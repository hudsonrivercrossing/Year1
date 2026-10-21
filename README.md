# DJ & YW · 1 year anniversary

送给 DJ 与 YW 的一周年互动纪念礼物。主题来自照片中的 **Experience the world together**：一起，体验这个世界。

参考照片：`assets/reference/anniversary-frame.png`。按用户最后确认，不展示具体日期，只保留 **1 year anniversary**。目前人物采用照片里的基础配色与长发；衣服花纹、眼镜及手持配件尚未精确还原。

## 运行

需要 Node.js 22.19+ 和 npm。

```sh
npm install
npm run dev
```

打开 http://127.0.0.1:5173 。生产构建：`npm run build`，预览构建：`npm run preview`。

## 体验

- 每人 6 个组件：双腿、躯干、右臂、左臂、头、头发，共 12 次拼装。
- 默认“自由拼装”：12 个组件随机散落在整个工作台的四个区域，颜色和部件顺序也随机，任选一块拖拽。只有对应角色、正确连接位置和已就绪的挂点才吸附；先双腿，再躯干，再手臂/头部，最后头发。
- 自由模式中，未吸附零件由 cannon-es 刚体模拟重力、碰撞、回弹及静止；可再次捡起。已安装组件也参与静态碰撞。碰撞形状为包围盒近似，不是积木孔洞级精确碰撞。
- “提示开/关”只控制拾起零件时对应部位的高亮；两个人物的完整虚影始终保留，说明和辅助按钮不受开关影响。偏好保存在本地。
- “下一块提示”选择可安装组件，可通过“装上这一块”按钮或 Enter 辅助安装；“再散开一次”重新随机散落剩余组件。
- 两种拼装模式均支持拖动空白处 360° 环绕视角，右键拖动平移，滚轮缩放；触屏单指环绕、双指平移与缩放。拾取零件会暂停镜头与其惯性，避免和拖拽拼装冲突。在手机上默认先显示全景，可放大后拼装。
- 右上角 EN / 中文 即时切换语言，不重置拼装或动作。音乐按钮播放/暂停新版约 71 秒的周年纯音乐《Built With Love》；默认关闭，渐入渐出，循环播放。音频也可从 `public/audio/built-with-love.mp3` 单独打开。
- 可切换到“我太懒了”（I’m too lazy，右上角 zzz），使用原有引导拼装，逐件提供组件，支持“装上这一块”和“自动拼装”。切换模式会重新开始拼装。
- 两人组装完后点“唤醒小世界”，观看过渡和自主漫步。
- 挥手、拥抱、跳舞结束后均自动恢复漫步。互动期间按钮暂停，避免动作冲突。
- 玩耍阶段支持拖动视角、滚轮缩放。音效和音乐独立：右上角扬声器开关控制音效，默认开启、首次交互后才发声；音乐仍默认关闭。
- “重新拼装”重置角色、镜头和动作。

## 标准零件与可替换结构

几何来自 LDraw 官方零件库，包含真实标准人仔零件，不是自画的方块替身：

| LDraw ID | 零件 |
| --- | --- |
| 3626cp01 | 标准笑脸头，空心顶柱 |
| 973 | 躯干 |
| 3815 | 髋部（库中保留的旧版形状） |
| 3816 / 3817 | 左右腿（库中保留的旧版形状） |
| 3818 / 3819 | 左右臂 |
| 3820 | 夹手 |
| 3901 / 4530 | DJ 短发与 YW 披肩长发 |
| 87991 | 保留的备选短发 |

`src/character-definitions.json` 定义角色配色和发型；`src/characters.ts` 定义组件顺序；`src/main.ts` 定义挂点、关节和行为。动画驱动关节节点，不依赖头发或衣服的具体外观。换同类标准头部或发型时沿用挂点；新增部件需同步几何加载清单。不同体型或非标准挂点需单独适配。当前没有换装 UI。

网页使用本地预处理后的零件 JSON，运行时不访问 LDraw。`assets/characters.blend` 提供同一零件结构的可编辑源文件，`public/models/characters.glb` 是静态层级模型导出；当前网页不加载该 GLB，动作由网页关节程序生成。

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

- 两个通用配色人仔，参考了照片的配色和发型，尚未还原服装印花和额外配件。
- 拼装包含自由和引导两种模式；仍以每人 6 个主要组件为单位，夹手和腿部细分零件暂未拆成独立可拖拽组件。
- 有独立腿和肩部转轴，夹手为标准几何并随手臂活动；未提供独立手腕动作编辑器。
- Hug 为角色靠近、面对、抬臂、停留及分开；不是物理碰撞或逆向运动学解算。
- 无 AI、账号、后端、保存进度或公开部署；刷新回到自由拼装开始。
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
