'use strict';
// Compile l'application (esbuild) vers ../server/public
//   node build.js          → build de production
//   node build.js --watch  → recompile à chaque modification
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const OUT = path.resolve(process.env.OUT_DIR || path.join(__dirname, '..', 'server', 'public'));
const watch = process.argv.includes('--watch');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f); const d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function writeHtml(meta) {
  const outputs = Object.keys(meta.outputs);
  const js = outputs.find((o) => /assets\/app-[^/]+\.js$/.test(o));
  const css = outputs.find((o) => /assets\/app-[^/]+\.css$/.test(o));
  const rel = (p) => '/' + path.relative(OUT, path.resolve(p)).split(path.sep).join('/');
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1F6B4F">
<meta name="description" content="Vélona : bilan nutritionnel, suivi chaque semaine et repas sains livrés à Antananarivo.">
<title>Vélona · Nutrition & hygiène de vie</title>
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" href="/icons/favicon-32.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Vélona">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel(css)}">
</head>
<body>
<div id="root"></div>
<noscript>Activez JavaScript pour utiliser Vélona.</noscript>
<script type="module" src="${rel(js)}"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
  // Service worker : la version change à chaque build pour vider l'ancien cache
  const version = path.basename(js).replace(/\.js$/, '');
  const sw = fs.readFileSync(path.join(__dirname, 'sw.template.js'), 'utf8').replace('__VERSION__', version)
    .replace('__ASSETS__', JSON.stringify(['/', rel(js), rel(css), '/symbol.png', '/wordmark.png', '/manifest.webmanifest']));
  fs.writeFileSync(path.join(OUT, 'sw.js'), sw);
}

async function main() {
  fs.rmSync(path.join(OUT, 'assets'), { recursive: true, force: true });
  copyDir(path.join(__dirname, 'static'), OUT);
  const opts = {
    entryPoints: { app: path.join(__dirname, 'src', 'main.jsx') },
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: path.join(OUT, 'assets'),
    entryNames: '[name]-[hash]',
    chunkNames: 'chunk-[hash]',
    assetNames: '[name]-[hash]',
    minify: !watch,
    sourcemap: watch ? 'inline' : false,
    target: ['es2020'],
    jsx: 'automatic',
    loader: { '.js': 'jsx' },
    define: { 'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production') },
    metafile: true,
    logLevel: 'info',
    legalComments: 'none',
  };
  if (watch) {
    const ctx = await esbuild.context({ ...opts, plugins: [{ name: 'html', setup(b) { b.onEnd((r) => { if (r.metafile) writeHtml(r.metafile); }); } }] });
    await ctx.watch();
  } else {
    const r = await esbuild.build(opts);
    writeHtml(r.metafile);
    const sizes = Object.entries(r.metafile.outputs).map(([f, o]) => `${path.basename(f)} ${(o.bytes / 1024).toFixed(0)} Ko`);
    console.log('Build terminé →', OUT, '\n ', sizes.join('\n  '));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
