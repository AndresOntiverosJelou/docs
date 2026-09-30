// Uso: node mockups/build.mjs <nombre>
// Toma mockups/<nombre>.tpl.html, reemplaza {{icon}} por el SVG de Lucide (mockups/lucide.json,
// extraído de lucide-react, la librería de íconos de jelou-apps), escribe mockups/<nombre>.html
// y el snippet snippets/mockups/<nombreCamel>.jsx para renderizarlo con <iframe srcDoc={...} />.
// El sitio requiere login y Mintlify no sirve archivos estáticos, así que el HTML viaja dentro de la página.
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

const id = name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
mkdirSync("snippets/mockups", { recursive: true });
writeFileSync(`snippets/mockups/${id}.jsx`, `// Generado desde mockups/${name}.tpl.html con mockups/build.mjs. No editar a mano.\nexport const ${id}Html = ${JSON.stringify(html)};\n`);
console.log(`mockups/${name}.html y snippets/mockups/${id}.jsx listos`);
