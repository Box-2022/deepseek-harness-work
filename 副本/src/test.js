(function(){
  const app = document.getElementById('app');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth/innerHeight, 0.1, 200);
  camera.position.set(8, 6, 10);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  app.appendChild(renderer.domElement);
  const geo = new THREE.BoxGeometry(2,2,2);
  const mat = new THREE.MeshToonMaterial({ color: 0xff8844 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  const amb = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(amb);
  const dl = new THREE.DirectionalLight(0xffffff, 1);
  dl.position.set(4, 8, 5);
  scene.add(dl);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0,0,0);
  controls.update();
  window.__ready = true;
  function loop(){
    requestAnimationFrame(loop);
    mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  loop();
})();
