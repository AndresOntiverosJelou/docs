export const ArchifyDiagram = ({ svg, title }) => {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !svg) return;

    // @font-face doesn't load inside a shadow root, so hoist the bundled fonts once.
    if (!document.getElementById("archify-fonts")) {
      const fonts = svg.match(/@font-face\s*{[^}]*}/g) || [];
      const style = document.createElement("style");
      style.id = "archify-fonts";
      style.textContent = fonts.join("\n");
      document.head.appendChild(style);
    }

    // Shadow DOM keeps archify's global selectors (:root, ids) away from the page.
    const root = host.shadowRoot || host.attachShadow({ mode: "open" });
    root.innerHTML = svg;
    const el = root.querySelector("svg");
    el.removeAttribute("width");
    el.removeAttribute("height");
    el.style.cssText = "display:block;width:100%;height:auto;border-radius:12px";

    const html = document.documentElement;
    const sync = () => el.setAttribute("data-theme", html.classList.contains("dark") ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [svg]);

  return <div ref={ref} role="img" aria-label={title} className="w-full" />;
};
