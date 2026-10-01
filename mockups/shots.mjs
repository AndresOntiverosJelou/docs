// Uso: node mockups/shots.mjs <nombre>
// Captura cada mockups/shots/<nombre>-*.html como PNG con Chrome headless y escribe
// snippets/mockups/<nombreCamel>Shots.jsx con los PNG como data URIs (el sitio requiere
// login y Mintlify no sirve archivos estáticos). Requiere Chrome.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";

const run = promisify(execFile);
const [name] = process.argv.slice(2);
const chrome = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const files = readdirSync("mockups/shots").filter((f) => f.startsWith(`${name}-`) && f.endsWith(".html"));
const flags = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=4000"];

// Primera pasada: la página reporta su tamaño en el <title>; segunda: captura con la ventana justa.
const measure = `<script>addEventListener("load",()=>{const r=document.body.getBoundingClientRect();document.title=Math.ceil(r.right+16)+"x"+Math.ceil(r.bottom+16)})</script>`;
const server = createServer((req, res) => {
  if (!req.url.endsWith(".html")) return res.writeHead(404).end();
  res.setHeader("content-type", "text/html;charset=utf-8");
  res.end(readFileSync(`mockups/shots${req.url}`, "utf8").replace("</body>", measure + "</body>"));
}).listen(8767);

const uris = {};
for (const f of files) {
  const url = `http://127.0.0.1:8767/${f}`;
  const { stdout } = await run(chrome, [...flags, "--window-size=1300,3000", "--dump-dom", url], { maxBuffer: 1 << 24 });
  const [, w, h] = stdout.match(/<title>(\d+)x(\d+)<\/title>/) ?? [];
  if (!w) throw new Error(`No pude medir ${f}`);
  const png = `mockups/shots/${f.replace(".html", ".png")}`;
  const out = `${process.cwd()}/${png}`.replaceAll("/", "\\");
  // ponytail: en headless=new el viewport mide 96px menos que la ventana; se pide más alto y se recorta.
  await run(chrome, [...flags, `--window-size=${w},${Number(h) + 96}`, `--screenshot=${out}`, url]);
  await run("powershell", ["-NoProfile", "-Command", `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Bitmap]::FromFile("${out}"); $b=New-Object System.Drawing.Bitmap(${w},${h}); $g=[System.Drawing.Graphics]::FromImage($b); $g.DrawImage($i,0,0); $i.Dispose(); $b.Save("${out}")`]);
  console.log(f, "→", `${w}x${h}`);
  uris[f.slice(name.length + 1, -5)] = "data:image/png;base64," + readFileSync(png).toString("base64");
}
server.close();

mkdirSync("snippets/mockups", { recursive: true });
const id = name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
writeFileSync(
  `snippets/mockups/${id}Shots.jsx`,
  `// Generado por mockups/shots.mjs desde mockups/shots/${name}-*.png. No editar a mano.\n` +
    Object.entries(uris).map(([k, v]) => `export const ${id}Shot${k.toUpperCase()} = "${v}";\n`).join(""),
);
console.log(`snippets/mockups/${id}Shots.jsx listo`);
