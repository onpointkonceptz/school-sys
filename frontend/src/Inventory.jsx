import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Search, Plus, Minus, History, Filter, X, Save } from 'lucide-react';

// Configure Axios
const api = axios.create({
    baseURL: '/api/inventory',
    withCredentials: true,
    headers: {
        'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
    }
});

const InventoryResultCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-bold text-navy mt-1">{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-4 rounded-full ${color.bg}`}>
            <Icon size={24} className={color.text} />
        </div>
    </div>
);

const Inventory = () => {
    const [view, setView] = useState('LIST'); // LIST, MOVEMENTS
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({ total_items: 0, low_stock: 0, out_of_stock: 0, total_value: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [stockAction, setStockAction] = useState(null); // { type: 'IN' | 'OUT', item: {} }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, itemsRes] = await Promise.all([
                api.get('/dashboard/'),
                api.get('/items/')
            ]);
            setStats(statsRes.data);
            setItems(itemsRes.data);
        } catch (error) {
            console.error("Failed to fetch inventory data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (formData) => {
        try {
            if (editingItem) {
                await api.put(`/items/${editingItem.id}/`, formData);
            } else {
                await api.post('/items/', formData);
            }
            setShowItemModal(false);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            alert("Failed to save item: " + (error.response?.data?.error || error.message));
        }
    };

    const handleStockAction = async (formData) => {
        try {
            await api.post('/stock/out/', { ...formData, item_id: stockAction.item.id });
            setShowStockModal(false);
            setStockAction(null);
            fetchData();
        } catch (error) {
            alert("Failed to issue stock: " + (error.response?.data?.error || error.message));
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category_name && item.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-center text-navy">Loading Inventory...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-navy">Inventory Management</h1>
                    <p className="text-gray-500">Track stock, manage supplies, and audit movements</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView(view === 'LIST' ? 'MOVEMENTS' : 'LIST')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-navy rounded-lg hover:bg-gray-50 transition"
                    >
                        <History size={18} />
                        {view === 'LIST' ? 'View Log' : 'View Items'}
                    </button>
                    <button
                        onClick={() => { setEditingItem(null); setShowItemModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-navy rounded-lg hover:bg-gray-50 transition"
                    >
                        <Plus size={18} />
                        New Item
                    </button>
                </div>
            </header>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <InventoryResultCard
                    title="Total Items"
                    value={stats.total_items}
                    icon={Package}
                    color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
                />
                <InventoryResultCard
                    title="Low Stock"
                    value={stats.low_stock}
                    icon={AlertTriangle}
                    color={{ bg: 'bg-yellow-100', text: 'text-yellow-600' }}
                    subtext="Items below min level"
                />
                <InventoryResultCard
                    title="Out of Stock"
                    value={stats.out_of_stock}
                    icon={X}
                    color={{ bg: 'bg-red-100', text: 'text-red-600' }}
                />
            </div>

            {/* Stock Source Info Banner */}
            <div className="mb-4 p-4 rounded-xl border border-blue-100 bg-blue-50 flex items-start gap-3">
                <span className="text-blue-400 mt-0.5">&#128274;</span>
                <div>
                    <p className="text-sm font-bold text-blue-800">Stock is managed through Accounts</p>
                    <p className="text-xs text-blue-500">To add stock: go to <strong>Accounts &rarr; Expenses</strong> and record an <strong>Inventory Purchase</strong>. Inventory only handles issuance (stock-out).</p>
                </div>
            </div>

            {/* Main Content */}
            {view === 'LIST' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-lg transition"><Filter size={20} /></button>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-center">Stock</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/80 transition">
                                    <td className="px-6 py-4 font-medium text-navy">{item.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.category_name || '-'}</td>
                                    <td className="px-6 py-4 text-center font-bold text-navy">{item.stock_remaining}</td>
                                    <td className="px-6 py-4 text-center">
                                        {item.stock_remaining === 0 ? (
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Out of Stock</span>
                                        ) : item.stock_remaining <= item.min_stock_level ? (
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">Low Stock</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">In Stock</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => { setStockAction({ type: 'OUT', item: item }); setShowStockModal(true); }}
                                            className="px-3 py-1.5 text-sm font-bold bg-[#ff851b]/10 text-[#ff851b] hover:bg-[#ff851b] hover:text-white rounded-lg transition-colors border border-[#ff851b]/20 flex items-center gap-1"
                                        >
                                            <Minus size={14} />
                                            Issue Item
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <MovementLog />
            )}

            {/* Modals */}
            {showItemModal && (
                <ItemModal
                    item={editingItem}
                    onClose={() => setShowItemModal(false)}
                    onSave={handleSaveItem}
                />
            )}

            {showStockModal && stockAction && (
                <StockActionModal
                    action={stockAction}
                    onClose={() => setShowStockModal(false)}
                    onSave={handleStockAction}
                />
            )}
        </div>
    );
};

// Sub-components
const MovementLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/movements/').then(res => setLogs(res.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Log...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-navy">Stock Movement Ledger</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                            <th className="px-4 py-4">Date &amp; Time</th>
                            <th className="px-4 py-4">Type</th>
                            <th className="px-4 py-4">Item Name</th>
                            <th className="px-4 py-4">Qty</th>
                            <th className="px-4 py-4">Stock Change</th>
                            <th className="px-4 py-4">Received By</th>
                            <th className="px-4 py-4">Issued By</th>
                            <th className="px-4 py-4">Reason</th>
                            <th className="px-4 py-4">Financial (₦)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {logs.map((log, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(log.date).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {log.type === 'IN' ? 'Stock In' : 'Stock Out'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-navy">{log.item}</td>
                                <td className="px-4 py-3 font-bold text-center">{log.qty}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs text-center whitespace-nowrap">{log.prev_qty} → {log.new_qty}</td>
                                <td className="px-4 py-3 text-gray-700">{log.received_by}</td>
                                <td className="px-4 py-3 text-gray-600">{log.issued_by}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
 ${log.reason === 'Sold to Student' ? 'bg-blue-100 text-blue-700' :
                                            log.reason === 'Issued to Staff/Dept' ? 'bg-purple-100 text-purple-700' :
                                                log.reason === 'Damaged/Expired' ? 'bg-red-100 text-red-600' :
                                                    'bg-gray-100 text-gray-600'}`}>
                                        {log.reason}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-navy">
                                    {log.financial > 0 ? `₦${log.financial.toLocaleString()}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ItemModal = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '', min_stock_level: 10, description: '', stock_remaining: 0, selling_price: 0
    });

    useEffect(() => {
        if (item) setFormData(item);
    }, [item]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-navy mb-4">{item ? 'Edit Item' : 'New Item'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input required type="text" className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert Level</label>
                        <input type="number" className="w-full border rounded-lg p-2" value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock Level</label>
                        <input type="number" className="w-full border rounded-lg p-2" value={formData.stock_remaining} onChange={e => setFormData({ ...formData, stock_remaining: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₦)</label>
                        <input required type="number" min="0" step="0.01" className="w-full border rounded-lg p-2" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy-light">Save Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StockActionModal = ({ action, onClose, onSave }) => {
    // action: { type: 'IN' | 'OUT', item: {} }
    const [formData, setFormData] = useState({ quantity: 1, type: 'SOLD', unit_cost: 0, selling_price: action.item.selling_price || 0, receiver: '' });

    // Load simple student list for dropdown if type is SOLD
    // Ideally this should use an async search select

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-navy mb-2">
                    Issue Item
                </h2>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                    <p className="text-sm font-bold text-navy">{action.item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Available Stock: {action.item.stock_remaining}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Issue *</label>
                        <input required type="number" min="1" max={action.item.stock_remaining} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-navy/20 outline-none transition-all" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Details *</label>
                        <input required placeholder="Student / Teacher / Staff / Dept" className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-navy/20 outline-none transition-all" value={formData.receiver} onChange={e => setFormData({ ...formData, receiver: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Reason *</label>
                        <select className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-navy/20 outline-none transition-all" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                            <option value="SOLD">Sold</option>
                            <option value="ISSUED">Issued</option>
                            <option value="DAMAGED">Damaged / Expired</option>
                            <option value="TRANSFER">Transfer</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition-colors shadow-lg shadow-navy/20 flex items-center gap-2">
                            <Minus size={16} /> Issue Stock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Inventory;
