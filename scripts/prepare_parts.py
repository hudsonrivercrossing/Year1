"""Flatten official LDraw triangles, preserving original files and author credits.
Usage: python3 scripts/prepare_parts.py /path/to/complete.zip
Coordinates remain in LDraw units; normals are computed in the client.
"""
from pathlib import Path
from collections import defaultdict
import zipfile, json, sys
archive=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/little-brick-ldraw.zip')
z=zipfile.ZipFile(archive)
names={n.lower():n for n in z.namelist()}
out=Path('public/models');out.mkdir(parents=True,exist_ok=True)
sources=Path('public/ldraw-source');sources.mkdir(parents=True,exist_ok=True)
used=set()
def resolve(name):
 name=name.replace('\\','/').lower()
 for p in ['ldraw/parts/'+name,'ldraw/p/'+name,'ldraw/'+name]:
  if p in names:return names[p]
 raise FileNotFoundError(name)
def mv(a,v):return [sum(a[r*3+c]*v[c] for c in range(3)) for r in range(3)]
def mm(a,b):return [sum(a[r*3+k]*b[k*3+c] for k in range(3)) for r in range(3) for c in range(3)]
def expand(name,a,t,color,geo,depth=0):
 if depth>40:raise ValueError('Recursive part')
 path=resolve(name);used.add(path)
 text=z.read(path).decode('utf-8-sig',errors='replace')
 for line in text.splitlines():
  bits=line.split()
  if not bits or bits[0] not in ['1','3','4']:continue
  kind=bits[0];c=bits[1];c=color if c=='16' else c
  if kind=='1':
   nums=list(map(float,bits[2:14]));tt=mv(a,nums[:3]);tt=[tt[i]+t[i] for i in range(3)]
   expand(' '.join(bits[14:]),mm(a,nums[3:]),tt,c,geo,depth+1)
  else:
   nums=list(map(float,bits[2:]));vs=[]
   for i in range(0,len(nums),3):
    v=mv(a,nums[i:i+3]);vs.append([round(v[j]+t[j],5) for j in range(3)])
   # Double-sided material makes mirrored subparts and BFC inversion safe.
   for tri in ([(0,1,2)] if kind=='3' else [(0,1,2),(0,2,3)]):
    for i in tri:geo[c].extend(vs[i])
parts=['3626cp8y','3626cp01','973','3815','3816','3817','3818','3819','3820','3901','87991','4530']
for part in parts:
 geo=defaultdict(list);expand(part+'.dat',[1,0,0,0,1,0,0,0,1],[0,0,0],'16',geo)
 (out/(part+'.json')).write_text(json.dumps(dict(geo),separators=(',',':')))
 print(part,sum(len(x)//9 for x in geo.values()),'triangles')
# Share the authoritative palette with both browser and Blender importers.
import re
config=z.read(names['ldraw/ldconfig.ldr']).decode('utf-8-sig')
colours={code:value for code,value in re.findall(r'!COLOUR\s+\S+\s+CODE\s+(\d+)\s+VALUE\s+(#[0-9A-Fa-f]{6})',config)}
Path('src/ldraw-colors.json').write_text(json.dumps(colours,indent=2))
(sources/'LDConfig.ldr').write_text(config)
for path in sorted(used):
 target=sources/path.removeprefix('ldraw/');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(path))
for name in ['CAreadme.txt','CAlicense.txt','CAlicense4.txt','Readme.txt']:
 path='ldraw/'+name
 if path.lower() in names:(sources/name).write_bytes(z.read(names[path.lower()]))
(out/'manifest.json').write_text(json.dumps({'source':'https://library.ldraw.org/library/updates/complete.zip','parts':parts,'sourceFiles':len(used)},indent=2))
print('Source files retained:',len(used))
