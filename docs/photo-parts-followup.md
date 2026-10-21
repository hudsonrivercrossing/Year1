# 照片零件复核与本轮实施

2026-10-21。原图为 `assets/reference/anniversary-frame.png`；放大只用于辨认，不把插值像素当成新增细节。**标准模型可验证，照片上的唯一型号不一定可验证。**

## 已接入与置信度

| 部位 | 本轮选用 | 判断与限制 |
| --- | --- | --- |
| DJ 头发 | 官方 LDraw `99930`，黑色 | 目录是短侧梳左分缝；照片前额起伏与两侧短边，比 `87991` 大体积蓬松碎发更贴合。是有依据的最佳外形选择，单一正面照片仍不能证明模具唯一编号。 |
| YW 头发 | 原创 `yw-long-bangs-approx` | 取代不匹配的 `4530` 肩长发，补平刘海和长直发两侧发束。它是脚本生成的视觉近似，**不是**官方 `17346` 或 `75867` 模型，不宣称软胶/硬塑料版本或制造尺寸。精确标准模型继续待替换。 |
| YW 脸 | 官方 LDraw `3626cp8r` / BrickLink `3626pb1352` 对照款 | 文件头明确映射 1352；睫毛、眉、张嘴露齿与红舌这一正面家族比无睫毛基础笑脸接近。目录明确列 `3626pb2662` 为相似正面印花，区别包括背面表情；原图只见正面，**不能唯一判定 1352 vs 2662**。选择 1352 是可追溯的对照实现，不是声称照片型号已鉴定。 |
| DJ 腿 / 髋 | 标准长腿，White 15 / Black 0 | 放大可见浅色腿上方连续深色腰带区域，并延续到髋侧。采用黑髋白腿，比分不清髋/腿颜色更贴近；反光下的真实色批仍非照片可测。 |
| YW 腿 / 髋 | 标准长腿，Dark Turquoise 3 | 照片是饱和青绿/青蓝家族，采用目录标准深青绿，并给髋与腿独立配置。精确色号仍是统一标准调色板后的视觉选择。 |
| 头 / 双手肤色 | 两人均 Yellow 14 | 照片为经典黄皮人仔；新增独立 `skin` 配置，使头与双手共用同一标准颜色。 |
| 躯干 / 手臂 | DJ Bright Light Blue 212；YW White 15 | 由已核对的上衣目录底色支持；躯干与手臂在定义中分别配置。 |

目录与源文件为一手依据：

- [99930 短侧梳头发目录](https://www.bricklink.com/v2/catalog/catalogitem.page?P=99930)；[87991 蓬松侧分目录](https://www.bricklink.com/v2/catalog/catalogitem.page?P=87991)。[LDraw 99930 官方状态、作者与 CC BY 4.0](https://library.ldraw.org/parts/15155)；本地保留 `public/ldraw-source/parts/99930.dat`。
- [17346 软胶平刘海长直发](https://www.bricklink.com/v2/catalog/catalogitem.page?P=17346)与[75867 硬塑料版本](https://www.bricklink.com/v2/catalog/catalogitem.page?P=75867)彼此列为类似模具。目录标称外廓相近，不能据照片区分软硬材料。
- [1352 正面笑脸 / 反面睡脸目录](https://www.bricklink.com/v2/catalog/catalogitem.page?P=3626pb1352)与[2662 双面笑脸目录](https://www.bricklink.com/v2/catalog/catalogitem.page?P=3626pb2662)互列类似印花；本地 `public/ldraw-source/parts/3626cp8r.dat` 文件头含 BrickLink 1352 映射，作者 Philippe Hurbain，CC BY 4.0。
- [973pb5102c01 上衣目录](https://www.bricklink.com/v2/catalog/catalogitem.page?P=973pb5102c01)、[973pb3541c01 上衣目录](https://www.bricklink.com/v2/catalog/catalogitem.page?P=973pb3541c01)。

## 颜色配置

RGB 采用本轮实际使用的官方库配置 `public/ldraw-source/LDConfig.ldr`，不是从照片采样：

| 色号 | 名称 | 当前库 RGB |
| --- | --- | --- |
| 0 | Black | `#1B2A34` |
| 3 | Dark Turquoise | `#069D9F` |
| 14 | Yellow | `#FAC80A` |
| 15 | White | `#F4F4F4` |
| 212 | Bright Light Blue | `#9DC3F7` |

主场景的暖光、色调映射与屏幕也会改变最终观感。`skin`、`torso`、`arm`、`hips`、`legs`、`hair` 均分别配置。

## 缺失标准模型与原创近似

本轮逐文件检查[官方完整库](https://library.ldraw.org/library/updates/complete.zip)及新下载的[未发布件库](https://library.ldraw.org/library/unofficial/ldrawunf.zip)：二者均无 `17346.dat`、`75867.dat`，也未发现对应模具关键词映射。LDraw 论坛的[该发型请求](https://forums.ldraw.org/thread-28454-post-55288.html)提到未清理的 LDD 导出来源；这不能替代已核对许可的正式模型，因此没有直接移用来源不清的下载文件。

原创近似由 `scripts/prepare_yw_hair.py` 生成，保留名义人仔头原点；不调用或描摹第三方网格。第二版按照片修正轮廓：降低头顶体积，把两条分离发束替换成与顶盖相连的侧发壳，保留齐刘海和眉眼净空；发尾由约 42 LDU 缩短至 36 LDU，并在肩部抬高、前后垂落。内外壁在颈部以下按标准躯干轮廓留出间隙，表面加入浅发丝凹纹。当前 5,194 个三角面，仍为原创视觉近似，不是精确官方件或制造模型。

`public/models/yw-long-bangs-approx.meta.json` 与 `public/models/manifest.json` 明确标记原创近似。Blender 属性也不把它署为 LDraw 官方件。`prepare_parts.py` 末尾会调用生成脚本，保证可重复构建。

## 官方上衣印花复核

对两套库全部 `.dat` 文件再次检索 `973pb5102`、`973pb3541`、`Fair Isle`；未找到这两件印花。搜到的 Friends 驯鹿毛衣与经典太空节日毛衣均是不同图案，不能拿来替代后冒称已找到同款。因此继续保留本项目已明确署为重绘的印花；**可靠官方同款印花模型的替换仍待完成**。

## 同批标准道具资产

已从官方库展开并保留源文件：`90540` 滑雪杖、`3899` 杯、`33120` 甜筒、`6254` 冰淇淋球。分别是 388、430、464、842 三角面；所有子件与作者许可一起留存。角色自身左右与道具放下/拾回由主场景的握持点及动作系统处理。

## 快照与校验

- 官方库 SHA256：`f3e496d0ede69ca7942fa4aa198e661ee2d22723906101e2e339d8917a4dd5f2`。
- 未发布件库 SHA256：`a8f01d7b863f5523122ca2d94d5add81212579506759b1e24e066af533523ddc`。
- 新增几何均通过有限数值、顶点数与三角面分组校验；生成脚本通过 Python 编译检查。
- 临时 Blender 近景验证了官方短发外形与 YW 眉眼净空，没有覆盖项目中的 Blender 文件。完整游戏动画、长发转头净空和手机视图仍由主场景回归检查。
- 长发位于颈部以下，头部大角度独立扭转会带动头发扫过肩膀。姿势应限制长发角色的颈部偏转、配合身体转向，而不是让头发与脸各自运动。
