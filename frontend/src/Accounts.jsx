import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CreditCard, TrendingUp, TrendingDown, DollarSign,
    Plus, FileText, Search, Filter, Download, Calendar,
    Wallet, Settings, Trash2, Package, Receipt
} from 'lucide-react';

// Configure Axios
const api = axios.create({
    baseURL: '/api/accounts',
    withCredentials: true,
    headers: {
        'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
    }
});

const Accounts = ({ onNavigate }) => {
    const [view, setView] = useState('DASHBOARD');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard/');
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#001f3f] tracking-tight">Financial Accounts</h1>
                    <p className="text-gray-500 mt-1">Manage income, expenses, and financial reporting.</p>
                </div>

                <div className="flex gap-4 items-center">
                    {/* Navigation Tabs */}
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
                        <TabButton active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} icon={CreditCard} label="Dashboard" />
                        <TabButton active={view === 'FEES'} onClick={() => setView('FEES')} icon={Settings} label="Fee Setup" />
                        <TabButton active={view === 'EXPENSES'} onClick={() => setView('EXPENSES')} icon={TrendingDown} label="Expenses" />
                        <TabButton active={view === 'LEDGER'} onClick={() => setView('LEDGER')} icon={FileText} label="Ledger" />
                        <TabButton active={view === 'REPORTS'} onClick={() => setView('REPORTS')} icon={FileText} label="Reports" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-navy border-t-transparent rounded-full opacity-50"></div>
                </div>
            ) : (
                <>
                    {view === 'DASHBOARD' && stats && (
                        <DashboardView
                            stats={stats}
                            onNavigate={onNavigate}
                            setView={setView}
                        />
                    )}
                    {view === 'FEES' && <FeeConfigView />}
                    {view === 'EXPENSES' && <ExpensesView onSuccess={fetchStats} />}
                    {view === 'LEDGER' && <LedgerView />}
                    {view === 'REPORTS' && <ReportsView />}
                </>
            )}
        </div>
    );
};



// --- Sub-Components ---
// Note: PaymentModal is now in src/components/PaymentModal.jsx and accessed via Students Page

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-[#001f3f] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-[#001f3f]'
            }`}
    >
        <Icon size={16} />
        {label}
    </button>
);

const DashboardView = ({ stats, onNavigate, setView }) => {
    const { summary, recent_activity } = stats;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Actions */}
            <div className="flex gap-4">
                <button
                    onClick={() => onNavigate('Students', { mode: 'PAYMENT' })}
                    className="flex-1 bg-[#001f3f] text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group border border-navy-light"
                >
                    <div>
                        <div className="text-2xl font-bold">Make Payments</div>
                        <div className="text-white/70 text-sm mt-1">Register student payments</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <CreditCard size={32} />
                    </div>
                </button>
                <div
                    onClick={() => setView('REPORTS')}
                    className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-navy/10 flex items-center justify-between cursor-pointer hover:border-navy transition-all group"
                >
                    <div>
                        <div className="text-2xl font-bold text-[#001f3f]">Generate Report</div>
                        <div className="text-[#001f3f]/50 text-sm mt-1">Export financial data</div>
                    </div>
                    <div className="bg-[#001f3f]/5 p-3 rounded-xl text-[#001f3f] group-hover:bg-[#001f3f] group-hover:text-white transition-colors">
                        <FileText size={32} />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Total Income (Term)"
                    value={summary.total_income}
                    icon={TrendingUp}
                    color="navy"
                    subtext="Fees & Other Inflows"
                />
                <StatCard
                    label="Total Expenses (Term)"
                    value={summary.total_expense}
                    icon={TrendingDown}
                    color="orange"
                    subtext="Operational Costs"
                />
                <StatCard
                    label="Net Balance"
                    value={summary.net_balance}
                    icon={Wallet}
                    color="navy-light"
                    subtext="Income - Expenses"
                />
                <StatCard
                    label="Outstanding Fees"
                    value={summary.total_outstanding}
                    icon={CreditCard}
                    color="orange-dark"
                    subtext="Uncollected Revenue"
                />
            </div>

            {/* Class-Based Revenue Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#001f3f] mb-4">Class-Based Revenue Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#001f3f]/5 border-b border-navy/10 text-[#001f3f]/60 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4 text-right">Expected Revenue</th>
                                <th className="px-6 py-4 text-right">Collected</th>
                                <th className="px-6 py-4 text-right">Outstanding</th>
                                <th className="px-6 py-4 text-right">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5">
                            {summary.class_breakdown && summary.class_breakdown.map((item, idx) => {
                                const percent = item.expected > 0 ? (item.collected / item.expected) * 100 : 0;
                                return (
                                    <tr key={idx} className="hover:bg-[#001f3f]/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-[#001f3f]">{item.class_grade}</td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-600">₦{Number(item.expected).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono text-[#001f3f] font-bold">₦{Number(item.collected).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono text-[#ff851b]">₦{Number(item.outstanding).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs font-bold text-[#001f3f]/60">{percent.toFixed(1)}%</span>
                                                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${percent >= 80 ? 'bg-[#001f3f]' : percent >= 50 ? 'bg-[#ff851b]' : 'bg-[#ff851b]/50'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!summary.class_breakdown || summary.class_breakdown.length === 0) && stats.class_breakdown && stats.class_breakdown.map((item, idx) => {
                                // Fallback if it is in stats root not summary
                                const percent = item.expected > 0 ? (item.collected / item.expected) * 100 : 0;
                                return (
                                    <tr key={idx} className="hover:bg-[#001f3f]/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-[#001f3f]">{item.class_grade}</td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-600">₦{Number(item.expected).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono text-[#001f3f] font-bold">₦{Number(item.collected).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono text-[#ff851b]">₦{Number(item.outstanding).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs font-bold text-[#001f3f]/60">{percent.toFixed(1)}%</span>
                                                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${percent >= 80 ? 'bg-[#001f3f]' : percent >= 50 ? 'bg-[#ff851b]' : 'bg-[#ff851b]/50'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!stats.class_breakdown && !summary.class_breakdown) && (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No class data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Financial Overview & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Income vs Expense Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#001f3f]">Financial Overview</h3>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#001f3f] inline-block"></span> Income</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#ff851b] inline-block"></span> Expenses</span>
                        </div>
                    </div>

                    {/* Summary Totals Row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 rounded-xl bg-[#001f3f]/5 border border-[#001f3f]/10">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Income</p>
                            <p className="text-xl font-black text-[#001f3f]">₦{Number(summary.total_income || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-[#ff851b]/5 border border-[#ff851b]/10">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Expenses</p>
                            <p className="text-xl font-black text-[#ff851b]">₦{Number(summary.total_expense || 0).toLocaleString()}</p>
                        </div>
                        <div className={`text-center p-3 rounded-xl border ${(summary.net_balance || 0) >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Net Balance</p>
                            <p className={`text-xl font-black ${(summary.net_balance || 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {(summary.net_balance || 0) >= 0 ? '+' : ''}₦{Number(Math.abs(summary.net_balance || 0)).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Visual Bar Chart — Income vs Expense */}
                    {(() => {
                        const income = Number(summary.total_income || 0);
                        const expense = Number(summary.total_expense || 0);
                        const max = Math.max(income, expense, 1);
                        const incomeH = Math.round((income / max) * 100);
                        const expenseH = Math.round((expense / max) * 100);
                        return (
                            <div className="flex items-end justify-center gap-12 h-40 px-8 border-b border-l border-gray-100 relative">
                                {/* Y-axis label */}
                                <span className="absolute left-0 top-0 text-xs text-gray-300 font-mono">₦{(max / 1000).toFixed(0)}k</span>
                                <span className="absolute left-0 bottom-0 text-xs text-gray-300 font-mono">₦0</span>

                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-bold text-[#001f3f]">₦{(income / 1000).toFixed(1)}k</span>
                                    <div
                                        className="w-20 bg-[#001f3f] rounded-t-lg transition-all duration-700 flex items-end justify-center"
                                        style={{ height: `${incomeH}%`, minHeight: '4px' }}
                                    />
                                    <span className="text-xs text-gray-500 font-semibold">Income</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-bold text-[#ff851b]">₦{(expense / 1000).toFixed(1)}k</span>
                                    <div
                                        className="w-20 bg-[#ff851b] rounded-t-lg transition-all duration-700"
                                        style={{ height: `${expenseH}%`, minHeight: '4px' }}
                                    />
                                    <span className="text-xs text-gray-500 font-semibold">Expenses</span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Outstanding Fees */}
                    {summary.total_outstanding > 0 && (
                        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100 flex justify-between items-center">
                            <span className="text-sm font-semibold text-amber-700">Outstanding Fees</span>
                            <span className="font-black text-amber-800">₦{Number(summary.total_outstanding).toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-[#001f3f] mb-4">Recent Activity</h3>
                    <div className="space-y-3 overflow-y-auto max-h-80">
                        {recent_activity.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 hover:bg-[#001f3f]/5 rounded-xl transition-colors border border-transparent hover:border-navy/10">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${item.type === 'INCOME' ? 'bg-[#001f3f]/10 text-[#001f3f]' : 'bg-[#ff851b]/10 text-[#ff851b]'}`}>
                                        <CreditCard size={14} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-[#001f3f] leading-tight">{item.description}</div>
                                        <div className="text-xs text-[#001f3f]/40">{new Date(item.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className={`font-mono font-bold text-xs whitespace-nowrap ${item.type === 'INCOME' ? 'text-[#001f3f]' : 'text-[#ff851b]'}`}>
                                    {item.type === 'INCOME' ? '+' : '-'}₦{Number(item.amount).toLocaleString()}
                                </div>
                            </div>
                        ))}
                        {recent_activity.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">No recent transactions</div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, subtext }) => {
    // Branding: Strict Navy/Orange Palette
    const colors = {
        navy: 'bg-[#001f3f]/10 text-[#001f3f]',
        'navy-light': 'bg-[#001f3f]/5 text-[#001f3f]',
        orange: 'bg-[#ff851b]/10 text-[#ff851b]',
        'orange-dark': 'bg-[#ff851b]/20 text-[#ff851b]',
        // Fallbacks if mapped incorrectly
        green: 'bg-[#001f3f]/10 text-[#001f3f]',
        red: 'bg-[#ff851b]/10 text-[#ff851b]',
        blue: 'bg-[#001f3f]/5 text-[#001f3f]'
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors[color] || colors.navy}`}>
                    <Icon size={24} />
                </div>
            </div>
            <div>
                <h3 className="text-gray-500 text-sm uppercase tracking-wider font-semibold">{label}</h3>
                <div className="text-3xl font-bold text-[#001f3f] mt-1 flex items-baseline gap-0.5">
                    <span>₦</span>
                    {Number(value).toLocaleString()}
                </div>
                {subtext && <div className="text-xs text-gray-400 mt-2">{subtext}</div>}
            </div>
        </div>
    );
};

const EXPENSE_BLANK = { title: '', category: '', amount: '', description: '', supplier: '', date: '', is_inventory_purchase: false, inventory_item_name: '', inventory_quantity: '', inventory_unit_cost: '' };

const ExpensesView = ({ onSuccess }) => {
    const [expenses, setExpenses] = useState([]);
    const [expenseType, setExpenseType] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(EXPENSE_BLANK);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');

    const fetchExpenses = async () => {
        const res = await api.get('/expenses/');
        setExpenses(res.data);
    };

    useEffect(() => {
        fetchExpenses();
        fetch('/api/inventory/items/', { credentials: 'include' })
            .then(r => r.json()).then(d => setInventoryItems(d)).catch(() => { });
    }, []);

    const openModal = (type) => {
        setExpenseType(type);
        setFormData({ ...EXPENSE_BLANK, is_inventory_purchase: type === 'INVENTORY' });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setExpenseType(null); };

    const totalAmount = (expenseType === 'INVENTORY' && formData.inventory_quantity && formData.inventory_unit_cost)
        ? parseFloat(formData.inventory_quantity || 0) * parseFloat(formData.inventory_unit_cost || 0)
        : parseFloat(formData.amount || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses/', { ...formData, amount: totalAmount });
            closeModal();
            fetchExpenses();
            if (onSuccess) onSuccess();
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.error || err.message));
        }
    };

    const filtered = expenses.filter(e =>
        activeTab === 'ALL' ? true :
            activeTab === 'INVENTORY' ? e.is_inventory_purchase :
                !e.is_inventory_purchase
    );

    const invCount = expenses.filter(e => e.is_inventory_purchase).length;
    const regCount = expenses.filter(e => !e.is_inventory_purchase).length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-[#001f3f]">Expense Management</h2>
                <p className="text-sm text-gray-400 mt-0.5">Record purchases and operating costs</p>
            </div>

            {/* Type Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <button
                    onClick={() => openModal('INVENTORY')}
                    className="group relative overflow-hidden text-left p-6 rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500 opacity-50" />
                    <div className="relative">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                            <Package size={24} className="text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-900">Inventory Purchase</h3>
                        <p className="text-sm text-blue-600 mt-1">Buy items and automatically update inventory stock</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-500">
                            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                            Auto-syncs with Inventory
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => openModal('REGULAR')}
                    className="group relative overflow-hidden text-left p-6 rounded-2xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500 opacity-50" />
                    <div className="relative">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                            <span className="text-2xl font-black text-orange-600">&#8358;</span>
                        </div>
                        <h3 className="text-lg font-bold text-orange-900">Regular Expense</h3>
                        <p className="text-sm text-orange-600 mt-1">Salaries, utilities, maintenance and operating costs</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-orange-400">
                            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
                            Does NOT affect inventory
                        </div>
                    </div>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-100">
                {[['ALL', `All (${expenses.length})`], ['INVENTORY', `Inventory (${invCount})`], ['REGULAR', `Regular (${regCount})`]].map(([key, label]) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === key ? 'bg-[#001f3f] text-white' : 'text-gray-500 hover:text-[#001f3f] hover:bg-gray-50'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Expense Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-5 py-4">Type</th>
                                <th className="px-5 py-4">Title / Item</th>
                                <th className="px-5 py-4">Category</th>
                                <th className="px-5 py-4">Date</th>
                                <th className="px-5 py-4">Qty</th>
                                <th className="px-5 py-4">Unit Cost</th>
                                <th className="px-5 py-4 text-right">Total (₦)</th>
                                <th className="px-5 py-4 text-right">Recorded By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((expense) => (
                                <tr key={expense.id} className={`hover:bg-gray-50/50 transition-colors ${expense.is_inventory_purchase ? 'border-l-4 border-l-blue-300' : 'border-l-4 border-l-orange-200'}`}>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${expense.is_inventory_purchase ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {expense.is_inventory_purchase ? ' Inventory' : ' Regular'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-[#001f3f]">
                                        {expense.is_inventory_purchase ? expense.inventory_item_name : expense.title}
                                    </td>
                                    <td className="px-5 py-4 text-gray-500 text-xs">{expense.category}</td>
                                    <td className="px-5 py-4 text-gray-400 text-xs">{expense.date}</td>
                                    <td className="px-5 py-4 font-mono">
                                        {expense.is_inventory_purchase ? expense.inventory_quantity : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                                        {expense.is_inventory_purchase && expense.inventory_unit_cost
                                            ? `₦${Number(expense.inventory_unit_cost).toLocaleString()}`
                                            : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-5 py-4 text-right font-mono font-bold text-red-600">
                                        -₦{Number(expense.amount).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-4 text-right text-gray-400 text-xs">{expense.recorded_by}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-400">No expenses here yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className={`p-5 border-b border-gray-100 flex justify-between items-center ${expenseType === 'INVENTORY' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{expenseType === 'INVENTORY' ? '' : ''}</span>
                                <div>
                                    <h3 className="font-bold text-lg text-[#001f3f]">
                                        {expenseType === 'INVENTORY' ? 'Inventory Purchase' : 'Regular Expense'}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {expenseType === 'INVENTORY' ? 'Auto-updates inventory stock on save' : 'Does not affect inventory'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {expenseType === 'INVENTORY' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Item Name *</label>
                                        <input
                                            required list="inv-items"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                            placeholder="e.g. Biro, Exercise Book, Chalk"
                                            value={formData.inventory_item_name}
                                            onChange={e => setFormData({ ...formData, inventory_item_name: e.target.value })}
                                        />
                                        <datalist id="inv-items">
                                            {inventoryItems.map(i => <option key={i.id} value={i.name} />)}
                                        </datalist>
                                        <p className="text-xs text-blue-500 mt-1">✓ New items will be auto-created in Inventory</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Category *</label>
                                            <input
                                                required list="inv-categories"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                                placeholder="e.g. Stationery"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            />
                                            <datalist id="inv-categories">
                                                <option value="Stationery" />
                                                <option value="Laboratory" />
                                                <option value="Sports" />
                                                <option value="Office Supplies" />
                                                <option value="Cleaning" />
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Supplier</label>
                                            <input
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                                placeholder="Supplier name"
                                                value={formData.supplier}
                                                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Quantity *</label>
                                            <input
                                                required type="number" min="1"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-mono"
                                                placeholder="e.g. 200"
                                                value={formData.inventory_quantity}
                                                onChange={e => setFormData({ ...formData, inventory_quantity: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Unit Cost (₦) *</label>
                                            <input
                                                required type="number" min="0" step="0.01"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-mono"
                                                placeholder="Cost per item"
                                                value={formData.inventory_unit_cost}
                                                onChange={e => setFormData({ ...formData, inventory_unit_cost: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Purchase Date</label>
                                        <input type="date"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 transition-all outline-none"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    {formData.inventory_quantity && formData.inventory_unit_cost && (
                                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex justify-between items-center">
                                            <span className="text-sm font-medium text-blue-700">Total Expense</span>
                                            <span className="text-xl font-bold text-blue-900">
                                                ₦{(parseFloat(formData.inventory_quantity) * parseFloat(formData.inventory_unit_cost)).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Notes</label>
                                        <textarea
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 transition-all outline-none"
                                            rows="2" placeholder="Optional notes..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-[#001f3f] text-white py-3 rounded-xl font-bold hover:bg-[#002a52] transition-all shadow-lg shadow-navy/20 flex items-center justify-center gap-2">
                                        Save &amp; Update Inventory Stock
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Expense Title *</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
                                            placeholder="e.g. Generator Fuel, Staff Salary"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Amount (₦) *</label>
                                            <input
                                                required type="number"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all outline-none font-mono"
                                                placeholder="0.00"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Category *</label>
                                            <input
                                                required list="reg-categories"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
                                                placeholder="e.g. Utilities"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            />
                                            <datalist id="reg-categories">
                                                <option value="Salaries" />
                                                <option value="Utilities" />
                                                <option value="Maintenance" />
                                                <option value="Transport" />
                                                <option value="Miscellaneous" />
                                            </datalist>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Date</label>
                                        <input type="date"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 transition-all outline-none"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Description</label>
                                        <textarea
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 transition-all outline-none"
                                            rows="3" placeholder="Optional description..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-[#001f3f] text-white py-3 rounded-xl font-bold hover:bg-[#002a52] transition-all shadow-lg shadow-navy/20 flex items-center justify-center gap-2">
                                        Save Expense
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


const LedgerView = () => {
    const [entries, setEntries] = useState([]);
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        const fetchLedger = async () => {
            const url = filterDate ? `/ledger/?start_date=${filterDate}` : '/ledger/';
            const res = await api.get(url);
            setEntries(res.data);
        };
        fetchLedger();
    }, [filterDate]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#001f3f]">General Ledger</h2>
                <div className="flex gap-2">
                    <input
                        type="date"
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                    <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Ref</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-right">Debit (Exp)</th>
                            <th className="px-6 py-4 text-right">Credit (Inc)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-mono text-xs text-gray-400">{entry.reference}</td>
                                <td className="px-6 py-4 text-gray-800">{entry.description}</td>
                                <td className="px-6 py-4 text-right font-mono text-red-600">
                                    {entry.type === 'EXPENSE' ? `₦${Number(entry.amount).toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-green-600">
                                    {entry.type === 'INCOME' ? `₦${Number(entry.amount).toLocaleString()}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Reports View ---
const ReportsView = () => {
    const [reportType, setReportType] = useState('FEES');
    const [filters, setFilters] = useState({ start_date: '', end_date: '', class_filter: '' });
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            const params = { type: reportType, ...filters };
            const res = await api.get('/reports/generate/', { params });
            setReportData(res.data);
        } catch (error) {
            console.error("Report generation failed", error);
            alert("Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (reportData.length === 0) return;

        const headers = Object.keys(reportData[0]);
        const csvContent = [
            headers.join(','),
            ...reportData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-bold text-[#001f3f]">Generate Reports</h2>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                    <select
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-navy/20"
                        value={reportType}
                        onChange={(e) => { setReportType(e.target.value); setReportData([]); }}
                    >
                        <option value="FEES">Fee Collection</option>
                        <option value="DEFAULTERS">Defaulters List</option>
                        <option value="EXPENSES">Expense Report</option>
                        <option value="SUMMARY">Financial Summary</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-navy/20"
                        value={filters.start_date}
                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-navy/20"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="flex-1 bg-[#001f3f] text-white py-2 rounded-xl font-bold hover:bg-[#001f3f]-light transition-all flex justify-center items-center gap-2"
                    >
                        {loading ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : <Search size={18} />}
                        Generate
                    </button>
                    <button
                        onClick={downloadCSV}
                        disabled={reportData.length === 0}
                        className={`px-4 py-2 rounded-xl font-medium border flex items-center gap-2 transition-all ${reportData.length > 0 ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                    >
                        <Download size={18} /> CSV
                    </button>
                </div>
            </div>

            {/* Results */}
            {reportData.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase">
                                <tr>
                                    {Object.keys(reportData[0]).map((key) => (
                                        <th key={key} className="px-6 py-4">{key.replace(/_/g, ' ')}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reportData.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        {Object.entries(row).map(([cellKey, val]) => (
                                            <td key={cellKey} className="px-6 py-4 text-gray-700">
                                                {typeof val === 'number' && !['admission_no'].includes(cellKey)
                                                    ? `₦${val.toLocaleString()}`
                                                    : val != null ? String(val) : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed text-gray-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Select filters and generate a report to view results.</p>
                </div>
            )}
        </div>
    );
};

// --- Fee Config View ---
const FeeConfigView = () => {
    const [fees, setFees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', amount: '', class_grade: '', student_status: '', student_type: '', term: '1st Term', session: '2025/2026'
    });

    const fetchFees = async () => {
        try {
            const res = await api.get('/fee-structures/');
            setFees(res.data);
        } catch (error) {
            console.error("Failed to fetch fee structures", error);
        }
    };

    useEffect(() => { fetchFees(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/fee-structures/', formData);
            setShowModal(false);
            setFormData({ name: '', amount: '', class_grade: '', student_status: '', student_type: '', term: '1st Term', session: '2025/2026' });
            fetchFees();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to save fee structure');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this fee structure?")) return;
        try {
            await api.delete(`/fee-structures/${id}/`);
            fetchFees();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete fee structure');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#001f3f]">Class-Based Fee Configuration</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#001f3f] text-white px-4 py-2 rounded-xl hover:bg-[#001f3f]-light transition-all shadow-lg shadow-navy/20"
                >
                    <Plus size={18} /> Add Fee Structure
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[#001f3f] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Fee Name</th>
                                <th className="px-4 py-4">Class</th>
                                <th className="px-4 py-4">Student Type</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Term/Session</th>
                                <th className="px-6 py-4 text-right">Amount (₦)</th>
                                <th className="px-4 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {fees.map((fee) => (
                                <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-[#001f3f]">{fee.name}</td>
                                    <td className="px-4 py-4 text-gray-600 bg-gray-50/50 font-medium">{fee.class_grade || 'All Classes'}</td>
                                    <td className="px-4 py-4 text-gray-600">{fee.student_type || 'Any'}</td>
                                    <td className="px-4 py-4 text-gray-600">{fee.student_status || 'Any'}</td>
                                    <td className="px-4 py-4 text-gray-400 text-xs">{fee.term} <br /> {fee.session}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-orange-600">{Number(fee.amount).toLocaleString()}</td>
                                    <td className="px-4 py-4 text-center">
                                        <button onClick={() => handleDelete(fee.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {fees.length === 0 && (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">No fee structures defined. Click "Add Fee Structure" to create one.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="font-bold text-lg text-[#001f3f]">Define Fee Structure</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Fee Name</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none"
                                        placeholder="e.g. Tuition Fee"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₦)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none font-mono"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Target Class</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none"
                                        value={formData.class_grade}
                                        onChange={e => setFormData({ ...formData, class_grade: e.target.value })}
                                    >
                                        <option value="">All Classes</option>
                                        <optgroup label="Nursery">
                                            <option value="PRE_NURSERY">Pre-Nursery</option>
                                            <option value="NURSERY_1">Nursery 1</option>
                                            <option value="NURSERY_2">Nursery 2</option>
                                            <option value="NURSERY_3">Nursery 3</option>
                                        </optgroup>
                                        <optgroup label="Primary">
                                            <option value="PRIMARY_1">Primary 1</option>
                                            <option value="PRIMARY_2">Primary 2</option>
                                            <option value="PRIMARY_3">Primary 3</option>
                                            <option value="PRIMARY_4">Primary 4</option>
                                            <option value="PRIMARY_5">Primary 5</option>
                                            <option value="PRIMARY_6">Primary 6</option>
                                        </optgroup>
                                        <optgroup label="Junior Secondary">
                                            <option value="JSS_1">JSS 1</option>
                                            <option value="JSS_2">JSS 2</option>
                                            <option value="JSS_3">JSS 3</option>
                                        </optgroup>
                                        <optgroup label="Senior Secondary">
                                            <option value="SSS_1">SSS 1</option>
                                            <option value="SSS_2">SSS 2</option>
                                            <option value="SSS_3">SSS 3</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Student Status</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none"
                                        value={formData.student_status}
                                        onChange={e => setFormData({ ...formData, student_status: e.target.value })}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="NEW">New</option>
                                        <option value="RETURNING">Returning</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Student Type</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none"
                                        value={formData.student_type}
                                        onChange={e => setFormData({ ...formData, student_type: e.target.value })}
                                    >
                                        <option value="">Any Type</option>
                                        <option value="DAY">Day</option>
                                        <option value="BOARDING">Boarding</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Term</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                                        value={formData.term}
                                        onChange={e => setFormData({ ...formData, term: e.target.value })}
                                    >
                                        <option value="1st Term">1st Term</option>
                                        <option value="2nd Term">2nd Term</option>
                                        <option value="3rd Term">3rd Term</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Session</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                                        value={formData.session}
                                        onChange={e => setFormData({ ...formData, session: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button disabled={loading} type="submit" className="w-full bg-[#001f3f] text-white py-3 rounded-xl font-bold hover:bg-[#001f3f]-light transition-all shadow-lg shadow-navy/20 flex justify-center items-center gap-2 disabled:opacity-50">
                                    {loading ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : <Plus size={18} />}
                                    Save Fee Structure
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;
