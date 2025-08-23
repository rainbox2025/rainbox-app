import React, { useEffect, useRef, useState } from "react";

function NoteThatFits() {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [showFull, setShowFull] = useState(true);

  useEffect(() => {
    let raf = 0;

    const recalc = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const c = containerRef.current;
        const m = measureRef.current;
        if (!c || !m) return;
        const canFit = m.offsetWidth <= c.clientWidth;
        setShowFull(prev => (prev !== canFit ? canFit : prev));
      });
    };

    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);

    // recheck after fonts load (prevents first-render mismatch)
    if (document.fonts?.ready) document.fonts.ready.then(recalc);
    recalc();

    window.addEventListener("resize", recalc);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {/* hidden measurer with the FULL sentence */}
      <span
        ref={measureRef}
        className="absolute -z-50 invisible pointer-events-none whitespace-nowrap text-xs"
      >
        New subscriptions will automatically appear here
      </span>

      {/* visible text (always single line) */}
      <p className="truncate text-xs">
        {showFull
          ? "New subscriptions will automatically appear here"
          : "New subscriptions will appear here"}
      </p>
    </div>
  );
}

export default NoteThatFits;
