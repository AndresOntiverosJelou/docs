/**
 * Visor de diagramas con zoom, paneo y pantalla completa.
 * @param {string} light - data URI del diagrama en modo claro
 * @param {string} dark - data URI del diagrama en modo oscuro
 * @param {string} alt - Descripción del diagrama
 */
export const DiagramViewer = ({ light, dark, alt }) => {
  const MIN = 1;
  const MAX = 6;
  const box = useRef(null);
  const drag = useRef(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [full, setFull] = useState(false);

  const zoomBy = (factor) =>
    setScale((s) => {
      const next = Math.min(MAX, Math.max(MIN, s * factor));
      if (next === MIN) setPos({ x: 0, y: 0 });
      return next;
    });
  const reset = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : box.current.requestFullscreen());

  useEffect(() => {
    const el = box.current;
    // Ctrl/⌘ + rueda hace zoom; la rueda sola sigue haciendo scroll de la página.
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    const onFull = () => setFull(document.fullscreenElement === el);
    el.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("fullscreenchange", onFull);
    return () => {
      el.removeEventListener("wheel", onWheel);
      document.removeEventListener("fullscreenchange", onFull);
    };
  }, []);

  const onPointerDown = (e) => {
    if (scale === 1) return;
    drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (drag.current) setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // Mintlify solo agrega su prefijo `mint-` a className literales del JSX que devuelve
  // el componente exportado (no a variables ni a componentes anidados), así que las
  // clases van escritas completas en cada elemento y lo que cambia va en `style`.
  const imageStyle = full ? { height: "calc(100vh - 3rem)", objectFit: "contain" } : undefined;

  return (
    <div
      ref={box}
      className="not-prose my-6 overflow-hidden rounded-xl border border-gray-200 bg-white select-none dark:border-white/10 dark:bg-[#0b0d13]"
      style={full ? { display: "flex", flexDirection: "column", height: "100vh" } : undefined}
    >
      <div
        className="overflow-hidden touch-none"
        style={{ cursor: scale > 1 ? "grab" : "default", flex: full ? 1 : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => (scale === 1 ? zoomBy(2) : reset())}
      >
        <div
          className="w-full origin-center transition-transform duration-75"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
        >
          <img src={light} alt={alt} draggable={false} className="block w-full dark:hidden" style={imageStyle} />
          <img src={dark} alt={alt} draggable={false} className="hidden w-full dark:block" style={imageStyle} />
        </div>
      </div>

      <div className="flex h-12 items-center justify-between gap-2 border-t border-gray-200 px-3 dark:border-white/10">
        <span className="hidden text-xs text-gray-400 sm:block">Ctrl/⌘ + rueda para zoom · arrastra para mover · doble clic</span>
        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" onClick={() => zoomBy(1 / 1.25)} aria-label="Alejar" title="Alejar" className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
            −
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-gray-500 dark:text-gray-400">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoomBy(1.25)} aria-label="Acercar" title="Acercar" className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
            +
          </button>
          <button type="button" onClick={reset} aria-label="Restablecer" title="Restablecer" className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
            ⟲
          </button>
          <button type="button" onClick={toggleFull} aria-label="Pantalla completa" title="Pantalla completa" className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
            {full ? "✕" : "⛶"}
          </button>
        </div>
      </div>
    </div>
  );
};
