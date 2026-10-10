---
name: img2particle3d
description: Build the "nebula-condensing-into-artifact" 3D particle effect from object reference images (three-view / 三视图) or a procedural Three.js model — the golden-dust point-cloud look from the 聆 page of 万象和鸣 (blc2q9n4.qwenwork.host). Samples ~48k additive-blended point-sprite particles over the mesh surface, with a macOS-style HSV color wheel + brightness slider to retint, three point shapes (round/square/star), a name readout, and drag-rotate / wheel-switch / hover-ripple interaction. Use when the user asks for a 3D particle effect, golden dust / 粒子特效 / 金色粒子 viewer, a point-cloud condensation from images, or wants to reproduce that website's particle look with adjustable color and labeled naming. Trigger terms 粒子特效, 三视图, Three.js points, point cloud, image-to-3D particle.
version: 1.1.0
license: MIT
---

# img2particle3d — 三视图 → 网页同款 3D 粒子特效

把"三视图/参考图"变成《万象和鸣》聆页那种**星云凝聚成器物**的金色粒子特效：约 4.8 万个加法混合点精灵铺满模型表面，可**调色**（网页同款 HSV 色轮 + 明度滑杆）、切**粒子形状**（圆点/方块/光芒）、显示**名称**，支持拖动旋转、滚轮切换、光标触碰粒子浮起泛波、双击复位。

本 skill 只负责**粒子呈现层**。三视图 → 程序化 3D 模型这一段交给现成的 `img2threejs` skill；两者用 `window.InstrumentModels` 接口衔接。

> 面向人类的介绍、跨客户端（Codex / Claude Code / Cursor / Windsurf / OpenClaw / QwenWork）安装步骤、以及可复用使用场景，见同目录 `README.md`；一键安装脚本见 `scripts/install.sh`。

## 何时使用

- 用户给了物体的三视图/多角度图，想要"网页那种 3D 粒子/金色尘埃/点云凝聚"的效果。
- 用户已有一个 Three.js 程序化模型，想套上粒子查看器 + 调色 + 命名。
- 用户想复刻/迁移 `blc2q9n4.qwenwork.host/page-ling` 聆页的粒子观感。

## 文件

- `assets/particle-viewer.html` — 自包含渲染器模板（含全部着色器、采样、动画、色轮 UI）。顶部 `CONFIG` 与色轮的 `wheelHue/wheelSat/wheelLight` 是调参入口。
- `assets/example-models.js` — 模型层示例：图元辅助函数 + 完整的 `createKonghou()`（竖箜篌，对应三视图）+ 一个极简 `createHeart()`，演示接口写法。
- `reference/particle-engine.md` — 采样/着色/动画的数学、可调常量表、实测坑。**改效果前先看它。**

## 标准流程

1. **拿到模型**（三选一）：
   - 有 `img2threejs` 产出的 `object-sculpt-spec.json`：把部件逐个翻译成 `cylinder/tube/rodBetween/torus/mesh(...)` 图元，写成一个 `createXxx()` 返回 `THREE.Group`（照抄 `example-models.js` 里 `createKonghou` 的写法与辅助函数）。
   - 直接照三视图手工用图元搭（简单器物够用）。
   - 已有现成 `.js` 模型脚本：确认它导出 `window.InstrumentModels = { names, create }`。

2. **注册接口**：在模型脚本末尾导出
   ```js
   const factories = [createKonghou, createHeart /* 追加你的 */];
   window.InstrumentModels = {
       names: ['竖箜篌', '心'],           // ← "给出名称"就在这里：按钮文字 + 名称读出
       create(index) { return factories[index](); }
   };
   ```
   `names[i]` 与 `create(i)` 一一对应；每个 `create` 每次返回**新** Group。

3. **组装页面**：把 `particle-viewer.html` 和你的模型 `.js` 放同一目录，把模板里
   `<script src="example-models.js">` 换成你的模型脚本文件名（Three.js 走 CDN，无需本地依赖）。

4. **本地起服务预览**（必须 http，不能 file://）：
   ```bash
   cd <你的目录> && python3 -m http.server 8920
   # 浏览器打开 http://localhost:8920/particle-viewer.html
   ```

5. **调色**：运行时拖动色轮选色相/饱和度、拖动明度滑杆调亮度（都改 `uTint`）。要改**默认观感**：调 `CONFIG.TINT_MIX`（0.2 轻染→1.0 完全统一成所选色）；改**初始色**改色轮的 `wheelHue/wheelSat/wheelLight`（默认 38/0.72/0.62 = 暖金）。

6. **调形状/密度/手感**：形状用页面下拉；密度 `CONFIG.PARTICLE_COUNT`（移动端降到 20000）；爆发/浮起/凝聚时长见 `reference` 的常量表。

7. **验证**（见下）后交付本地 URL；仅当用户主动要求才发布线上。

## 关键约定与坑（务必遵守）

- **走 http(s)**：`file://` 下 CDN/WebGL 可能失败。始终 `python3 -m http.server` 预览。
- **模型必须是有面积表面**：粒子按三角面积采样；纯线框/`Line`/无 `position` 属性的对象采不到样。
- **别自己预先缩放居中**：查看器按最长边归一化到 `NORMALIZE_SIZE`；手动缩放会破坏采样范围。
- **每个 Mesh 要有 `material.color`**：它决定该处粒子固有色（模型配色 = 粒子配色）。
- **`create(index)` 每次返回新对象**：切换时旧模型被 `displayRoot.remove`，勿复用引用。
- **调色原理**：`finalColor = mix(vColor, uTint, TINT_MIX)`。色轮只改 `uTint`；想让色轮"完全接管"就调大 `TINT_MIX`。

## 验证成功

- 打开页面能看到一团星云在 ~1.2s 内凝聚成器物轮廓，底部按钮/名称正确显示。
- 拖动色轮 / 明度滑杆，粒子整体色调实时变化（当前色块与滑杆同步）。
- 光标移入表面，粒子随指尖浮起泛波；按住拖动可 360° 旋转；滚轮/按钮切换；双击复位。
- 若一片空白：多半是 file:// 或模型无表面或 `InstrumentModels` 未导出——按上条排查。
