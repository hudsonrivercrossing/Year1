"""Create small local WOFF2 files for current interface text. Sources: output/fonts/."""
from pathlib import Path
from fontTools import subset
chars=set(chr(i) for i in range(32,127))
chars.update('一起体验这个世界我们刚好每下一块也想和你自由拼装引导提示开关再次让的小动起来抱个招呼跳舞语音乐播放暂停换中关闭拖空白处环绕视角右键平移滚轮双指缩放点靠近对应虚影先部分再接双腿身体臂头发余')
for p in Path('src').glob('*'):
 if p.suffix in ['.ts','.json']:chars.update(p.read_text())
for filename,target in [('LXGWWenKai-Regular.ttf','WenKai-UI.woff2'),('Baskervville-Regular.ttf','Baskervville-Regular.woff2'),('Baskervville-Italic.ttf','Baskervville-Italic.woff2'),('Sacramento-Regular.ttf','Sacramento-Regular.woff2')]:
 options=subset.Options();options.flavor='woff2';options.layout_features=['*'];options.name_IDs=['*']
 font=subset.load_font('output/fonts/'+filename,options)
 worker=subset.Subsetter(options=options);worker.populate(text=''.join(sorted(chars)));worker.subset(font)
 subset.save_font(font,'public/fonts/'+target,options)
 print(target,Path('public/fonts/'+target).stat().st_size)
