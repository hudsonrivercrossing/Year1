# Year1 · GitHub Pages

- 目标地址：https://hudsonrivercrossing.github.io/Year1/
- 仓库：https://github.com/hudsonrivercrossing/Year1
- 发布源：main 的 GitHub Actions；仅上传 dist-pages 生产资源。
- 构建：Node.js 22、npm ci、npm run build:pages。
- Vite pages 模式：base=/Year1/、outDir=dist-pages。默认模式保留根路径构建，现有 ChatGPT Site 保留。
- 当前三个高级动作仅完善流程和 TODO，不包含运行实现，见 advanced-scenes-plan.md。

## 发布历史与本地原件

本地 v1.0.0 原始提交为 7534e3f8c109fa13b550ee44988c57686faa5df8，未移动。该历史含原始照片和 Blender 文件，不能直接推送到公开仓库。

scripts/export-github.py 用 Git fast-export 的路径过滤生成独立发布仓库，完整历史排除 assets/、output/、.openai/；保留标准模型、重绘贴图、字体和部件许可，以及播放版音频。main、v1.0.0 的代码与文件版本对应本地历史，过滤导致公开提交 SHA 改变。公开 v1.0.0 的基线提交为 2cc79b67cb1b3654df7fe598613f5d66c702a5cd；原始标签仍保留在本机。导出后扫描可达历史中的禁止路径、常见令牌和私钥特征；扫描不输出疑似秘密内容。

```sh
# 在私有源仓库提交并验证后，导出到一个新目录或上次的专用发布副本。
python3 scripts/export-github.py /absolute/path/to/year1-public
# 在专用发布副本中设置远端；仅推送 main 和同名基线标签。
git -C /absolute/path/to/year1-public remote add origin https://github.com/hudsonrivercrossing/Year1.git
git -C /absolute/path/to/year1-public push origin main refs/tags/v1.0.0
```

后续继续修改私有源并提交，再运行同一导出命令，从发布副本推送 main。不要从原始仓库直接 push，也不要 --mirror 或上传全部本地 refs。提交对应表保存在发布副本的 .git/year1-export.json 内，属于本地 Git 元数据，不会上传。

## 验收

本地生产包验收通过：

- 根路径与 /Year1/ 两种构建通过，保留现有 Three.js 分包体积提示。
- 四种手机竖屏、844×390 横屏、1440×960 桌面 × 中英文，共 12 种布局无溢出；三个菜单页和「小小心动 / Little moments / Moments」名称正确。
- 模型、衣服贴图、三套字体、音乐及素材署名链接均保留 /Year1/ 前缀，无页面异常或资源 HTTP 错误；生产包无开发检查全局。
- 音乐默认关闭、点击后实际播放、音量 0.14、淡出暂停；双语切换与音效静音独立。
- 牵手与击掌夹手距离约 0.22；手机拼装仰角约 60.19°、游玩约 36°；拥抱手臂错位、亲亲与取消/拾回道具均通过。
- 触屏浏览器模拟：真实 touch 输入拖拽安装、目标高亮、单指环绕、轻点解锁音乐、菜单切页和横竖屏通过；不作为实机验收。
- 自由拼装真实鼠标拖拽、高亮、永久虚影及重拼通过；1,200 次固定种子随机选择无近期重复。

浏览器模拟不等于实体 iPhone / Android 验收，实机触摸、声音与性能仍在 TODO。线上部署结果见下方记录。

实现参考：[Vite Pages](https://vite.dev/guide/static-deploy.html#github-pages) · [GitHub Pages 自定义 Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 首次线上发布 · 2026-10-21

- 功能代码本地提交：77d2f9d3af24a04426fa8470df2efa7b98c5c6a1。
- 清理后的公开提交：9394798b9773a93a3ac68af426b82777105c033f。
- [构建和部署工作流](https://github.com/hudsonrivercrossing/Year1/actions/runs/39699582655)：build、deploy 均 success；Pages 部署 7240545615 对应同一公开提交。
- GitHub 仓库 public、默认分支 main；Pages build_type=workflow，HTTPS 已启用。
- 对公开网址运行 check-pages.js：四个手机竖屏、一个横屏与一个桌面 × 中英文，12 种布局通过；模型、贴图、字体和音乐加载正常，无页面异常或 HTTP 资源错误；取消/恢复/重拼通过。
- 146 个线上文件逐一 SHA256 与已验收 dist-pages 相同。
- 分别核对当前版本和 v1.0.0：排除私有目录后，公开文件树与各自的本地版本逐项一致；本次发布前的 19 个历史提交均完成同样核对。9 个私有原件的 blob ID 均不存在于公开可达对象中；禁止路径和常见凭据特征扫描通过。
- 本机 v1.0.0 保持原 SHA；GitHub v1.0.0 指向清理后的 2cc79b67cb1b3654df7fe598613f5d66c702a5cd。
- 现有 ChatGPT Site 保留；本轮未修改其部署或访问范围。

后续本记录与 TODO 的文档提交不改变经过验收的生产资源；代码推送 main 后继续由 Actions 自动发布。
