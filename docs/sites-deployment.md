# ChatGPT Sites 部署

- 地址：https://dj-yw-little-brick-world.jovialangel128.chatgpt.site
- 当前访问范围：仅所有者的 ChatGPT 账号，未开放公共访问或添加其他访问者。
- 发布日期：2026-10-21。
- 发布状态：Sites 原生操作返回 `succeeded`。
- 项目 ID：`appgprj_6ad83efe21fc8191b7860f21faf541e8`。
- 部署 ID：`appgdep_6ad967d32638819184d41166cc76c8e5`。
- 版本 ID：`appgprj_6ad83efe21fc8191b7860f21faf541e8~appgver_c6b4803bbe2c8191bb2ec98e78d1b848`。
- 本地功能：三个高级动作与本部署记录一同提交；`v1.0.0` 标签保持不变。
- Sites 源码提交：`9c1315bada81a300706d309e38f61dbc9c46fb52`。
- 本次增量：手机拼装／游玩默认镜头距离缩短 5%，保持原有俯仰方向与手动接管；生活页签保留加一会儿班、种一朵花、送你一只包；支持中断、收场和原道具拾回，保留手机毛玻璃菜单、独立音乐与默认交互音效。
- 本轮内容：手机工作台布局、照片部件与配色、六个新动作、两条新组合、四件手持物的放落/返回拾取；[验收记录](mobile-actions-validation.md)。
- 发布构建与本地生产构建的 183 个文件逐一 SHA256 一致。

## 更新方式

本地 `.openai/hosting.json` 记录同一项目 ID；再次发布时复用这个项目，不重复创建。

独立的发布 checkout：
`/Users/djfan/.codex/visualizations/2026/10/21/01a15c4c-02b3-7f12-9c3f-a75cbc7e039a/my-little-brick-world-site`。

按 Sites skill 获取同项目的短期源码凭据，由 source helper 同步、构建、打包并发布。不要把凭据写入文件或 Git。保留现有访问范围，除非用户要求改变。

发布的是完整前端运行资源：拼装、语言、音乐/音效、新动作及组合均保留。原始参考照片、Blender 编辑文件和原仓库 Git 历史没有上传到 Sites。部署包逐文件 SHA256 与本地通过验证的 dist 一致。

原生发布结果确认部署成功；没有把未登录访问私有页面当成发布失败，也没有额外声称已在云端完成登录后的完整交互验收。
