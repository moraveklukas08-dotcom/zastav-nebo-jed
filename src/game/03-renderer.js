/* ============================== renderer ============================== */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr));
renderer.shadowMap.enabled = Q.shadows; renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const pmrem = new THREE.PMREMGenerator(renderer);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.12, 1500);
camera.rotation.order = 'YXZ';
const carRig = new THREE.Group(); carRig.rotation.order = 'YXZ'; scene.add(carRig); carRig.add(camera);
const CAMW = new THREE.Vector3(), CAMQ = new THREE.Quaternion();
const hemi = new THREE.HemisphereLight(0xdcecff, 0x5a6440, 0.35);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffeccc, 2.6);
sun.castShadow = Q.shadows;
sun.shadow.mapSize.set(Q.shadowSize, Q.shadowSize);
Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 260 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);
const headlight = new THREE.SpotLight(0xfff1d8, 0, 110, 0.46, 0.6, 1.1);
headlight.position.set(0.38, -0.6, -1.9); carRig.add(headlight);
const hlTarget = new THREE.Object3D(); hlTarget.position.set(0.38, -2.2, -32); carRig.add(hlTarget); headlight.target = hlTarget;

