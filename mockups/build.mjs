// Uso: node mockups/build.mjs <nombre>
// Toma mockups/<nombre>.tpl.html, reemplaza {{icon}} por el SVG de Lucide (mockups/lucide.json,
// extraído de lucide-react, la librería de íconos de jelou-apps), escribe mockups/<nombre>.html
// y cada pantalla suelta en mockups/shots/ (las convierte en PNG mockups/shots.mjs).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const [name] = process.argv.slice(2);
if (!/^[a-z][a-z0-9-]*$/.test(name ?? "")) {
  console.error("Uso: node mockups/build.mjs <nombre>");
  process.exit(1);
}

const icons = JSON.parse(readFileSync("mockups/lucide.json", "utf8"));
const html = readFileSync(`mockups/${name}.tpl.html`, "utf8").replace(/\{\{([a-z0-9-]+)(?::(\d+))?\}\}/g, (_, n, size = 18) => {
  if (!icons[n]) throw new Error(`Ícono desconocido: ${n}`);
  const logo = n.startsWith("logo-");
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${logo ? "currentColor" : "none"}" stroke="${logo ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]}</svg>`;
});
writeFileSync(`mockups/${name}.html`, html);

// Cada bloque <!-- shot:x --> … <!-- /shot:x --> sale también como mockups/shots/<nombre>-x.html
// para capturarlo como PNG con Chrome headless (ver mockups/shots.mjs).
mkdirSync("mockups/shots", { recursive: true });
const head = html.slice(0, html.indexOf("</head>") + 7);
for (const [, id, body] of html.matchAll(/<!-- shot:(\w+) -->([\s\S]*?)<!-- \/shot:\1 -->/g)) {
  writeFileSync(`mockups/shots/${name}-${id}.html`, `${head}<body class="shot">${body}</body></html>`);
}

console.log(`mockups/${name}.html y mockups/shots/ listos`);
