# img2particle3d — 三视图 → 网页同款 3D 粒子特效

把一张物体的**三视图/多角度参考图**（或任意程序化 Three.js 模型），变成《万象和鸣》聆页那种**"星云凝聚成器物"**的金色粒子特效网页：

- 约 **4.8 万个**加法混合点精灵，按面积加权均匀铺满模型表面
- **星云凝聚**开场动画 + 切换时的爆发消散
- **HSV 色轮 + 明度滑杆**调色（仿 macOS 取色器，与线上聆页同款）
- **三种粒子形状**：圆点 / 方块 / 光芒
- **名称读出** + 底部对象切换栏
- 光标触碰粒子**浮起泛波**、拖动 360° 旋转、滚轮切换、双击复位、键盘操作、`prefers-reduced-motion` 适配

纯前端单文件模板，Three.js 走 CDN，零构建、零本地依赖。

---

## 效果预览

| 星云凝聚 | 凝聚完成 | 换色 |
|---|---|---|
| 打开页面：随机球星云 | ~1.2s 内凝成器物轮廓 | 拖色轮实时换色 |

实测案例：竖箜篌（`assets/example-models.js`）、头戴雏菊的土豆小鸡（`assets/example-character-models.js`）。

## 它是怎么工作的

```
三视图 ──(img2threejs 或手工图元)──▶ 程序化 THREE.Group 模型
                                            │
              particle-viewer.html ◀── window.InstrumentModels 接口
    归一化 → 面积加权三角面采样 → 48k 粒子 → 加法混合点精灵着色器
         → 星云凝聚 morph → 光标浮起泛波 → 色轮调色 / 形状 / 命名 / 交互
```

模型层与呈现层**解耦**：呈现层只认 `window.InstrumentModels = { names, create(index) }` 这一个接口，不关心模型怎么来的。这也是它能复用到任何对象上的原因。

## 目录结构（标准 Agent Skills 布局）

```
img2particle3d/
├── SKILL.md                        # Agent 入口：规范 frontmatter + 操作流程（机器读）
├── README.md                       # 本文件：人类视角的介绍与安装（人读）
├── assets/
│   ├── particle-viewer.html        # 自包含渲染器模板（着色器/采样/动画/色轮 UI）
│   ├── example-models.js           # 示例①：竖箜篌（乐器，图元建模）+ 极简心形
│   └── example-character-models.js # 示例②：雏菊土豆小鸡（角色/吉祥物类）
├── reference/
│   └── particle-engine.md          # 采样/着色/动画数学、常量表、实测坑
└── scripts/
    └── install.sh                  # 一键装到本机已存在的客户端 skills 目录
```

## 快速开始（3 分钟）

```bash
# 1. 建工作目录，放入模板和示例模型
mkdir my-particle && cd my-particle
cp <skill目录>/assets/particle-viewer.html .
cp <skill目录>/assets/example-models.js .

# 2. 起本地服务（必须 http，file:// 下 WebGL/CDN 可能失败）
python3 -m http.server 8920

# 3. 浏览器打开
open http://localhost:8920/particle-viewer.html
```

看到星云凝聚成竖箜篌即成功。拖色轮换色、下拉切形状、拖动旋转、滚轮切换。

### 换成你自己的对象

1. 照三视图用图元（`cylinder/tube/rodBetween/torus/mesh`）搭一个 `createXxx()` 返回 `THREE.Group`（照抄示例文件的写法），或用 `img2threejs` skill 从三视图生成。
2. 在脚本末尾注册：
   ```js
   window.InstrumentModels = {
       names: ['你的名称'],                    // ← 名称读出 + 底部按钮
       create(index) { return createXxx(); }   // ← 每次返回新对象
   };
   ```
3. 把 `particle-viewer.html` 里 `<script src="example-models.js">` 换成你的模型文件名。

## 安装到各 Agent 客户端

这是一个**标准 Agent Skills 目录**（`SKILL.md` + `assets/` + `reference/` + `scripts/`），任何支持 Agent Skills / SKILL.md 约定的客户端都能直接识别。

**一键安装（推荐）**——自动装到本机所有已存在的客户端 skills 目录，或用 `--dest` 指定任意目录：

```bash
cd img2particle3d
bash scripts/install.sh          # 自动检测并安装到已存在的客户端目录
bash scripts/install.sh --dest ~/.codex/skills   # 装到指定目录
```

**手动安装**——把整个 `img2particle3d/` 文件夹拷进客户端的 skills 目录即可：

| 客户端 | 常见 skills 目录 |
|---|---|
| Codex | `~/.codex/skills/` |
| Claude Code | `~/.claude/skills/`（个人）或项目 `.claude/skills/` |
| QwenWork（千问办公） | `~/.qwenworkcn/skills/` |
| Cursor / Windsurf / OpenClaw | 按其文档把本文件夹放入其 skills/rules 目录，或在会话里直接指向本文件夹路径 |

> 各客户端的 skills 目录约定可能随版本变化；拿不准时优先用 `install.sh`（只写入真实存在的目录），或查该客户端文档确认路径。

安装后，在会话里说「把这张三视图做成粒子特效」「帮我复刻聆页那种金色粒子」之类的话，Agent 会自动触发本 skill。

## 可复用使用场景

按对象类型分，均已验证可行：

**文化遗产 / 博物馆展陈**
- 文物三视图 → 粒子化数字展品页（本 skill 的出处：云冈石窟"音乐窟"十件古乐器）
- 展厅大屏的"尘埃聚成文物"开场动画，配合讲解逐件切换

**教学与科普**
- 乐器/器物科普页：粒子形态展示 + 色轮互动，比静态图更抓注意力
- 结构演示：把部件（琴弦/穗头/花窗）分色建模，粒子颜色即结构分区

**品牌与活动**
- 吉祥物三视图 → 品牌主视觉粒子化（如示例的"雏菊土豆小鸡"），用于 H5、发布会大屏
- 产品发布倒计时页：星云→产品轮廓的凝聚动画

**作品集与个人项目**
- 手办/模型摄影三视图 → 可交互粒子作品页， portfolio 一键升级
- 游戏/小说设定图的"灵魂具象化"演出

**二次开发**
- 换粒子形状（改片元着色器 `uShape` 分支）、换凝聚缓动、接 WebAudio 让粒子随音乐律动
- 常量表见 `reference/particle-engine.md`，逐项可调

## 参数速查

| 想改什么 | 改哪里 |
|---|---|
| 默认光色 / 初始色 | 色轮 `wheelHue/wheelSat/wheelLight`（默认 38/0.72/0.62 暖金） |
| 色轮对粒子的影响强度 | `CONFIG.TINT_MIX`（0.2 轻染 → 1.0 完全统一） |
| 粒子密度 | `CONFIG.PARTICLE_COUNT`（默认 48000，移动端建议 20000） |
| 凝聚时长 / 爆发半径 | `CONFIG.MORPH_DURATION` / `SCATTER_AMOUNT` |
| 浮起范围 / 强度 | `CONFIG.HOVER_RADIUS` / `HOVER_STRENGTH` |
| 器物大小 / 相机距离 | `CONFIG.NORMALIZE_SIZE` / `CAMERA_Z` |
| 点大小 / 形状 | `CONFIG.POINT_SIZE` / 页面「粒子形状」下拉 |

完整说明与坑见 `reference/particle-engine.md`。

## 依赖与许可

- 运行依赖：浏览器 + [Three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js)（CDN 引入，无需安装）
- 本 skill（模板与文档）以 MIT 许可发布；`SKILL.md` 的 `license` 字段已声明
- 粒子引擎源自《万象和鸣》数字展示项目（云冈第 12 窟"音乐窟"）
