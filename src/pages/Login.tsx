import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
interface ApiError {
    message: string;
}
export default function Login() {
    const { login, signup, isEnvAuth } = useAuth();
    const [tab, setTab] = useState<'signin' | 'signup'>(isEnvAuth ? 'signin' : 'signin');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const onSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username.trim(), password);
            navigate('/');
        } catch (err) {
            const error = err as ApiError;

            setError(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const onSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signup) return; // not available in env-auth mode
        setError(null);
        setLoading(true);
        try {
            await signup(
                username.trim(),
                password,
                email.trim(),
                firstName.trim(),
                lastName.trim(),
                phone.trim()
            );
            navigate('/');
        } catch (err) {
            const error = err as ApiError;

            setError(error.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center px-4">
            <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome to Bless Pets</h1>
                <p className="mt-1 text-sm text-gray-600">Sign in to continue.</p>

                {!isEnvAuth && (
                    <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
                        <button
                            className={`rounded-lg px-3 py-2 text-sm ${tab === 'signin' ? 'bg-white shadow' : ''}`}
                            onClick={() => setTab('signin')}
                        >
                            Sign In
                        </button>
                        <button
                            className={`rounded-lg px-3 py-2 text-sm ${tab === 'signup' ? 'bg-white shadow' : ''}`}
                            onClick={() => setTab('signup')}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {tab === 'signin' && (
                    <form onSubmit={onSignin} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Username</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                                required
                            />
                        </div>
                        {isEnvAuth && (
                            <div className="text-xs text-gray-500">
                                Hint (demo): <code>demo / demo123</code> — configurable via env.
                            </div>
                        )}
                        <button
                            disabled={loading}
                            className="w-full rounded-xl bg-black px-3 py-2 text-white disabled:opacity-60"
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                )}

                { tab === 'signup' && (
                    <form onSubmit={onSignup} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Username</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium">First Name</label>
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Last Name</label>
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                                required
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full rounded-xl bg-black px-3 py-2 text-white disabled:opacity-60"
                        >
                            {loading ? 'Creating…' : 'Create account'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
