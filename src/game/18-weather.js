/* ============================== weather particles ============================== */
const WX = { rain: null, snow: null, sunset: false };
{
  const N = 2200, pos = new Float32Array(N * 6), base = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { base[i * 3] = rand(-18, 18); base[i * 3 + 1] = rand(-2, 16); base[i * 3 + 2] = rand(-34, 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  WX.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xb9c6d2, transparent: true, opacity: 0.45, depthWrite: false }));
  WX.rain.frustumCulled = false; WX.rain.visible = false; WX.rain.userData.base = base; scene.add(WX.rain);
  const M2 = 2600, sp = new Float32Array(M2 * 3); for (let i = 0; i < M2; i++) { sp[i * 3] = rand(-22, 22); sp[i * 3 + 1] = rand(-2, 14); sp[i * 3 + 2] = rand(-40, 8); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  WX.snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false }));
  WX.snow.frustumCulled = false; WX.snow.visible = false; scene.add(WX.snow);
}
function updateWeather(dt, t) {
  const cp = CAMW;
  if (WX.rain.visible) {
    const n = Math.floor(2200 * Q.particles), b = WX.rain.userData.base, p = WX.rain.geometry.attributes.position.array;
    for (let i = 0; i < 2200; i++) {
      b[i * 3 + 1] -= 16 * dt; b[i * 3 + 2] += P.v * dt * 0.0; if (b[i * 3 + 1] < -1.5) { b[i * 3 + 1] += 17; b[i * 3] = rand(-18, 18); b[i * 3 + 2] = rand(-34, 6); }
      const k = i * 6; if (i >= n) { p[k] = p[k + 3] = 0; p[k + 1] = p[k + 4] = -50; p[k + 2] = p[k + 5] = 0; continue; }
      p[k] = b[i * 3]; p[k + 1] = b[i * 3 + 1]; p[k + 2] = b[i * 3 + 2]; p[k + 3] = b[i * 3] + 0.03; p[k + 4] = b[i * 3 + 1] + 0.42; p[k + 5] = b[i * 3 + 2] + 0.08 + P.v * 0.012;
    }
    WX.rain.geometry.attributes.position.needsUpdate = true; WX.rain.position.set(cp.x, 0, cp.z); WX.rain.rotation.y = carRig.rotation.y;
  }
  if (WX.snow.visible) {
    const p = WX.snow.geometry.attributes.position.array;
    for (let i = 0; i < 2600; i++) { p[i * 3 + 1] -= 1.3 * dt; p[i * 3] += Math.sin(t * 0.8 + i) * 0.4 * dt; p[i * 3 + 2] += P.v * dt * 0.35; if (p[i * 3 + 1] < -1.5 || p[i * 3 + 2] > 10) { p[i * 3 + 1] = rand(8, 14); p[i * 3] = rand(-22, 22); p[i * 3 + 2] = rand(-40, 0); } }
    WX.snow.geometry.attributes.position.needsUpdate = true; WX.snow.position.set(cp.x, 0, cp.z); WX.snow.rotation.y = carRig.rotation.y;
  }
  if (CK.wipers[0].visible) {
    const per = 1.5, ph = (t % per) / per, a = Math.sin(ph * Math.PI) * 1.5;
    CK.wipers.forEach(w => { w.rotation.z = 1.42 - a; });
    if (ph < WX.lastPh) AU.wiper(); WX.lastPh = ph;
    if (CK.drops.visible) CK.drops.material.opacity = Math.min(0.75, ph < 0.5 ? 0.6 * (1 - ph * 2) : (ph - 0.5) * 1.2);
  }
  const gl = $('glare');
  if (WX.sunset && S && P.mode !== 'replay') {
    const v = new THREE.Vector3().copy(SUN_DIR).multiplyScalar(500).add(cp).project(camera);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(CAMQ).dot(SUN_DIR);
    const op = v.z < 1 ? Math.max(0, (fwd - 0.6) / 0.4) : 0;
    gl.style.opacity = (op * 0.95).toFixed(2); gl.style.setProperty('--gx', ((v.x * 0.5 + 0.5) * 100).toFixed(1) + '%'); gl.style.setProperty('--gy', ((1 - (v.y * 0.5 + 0.5)) * 100).toFixed(1) + '%');
  } else gl.style.opacity = 0;
}

