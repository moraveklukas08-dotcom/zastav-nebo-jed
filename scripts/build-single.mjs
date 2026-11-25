// Ze sestavené hry (dist/) vytvoří jeden soubor dist-single/index.html
// se vloženým JS a CSS. Slouží pro náhled jako claude.ai artefakt.
import fs from 'node:fs';
import path from 'node:path';
const dist = 'dist';
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/, (_, f) => '<script type="module">\n' + fs.readFileSync(path.join(dist, f), 'utf8').replace(/<\/script/g, '<\\/script') + '\n</script>');
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/, (_, f) => '<style>\n' + fs.readFileSync(path.join(dist, f), 'utf8') + '\n</style>');
// artefakt si dokument obalí sám: necháme jen obsah hlavičky a těla
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
fs.mkdirSync('dist-single', { recursive: true });
fs.writeFileSync('dist-single/index.html', '<meta name="claude:viewport-fit-sides" content="cover">\n' + head.trim() + '\n' + body.trim() + '\n');
console.log('dist-single/index.html', (fs.statSync('dist-single/index.html').size / 1024 | 0) + ' kB');
