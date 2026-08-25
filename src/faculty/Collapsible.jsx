import { useState } from "react";

/**
 * A titled, collapsible panel for the faculty console — keeps the debrief and live
 * views tidy so sections can be opened one at a time instead of everything at once.
 */
export default function Collapsible({ title, subtitle, right, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`f-collapse ${open ? "open" : ""}`}>
      <button className="f-collapse-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="f-collapse-caret">{open ? "▾" : "▸"}</span>
        <span className="f-collapse-title">{title}</span>
        {subtitle && <span className="f-note f-collapse-sub">{subtitle}</span>}
        {right != null && <span className="f-collapse-right">{right}</span>}
      </button>
      {open && <div className="f-collapse-body">{children}</div>}
    </div>
  );
}
