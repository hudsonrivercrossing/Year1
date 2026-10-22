# DJ & YW · 1 year anniversary

送给 DJ 与 YW 的一周年互动纪念礼物。主题来自照片中的 **Experience the world together**：一起，体验这个世界。

原始参考照片仅保留在本地，不上传 GitHub。只保留 **1 year anniversary**。DJ 使用 99930 短侧梳发与圆框眼镜脸；YW 使用已核对映射的笑脸对照款和原创平刘海长发近似。两件上衣重绘正反面印花，配色分开配置。标准手持物已接入；发型精确模型与脸部背面型号的限制见 [本轮复核](docs/photo-parts-followup.md) 和 [TODO](TODO.md)。

## 运行

需要 Node.js 22.19+ 和 npm。

```sh
npm install
npm run dev
```

打开 http://127.0.0.1:5173 。生产构建：`npm run build`，预览构建：`npm run preview`。

## GitHub Pages

地址：https://hudsonrivercrossing.github.io/Year1/ 。`main` 的推送由 `.github/workflows/pages.yml` 自动构建并发布，无需手动上传 dist。

```sh
npm ci
npm run build:pages
npm run preview:pages
```

预览地址为 http://127.0.0.1:4173/Year1/ 。Pages 模式将脚本、模型、贴图、字体、音乐和署名链接统一放在 `/Year1/`；普通 `npm run build` 仍使用 `/`，供现有 ChatGPT Site 使用。

公开历史保留 `v1.0.0` 和 TODO；原始照片、Blender 编辑文件、原始生成音频、研究输出及本地托管配置从所有公开提交中排除。原始本地仓库和标签不变；公开标签对应相同代码基线的清理副本，提交 SHA 不同。后续从私有源导出发布副本的方法见 [发布说明](docs/github-pages.md)。

## 体验

- 每人 6 个组件：双腿、躯干、右臂、左臂、头、头发，共 12 次拼装。
- 默认“自由拼装”：12 个组件随机散落在整个工作台的四个区域，颜色和部件顺序也随机，任选一块拖拽。只有对应角色、正确连接位置和已就绪的挂点才吸附；先双腿，再躯干，再手臂/头部，最后头发。
- 自由模式中，未吸附零件由 cannon-es 刚体模拟重力、碰撞、回弹及静止；可再次捡起。已安装组件也参与静态碰撞。碰撞形状为包围盒近似，不是积木孔洞级精确碰撞。
- 拿起零件时自动高亮对应部位；两个人物的完整虚影始终保留。提示开关已移除，不再沿用旧的关闭偏好。
- “下一块提示”选择可安装组件，可通过“装上这一块”按钮或 Enter 辅助安装；“再散开一次”重新随机散落剩余组件。
- 两种拼装模式均支持拖动空白处 360° 环绕视角，右键拖动平移，滚轮缩放；触屏单指环绕、双指平移与缩放。拾取零件会暂停镜头与其惯性，避免和拖拽拼装冲突。在手机上默认先显示全景，可放大后拼装。
- 右上角 EN / 中文 即时切换语言，不重置拼装或动作。音乐按钮播放/暂停新版约 60 秒的轻和风纯音乐《Little Days》；默认关闭，渐入渐出，循环播放。音频也可从 `public/audio/little-days.mp3` 单独打开。
- 可切换到“我太懒了”（I’m too lazy，右上角 zzz），使用原有引导拼装，逐件提供组件，支持“装上这一块”和“自动拼装”。切换模式会重新开始拼装。
- 两人组装完后点“唤醒小世界”，观看过渡和自主漫步。
- “小小心动”菜单按“心动／陪伴／组合”分页，包含亲脸颊、羞羞、牵手、击掌、招呼、并肩看风景、坐一会、等你一下，以及挥手与跳舞。抱抱保留为手机底部主要入口。
- 三条组合复用同一数据化动作时间线：亲亲 → 羞羞 → 拥抱；漫步 → 等待 → 招呼 → 靠近 → 拥抱；跳舞 → 牵手 → 并肩停留。随机小互动可关闭，自动选择会避开最近三项动作，随机组合避开最近两项。
- 漫步携带四件照片道具。整段动作开始时轻轻放落在脚边，最后完成或中断后回释放位置、俯身依次拾回，再恢复漫步；连续组合中间不重复拾放。“先歇一会”平滑取消姿态与后续队列，再完成拾取。重新拼装会清理全部道具与刚体。
- 手机隐藏大标题、副文案与操作说明，缩小纪念署名；拼装辅助变成三个并列小工具：找一块（选中可安装零件后变为帮放好）、再散开和取景，首页只保留主要动作与菜单。默认取景跟随两个人，手动旋转/平移/缩放后停止跟随，取景按钮可恢复。桌面构图保留。
- 玩耍阶段支持拖动视角、滚轮缩放。音效和音乐独立：右上角扬声器开关控制音效，默认开启、首次交互后才发声；音乐仍默认关闭。
- “重新拼装”重置角色、镜头和动作。

## 标准零件与可替换结构

标准人仔及手持物几何来自 LDraw 官方零件库。YW 长直发是明确标注的原创近似，等待许可可靠的精确模型：

| LDraw ID | 零件 |
| --- | --- |
| 3626cp8y | DJ 圆框眼镜脸（BrickLink 3626pb1507） |
| 3626cp8r | YW 笑脸对照款（BrickLink 3626pb1352；照片不足以排除相同正面家族 2662） |
| 3626cp01 | 标准笑脸头，空心顶柱 |
| 973 | 躯干 |
| 3815 | 髋部（库中保留的旧版形状） |
| 3816 / 3817 | 左右腿（库中保留的旧版形状） |
| 3818 / 3819 | 左右臂 |
| 3820 | 夹手 |
| 99930 | DJ 短侧梳发 |
| yw-long-bangs-approx | 原创平刘海长直发近似，不是 17346/75867 官方模型 |
| 90540 / 3899 | 滑雪杖 / 灰杯 |
| 33120 | 橙色一体甜筒，已经包含冰淇淋；不额外叠 6254 |
| 87991 | 保留的备选短发 |

`src/character-definitions.json` 定义配色、部件和置信度；`src/characters.ts` 定义拼装顺序；`src/action-library.ts` 定义动作阶段、参与者和时长；`src/affection.ts` 执行局部移动与姿态；`src/hand-props.ts` 管理握持、落地和拾取。长发颈部转动限幅，减少穿肩。坐姿按腿部几何最低点调整身体高度。换同类标准头发/头部沿用挂点；不同体型或非标准挂点仍需适配，当前没有换装 UI。

DJ 的髋部与裤腿均为白色。窄深色腰线由 `src/waist-band.ts` 作为独立、可替换的表面层绘制，不把整块髋部或裆部涂黑，也不改变标准零件几何。

网页使用本地预处理后的零件 JSON，运行时不访问 LDraw。本地私有的 `assets/characters.blend` 提供同一零件结构的可编辑源文件（不在公开仓库中），`public/models/characters.glb` 是静态层级模型导出；当前网页不加载该 GLB，动作由网页关节程序生成。

## 复现素材

从 https://library.ldraw.org/library/updates/complete.zip 下载官方库，然后执行：

```sh
python3 scripts/prepare_parts.py /path/to/complete.zip
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/build_blender.py
```

Blender 5.2.2 LTS 已实际运行生成源文件和 GLB。Blender 无需在使用网页时运行。

## 场地与漫步

底板 28×20；漫步中心范围为 x ±11.5、z ±8，留出边缘余量。每个角色独立选择近距离探索、远处目标、停顿、左右张望和行走速度（0.5–1.55），每隔随机时间重新决策，接近伙伴时避让。姿态节奏也独立。动作按钮仍会暂时接管行为，完成后恢复各自漫步。

开发服务器提供只读 `window.__brickWorld` 位置快照供浏览器验证；生产构建会移除此入口。

## 当前范围

- 两人的上衣印花为原创重绘，YW 发型为原创近似；不把照片上的唯一型号或暖光下的精确色号当成已证实事实。
- 拼装包含自由和引导两种模式；仍以每人 6 个主要组件为单位，夹手和腿部细分零件暂未拆成独立可拖拽组件。
- 有独立腿和肩部转轴，夹手为标准几何并随手臂活动；未提供独立手腕动作编辑器。
- Hug 为角色靠近、面对、抬臂、停留及分开；不是物理碰撞或逆向运动学解算。
- 无 AI 接口、应用账号、后端或进度保存；刷新回到自由拼装开始。已托管到账号私有 ChatGPT Site，访问范围见 [部署记录](docs/sites-deployment.md)。
- 手机尺寸的浏览器检查不等于真实手机触摸、性能或音频验收。
- 中英文字体使用本地 WOFF2，运行时不请求外部字体服务。修改中文文案后需运行 `python3 scripts/prepare_fonts.py` 更新字形子集。

## Attribution

This project uses the LDraw Parts Library: https://www.ldraw.org/ .
Original source files, authors, history, and license headers for every used part and dependency are retained in `public/ldraw-source/`.
See `public/ldraw-source/CAreadme.txt` and the license files there. Derived geometry is transformed and triangulated by `scripts/prepare_parts.py`; original author attribution remains with each source file. LDraw is a community parts library; this project is not affiliated with or endorsed by the LEGO Group.

## 纪念文案

| 中文 | English |
| --- | --- |
| 一起，体验这个世界。 | Experience the world together. |
| 一块一块，拼出我们的世界。 | Piece by piece, a world of our own. |
| 我们，刚刚好。 | Better, together. |
| 下一块，也想和你一起。 | Every next piece, with you. |
| 世界那么大，还好有你。 | A big world. My favourite place is with you. |

界面移除了产品页头和页脚；素材署名保留在右上角信息入口与源文件中。音乐来源记录见 `public/audio/README.md`。

## 字体与图标细化

照片文字曾经过 Sacramento、Allura、Dawning of a New Day 对比；不能仅凭照片确认原始字库。根据姓名 J 的可读性反馈，当前改为 **霞鹜文楷（中文）＋ Sacramento（英文标题和纪念语）＋ Baskervville（英文操作文字）**。手写体呼应照片，DJ / YW 也统一为同款 Sacramento 手写体。英文标题的 world together 作为完整词组保持同一行。页面统一使用 rem 字号变量：正文和操作按钮 16px，次要文字 14px，提示 12px；标题按语言和屏幕尺寸区分。字体本地加载，许可保留在 `public/fonts/`，研究记录见 `docs/photo-lettering.md`。语言与音乐按钮使用细线 SVG，带本地化名称、键盘焦点与开关状态。

## 轻音效

`src/sound-effects.ts` 使用 Web Audio 生成原创短音效，无需外部音效文件或网络请求。成功拼接是轻塑料扣合声；未吸附零件的落地、回弹由 cannon-es 的真实接触事件触发，音量随冲击强度变化，过滤静止抖动与过密碰撞。最终拼好、唤醒、招呼、实际抱到一起、跳舞各有不同的温暖短旋律。主音效增益 0.28，包络柔和；扬声器可独立静音并保存偏好。`scripts/check-keepsake-sounds.js` 检查实际流程触发与离线渲染峰值。

## 照片外观与动作升级

`v1.0.0`（7534e3f）保留为回溯基线。本轮待办、完成项与后续顺序集中在 [TODO.md](TODO.md)。

- 上衣使用标准 `973` 几何，正反面采用原创重绘印花层：DJ 对照 `973pb5102c01`，YW 对照 `973pb3541c01`。这不是官方印花模型或目录照片贴图；后续可以独立替换。来源说明见 `public/textures/README.md`，重生成：`python3 scripts/prepare_portrait_prints.py`。
- DJ 使用官方 LDraw `3626cp8y`，原作者与依赖子件保留在 `public/ldraw-source/`。`scripts/prepare_parts.py` 从同一库的 `LDConfig.ldr` 提取颜色值，浏览器与 Blender 共用 `src/ldraw-colors.json`，保证眼白、镜框和眉毛不被误画成黄色。
- 本地私有 Blender 源文件与公开运行资源 `public/models/characters.glb` 已同步外观；四张衣服贴图内嵌在文件中。运行时动作用 `src/affection.ts` 编排，未烘焙进静态 GLB。
- 亲脸颊与羞羞配有低音量原创音效；每次动作只触发一次。亲脸颊在转头靠近后的停留阶段发声；音乐与音效仍可分别开关。
- `scripts/check-portraits-affection.js` 检查新动作/组合、取消和复位、双语手机菜单、轻音效峰值及尾音；`scripts/check-free-assembly.js` 检查 12 块零件的真实拖拽拼装。

手机镜头本轮调整：拼装俯视约 46°，漫步约 29°，游玩取景增加距离和两侧留白；恢复取景、唤醒与跟随使用同一规则。手动控制后保留镜头控制权。
