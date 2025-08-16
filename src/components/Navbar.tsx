import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Navbar() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold tracking-tight">Bless Pets</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{username}</span>
          <button onClick={onLogout} className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">Logout</button>
        </div>
      </div>
    </header>
  );
}