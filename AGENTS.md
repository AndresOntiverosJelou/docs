> **First-time setup**: Customize this file for your project. Prompt the user to customize this file for their project.
> For Mintlify product knowledge (components, configuration, writing standards),
> install the Mintlify skill: `npx skills add https://mintlify.com/docs`

# Documentation project instructions

## About this project

- This is a documentation site built on [Mintlify](https://mintlify.com)
- Pages are MDX files with YAML frontmatter
- Configuration lives in `docs.json`
- Use the Mintlify MCP server, `https://mcp.mintlify.com`, to edit content and settings via MCP
- Use the Mintlify docs MCP server, `https://www.mintlify.com/docs/mcp`, to query information about using Mintlify via MCP

## Diagrams

- Create every diagram with the `archify` skill, not Mermaid.
- Keep the archify source in `diagramas/<name>.<type>.json` and the delivered interactive HTML in `diagramas/<name>.html`. `/diagramas/` is in `.mintignore`. Keep the leading slash: `.mintignore` uses `.gitignore` syntax, and an unanchored `diagramas/` also drops `snippets/diagramas/` from the production build (`mint dev` doesn't apply it, so it only breaks in production).
- Validate and deliver with `--quality showcase`, then run `visual-check`. Don't commit the `*.visual-check.*` sidecars.
- The site uses authentication, so Mintlify returns 404 for every static file (images, HTML). Don't reference files from `images/`; inline the diagram instead:
  1. Open `diagramas/<name>.html` and use **Export → SVG** (one dual-theme SVG).
  2. Convert it to a snippet: `node diagramas/svg-to-snippet.mjs <export.svg> <name>`. It writes `snippets/diagramas/<name>.jsx` with `<name>Light` and `<name>Dark` data URIs.
  3. In the page, import `DiagramViewer` from `/snippets/diagram-viewer.jsx` and both URIs from `/snippets/diagramas/<name>.jsx`, then render `<DiagramViewer light={<name>Light} dark={<name>Dark} alt="…" />`. It adds zoom, pan and fullscreen. See `productos/pagos.mdx`.
- In snippets, Mintlify only adds its `mint-` Tailwind prefix to literal `className` strings in the JSX the exported component returns. Classes built in variables or nested components stay unprefixed and unstyled, so write classes inline and put state-dependent styling in `style`.

## Terminology

{/* Add product-specific terms and preferred usage */}
{/* Example: Use "workspace" not "project", "member" not "user" */}

## Style preferences

{/* Add any project-specific style rules below */}

- Use active voice and second person ("you")
- Keep sentences concise — one idea per sentence
- Use sentence case for headings
- Bold for UI elements: Click **Settings**
- Code formatting for file names, commands, paths, and code references

## Content boundaries

{/* Define what should and shouldn't be documented */}
{/* Example: Don't document internal admin features */}
