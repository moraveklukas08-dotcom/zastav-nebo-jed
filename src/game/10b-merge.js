/* ============================== static geometry merging ============================== */
// Spojí statické objekty scény (domy, chodníky, lampy…) podle materiálu a 80m úseků
// do několika velkých meshů. Výrazně snižuje počet vykreslovacích volání.
// Vynechává herce, objekty s animací (tickers, userData.dynamic) a víceúrovňové materiály.
function mergeStatic(sc) {
  const G = sc.group; G.updateMatrixWorld(true);
  const skip = new Set(sc.actors.map(a => a.obj)); for (const t of sc.tickers) if (t.isObject3D) skip.add(t);
  const buckets = new Map(), victims = [], multi = [];
  const visit = (o, blocked) => {
    blocked = blocked || skip.has(o) || (o.userData && o.userData.dynamic) || !o.visible;
    if (!blocked && o.isMesh && !o.isInstancedMesh && Array.isArray(o.material) && o.geometry && o.geometry.index && o.geometry.groups.length) {
      const g = o.geometry, wp = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld), idx = g.index.array;
      for (const gr of g.groups) {
        const mtl = o.material[gr.materialIndex]; if (!mtl || mtl.transparent) continue;
        const sub = g.clone(); sub.clearGroups(); sub.setIndex(Array.from(idx.subarray(gr.start, gr.start + gr.count)));
        const attrs = Object.keys(sub.attributes).sort().join(',');
        const key = mtl.uuid + '|' + attrs + '|1|' + (o.castShadow ? 1 : 0) + '|' + o.renderOrder + '|' + Math.floor(-wp.z / 80) + '|' + Math.floor(wp.x / 120);
        let bk = buckets.get(key); if (!bk) buckets.set(key, bk = { mat: mtl, cast: o.castShadow, ro: o.renderOrder, list: [] });
        bk.list.push({ geometry: sub, matrixWorld: o.matrixWorld, owner: o, temp: true });
      }
      multi.push(o);
    }
    if (!blocked && o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.geometry && o.geometry.attributes.position && !o.material.transparent) {
      const g = o.geometry, attrs = Object.keys(g.attributes).sort().join(','), wp = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
      const key = o.material.uuid + '|' + attrs + '|' + (g.index ? 1 : 0) + '|' + (o.castShadow ? 1 : 0) + '|' + o.renderOrder + '|' + Math.floor(-wp.z / 80) + '|' + Math.floor(wp.x / 120);
      let b = buckets.get(key); if (!b) buckets.set(key, b = { mat: o.material, cast: o.castShadow, ro: o.renderOrder, list: [] });
      b.list.push(o);
    }
    for (const c of o.children) visit(c, blocked);
  };
  for (const c of G.children) visit(c, false);
  let merged = 0;
  for (const b of buckets.values()) {
    if (b.list.length < 2 && !b.list.some(o => o.temp)) continue;
    const geos = b.list.map(o => { const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); for (const k of Object.keys(g.morphAttributes || {})) delete g.morphAttributes[k]; return g; });
    let mg = null; try { mg = mergeGeometries(geos, false); } catch (e) { mg = null; }
    geos.forEach(g => g.dispose());
    if (!mg) continue;
    mg.computeBoundingSphere();
    const m = new THREE.Mesh(mg, b.mat); m.castShadow = b.cast; m.receiveShadow = true; m.renderOrder = b.ro; m.matrixAutoUpdate = false; G.add(m);
    for (const o of b.list) if (!o.temp) victims.push(o);
    merged += b.list.length;
  }
  for (const b of buckets.values()) for (const o of b.list) if (o.temp) o.geometry.dispose();
  for (const o of multi) victims.push(o);
  for (const o of victims) { if (o.parent) o.parent.remove(o); if (!o.geometry.userData.shared) o.geometry.dispose(); }
  sc.mergedCount = merged;
}

// Spojí přímé potomky skupiny (např. auta) se stejným materiálem do jednoho meshe.
// Podskupiny (kola, lampy s vlastním materiálem) zůstávají samostatně.
function mergeLocal(g) {
  const by = new Map();
  for (const c of g.children) if (c.isMesh && !Array.isArray(c.material) && !c.material.transparent && c.material.userData.shared) { const k = c.material.uuid + '|' + Object.keys(c.geometry.attributes).sort().join(',') + '|' + (c.geometry.index ? 1 : 0); (by.get(k) || by.set(k, []).get(k)).push(c); }
  for (const list of by.values()) {
    if (list.length < 2) continue;
    const geos = list.map(c => { c.updateMatrix(); const q = c.geometry.clone(); q.applyMatrix4(c.matrix); return q; });
    let mg = null; try { mg = mergeGeometries(geos, false); } catch (e) {} geos.forEach(q => q.dispose()); if (!mg) continue;
    const m = new THREE.Mesh(mg, list[0].material); m.castShadow = list.some(c => c.castShadow); m.receiveShadow = true; g.add(m);
    for (const c of list) { g.remove(c); if (!c.geometry.userData.shared) c.geometry.dispose(); }
  }
  return g;
}
