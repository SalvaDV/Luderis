/**
 * ThemeContext.jsx
 *
 * Reemplaza el anti-patrón:
 *   let C = {...THEMES[key]};
 *   function applyTheme(key) { Object.assign(C, THEMES[key]); }
 *   window.__setAppTheme = ...
 *
 * Con un contexto React limpio y reactivo.
 *
 * USO:
 *   // En App.jsx:
 *   <ThemeProvider><App /></ThemeProvider>
 *
 *   // En cualquier componente:
 *   const { theme, C, toggleTheme, themeName } = useTheme();
 *
 * El objeto C mantiene la misma interfaz que antes para facilitar
 * la migración incremental — los componentes existentes pueden
 * seguir usando C.accent, C.text, etc. sin cambiar nada.
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { themes } from "../theme.js";
import { themeStorage } from "../storage.js";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => themeStorage.get());

  const C = themes[themeName] || themes.light;

  const toggleTheme = useCallback(() => {
    setThemeName(prev => {
      const next = prev === "light" ? "dark" : "light";
      themeStorage.set(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((name) => {
    if (!themes[name]) return;
    themeStorage.set(name);
    setThemeName(name);
  }, []);

  const value = {
    themeName,
    C,
    toggleTheme,
    setTheme,
    isDark: themeName === "dark",
    isLight: themeName === "light",
  };

  return (
    <ThemeContext.Provider value={value}>
      {/* Inyectar CSS vars en el DOM para que los inputs nativos respeten el tema */}
      <style>{`
        :root {
          color-scheme: ${themeName};
          --cl-bg: ${C.bg};
          --cl-surface: ${C.surface};
          --cl-border: ${C.border};
          --cl-text: ${C.text};
          --cl-muted: ${C.muted};
          --cl-accent: ${C.accent};
          --cl-input-bg: ${C.inputBg};
          --cl-input-border: ${C.inputBorder};
        }
        /* Fix global: inputs y selects respetan el tema */
        input, textarea, select {
          color-scheme: ${themeName};
          background-color: var(--cl-input-bg) !important;
          color: var(--cl-text) !important;
          border-color: var(--cl-input-border);
        }
        input::placeholder, textarea::placeholder {
          color: var(--cl-muted);
          opacity: 1;
        }
        /* Scrollbar temática */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--cl-border); border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        /* Animaciones */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes tabPulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        * { box-sizing: border-box; }
        html, body, #root {
          background: var(--cl-bg);
          color: var(--cl-text);
          min-height: 100vh;
        }
        .cl-card-anim { animation: fadeUp .2s ease both; }
        .cl-fade { animation: fadeIn .15s ease both; }
        /* Price slider */
        .psr::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--cl-accent);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 0 2px var(--cl-accent);
          position: relative; z-index: 2;
        }
        .psr::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--cl-accent);
          cursor: pointer;
          border: 2px solid white;
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}

// Para migración gradual: expone un hook que devuelve solo C
// para componentes que solo necesitan los colores
export function useColors() {
  return useContext(ThemeContext)?.C || themes.light;
}
