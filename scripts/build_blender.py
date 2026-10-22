"""blender --background --python scripts/build_blender.py
Build an editable hierarchy from the same standard-part meshes as the browser.
"""
import bpy, bmesh, json, math
from mathutils import Quaternion
from pathlib import Path
root=Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
S=.035
bpy.context.preferences.filepaths.save_version=0
palette=json.loads((root/'src/ldraw-colors.json').read_text())
prop_appearances=json.loads((root/'src/photo-props.json').read_text())
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
  if id=='yw-long-bangs-approx':
   # Match the web mergeVertices + smooth normal treatment of original hair.
   bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001);bm.to_mesh(mesh);bm.free()
   for face in mesh.polygons:face.use_smooth=True
  obj=bpy.data.objects.new(('Original_' if id=='yw-long-bangs-approx' else 'LDraw_')+id,mesh);bpy.context.collection.objects.link(obj);obj.parent=parent
  mesh.materials.append(material(color if code=='16' else palette.get(code,'#'+code[3:] if code.lower().startswith('0x2') else color)))
  if id=='yw-long-bangs-approx':
   obj['part_id']=id;obj['source']='Original procedural project geometry; see public/models/yw-long-bangs-approx.meta.json';obj['catalog_reference']='17346/75867 visual approximation; exact mold unconfirmed'
  else:
   obj['ldraw_part']=id;obj['source']='LDraw.org';obj['license']='CC BY 4.0; see public/ldraw-source'
 return obj
def shirt_print(name,parent):
 outline=[(-12,0),(12,0),(14.345,2),(19,29),(19,32),(-19,32),(-19,29),(-14.345,2)]
 for side,direction in [('front',1),('back',-1)]:
  mesh=bpy.data.meshes.new(name+'_'+side)
  mesh.from_pydata([position((x,y,-direction*10.015))for x,y in outline],[],[(0,i+1,i) if direction==1 else (0,i,i+1)for i in range(1,len(outline)-1)]);mesh.update()
  uv=mesh.uv_layers.new()
  for face in mesh.polygons:
   for index in face.loop_indices:
    x,y=outline[mesh.loops[index].vertex_index];uv.data[index].uv=(.5+direction*x/38,1-y/32)
  m=bpy.data.materials.new(name+'_'+side);m.use_nodes=True
  shader=m.node_tree.nodes.get('Principled BSDF');shader.inputs['Roughness'].default_value=.42
  image=bpy.data.images.load(str(root/'public/textures'/f'{name}-{side}.png'));image.pack()
  texture=m.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image
  m.node_tree.links.new(texture.outputs['Color'],shader.inputs['Base Color'])
  mesh.materials.append(m);obj=bpy.data.objects.new(name+'_'+side,mesh);bpy.context.collection.objects.link(obj);obj.parent=parent
  obj['source']='Original procedural print redraw; see public/textures/README.md'
def waist_print(spec,parent):
 x=18.025;z=10.025;h=spec['height']
 faces=[[(-x,0,-z),(-x,h,-z),(x,h,-z),(x,0,-z)],[(x,0,z),(x,h,z),(-x,h,z),(-x,0,z)],[(-x,0,z),(-x,h,z),(-x,h,-z),(-x,0,-z)],[(x,0,-z),(x,h,-z),(x,h,z),(x,0,z)]]
 mesh=bpy.data.meshes.new('narrow_waist_print');mesh.from_pydata([position(v)for face in faces for v in face],[],[tuple(range(i,i+4))for i in range(0,16,4)]);mesh.update();ink=material(spec['color']).copy();ink.name='waist_print_ink';ink.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.42;mesh.materials.append(ink)
 obj=bpy.data.objects.new('Original_narrow_waist_print',mesh);bpy.context.collection.objects.link(obj);obj.parent=parent;obj['source']='Original replaceable surface print on standard 3815 hips, not a separate structural part'
for i,d in enumerate(json.loads((root/'src/character-definitions.json').read_text())):
 rig=empty(d['name'],xyz=(-2 if i==0 else 2,0,72*S));rig['units']='LDraw units converted at 0.035 scene units/LDU'
 waist=empty('waist',rig,position((0,32,0)));upper=empty('upper',waist,position((0,-32,0)))
 torso=empty('torso',upper);part('973',d['torso'],torso);shirt_print(d['shirtPrint'],torso)
 legs=empty('legs',rig,position((0,32,0)));part('3815',d['hips'],legs)
 if d.get('waistBand'):waist_print(d['waistBand'],legs)
 for id,x in [('3816',-10),('3817',10)]:
  pivot=empty('hip_'+id,legs,position((x,12,0)));shape=empty('leg_shape',pivot,position((-x,0,0)));part(id,d['legs'],shape)
 hands={}
 for name,id,x in [('rightArm','3818',-15.552),('leftArm','3819',15.552)]:
  arm=empty(name,upper,position((x,9,0)));arm.rotation_euler.y=(1 if name=='rightArm' else -1)*math.radians(9.782);part(id,d['arm'],arm)
  kind='pole'if name=='rightArm'else('mug'if i==0 else'iceCream')
  arm.rotation_mode='QUATERNION';arm.rotation_quaternion=Quaternion((1,0,0),prop_appearances[kind]['carryShoulder'])@Quaternion((0,1,0),(1 if name=='rightArm'else -1)*math.radians(9.782))
  hand=empty('hand',arm,position((-5 if name=='rightArm' else 5,20,-10)));hand.rotation_euler.x=math.pi/4;part('3820',d['skin'],hand);hands[name]=hand
 head=empty('head',upper,position((0,-24,0)));part(d['headPart'],d['skin'],head)
 hair=empty('hair',upper,position((0,-24,0)));part(d['hairPart'],d['hair'],hair)
 for hand_name,kind in [('rightArm','pole'),('leftArm','mug' if i==0 else 'iceCream')]:
  socket=empty('photo_grip_'+hand_name,hands[hand_name],position(prop_appearances['handGrip']))
  socket['source']='LDraw 3820 !HELP grip centre';socket['lifecycle']='Web: drop once per complete activity, return and pick up after finish/cancel'
  appearance=prop_appearances[kind]
  if kind=='pole':socket.rotation_euler.x=math.radians(appearance['gripTiltDegrees'])
  else:
   bpy.context.view_layer.update();socket.rotation_mode='QUATERNION';socket.rotation_quaternion=hands[hand_name].matrix_world.to_quaternion().inverted()@rig.matrix_world.to_quaternion()
  for spec in appearance['parts']:
   model=empty(kind+'_grip_offset',socket,position(spec['offset']));part(spec['id'],spec['color'],model)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets/characters.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'public/models/characters.glb'),export_format='GLB',export_yup=True)
print('Saved editable standard-part characters and GLB')
