# 粒子引擎参考 — 数学、常量与坑

本文件是 `particle-viewer.html` 背后的原理速查。改效果时对照此处，不要盲调。

## 1. 数据流

```
三视图 ──(img2threejs)──▶ object-sculpt-spec.json ──翻译──▶ create(index): THREE.Group
                                                                       │
                     particle-viewer.html ◀── window.InstrumentModels ─┘
   归一化 → 面积加权三角采样 → 48000 粒子 → ShaderMaterial(加法混合) → 星云凝聚 morph
```

模型层与呈现层解耦：呈现层只认 `names[]` 和 `create(index)`，不关心模型怎么来的。

## 2. 表面采样（把 Mesh 变成点云）

1. `Box3` 求包围盒，`normalization = NORMALIZE_SIZE / max(size.x,y,z)`，整体缩放并居中。
2. 遍历所有 `isMesh`，把每个三角（`toNonIndexed` 后每 3 顶点一个）变换到世界坐标，算面积，累加成 `cumulative` 分布。
3. 每个粒子：`random()*totalArea` → 二分 `findTriangle` 命中一个三角（**面积越大越容易被选中 → 均匀铺面**）→ 取重心坐标 `(u,v)`，若 `u+v>1` 翻折回三角内 → 插值得到点坐标。
4. 粒子的固有色 = 命中三角所属 `material.color`。所以**模型配色直接决定粒子颜色分布**。

关键：模型必须是**有面积的封闭/半封闭表面**。纯线框、`LineSegments`、无 `position` 属性的对象采不到样。

## 3. 着色器（点精灵）

- `blending: AdditiveBlending` + `depthWrite:false` → 叠加发光，无 z 打架。这是"粒子感"的来源。
- 顶点：`gl_PointSize = uPointSize * (14.0 / -mvPosition.z)` → 近大远小透视衰减。
- 片元：`gl_PointCoord` 是点内 0..1 坐标，`p = gl_PointCoord-0.5`。三种形状：
  - `uShape 0 圆点`：`1-smoothstep(0.31,0.5,dist)`
  - `uShape 1 方块`：`1-smoothstep(0.44,0.5,max(|x|,|y|))`
  - `uShape 2 光芒`：十字 + 对角线细星芒，`min(crossShape, diagonal)`，点大小自动升到 2.4
- 上色：`finalColor = mix(vColor, uTint, TINT_MIX)`。`vColor` 是采样到的固有色，`uTint` 是色轮选的色（canvas HSV 色轮：拖动定色相/饱和度，明度滑杆改 L，HSL→RGB 写入 `uTint`）。
  - `TINT_MIX=0.2`：以固有色为主、轻染一层所选色（网页默认观感）。
  - 想要"整簇统一成所选色"→ 调大 `TINT_MIX`（0.6~1.0）。
  - 想要"完全保留模型原色、色轮几乎无效"→ 调小到 0。

## 4. 动画

- **凝聚 morph**：`base = source + (target-source)*eased + scatterDir*pulse`
  - `eased = 1-(1-t)^4`（四次缓出）；`pulse = sin(π*t)*SCATTER_AMOUNT` 让粒子中途先炸开再收拢，形成"星云→器物"。
  - `source` 是上一帧基准位（初始为随机球星云），`target` 是本次采样结果。
- **浮起 hover**：把屏幕光标经 `Raycaster` 投到 `displayRoot` 局部空间的射线；对每个粒子求它到射线的最近点距离 `d`；`d<HOVER_RADIUS` 时按 `f²·HOVER_STRENGTH·(0.75+0.35·sin(wave+phase))` 沿法向外推 → 指尖附近泛波。
- **自转**：无操作 >4.2s 后 `targetRotationY += 0.00115` 缓慢自转；`displayRoot.rotation` 用 0.12 阻尼逼近目标。

## 5. 可调常量（都在 particle-viewer.html 顶部 CONFIG）

| 常量 | 默认 | 作用 | 调大/调小的后果 |
|---|---|---|---|
| PARTICLE_COUNT | 48000 | 采样点数 | 大=细腻但吃 GPU；移动端建议 20000 |
| SCATTER_AMOUNT | 4.6 | 切换爆发半径 | 大=炸得更开 |
| HOVER_RADIUS | 1.15 | 触碰影响半径 | 大=泛波范围更广 |
| HOVER_STRENGTH | 0.62 | 浮起强度 | 大=推得更远 |
| MORPH_DURATION | 1250 | 凝聚时长(ms) | 大=更慢更仪式感 |
| NORMALIZE_SIZE | 6.7 | 归一化尺寸 | 大=器物更大 |
| CAMERA_Z | 8.5 | 相机距离 | 大=更远更小 |
| POINT_SIZE | 1.7 | 点大小 | 大=颗粒更粗更亮 |
| TINT_MIX | 0.2 | 调色板权重 | 见 §3 |

## 6. 坑（实测）

- **必须走 http(s)，不能 file://**：Three.js 从 CDN 加载 + 部分浏览器对 file:// 下 WebGL/脚本有限制。用 `python3 -m http.server 8920` 起本地服务再开。
- **模型不要自己预先缩放居中**：查看器会做归一化；你手动缩放过反而可能采到极小/极大范围。
- **`create(index)` 每次要返回新对象**：切换乐器时旧模型会被 `displayRoot.remove`，别复用同一 Group 引用。
- **材质要有 `.color`**：采样读 `object.material.color`；用 `MeshBasicMaterial` 也行，只是没光照——反正粒子最终由着色器上色，MeshStandard 的固有色只是给采样提供 RGB。
- **粒子多时首帧重建会卡**：48000×三角遍历在重建瞬间是同步的，网页靠 `loading` 文案遮住；若目标机弱，降 `PARTICLE_COUNT`。
- **透明度**：模型 Mesh 被设成 `opacity:0.17` 只是让"骨架"隐约可见，真正视觉是粒子；不想要骨架可把模型 `visible=false`（采样已在隐藏前完成）。
- **reduced-motion**：系统开"减弱动态"时 `MORPH_DURATION` 自动降到 160ms，自转关闭。
