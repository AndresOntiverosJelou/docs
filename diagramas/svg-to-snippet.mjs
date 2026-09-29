// Uso: node diagramas/svg-to-snippet.mjs <export.svg> <nombre>
// Convierte el SVG exportado de archify en snippets/diagramas/<nombre>.jsx con dos
// data URIs (claro y oscuro). El sitio requiere login y Mintlify no sirve archivos
// estáticos, así que la imagen tiene que viajar dentro de la página.
import { readFileSync, writeFileSync } from "node:fs";

const [src, name] = process.argv.slice(2);
if (!src || !/^[a-z][a-zA-Z0-9]*$/.test(name ?? "")) {
  console.error("Uso: node diagramas/svg-to-snippet.mjs <export.svg> <nombre>");
  process.exit(1);
}

const svg = readFileSync(src, "utf8");
if (!svg.startsWith("<svg ")) throw new Error(`${src} no parece un SVG exportado de archify`);

const uri = (theme) =>
  "data:image/svg+xml;base64," + Buffer.from(svg.replace("<svg ", `<svg data-theme="${theme}" `)).toString("base64");

const out = `snippets/diagramas/${name}.jsx`;
writeFileSync(
  out,
  `// Generado desde diagramas/${name}.architecture.json (archify, Export → SVG). No editar a mano.\n` +
    `export const ${name}Light = "${uri("light")}";\n` +
    `export const ${name}Dark = "${uri("dark")}";\n`,
);
console.log(`${out} listo`);
