import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users, Clock, Calendar, FileText, Bell, TrendingUp,
    Plus, Search, Filter, Mail, Phone, MapPin,
    CheckCircle, XCircle, MoreVertical, Edit, Trash2,
    Download, Upload, Save, ArrowLeft, ChevronRight,
    UserPlus, Briefcase, GraduationCap, ShieldCheck,
    Shield, Activity, Lock, Unlock, FileCheck, Info, BookOpen as BookIcon
} from 'lucide-react';

const api = axios.create({
    baseURL: '/api/staff',
    withCredentials: true,
});

api.interceptors.request.use(config => {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    if (match) config.headers['X-CSRFToken'] = match.split('=')[1];
    return config;
});

const globalApi = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

globalApi.interceptors.request.use(config => {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    if (match) config.headers['X-CSRFToken'] = match.split('=')[1];
    return config;
});

const Staff = ({ user, onNavigate }) => {
    const [view, setView] = useState('DIRECTORY'); // DIRECTORY, ATTENDANCE, LEAVE, CALENDAR, PERFORMANCE, MANAGEMENT
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await api.get('/list/');
            setStaffList(res.data);
        } catch (error) {
            console.error("Failed to fetch staff", error);
        } finally {
            setLoading(false);
        }
    };

    const renderHeader = () => (
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-black text-[#001f3f] tracking-tight">Staff Management</h1>
                <p className="text-gray-500 mt-1">Manage profiles, attendance, and internal operations.</p>
            </div>

            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                {[
                    { id: 'DIRECTORY', label: 'Directory', icon: Users },
                    { id: 'ATTENDANCE', label: 'Attendance', icon: Clock },
                    { id: 'LEAVE', label: 'Leave', icon: FileText },
                    { id: 'CALENDAR', label: 'Calendar', icon: Calendar },
                    { id: 'PERFORMANCE', label: 'Performance', icon: TrendingUp }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setView(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === tab.id
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'text-gray-500 hover:text-[#001f3f] hover:bg-white'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </header>
    );

    return (
        <div className="p-8 min-h-screen bg-slate-50">
            {renderHeader()}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full shadow-lg"></div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {view === 'DIRECTORY' && <StaffDirectory staff={staffList} onRefresh={fetchStaff} user={user} onManage={(s) => { setSelectedStaff(s); setView('MANAGEMENT'); }} />}
                    {view === 'ATTENDANCE' && <StaffAttendanceTab user={user} />}
                    {view === 'LEAVE' && <LeaveManagementTab user={user} />}
                    {view === 'CALENDAR' && <CalendarTab user={user} />}
                    {view === 'PERFORMANCE' && <PerformanceTab user={user} />}
                    {view === 'MANAGEMENT' && <StaffManagementPanel
                        staffId={selectedStaff?.user}
                        onBack={() => { setView('DIRECTORY'); fetchStaff(); }}
                        user={user}
                    />}
                </div>
            )}
        </div>
    );
};

// --- STAFF DIRECTORY ---
const StaffDirectory = ({ staff, onRefresh, user, onManage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showProfile, setShowProfile] = useState(null);

    const filtered = staff.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search staff by name or role..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-orange-500/10 outline-none font-medium text-[#001f3f]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {(['SUPER_ADMIN', 'PRINCIPAL'].includes(user.role)) && (
                    <button
                        onClick={() => onNavigate('System')}
                        className="flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 font-bold whitespace-nowrap"
                    >
                        <UserPlus size={20} />
                        <span>Add New Staff</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(member => (
                    <div
                        key={member.id}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 font-black text-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                {member.full_name[0]}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#001f3f] leading-tight">{member.full_name}</h3>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    <ShieldCheck size={12} />
                                    {member.role.replace('_', ' ')}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <Mail size={16} className="text-gray-400" />
                                {member.user_email || "No email provided"}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <Phone size={16} className="text-gray-400" />
                                {member.phone_number || "No phone provided"}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <Clock size={16} className="text-gray-400" />
                                Joined: {new Date(member.joining_date).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-50 flex gap-2">
                            <button
                                onClick={() => onManage(member)}
                                className="flex-1 px-4 py-2.5 bg-[#001f3f] text-white rounded-xl text-sm font-bold hover:bg-navy-light transition-colors shadow-lg shadow-navy/20"
                            >
                                Manage Profile
                            </button>
                            <button
                                onClick={() => onManage(member)}
                                className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                            >
                                <Edit size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {filtered.length === 0 && (
                <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center">
                    <Users size={64} className="mx-auto text-gray-200 mb-6" />
                    <h3 className="text-2xl font-black text-gray-400">No staff found matching your criteria</h3>
                </div>
            )}
        </div>
    );
};

// --- ATTENDANCE TAB ---
const StaffAttendanceTab = () => {
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [markData, setMarkData] = useState({ staff: '', status: 'PRESENT', clock_in: '08:00', clock_out: '16:00', remarks: '' });
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendance();
    }, [date]);

    // Use the staff list from context or fetch it if needed. 
    // For simplicity, I'll assume we pass staffList down or fetch it here.
    const [staffList, setStaffList] = useState([]);
    useEffect(() => {
        api.get('/list/').then(res => setStaffList(res.data));
    }, []);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get('/attendance/', { params: { date } });
            setAttendance(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/attendance/record/', { ...markData, date });
            setShowMarkModal(false);
            fetchAttendance();
        } catch (e) {
            alert("Failed to record attendance. Staff may already have a record for this date.");
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div>
                    <h2 className="text-2xl font-black text-[#001f3f]">Attendance Tracker</h2>
                    <p className="text-gray-500 mt-1">Daily clock-in logs for all active staff members.</p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-[#001f3f] shadow-sm outline-none focus:ring-4 focus:ring-orange-500/10"
                    />
                    <button
                        onClick={() => setShowMarkModal(true)}
                        className="flex items-center gap-2 bg-[#001f3f] text-white px-5 py-3 rounded-2xl hover:bg-navy-light transition-all shadow-lg shadow-navy/20 font-bold"
                    >
                        <Clock size={20} /> Mark Attendance
                    </button>
                </div>
            </div>

            {showMarkModal && (
                <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-[#001f3f]">Record Attendance</h3>
                            <button onClick={() => setShowMarkModal(false)} className="text-gray-400 hover:text-red-500"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleMarkSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Staff</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-medium outline-none"
                                    value={markData.staff}
                                    onChange={e => setMarkData({ ...markData, staff: e.target.value })}
                                >
                                    <option value="">Choose a member...</option>
                                    {staffList.map(s => <option key={s.user} value={s.user}>{s.full_name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-medium outline-none"
                                        value={markData.status}
                                        onChange={e => setMarkData({ ...markData, status: e.target.value })}
                                    >
                                        <option value="PRESENT">Present</option>
                                        <option value="LATE">Late</option>
                                        <option value="ABSENT">Absent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Clock In Time</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-medium outline-none"
                                        value={markData.clock_in}
                                        onChange={e => setMarkData({ ...markData, clock_in: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
                                Save Attendance Record
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full shadow-lg"></div>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-2xl border border-gray-50">
                        <table className="w-full text-left">
                            <thead className="bg-[#001f3f]/5 text-[#001f3f]/60 text-xs font-black uppercase tracking-widest border-b border-navy/5">
                                <tr>
                                    <th className="px-8 py-5">Staff Member</th>
                                    <th className="px-8 py-5">Clock In</th>
                                    <th className="px-8 py-5">Clock Out</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attendance.map(record => (
                                    <tr key={record.id} className="hover:bg-orange-50/30 transition-colors">
                                        <td className="px-8 py-5 font-bold text-[#001f3f]">{record.staff_name}</td>
                                        <td className="px-8 py-5 font-medium text-gray-600 font-mono">{record.clock_in || '--:--'}</td>
                                        <td className="px-8 py-5 font-medium text-gray-600 font-mono">{record.clock_out || '--:--'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                                record.status === 'LATE' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="text-gray-400 hover:text-[#001f3f] transition-colors"><MoreVertical size={20} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {attendance.length === 0 && (
                        <div className="p-20 text-center">
                            <Clock size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold">No attendance records found for this date.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// --- LEAVE MANAGEMENT TAB ---
const LeaveManagementTab = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        api.get('/leave/requests/').then(res => setRequests(res.data));
    }, []);

    const handleApprove = async (id, status) => {
        try {
            await api.post('/leave/approve/', { id, status });
            setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
        } catch (e) {
            alert("Action failed.");
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-[#001f3f] mb-8">Leave Requests</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map(req => (
                    <div key={req.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-[#001f3f] text-lg">{req.staff_name}</h3>
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{req.leave_type}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {req.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl shadow-sm">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase mb-1">Start Date</p>
                                <p className="font-black text-[#001f3f]">{req.start_date}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase mb-1">End Date</p>
                                <p className="font-black text-[#001f3f]">{req.end_date}</p>
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm line-clamp-2 italic">"{req.reason}"</p>

                        {req.status === 'PENDING' && (
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => handleApprove(req.id, 'APPROVED')}
                                    className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/10"
                                >
                                    <CheckCircle size={18} /> Approve
                                </button>
                                <button
                                    onClick={() => handleApprove(req.id, 'REJECTED')}
                                    className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/10"
                                >
                                    <XCircle size={18} /> Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {requests.length === 0 && (
                <div className="text-center py-20 text-gray-400 font-bold">No active leave requests.</div>
            )}
        </div>
    );
};

// --- STAFF MANAGEMENT PANEL (CENTRAL CONTROL) ---
const StaffManagementPanel = ({ staffId, onBack, user }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, ACADEMICS, TIMETABLE, DOCUMENTS

    useEffect(() => {
        if (staffId) fetchDetails();
    }, [staffId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/manage/details/${staffId}/`);
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch staff details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center"><div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div><p className="text-gray-400 font-bold">Loading centralized control panel...</p></div>;
    if (!data) return <div className="p-20 text-center text-red-500 font-bold">Error loading staff data.</div>;

    const staffMember = data.user;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Control Panel Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                            {staffMember.first_name?.[0]}{staffMember.last_name?.[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#001f3f]">{staffMember.first_name} {staffMember.last_name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-black text-white bg-orange-500 px-2 py-0.5 rounded-lg uppercase tracking-wider">{staffMember.role}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-widest ${staffMember.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {staffMember.is_active ? 'Active Account' : 'Deactivated'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    {[
                        { id: 'OVERVIEW', label: 'Profile & Status', icon: Info },
                        { id: 'ACADEMICS', label: 'Assignments', icon: BookIcon },
                        { id: 'TIMETABLE', label: 'Timetable', icon: Clock },
                        { id: 'DOCUMENTS', label: 'Documents', icon: FileCheck }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                                ? 'bg-white text-[#001f3f] shadow-sm border border-gray-100'
                                : 'text-gray-400 hover:text-[#001f3f]'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content Area */}
            <div className="grid grid-cols-1 gap-8">
                {activeTab === 'OVERVIEW' && <ManagementOverview data={data} onRefresh={fetchDetails} />}
                {activeTab === 'ACADEMICS' && <AcademicAssignment data={data} onRefresh={fetchDetails} />}
                {activeTab === 'TIMETABLE' && <TimetableManager data={data} onRefresh={fetchDetails} />}
                {activeTab === 'DOCUMENTS' && <DocumentVault data={data} onRefresh={fetchDetails} />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS FOR MANAGEMENT ---

const ManagementOverview = ({ data, onRefresh }) => {
    const user = data.user;
    const profile = data.profile;
    const [formData, setFormData] = useState({
        bio: profile.bio || '',
        qualifications: profile.qualifications || '',
        phone_number: profile.phone_number || '',
        address: profile.address || ''
    });

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/profile/update/', { user: user.id, ...formData });
            alert("Profile updated!");
            onRefresh();
        } catch (e) { alert("Update failed"); }
    };

    const toggleStatus = async () => {
        if (!confirm(`Are you sure you want to ${user.is_active ? 'DEACTIVATE' : 'ACTIVATE'} this account?`)) return;
        try {
            await api.post('/manage/status-toggle/', { user_id: user.id, is_active: !user.is_active });
            onRefresh();
        } catch (e) { alert("Action failed"); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-[#001f3f] mb-8 flex items-center gap-2">
                    <UserPlus className="text-orange-500" /> Basic Information & Background
                </h3>
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Phone Number</label>
                            <input className="w-full p-4 bg-gray-50 border rounded-2xl font-medium" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Address</label>
                            <input className="w-full p-4 bg-gray-50 border rounded-2xl font-medium" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bio / Introduction</label>
                        <textarea rows="3" className="w-full p-4 bg-gray-50 border rounded-2xl font-medium" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Qualifications & Certifications</label>
                        <textarea rows="3" className="w-full p-4 bg-gray-50 border rounded-2xl font-medium" value={formData.qualifications} onChange={e => setFormData({ ...formData, qualifications: e.target.value })} />
                    </div>
                    <button type="submit" className="bg-[#001f3f] text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-navy/20 hover:scale-105 transition-all">Save Changes</button>
                </form>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="text-xl font-black text-[#001f3f] mb-8 flex items-center gap-2">
                    <Shield className="text-navy" /> Account Control
                </h3>
                <div className="space-y-6 flex-1">
                    <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                        <div className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest text-center">Security Status</div>
                        <button
                            onClick={toggleStatus}
                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${user.is_active ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-600 hover:text-white'}`}
                        >
                            {user.is_active ? <><Lock size={20} /> Deactivate Account</> : <><Unlock size={20} /> Activate Account</>}
                        </button>
                    </div>

                    <div className="p-6 rounded-2xl border border-orange-100 bg-orange-50/50">
                        <p className="text-xs font-bold text-orange-700 text-center uppercase mb-1">Current System Role</p>
                        <p className="text-2xl font-black text-navy text-center uppercase tracking-tighter">{user.role.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AcademicAssignment = ({ data, onRefresh }) => {
    const user = data.user;
    const allocations = data.assignments.subjects;
    const [allSubjects, setAllSubjects] = useState([]);
    const [assignForm, setAssignForm] = useState({ subject_id: '', class_grade: '' });

    useEffect(() => {
        globalApi.get('/academics/subjects/').then(res => setAllSubjects(res.data));
    }, []);

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await globalApi.post('/academics/assign-subject/', { subject_id: assignForm.subject_id, class_grade: assignForm.class_grade, teacher_id: user.id });
            setAssignForm({ subject_id: '', class_grade: '' });
            onRefresh();
        } catch (e) { alert("Assignment failed"); }
    };

    const handleUnassign = async (id) => {
        if (!confirm("Remove this assignment?")) return;
        try {
            await globalApi.post('/academics/unassign-subject/', { allocation_id: id });
            onRefresh();
        } catch (e) { alert("Action failed"); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-[#001f3f] mb-8">Current Subject Allocations</h3>
                <div className="space-y-4">
                    {allocations.map(a => (
                        <div key={a.id} className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 group">
                            <div>
                                <div className="font-black text-lg text-navy tracking-tight">{a.subject_name}</div>
                                <div className="text-xs font-black text-orange-500 uppercase tracking-widest">{a.class_grade}</div>
                            </div>
                            <button onClick={() => handleUnassign(a.id)} className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    {allocations.length === 0 && <p className="text-center py-10 text-gray-400 font-bold">No academic subjects assigned yet.</p>}
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-[#001f3f] mb-8">Assign New Subject</h3>
                <form onSubmit={handleAssign} className="space-y-4">
                    <select
                        required className="w-full p-4 bg-gray-50 border rounded-2xl font-bold text-navy"
                        value={assignForm.subject_id} onChange={e => setAssignForm({ ...assignForm, subject_id: e.target.value })}
                    >
                        <option value="">Select Subject...</option>
                        {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                    <select
                        required className="w-full p-4 bg-gray-50 border rounded-2xl font-bold text-navy"
                        value={assignForm.class_grade} onChange={e => setAssignForm({ ...assignForm, class_grade: e.target.value })}
                    >
                        <option value="">Select Class...</option>
                        {['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'NURSERY_1', 'NURSERY_2', 'PRE_NURSERY'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:scale-105 transition-all">Assign Subject</button>
                </form>
            </div>
        </div>
    );
};

const TimetableManager = ({ data, onRefresh }) => {
    const user = data.user;
    const timetable = data.assignments.timetable;
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    return (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-[#001f3f] mb-8">Personal Timetable Grid</h3>
            <div className="overflow-x-auto rounded-3xl border border-gray-100">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-4 bg-gray-50 border text-xs font-black text-gray-400 uppercase tracking-widest">Time / Day</th>
                            {days.map(d => <th key={d} className="p-4 bg-gray-50 border text-xs font-black text-gray-400 uppercase tracking-widest">{d}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                            <tr key={period}>
                                <td className="p-4 border bg-gray-50 text-center">
                                    <div className="text-xs font-black text-navy uppercase">Period {period}</div>
                                    <div className="text-[10px] text-gray-400 font-bold">{8 + period}:00</div>
                                </td>
                                {days.map(day => {
                                    const entry = timetable.find(e => e.day_of_week === day && e.start_time.startsWith(`${8 + period < 10 ? '0' + (8 + period) : 8 + period}`));
                                    return (
                                        <td key={day} className="p-2 border min-w-[150px] min-h-[100px]">
                                            {entry ? (
                                                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 text-center">
                                                    <div className="text-xs font-bold text-navy truncate uppercase">{entry.subject_name}</div>
                                                    <div className="text-[10px] font-black text-orange-500">{entry.class_grade}</div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-200">-</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-6 text-sm text-gray-400 text-center font-medium italic">Timetable entries are managed via the Academics Class Timetable module for global consistency.</p>
        </div>
    );
};

const DocumentVault = ({ data, onRefresh }) => {
    const user = data.user;
    const documents = data.documents;

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('staff', user.id);
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('document_type', 'CERTIFICATE');

        try {
            await api.post('/manage/document-upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onRefresh();
        } catch (e) { alert("Upload failed"); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-[#001f3f] mb-8 flex justify-between items-center">
                    Staff Documents Vault
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{documents.length} Files</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documents.map(doc => (
                        <div key={doc.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-50 text-navy">
                                    <FileCheck size={24} />
                                </div>
                                <div className="max-w-[150px]">
                                    <div className="font-bold text-sm text-navy truncate">{doc.title}</div>
                                    <div className="text-[10px] text-gray-400 uppercase font-black">{new Date(doc.upload_date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <a href={doc.file} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-navy transition-colors">
                                <Download size={20} />
                            </a>
                        </div>
                    ))}
                    {documents.length === 0 && <div className="sm:col-span-2 p-10 text-center text-gray-300 font-bold">No documents uploaded yet.</div>}
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-6">
                    <Upload size={32} />
                </div>
                <h4 className="text-lg font-black text-[#001f3f] mb-2">Upload New Document</h4>
                <p className="text-sm text-gray-500 mb-6">PDF, PNG or JPG (Max 5MB)<br />For certificates, ID cards or contracts.</p>
                <label className="cursor-pointer bg-[#001f3f] text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-navy/20 hover:scale-105 transition-all">
                    Choose File
                    <input type="file" className="hidden" onChange={handleUpload} />
                </label>
            </div>
        </div>
    );
};

// --- CALENDAR TAB ---
const CalendarTab = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/calendar/').then(res => {
            setEvents(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const getCategoryStyle = (cat) => {
        switch (cat) {
            case 'ACADEMIC': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'HOLIDAY': return 'bg-red-100 text-red-700 border-red-200';
            case 'STAFF_MEETING': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'EXTRACURRICULAR': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-[#001f3f]">School Calendar</h2>
                <p className="text-gray-500 mt-1">Upcoming events, staff meetings, and holidays.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No upcoming calendar events scheduled.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map(event => (
                        <div key={event.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow">
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border mb-3 ${getCategoryStyle(event.category)}`}>
                                    {event.category.replace('_', ' ')}
                                </span>
                                <h3 className="text-lg font-bold text-[#001f3f]">{event.title}</h3>
                                <p className="text-gray-500 text-sm mt-1">{event.description}</p>
                            </div>
                            <div className="text-left md:text-right border-l-4 border-orange-500 pl-4 md:border-l-0 md:border-r-4 md:pr-4 font-mono text-sm">
                                <div className="font-bold text-[#001f3f]">
                                    {new Date(event.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                    {new Date(event.start_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    {' - '}
                                    {new Date(event.end_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- PERFORMANCE TAB ---
const PerformanceTab = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/evaluations/').then(res => {
            setEvaluations(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const getScoreColor = (score) => {
        if (score >= 85) return 'text-green-600 bg-green-50 border-green-100';
        if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-100';
        if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-100';
        return 'text-red-600 bg-red-50 border-red-100';
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-[#001f3f]">Staff Performance Reviews</h2>
                <p className="text-gray-500 mt-1">Official evaluations, scores, and feedback from school directors.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                </div>
            ) : evaluations.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No performance reviews recorded yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {evaluations.map(evaluation => (
                        <div key={evaluation.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-[#001f3f]">{evaluation.staff_name}</h3>
                                    <span className="text-xs text-gray-400 font-medium">Evaluated on {new Date(evaluation.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 text-sm font-medium italic">"{evaluation.comments}"</p>
                                <div className="text-xs text-gray-400 mt-3 font-semibold">Evaluator: {evaluation.evaluator_name}</div>
                            </div>
                            <div className={`px-6 py-4 rounded-xl border flex flex-col items-center justify-center min-w-[100px] shadow-sm ${getScoreColor(evaluation.score)}`}>
                                <span className="text-3xl font-black">{evaluation.score}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest mt-0.5">Score</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Staff;
