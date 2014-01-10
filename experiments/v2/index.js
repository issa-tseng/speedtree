(function() {
  var addNode, addSegment, camera, clamp, render, renderer, scene;

  clamp = function(num, min, max) {
    if (num < min) {
      return min;
    } else if (num > max) {
      return max;
    } else {
      return num;
    }
  };

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);

  renderer = new THREE.WebGLRenderer({
    antialiasing: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);

  document.getElementById('main').appendChild(renderer.domElement);

  addNode = function(pos) {
    var node, nodeGeom, nodeMat;
    nodeGeom = new THREE.CylinderGeometry(0.2, 0.24, 0.05, 40, 1, true);
    nodeMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.9,
      wireframe: true
    });
    node = new THREE.Mesh(nodeGeom, nodeMat);
    node.rotation.x = Math.PI / 2;
    node.position = pos;
    return scene.add(node);
  };

  addSegment = function(pos1, pos2) {
    var seg, segGeom, segMat;
    segGeom = new THREE.Geometry();
    segGeom.vertices.push(pos1);
    segGeom.vertices.push(pos2);
    segMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.2
    });
    seg = new THREE.Line(segGeom, segMat);
    return scene.add(seg);
  };

  addNode(new THREE.Vector3(0, 0, 0));

  addNode(new THREE.Vector3(1, -1, 0));

  addSegment(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, -1, 0));

  camera.position.z = 10;

  render = function() {
    requestAnimationFrame(render);
    return renderer.render(scene, camera);
  };

  render();

  document.body.addEventListener('mousewheel', (function(event) {
    var _ref;
    console.log(event.wheelDelta);
    camera.position.z += (_ref = clamp(event.wheelDelta * -0.1, -0.5, 0.5)) != null ? _ref : 0;
    return camera.position.z = clamp(camera.position.z, 1.5, 30);
  }), false);

}).call(this);
