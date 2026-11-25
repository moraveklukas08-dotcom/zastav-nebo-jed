/* ============================== cockpit, mirror, wipers ============================== */
const cockpit = new THREE.Group(); carRig.add(cockpit);
const CK = {};
const mirrorRT = new THREE.WebGLRenderTarget(384, 128);
const mirrorCam = new THREE.PerspectiveCamera(40, 3, 0.3, 600); mirrorCam.rotation.order = 'YXZ';
{
  const dash = new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.8 });
  const hoodM = new THREE.MeshPhysicalMaterial({ color: 0x7a1414, metalness: 0.05, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.6 });
  const pill = new THREE.MeshStandardMaterial({ color: 0x121315, roughness: 0.85 });
  const add = (geo, m, x, y, z, rx = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.x = rx; cockpit.add(o); return o; };
  add(new RoundedBoxGeometry(1.9, 0.16, 2.3, 3, 0.07), hoodM, 0.38, -0.47, -2.3, 0.05);
  add(new RoundedBoxGeometry(2.8, 0.36, 1.0, 3, 0.12), dash, 0.38, -0.57, -0.86);
  add(new RoundedBoxGeometry(0.56, 0.16, 0.34, 3, 0.06), dash, 0, -0.33, -0.8);
  add(new RoundedBoxGeometry(0.06, 1.15, 0.07, 2, 0.025), pill, -0.92, 0.02, -0.72, 0.64);
  add(new RoundedBoxGeometry(0.06, 1.15, 0.07, 2, 0.025), pill, 1.5, 0.02, -0.72, 0.64);
  const [cc, g] = makeCanvas(512, 200);
  const drawDial = (cx, max, step, label) => { g.fillStyle = '#07090b'; g.beginPath(); g.arc(cx, 100, 92, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#3a4048'; g.lineWidth = 3; g.stroke(); g.strokeStyle = '#e9eef2'; g.fillStyle = '#e9eef2'; g.font = '600 17px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let vv = 0; vv <= max; vv += step / 2) { const a = (225 - vv / max * 270) * DEG; const major = vv % step === 0; g.lineWidth = major ? 3 : 1.5; g.beginPath(); g.moveTo(cx + Math.cos(a) * 86, 100 - Math.sin(a) * 86); g.lineTo(cx + Math.cos(a) * (major ? 72 : 78), 100 - Math.sin(a) * (major ? 72 : 78)); g.stroke(); if (major) g.fillText(label(vv), cx + Math.cos(a) * 58, 100 - Math.sin(a) * 58); } };
  g.fillStyle = '#000'; g.fillRect(0, 0, 512, 200);
  drawDial(128, 200, 20, x => x); drawDial(384, 7, 1, x => x);
  g.fillStyle = '#8a929b'; g.font = '600 13px ' + FONT; g.fillText('km/h', 128, 150); g.fillText('×1000 ot.', 384, 150);
  const cl = add(new THREE.PlaneGeometry(0.46, 0.18), new THREE.MeshBasicMaterial({ map: toTex(cc, false), toneMapped: false }), 0, -0.33, -0.63, -0.35);
  const needleM = new THREE.MeshBasicMaterial({ color: 0xff4a2a, toneMapped: false });
  const mkNeedle = x => { const p = new THREE.Group(); p.position.set(x, 0, 0.002); const n = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 0.065), needleM); n.position.y = 0.03; p.add(n); cl.add(p); return p; };
  CK.speed = mkNeedle(-0.115); CK.rpm = mkNeedle(0.115);
  const indM = new THREE.MeshBasicMaterial({ color: 0x163a1a, toneMapped: false });
  CK.indL = new THREE.Mesh(new THREE.CircleGeometry(0.008, 3), indM.clone()); CK.indL.position.set(-0.02, 0.07, 0.003); CK.indL.rotation.z = Math.PI; cl.add(CK.indL);
  CK.indR = new THREE.Mesh(new THREE.CircleGeometry(0.008, 3), indM.clone()); CK.indR.position.set(0.02, 0.07, 0.003); cl.add(CK.indR);
  const wheel = new THREE.Group(); wheel.position.set(0, -0.42, -0.53); wheel.rotation.x = -0.33; cockpit.add(wheel);
  const rimM = new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.6 });
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.024, 12, 40), rimM));
  wheel.add(new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.08, 0.05, 2, 0.02), rimM));
  for (const a of [0, Math.PI, -Math.PI / 2]) { const sp = new THREE.Mesh(unitBox, rimM); sp.scale.set(0.17, 0.028, 0.02); sp.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0); sp.rotation.z = a; wheel.add(sp); }
  CK.wheel = wheel;
  // rear-view mirror (rendered from a rear camera)
  const mg = new THREE.Group(); mg.position.set(0.44, 0.255, -0.74); mg.rotation.y = -0.2; mg.scale.setScalar(0.7); cockpit.add(mg);
  mg.add(new THREE.Mesh(new RoundedBoxGeometry(0.25, 0.085, 0.03, 2, 0.02), pill));
  const mgeo = new THREE.PlaneGeometry(0.232, 0.07); const muv = mgeo.attributes.uv; for (let i = 0; i < muv.count; i++) muv.setX(i, 1 - muv.getX(i));
  const mglass = new THREE.Mesh(mgeo, new THREE.MeshBasicMaterial({ map: mirrorRT.texture })); mglass.position.z = 0.016; mg.add(mglass);
  B(mg, 0.02, 0.09, 0.02, pill, 0, 0.08, -0.01, false);
  CK.mirror = mg;
  // wipers and raindrops
  CK.wipers = [];
  for (const px of [-0.35, 0.5]) { const piv = new THREE.Group(); piv.position.set(px, -0.37, -1.02); piv.rotation.x = -0.75; const bl = new THREE.Mesh(unitBox, pill); bl.scale.set(0.009, 0.6, 0.012); bl.position.y = 0.31; piv.add(bl); const arm = new THREE.Mesh(unitBox, pill); arm.scale.set(0.022, 0.5, 0.01); arm.position.set(0.012, 0.25, -0.01); piv.add(arm); cockpit.add(piv); piv.visible = false; CK.wipers.push(piv); }
  const [dc, dg] = makeCanvas(512, 256);
  for (let i = 0; i < 260; i++) { const x = Math.random() * 512, y = Math.random() * 256, r = rand(1.2, 4.5); const gr = dg.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(190,205,220,0.25)'); gr.addColorStop(1, 'rgba(60,70,80,0.35)'); dg.fillStyle = gr; dg.beginPath(); dg.ellipse(x, y, r, r * rand(0.8, 1.3), 0, 0, Math.PI * 2); dg.fill(); }
  const drops = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: toTex(dc, false), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  drops.position.set(0.3, 0.1, -0.98); drops.renderOrder = 20; drops.visible = false; cockpit.add(drops); CK.drops = drops;
  cockpit.traverse(o => { o.castShadow = false; o.receiveShadow = false; });
}
