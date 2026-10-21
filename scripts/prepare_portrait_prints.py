"""Original vector-like redraws of catalogued LEGO shirt prints, not catalog photos.
973pb5102c01 / 973pb3541c01; see public/textures/README.md for source/confidence.
"""
from pathlib import Path
from PIL import Image, ImageDraw
out=Path('public/textures');out.mkdir(exist_ok=True)
size=1024
for kind in ['dj-sweater','yw-stripes']:
 for side in ['front','back']:
  im=Image.new('RGB',(size,size),'#9DC3F7' if kind=='dj-sweater' else '#F4F4F4');d=ImageDraw.Draw(im)
  if kind=='dj-sweater':
   navy='#17394e';cream='#f5f1dc';blue='#467ea7'
   d.rectangle((0,0,1024,265),fill=navy)
   # Rounded knit neckline follows the standard torso's trapezoidal front.
   d.arc((225,-130,799,120),0,180,fill=cream,width=24)
   d.arc((245,-125,779,90),0,180,fill=blue,width=12)
   for x in range(42,1024,96):d.polygon([(x,164),(x+12,180),(x,196),(x-12,180)],fill=cream)
   d.rectangle((0,230,1024,244),fill=cream)
   d.rectangle((0,282,1024,480),fill=cream)
   for x in range(72,1024,176):
    pts=[(x,306),(x+65,380),(x,454),(x-65,380),(x,306)]
    d.line(pts,fill=navy,width=12,joint='curve')
    d.line([(x,334),(x+40,380),(x,426),(x-40,380),(x,334)],fill=blue,width=8,joint='curve')
   for x in range(0,1024,130):d.ellipse((x-8,490,x+8,506),fill=navy)
   d.rectangle((0,522,1024,532),fill=cream)
   wave=[(x,580+(32 if (x//64)%2 else 0))for x in range(-64,1090,64)]
   d.line(wave,fill=navy,width=27,joint='curve')
   d.line([(x,y+30)for x,y in wave],fill=blue,width=14,joint='curve')
   for x in range(20,1024,85):d.polygon([(x,686),(x+11,700),(x,714),(x-11,700)],fill=cream)
   if side=='front':d.arc((290,720,760,845),13,160,fill=blue,width=9)
  else:
   for y in [262,374,486,598,710,822]:d.rectangle((25,y,999,y+28),fill='#c42e37')
   if side=='front':
    d.arc((335,-30,689,130),0,180,fill='#d9d6c9',width=10)
    for x in range(375,665,30):d.line((x,79,x-3,107),fill='#e5e1d5',width=5)
  im.save(out/(kind+'-'+side+'.png'))
  print(out/(kind+'-'+side+'.png'))
