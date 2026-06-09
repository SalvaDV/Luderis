/* Toast global — window.__ldToast(mensaje, tono) */
(function () {
  let container;
  function ensure() {
    if (container) return container;
    container = document.createElement("div");
    container.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9000;display:flex;flex-direction:column;gap:10px;align-items:center;pointer-events:none;";
    document.body.appendChild(container);
    return container;
  }
  const ICONS = {
    success: "M20 6 9 17l-5-5",
    info: "M12 16v-5 M12 8h.01",
    warn: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01",
    error: "M18 6 6 18 M6 6l12 12",
  };
  const COLORS = { success: "#10B981", info: "#3B82F6", warn: "#F59E0B", error: "#EF4444" };
  window.__ldToast = function (msg, tone) {
    tone = tone || "success";
    const c = ensure();
    const t = document.createElement("div");
    t.style.cssText = "pointer-events:auto;display:flex;align-items:center;gap:10px;background:#16243B;color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px 12px 14px;font-family:inherit;font-size:14px;font-weight:550;box-shadow:0 10px 30px rgba(0,0,0,.3);max-width:380px;opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;";
    const color = COLORS[tone] || COLORS.success;
    t.innerHTML = '<span style="flex-shrink:0;width:22px;height:22px;border-radius:6px;background:' + color + '22;display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[tone] || ICONS.success).split(" M").map((d, i) => '<path d="' + (i ? "M" + d : d) + '"/>').join("") + '</svg></span><span></span>';
    t.lastChild.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateY(0)"; });
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; setTimeout(() => t.remove(), 250); }, 2600);
  };
})();
