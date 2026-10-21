"""Original visual approximation of the photographed straight, heavy-bang hair.

Not an official 17346/75867 mesh, traced catalog asset or manufacturing model.
All geometry is original; nominal minifig head origin and LDraw-unit scale.
"""
from pathlib import Path
import json, math

vertices=[]
def tri(a,b,c):
 for p in (a,b,c):vertices.extend(round(v,5)for v in p)
def quad(a,b,c,d):tri(a,b,c);tri(a,c,d)
def grid(rows,close=False):
 for row,next_row in zip(rows,rows[1:]):
  count=len(row)if close else len(row)-1
  for n in range(count):
   j=(n+1)%len(row);quad(row[n],row[j],next_row[j],next_row[n])
def ring(y,rx,rz,n=96,start=0,end=math.tau,groove=0):
 result=[]
 for k in range(n):
  a=start+(end-start)*k/(n if start==0 and end==math.tau else n-1)
  # Shallow molded strand channels; no painted stripes or silhouette spikes.
  front=max(0,math.cos(a))**4
  relief=groove*(.5+.5*math.cos(a*19))*front
  result.append((math.sin(a)*rx,y,-math.cos(a)*(rz-relief)))
 return result

# A lower crown flows into the temples instead of overhanging like a bowl.
outer=[ring(y,15.1*r,14.8*r,groove=.10)for y,r in [(-6.8,0),(-6.5,.34),(-5.9,.58),(-4.9,.77),(-3.4,.90),(-1.4,.975),(.8,1),(3.8,1)]]
inner=[ring(y,13.3*r,13.3*r)for y,r in [(-6,0),(-5,.43),(-3,.76),(0,.98),(2,1),(3.8,1)]]
grid(outer,True);grid([list(reversed(r))for r in inner],True)
for n in range(96):
 j=(n+1)%96;quad(outer[-1][n],inner[-1][n],inner[-1][j],outer[-1][j])

# Heavy, almost straight fringe with softly turned corners. The hem clears
# the candidate face's eyebrows (first printed geometry at Y=5.17).
front=[]
for y in [3.8,4.65]:
 row=ring(y,15.1,14.8,41,-.84,.84,.10)
 if y>4:row=[(x,y+.10*math.cos(k/40*math.pi*8)-.30*abs(k/20-1)**6,z)for k,(x,y,z)in enumerate(row)]
 front.append(row)
grid(front)
quad(front[1][0],(front[1][0][0],front[1][0][1],front[1][0][2]+1.1),(front[1][-1][0],front[1][-1][1],front[1][-1][2]+1.1),front[1][-1])

def clear_torso(x,y,z,padding):
 # Keep both shell surfaces outside the standard 973 silhouette below neck.
 q=y-24
 if 0<=q<=32:
  half=12+(14.345-12)*q/2 if q<2 else 14.345+(19-14.345)*(q-2)/27
  scale=min((half+padding)/max(abs(x),1e-8),(10+padding)/max(abs(z),1e-8))
  if scale>1:x*=scale;z*=scale
 return(x,y,z)

# Continuous wig shell: the face opening is cut directly into the same
# surface as the crown and sides. No separate hanging tubes or front locks.
# Below the neck, a rounded rectangular section clears the torso. The hem
# rises over each shoulder, while the front/back curtains remain longer.
back=[];inside=[]
profiles=[(3.8,15.1,14.8,1),(7,15.3,15.0,1),(13,15.5,15.2,1),(20.5,15.7,15.4,1),(23,15.8,15.3,.9),(26,16.0,15.2,.75),(30,16.0,15.0,.6),(34,15.8,14.9,.5),(36,15.6,14.8,.5)]
for y,rx,rz,power in profiles:
 start=math.asin((15.1*math.sin(math.tau*10/96)/rx)**(1/power))
 outer_row=[];inner_row=[]
 irx,irz=(13.3,13.3)if y==3.8 else(rx-1.1,rz-1.1)
 for k in range(77):
  a=start+(math.tau-2*start)*k/76;sn,cs=math.sin(a),math.cos(a)
  u=math.copysign(abs(sn)**power,sn);v=math.copysign(abs(cs)**power,cs)
  yy=y if y<=20.5 else 20.5+(y-20.5)*(15.5-14*abs(sn)**4)/15.5
  channel=.10*(.5+.5*math.cos(a*19))*max(0,cs)**4
  outer_row.append(clear_torso(rx*u,yy,-(rz-channel)*v,1.1))
  inner_row.append(clear_torso(irx*u,yy,-irz*v,.2))
 back.append(outer_row);inside.append(inner_row)
grid(back);grid([list(reversed(r))for r in inside])
# Closed, softly beveled front rims and a short rounded lower hem.
for n in range(76):quad(back[-1][n],back[-1][n+1],inside[-1][n+1],inside[-1][n])
for side in [0,-1]:
 for n in range(len(back)-1):quad(back[n][side],inside[n][side],inside[n+1][side],back[n+1][side])

out=Path(__file__).resolve().parent.parent/'public/models';out.mkdir(parents=True,exist_ok=True)
(out/'yw-long-bangs-approx.json').write_text(json.dumps({'16':vertices},separators=(',',':')))
(out/'yw-long-bangs-approx.meta.json').write_text(json.dumps({
 'id':'yw-long-bangs-approx','revision':2,'source':'Original procedural project geometry',
 'generator':'scripts/prepare_yw_hair.py','officialLDraw':False,
 'catalogReferences':['https://www.bricklink.com/v2/catalog/catalogitem.page?P=17346','https://www.bricklink.com/v2/catalog/catalogitem.page?P=75867'],
 'description':'Photo-guided visual approximation: lower crown, connected heavy fringe and continuous face-framing side curtains, shoulder clearances and shorter curved ends and subtle molded strand channels. Neither exact mold nor material variant is confirmed; no third-party mesh used; not a manufacturing model.',
 'triangles':len(vertices)//9},indent=2))
print('yw-long-bangs-approx',len(vertices)//9,'original triangles, revision 2')
