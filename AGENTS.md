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
- Keep the archify source in `diagramas/<name>.<type>.json` and the delivered interactive HTML in `diagramas/<name>.html`. `diagramas/` is in `.mintignore`.
- Validate and deliver with `--quality showcase`, then run `visual-check`. Don't commit the `*.visual-check.*` sidecars.
- The site uses authentication, so Mintlify does not serve static HTML files and an `<iframe>` to the HTML will not load. Export light and dark PNGs from the viewer (**Export → PNG**, once per theme) to `images/diagramas/<name>-light.png` and `-dark.png`, and embed both with `className="block dark:hidden"` / `className="hidden dark:block"` inside a `<Frame>`.

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
