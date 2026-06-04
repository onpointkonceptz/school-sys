import { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const attempt = async (retryCount = 0) => {
            try {
                const response = await axios.post('/api/login/', {
                    username,
                    password
                }, { timeout: 60000 }); // 60s timeout for Render cold start

                if (response.data.success) {
                    if (response.data.token) {
                        localStorage.setItem('authToken', response.data.token);
                    }
                    onLogin(response.data);
                } else {
                    setError('Invalid credentials. Please check your username and password.');
                }
            } catch (err) {
                console.error('Login error:', err);
                if (err.code === 'ECONNABORTED' || (err.request && !err.response)) {
                    // Timeout or no response — Render might be waking up
                    if (retryCount < 1) {
                        setError('Server is waking up, please wait...');
                        await new Promise(r => setTimeout(r, 8000));
                        return attempt(retryCount + 1);
                    }
                    setError('Server took too long to respond. Please try again in 30 seconds.');
                } else if (err.response) {
                    const msg = err.response.data?.error || err.response.data?.detail || '';
                    setError(msg || 'Invalid credentials');
                } else {
                    setError('Cannot connect to server. Please check your connection.');
                }
            }
        };

        await attempt();
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#001f3f] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-8 text-center bg-gray-50 border-b border-gray-100">
                    <img
                        src="https://kadwelinternationalschools.com/assets/img/logo.png"
                        alt="Kadwel School Logo"
                        className="w-20 h-20 mx-auto mb-4 object-contain bg-white rounded-full p-1"
                    />
                    <h2 className="text-3xl font-black text-[#001f3f] tracking-tight">Welcome Back</h2>
                    <p className="text-gray-500 text-sm font-medium mt-2">
                        Sign in to <span className="text-[#001f3f] font-bold">Kadwel School</span> Portal
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff851b]/50 transition"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff851b]/50 transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#ff851b] hover:bg-[#ff851b]-dark text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-[#ff851b]/30 transition flex items-center justify-center gap-2 group"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                        {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition" />}
                    </button>

                    <div className="text-center mt-4">
                        <a href="#" className="text-sm text-gray-400 hover:text-[#001f3f] transition">Forgot Password?</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
