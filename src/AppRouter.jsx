/**
 * AppRouter.jsx
 *
 * Migra la navegación de:
 *   const [page, setPage] = useState("explore")
 *   {page === "explore" && <ExplorePage />}
 *
 * A React Router v6 con rutas tipadas y protegidas.
 *
 * BENEFICIOS:
 * - URLs reales → el botón "atrás" funciona
 * - Deep links → se puede compartir /explorar?pub=xxx
 * - Separación clara de rutas públicas/privadas
 * - Lazy loading de páginas pesadas
 *
 * INSTALACIÓN REQUERIDA:
 *   npm install react-router-dom
 */

import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useSession } from "../contexts/SessionContext.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";

// Lazy loading de páginas (reduce el bundle inicial significativamente)
const AuthScreen     = lazy(() => import("../features/auth/AuthScreen.jsx"));
const ExplorePage    = lazy(() => import("../pages/ExplorePage.jsx"));
const AgendaPage     = lazy(() => import("../pages/AgendaPage.jsx"));
const ChatsPage      = lazy(() => import("../pages/ChatsPage.jsx"));
const FavoritosPage  = lazy(() => import("../pages/FavoritosPage.jsx"));
const InscripcionesPage = lazy(() => import("../pages/InscripcionesPage.jsx"));
const MiCuentaPage   = lazy(() => import("../pages/MiCuentaPage.jsx"));

// Layout privado: sidebar + main content
const AppLayout = lazy(() => import("../components/layout/AppLayout.jsx"));

// ── Protected Route ────────────────────────────────────────────────────────────

function PrivateRoute() {
  const { isAuthenticated } = useSession();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { isAuthenticated } = useSession();
  if (isAuthenticated) return <Navigate to="/explorar" replace />;
  return <Outlet />;
}

// ── Router principal ───────────────────────────────────────────────────────────

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rutas públicas (solo sin sesión) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login"     element={<AuthScreen />} />
            <Route path="/registro"  element={<AuthScreen defaultMode="register" />} />
          </Route>

          {/* Rutas privadas (requieren sesión) */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route index                    element={<Navigate to="/explorar" replace />} />
              <Route path="/explorar"         element={<ExplorePage />} />
              <Route path="/agenda"           element={<AgendaPage />} />
              <Route path="/chats"            element={<ChatsPage />} />
              <Route path="/favoritos"        element={<FavoritosPage />} />
              <Route path="/inscripciones"    element={<InscripcionesPage />} />
              <Route path="/cuenta"           element={<MiCuentaPage />} />
              {/* Ruta para compartir publicaciones */}
              <Route path="/explorar/:pubId"  element={<ExplorePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/explorar" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Spinner />
    </div>
  );
}
