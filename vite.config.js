import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Hra je zatím rozdělená do očíslovaných částí v src/game/, které sdílejí jeden
// modulový scope. Tento plugin je při sestavení spojí v pořadí čísel do jednoho
// virtuálního modulu. Cílem je postupně je převést na samostatné ES moduly.
const root = path.dirname(fileURLToPath(import.meta.url));
const PARTS = path.join(root, 'src/game');
const ID = 'virtual:zastav-game';
const RID = '\0' + ID;

function gameParts() {
  return {
    name: 'zastav-game-parts',
    resolveId(s) { if (s === ID) return RID; },
    load(id) {
      if (id !== RID) return;
      const files = fs.readdirSync(PARTS).filter(f => f.endsWith('.js')).sort();
      files.forEach(f => this.addWatchFile(path.join(PARTS, f)));
      return files.map(f => `// ---- ${f} ----\n` + fs.readFileSync(path.join(PARTS, f), 'utf8')).join('\n');
    },
    handleHotUpdate(ctx) {
      if (!ctx.file.startsWith(PARTS)) return;
      const m = ctx.server.moduleGraph.getModuleById(RID);
      if (m) ctx.server.moduleGraph.invalidateModule(m);
      ctx.server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [gameParts()],
  build: { target: 'es2020', chunkSizeWarningLimit: 2500 },
});
