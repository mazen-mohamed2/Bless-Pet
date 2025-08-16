import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Pets from './pages/Pets';
import PetDetails from './pages/PetDetails';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Pets />
                </RequireAuth>
              }
            />
            <Route
              path="/pets/:id"
              element={
                <RequireAuth>
                  <PetDetails />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
