"""blender --background --python scripts/build_blender.py
Build an editable hierarchy from the same standard-part meshes as the browser.
"""
import bpy, json, math
from pathlib import Path
root=Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
S=.035
# Blender Z up; glTF export automatically converts to web Y up.
def position(v):return (v[0]*S,v[2]*S,-v[1]*S)
def empty(name,parent=None,xyz=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=xyz;return o
def material(hex):
 m=bpy.data.materials.get(hex)
 if m:return m
 m=bpy.data.materials.new(hex);m.use_nodes=True
 # Convert sRGB input to linear for the shader.
 rgb=[int(hex[i:i+2],16)/255 for i in (1,3,5)]
 rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
 m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*rgb,1)
 m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.32
 return m
def part(id,color,parent):
 data=json.loads((root/'public/models'/f'{id}.json').read_text())
 for code,coords in data.items():
  verts=[position(coords[i:i+3]) for i in range(0,len(coords),3)]
  mesh=bpy.data.meshes.new(id);mesh.from_pydata(verts,[],[(i,i+1,i+2) for i in range(0,len(verts),3)]);mesh.update()
  obj=bpy.data.objects.new('LDraw_'+id,mesh);bpy.context.collection.objects.link(obj);obj.parent=parent
  mesh.materials.append(material(color if code=='16' else '#201c18' if code=='0' else '#f2c638' if code=='14' else color))
  obj['ldraw_part']=id;obj['source']='LDraw.org';obj['license']='CC BY 4.0; see public/ldraw-source'
 return obj
for i,d in enumerate(json.loads((root/'src/character-definitions.json').read_text())):
 rig=empty(d['name'],xyz=(-2 if i==0 else 2,0,72*S));rig['units']='LDraw units converted at 0.035 scene units/LDU'
 torso=empty('torso',rig);part('973',d['torso'],torso)
 legs=empty('legs',rig,position((0,32,0)));part('3815',d['legs'],legs)
 for id,x in [('3816',-10),('3817',10)]:
  pivot=empty('hip_'+id,legs,position((x,12,0)));shape=empty('leg_shape',pivot,position((-x,0,0)));part(id,d['legs'],shape)
 for name,id,x in [('rightArm','3818',-15.552),('leftArm','3819',15.552)]:
  arm=empty(name,rig,position((x,9,0)));arm.rotation_euler.y=(1 if name=='rightArm' else -1)*math.radians(9.782);part(id,d['torso'],arm)
  hand=empty('hand',arm,position((-5 if name=='rightArm' else 5,20,-10)));hand.rotation_euler.x=math.pi/4;part('3820','#f2cb42',hand)
 head=empty('head',rig,position((0,-24,0)));part('3626cp01','#f2cb42',head)
 hair=empty('hair',rig,position((0,-24,0)));part(d['hairPart'],d['hair'],hair)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets/characters.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'public/models/characters.glb'),export_format='GLB',export_yup=True)
print('Saved editable standard-part characters and GLB')
