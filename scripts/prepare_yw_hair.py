"""Original visual approximation of long straight hair with blunt bangs.

The photographed 17346/75867 family has no matching file in either checked
LDraw archive. This is original procedural geometry, NOT an official part,
not a traced catalog mesh, and not a printable or manufacturing model.
Coordinates use the same nominal minifig head origin and LDraw-unit scale.
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
def ring(y,rx,rz,n=64,start=0,end=math.tau,groove=0):
 return [(math.sin(a)*rx,y,-math.cos(a)*rz+groove*math.cos(a*13))for a in [start+(end-start)*k/(n if end==math.tau and start==0 else n-1)for k in range(n)]]

# Hollow scalp cap. The inside clears a nominal standard head/stud, while the
# front hem stays above the candidate head's eyebrows (first print Y=5.17).
outer=[ring(y,15.5*r,15.2*r)for y,r in [(-8,.001),(-7.6,.3),(-6.9,.5),(-5.9,.67),(-4.7,.8),(-3.3,.9),(-1.7,.97),(.8,1),(3.8,1.015)]]
inner=[ring(y,13.3*r,13.3*r)for y,r in [(-6,.001),(-5,.43),(-3,.76),(0,.98),(2,1),(3.8,1)]]
grid(outer,True);grid([list(reversed(r))for r in inner],True)
for n in range(64):
 j=(n+1)%64;quad(outer[-1][n],inner[-1][n],inner[-1][j],outer[-1][j])

# Blunt fringe; a barely curved hem, rather than a side part or swept bangs.
front=[]
for y in [3.8,4.8]:
 row=ring(y,15.73,15.43,33,-.83,.83)
 if y==4.8:row=[(x,y+.12*math.cos(k/32*math.pi*6),z)for k,(x,y,z)in enumerate(row)]
 front.append(row)
grid(front)
quad(*[front[1][0],(front[1][0][0],4.8,front[1][0][2]+1.3),(front[1][-1][0],4.8,front[1][-1][2]+1.3),front[1][-1]])

# Upper side/back shell tapers to a rear curtain below the head. The narrowing
# leaves actual torso/shoulder clearance; long front locks are separate pieces.
profiles=[(3.8,.83,15.73,15.43),(12,.89,15.8,15.5),(20.5,1.03,15.9,15.5),(23,2.18,15.5,15.5),(26,2.45,15.2,15.2),(34,2.45,15,15),(41.8,2.45,14.8,14.8)]
back=[];back_inside=[]
for y,start,rx,rz in profiles:
 back.append(ring(y,rx,rz,49,start,math.tau-start,.08))
 back_inside.append(ring(y,rx-1.2,rz-1.2,49,start,math.tau-start))
grid(back);grid([list(reversed(r))for r in back_inside])
for n in range(48):quad(back[-1][n],back[-1][n+1],back_inside[-1][n+1],back_inside[-1][n])
for side in [0,-1]:
 for n in range(len(back)-1):quad(back[n][side],back_inside[n][side],back_inside[n+1][side],back[n+1][side])

# Rounded front locks: outside the front face of a standard 973 torso, so the
# long silhouette does not run through the shirt or require scaling the torso.
for sign in [-1,1]:
 rows=[]
 for y,x,z,rx,rz in [(.8,11.6,-10.9,2.8,1.3),(5,12.5,-11.7,3.2,1.4),(11,13.8,-12.4,3.5,1.4),(20,14.1,-12.9,3.6,1.4),(29,13.9,-13.1,3.4,1.35),(38,13.2,-13.1,2.8,1.2),(40.7,12.7,-12.9,1.5,.8),(41.6,12.7,-12.9,.1,.1)]:
  rows.append([(sign*x+rx*math.sin(k*math.tau/20),y,z+rz*math.cos(k*math.tau/20))for k in range(20)])
 grid(rows,True)

out=Path('public/models');out.mkdir(parents=True,exist_ok=True)
(out/'yw-long-bangs-approx.json').write_text(json.dumps({'16':vertices},separators=(',',':')))
(out/'yw-long-bangs-approx.meta.json').write_text(json.dumps({
 'id':'yw-long-bangs-approx','source':'Original procedural project geometry',
 'generator':'scripts/prepare_yw_hair.py','officialLDraw':False,'catalogReferences':['https://www.bricklink.com/v2/catalog/catalogitem.page?P=17346','https://www.bricklink.com/v2/catalog/catalogitem.page?P=75867'],
 'description':'Visual long-straight-bangs approximation on the nominal standard minifig head origin. Neither exact mold nor soft/hard material variant is confirmed. No third-party mesh used; not a manufacturing model.',
 'triangles':len(vertices)//9},indent=2))
print('yw-long-bangs-approx',len(vertices)//9,'original triangles')
