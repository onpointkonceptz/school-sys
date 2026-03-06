import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Users, AlertTriangle, CreditCard, DollarSign } from 'lucide-react';

const NairaSymbol = ({ size = 24, className }) => (
    <span className={className} style={{ fontSize: size, fontWeight: 'bold', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ₦
    </span>
);

// Map icon strings from API to Lucide components
const iconMap = {
    'TrendingUp': TrendingUp,
    'TrendingDown': TrendingDown,
    'Users': Users,
    'AlertTriangle': AlertTriangle,
    'NairaSymbol': NairaSymbol, // Custom mapping
    'DollarSign': DollarSign
};

const Dashboard = ({ onNavigate, user }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch from real API
                // We use withCredentials to send the session cookie established at login
                const response = await axios.get('/api/dashboard/', {
                    withCredentials: true
                });
                setData(response.data);
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
                if (err.response && (err.response.status === 403 || err.response.status === 401)) {
                    setError("Session Expired. Please Logout and Login again.");
                } else {
                    setError(`Error: ${err.message}. Ensure Backend is running.`);
                }
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) return <div className="flex justify-center items-center h-screen text-navy">Loading Dashboard...</div>;

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <div className="text-red-600 font-bold text-xl">{error}</div>
                <button
                    onClick={() => {
                        localStorage.removeItem('user');
                        window.location.reload();
                    }}
                    className="bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy-light transition"
                >
                    Logout
                </button>
            </div>
        );
    }

    if (!data) return null;

    const isTeacher = data.section === 'TEACHER';

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {data.name} ({data.role})</p>
                </div>
            </header>

            {/* Teacher Welcome Banner */}
            {isTeacher && (
                <div className="bg-[#001f3f] rounded-2xl p-6 mb-8 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-1">Teacher Portal</h2>
                        <p className="text-white/70 text-sm">{data.message}</p>
                    </div>
                    <button
                        onClick={() => onNavigate('Academics')}
                        className="relative z-10 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg whitespace-nowrap"
                    >
                        Open Academics →
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            {data.stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {data.stats.map((stat, idx) => {
                        const Icon = iconMap[stat.icon] || AlertTriangle;
                        return (
                            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${stat.bg || 'bg-gray-100'}`}>
                                        <Icon size={24} className={stat.color || 'text-gray-600'} />
                                    </div>
                                </div>
                                <h3 className="text-gray-500 text-sm uppercase tracking-wider font-semibold">{stat.label}</h3>
                                <p className="text-3xl font-bold text-navy mt-1">
                                    {stat.type === 'currency' ? '₦' : ''}{stat.value.toLocaleString()}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions (Show only if available) */}
                {data.recent_transactions && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-navy">Recent Transactions</h2>
                            <button className="text-orange text-sm font-medium hover:underline" onClick={() => onNavigate('Accounts')}>View All</button>
                        </div>
                        <div className="space-y-4">
                            {data.recent_transactions.map((t, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-2 rounded-full border border-gray-200">
                                            <CreditCard size={20} className="text-navy" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-navy">{t.student}</p>
                                            <p className="text-xs text-gray-500">Transaction</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">+₦{t.amount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">{t.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inventory Alerts (Show only if available) */}
                {data.alerts && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-red-600">Low Stock Alerts</h2>
                            <button className="text-orange text-sm font-medium hover:underline" onClick={() => onNavigate('Inventory')}>View Inventory</button>
                        </div>
                        <div className="space-y-4">
                            {data.alerts.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-4">
                                        <AlertTriangle size={20} className="text-red-500" />
                                        <p className="font-semibold text-navy">{item.item}</p>
                                    </div>
                                    <span className="text-red-600 font-bold">{item.stock} left</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-navy rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>

                    <h2 className="text-xl font-bold mb-6 relative z-10">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <button onClick={() => onNavigate('Students')} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition backdrop-blur-sm">
                            <Users size={24} className="mb-3 text-orange" />
                            <span className="block font-semibold">Students</span>
                            <span className="text-xs text-white/60">View student info</span>
                        </button>
                        {!isTeacher && (
                            <button onClick={() => onNavigate('Accounts')} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition backdrop-blur-sm">
                                <CreditCard size={24} className="mb-3 text-green-400" />
                                <span className="block font-semibold">Record Payment</span>
                                <span className="text-xs text-white/60">Tuition or fees</span>
                            </button>
                        )}
                        {!isTeacher && (
                            <button onClick={() => onNavigate('Inventory')} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition backdrop-blur-sm">
                                <AlertTriangle size={24} className="mb-3 text-yellow-400" />
                                <span className="block font-semibold">Inventory</span>
                                <span className="text-xs text-white/60">Check stock levels</span>
                            </button>
                        )}
                        {isTeacher && (
                            <button onClick={() => onNavigate('Academics')} className="bg-orange-500/80 hover:bg-orange-500 p-4 rounded-xl text-left transition backdrop-blur-sm">
                                <TrendingUp size={24} className="mb-3 text-white" />
                                <span className="block font-semibold">Academics</span>
                                <span className="text-xs text-white/80">Enter grades & manage</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
