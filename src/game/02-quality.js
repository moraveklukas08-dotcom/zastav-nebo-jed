/* ============================== quality ============================== */
const QL = { low: { name: 'low', pr: 1, shadows: false, shadowSize: 1024, grass: 0, mirror: 0, particles: 0.4 }, medium: { name: 'medium', pr: 1.25, shadows: true, shadowSize: 2048, grass: 0.45, mirror: 2, particles: 0.7 }, high: { name: 'high', pr: 1.75, shadows: true, shadowSize: 4096, grass: 1, mirror: 1, particles: 1 } };
let Q = QL[lsGet('zastav-q')] || (isTouch ? QL.medium : QL.high);
