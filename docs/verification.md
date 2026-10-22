# 第一版检查记录

2026-10-20，本机 macOS / Apple Silicon。

## 已完成

- Node.js v22.19.0、npm 10.9.3，依赖安装完成。
- Blender 5.2.2 LTS 实际运行 `scripts/build_blender.py`，生成可编辑 `.blend` 和 `.glb`。受限沙箱启动曾崩溃，正常本机权限下重新运行成功。
- `npm run build`：TypeScript 与 Vite 生产构建通过。Three.js vendor 包约 500 KB 未压缩，Vite 给出体积提示；不是构建错误。
- 通过真实浏览器拖拽双腿到虚影：计数由 00/12 变为 01/12。
- Playwright CLI 通过可见 DOM 进行完整流程检查，异常时会抛错。检查执行成功，截图保存在 `output/playwright/`。
  - 聚焦“装上这一块”后按 Enter：计数变为 01/12。
  - 自动拼装至 12/12，出现唤醒按钮。
  - 唤醒过渡完成，出现三个互动按钮。
  - Wave、Hug、Dance 分别触发状态文本，完成后按钮恢复可用。
  - 互动期间其它动作按钮禁用。
  - 拥抱中途重新拼装，计数回到 00/12；重新拼装唤醒后，拥抱可再次完成。
  - 390×844：没有页面横向溢出，组件、按钮均可见。
  - 1440×960：检查桌面布局、拥抱姿势和恢复漫步截图。
- 已保留实际使用的 67 个 LDraw 零件及子零件原文件、作者信息与授权文件。

## 证据

- `output/playwright/mobile-build.png`
- `output/playwright/mobile-ready.png`
- `output/playwright/mobile-hug.png`
- `output/playwright/desktop-hug.png`
- `output/playwright/desktop-play.png`

## 尚未验收

真实手机触摸和音频、低性能设备、长时间连续运行、完整辅助技术体验、照片还原。

拼装目前逐件引导；动作是预编排关节动画，没有物理碰撞、IK 或动作资源编辑器。手部几何随手臂运动，暂不提供独立手腕编辑。详情见 README。

## 场地扩展

底板从 12×8.2 扩为 16×11，面积增加约 79%；凸点从 345 个增加为 651 个，仍使用 InstancedMesh 合批。漫步目标范围从 ±3.5/±2.2 扩至 ±5.7/±3.7，行走速度从 0.7 调整到 0.9。唤醒后的桌面及窄屏镜头分别拉远，最大缩放距离增加至 48。生产构建再次通过。

扩场后实际浏览器检查通过：12 件自动拼装、唤醒后显示互动控件、拥抱结束按钮恢复、390px 无横向溢出。已检查 `larger-world.png` 与 `larger-world-mobile.png`。手机默认镜头为了容纳更多场地拉远，角色相应变小，可通过缩放靠近查看。

## 自由拼装与独立漫步

- 底板再次扩大至 22×15，相比 16×11 面积增加 87.5%；凸点 1247 个，继续使用 InstancedMesh。
- 新增 cannon-es，全部 12 个组件同时出场。松手未连接时有重力、回弹、摩擦和休眠；动态组件相互碰撞，已连接组件作为静态碰撞体。
- 碰撞使用组件包围盒近似。拖拽时辅助对正标准朝向；吸附容差随组件投影尺寸调整，且检查角色、槽位和前置组件。物理模拟不做积木孔洞级精确啮合。
- 自由模式默认开启；引导模式保留；切换模式重置拼装。
- 通过实际鼠标拖拽测试：缺少双腿时躯干不吸附并落地；放错角色不吸附；两个人全部 12 个组件均可实际拖拽吸附，完成后可唤醒。
- 独立漫步增加随机近远目标、速度、暂停、张望和伙伴避让。修正微小步长被旧移动阈值忽略的问题。
- 24 次采样（每次约 800ms）：两人独立速度变化，位置都在 x ±8.6 / z ±5.5 内，两人都持续产生移动，非同步暂停；扩大场地后拥抱仍正常结束恢复漫步。
- 引导拼装回归通过，模式切换重置通过。390×844 全部组件同时存在且页面无横向溢出；仍未做真机触摸验收。
- TypeScript / Vite 生产构建通过；确认生产包不含只读开发检查入口。
- 保留可重复的 Playwright CLI 回调：`scripts/check-free-assembly.js`。在已打开本地页面的 CLI 会话中用 `run-code` 传入该文件内容即可执行。
- 截图：`free-initial.png`、`free-assembled.png`、`free-expanded-play.png`、`free-mobile.png`，位于 `output/playwright/`。

## DJ & YW 一周年礼物版

参考用户提供的 `assets/reference/anniversary-frame.png`：主题原文为 “Experience the world together”，署名 “DJ & YW · One year anniversary”。用户最终要求不显示日期，仅保留 “1 year anniversary”。

- 移除页面 header、产品品牌导航、底部实验/来源/许可文字；必要署名保留在信息入口和源文件中。
- 中英文即时切换，记住语言；切换时保留拼装、动作和音乐状态。
- 提示开关隐藏/显示虚影、人物标签、零件说明、辅助安装按钮及操作提示，不改变吸附规则。偏好保存在本地。
- 工作台扩大至 28×20（2145 个凸点）；随机打乱组件身份并在四个区域随机采样，避免整齐排列。各组件随机朝向，自然落到工作台。
- 空白区域拖动可平移，滚轮/双指缩放。手机默认提供全部零件的全景，需要放大后精细拼装。
- 从不同深度拿起的零件沿拾取射线移入对应挂点的拖拽平面，保持屏幕位置，避免远端组件被错误深度锁住而无法拼装。
- 唤醒镜头从当前相机/目标位置平滑过渡，保持自由平移缩放后的连续性。
- DJ 基础配色改为蓝色上衣、浅色裤子，YW 改为浅色上衣、青色裤子和 4530 标准披肩长发。服装花纹与配件仍未精确还原。
- Treblo 原创纯音乐《Our Little World》，71.006621 秒，MP3；放在 `public/audio/our-little-world.mp3`。实际验证用户点击后播放、切换语言继续播放、关闭后渐弱并暂停。默认不自动播放。
- `scripts/check-anniversary.js`：全台散落、无 header/footer/日期、提示开关、语言切换保留进度、实际音乐开/关、拖拽与平移不冲突、完成拼装及拥抱回归、390px 全部零件在全景内且无横向溢出，全部通过。
- `scripts/check-free-assembly.js`：实际拖拽散落在四个区域的全部 12 个组件，覆盖正负深度；拼装、唤醒、拥抱回归全部通过。
- Blender 源文件与 GLB 已重新生成；TypeScript / Vite 构建通过。
- 实际浏览器零运行错误；真实手机触摸、音频听感与长时间使用仍需用户体验确认。

## Highlight semantics, photo lettering and warmer music

Latest user clarification overrides the previous hint behavior: silhouettes remain visible regardless of the switch. Only the held part's exact target highlights when hints are on; it returns to the base silhouette on release. Unavailable connections use a warm amber target; available ones use muted olive. Captions, labels and placement controls remain independent of the highlight switch.

`check-highlight.js` passed actual mouse pick/release assertions for hints on and off, persistent silhouettes, no unrelated controls disappearing, locally loaded Photo Script font, SVG controls, new soundtrack start/pause, uninterrupted music across language changes and 390px layout. Screenshots: `hints-on-held.png`, `hints-off-held.png`, `lettering-final-en.png`, `lettering-final-mobile.png`.

Font comparison evidence and confidence limits: `docs/photo-lettering.md`. Original font identity is not established; Dawning of a New Day is the selected visual approximation from three rendered candidates.

Music was regenerated at the user's request: The World, With You, 58.514286 seconds, with a warmer acoustic piano/guitar/cello brief. Earlier audio remains available; page default points to the new file. Browser playback was confirmed, but musical warmth remains a subjective acceptance item for the user.

## Bilingual font pair and assembly orbit

The script approximation was replaced after the user identified DJ's J as unclear: local LXGW WenKai for Chinese, Baskervville upright for names, and true Baskervville italic for the English title and dedication. Three local WOFF2 faces loaded successfully in the actual browser; total font payload about 121 KB. Sources, comparison rationale and subset reproduction are documented in `docs/photo-lettering.md`.

Both assembly modes now allow unrestricted horizontal orbit, right-button panning and wheel zoom. Touch mappings are one-finger orbit and two-finger pan/zoom. Guided mode no longer overwrites the camera every animation frame. Picking a component clears camera inertia and suspends OrbitControls; releasing it restores controls. Non-primary buttons cannot pick parts. Resetting the view also clears residual motion.

`check-fonts-orbit.js` passed: actual pointer rotation exceeded 480 degrees in both modes, a real scattered component and a guided component could be installed from the rotated view, camera position stayed fixed during pickup/drag, and right-dragging over a loose part panned without picking it. Chinese and English 390px layouts stayed within the viewport. Captures: `fonts-final-zh.png`, `fonts-final-en.png`, `fonts-mobile-zh.png`, `fonts-mobile-en.png`, `orbit-free-build.png`, `orbit-guided-build.png`.

`check-highlight.js` passed again with the new Latin font assertion: permanent silhouettes, held-only highlighting, hints-off behavior, icons, soundtrack playback/pause and language preservation. TypeScript/Vite production build passed. Real-device touch gestures are configured but have not been tested on a physical phone.

## Handwritten display, unified type scale and quiet effects

The current English display/dedication uses local Sacramento, while DJ / YW and English controls retain upright Baskervville; Chinese retains WenKai. Replaced accumulated stylesheet overrides with one semantic rem scale: 16px body/action text, 14px secondary labels, 12px captions, language-specific display sizes, and 24px handwritten dedication. Mobile body/actions keep their readable size. Both language layouts were visually inspected at 1440×960 and 390×844.

Added original Web Audio synthesis in `src/sound-effects.ts`: plastic snap, contact-dependent drop tap, completion phrase, awakening phrase, greeting, warm embrace chord, and dance notes. Floor/ground sounds subscribe to cannon-es contact events with speed thresholds and per-body/global throttling to suppress resting jitter and excessive simultaneous clatter. The hug sound triggers only when the figures meet. The speaker button independently mutes effects and saves its preference; background music remains independent and off by default. No sound context starts before a user gesture.

`check-keepsake-sounds.js` passed the actual UI flow: repeated unsupported drops made contact sounds; muted scattering scheduled none; all 12 placements produced 12 snaps and exactly one completion cue; awakening, wave, actual hug and dance each produced exactly one corresponding cue. Music remained off throughout. Both phone-width language layouts fit, and the three main corner controls retained 44px targets.

Rendered each synthesis preset through OfflineAudioContext at the real 0.28 master gain: peaks approximately 0.018–0.023 (around −35 to −33 dBFS), nonzero audio and silent ending tails. This checks signal levels and triggering; perceived loudness still depends on the user's device/system volume. TypeScript/Vite production build passed; the existing Three.js bundle-size advisory remains.

Screenshots: `keepsake-en.png`, `keepsake-zh.png`, `keepsake-ready-en.png`, `keepsake-mobile-en.png`, `keepsake-mobile-zh.png` under `output/playwright/`.

## New anniversary soundtrack: Built With Love

Generated a new original instrumental with Treblo v3-preview, task `0d9f5168-5791-4470-b616-ea2a85466d68`, using only a generic toy-brick/love/anniversary brief. The successful request contained no names or private gift context. Downloaded to `public/audio/built-with-love.mp3`; ffprobe measured 71.053061 seconds. ffmpeg measured mean −17.5 dBFS and peak −0.6 dBFS. Switched the page default, attribution and provenance notes; lowered background playback to 0.20 to leave room for the existing independent effects. Previous tracks remain available.

Actual browser checks passed: no music autoplay, new local file plays and time advances, independent effect mute does not stop music, a real assembly completion emits a snap while music continues, switching language preserves playback, and the music control fades then pauses. TypeScript/Vite build passed.

## Refined play actions and Prompt discussion

Replaced large glyphs with consistent 20px fine-line SVGs for greeting, heart and music notes, and a 16px reset arrow. Play actions use subdued paper fills, light pill borders and coherent spacing. Build again is a quiet secondary action. Current action has aria-pressed and a warm subtle active treatment even while controls are busy; completion clears the pressed state.

Production build passed. Actual browser checks passed: visible icons, pressed/disabled state during wave, restoration afterward, bilingual 390px layout without horizontal overflow, 44px control heights, and reset to assembly. Screenshots: `actions-refined-en.png`, `actions-refined-detail.png`, `actions-refined-mobile-en.png`, `actions-refined-mobile-zh.png`.

The original shared conversation was successfully read through the browser after web fetch failed. The Prompt follow-up is documented in `docs/prompt-control-proposal.md`; no API integration was implemented in this change.

## Little Days: quieter Japanese game-music direction (2026-10-21)

Original Treblo v3-preview instrumental, task `79fc36a5-619d-4fd6-af6d-3c998a8f92cd`. The brief requested a cozy wa-fu slice-of-life arrangement, a restrained cooking-game bounce, pentatonic space, felt piano and koto/wooden plucks, without vocals, big percussion or app interaction effects. No existing soundtrack or private photo was supplied. This describes the brief; perceived style remains for the user to judge.

Raw duration 60.186122s; prepared file 60.186122s. Applied -5.580 dB fixed attenuation, 0.25s intro/0.7s outro fades. Prepared file measured -20.44 LUFS and -6.40 dBTP. Browser gain reduced from 0.20 to 0.14; original raw and earlier tracks retained.

Actual browser checks passed: new local MP3 loads and time advances, no autoplay, 0.14 final volume, loop enabled, switching language continues playback, effects mute independently, and music fades to zero then pauses. Updated deterministic fade checks also passed. TypeScript/Vite production build passed. Beat-perfect seamless looping and physical-device listening were not claimed.
