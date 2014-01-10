# util
clamp = (num, min, max) -> if num < min then min else if num > max then max else num

scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100)

renderer = new THREE.WebGLRenderer( antialiasing: true )
renderer.setSize(window.innerWidth, window.innerHeight)

document.getElementById('main').appendChild(renderer.domElement)

addNode = (pos) ->
  nodeGeom = new THREE.CylinderGeometry(0.2, 0.24, 0.05, 40, 1, true)
  nodeMat = new THREE.MeshBasicMaterial( color: 0x00ffcc, transparent: true, opacity: 0.9, wireframe: true )
  node = new THREE.Mesh(nodeGeom, nodeMat)
  node.rotation.x = Math.PI / 2
  node.position = pos

  scene.add(node)

addSegment = (pos1, pos2) ->
  segGeom = new THREE.Geometry()
  segGeom.vertices.push(pos1)
  segGeom.vertices.push(pos2)
  segMat = new THREE.LineBasicMaterial( color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.2 )
  seg = new THREE.Line(segGeom, segMat)

  scene.add(seg)

addNode(new THREE.Vector3( 0, 0, 0 ))
addNode(new THREE.Vector3( 1, -1, 0 ))

addSegment(new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 1, -1, 0 ))

camera.position.z = 10

render = ->
  requestAnimationFrame(render)

  #camera.position.z -= 0.1

  renderer.render(scene, camera)

render()

document.body.addEventListener('mousewheel', ((event) ->
  console.log(event.wheelDelta)
  camera.position.z += clamp(event.wheelDelta * -0.1, -0.5, 0.5) ? 0
  camera.position.z = clamp(camera.position.z, 1.5, 30)
), false)

