// Uso: node mockups/html-to-snippet.mjs <nombre>
// Convierte mockups/<nombre>.html en snippets/mockups/<nombreCamel>.jsx para renderizarlo con
// <iframe srcDoc={...} />. El sitio requiere login y Mintlify no sirve archivos estáticos,
// así que el HTML tiene que viajar dentro de la página. Sin JS: el iframe hereda la CSP del sitio.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const [name] = process.argv.slice(2);
if (!/^[a-z][a-z0-9-]*$/.test(name ?? "")) {
  console.error("Uso: node mockups/html-to-snippet.mjs <nombre>");
  process.exit(1);
}

const html = readFileSync(`mockups/${name}.html`, "utf8");
const id = name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
mkdirSync("snippets/mockups", { recursive: true });
const out = `snippets/mockups/${id}.jsx`;
writeFileSync(out, `// Generado desde mockups/${name}.html. No editar a mano.\nexport const ${id}Html = ${JSON.stringify(html)};\n`);
console.log(`${out} listo (${id}Html)`);
