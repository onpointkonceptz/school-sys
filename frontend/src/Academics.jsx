
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BookOpen, Users, Edit3, Save, CheckCircle, Search, Filter, X,
    User, CreditCard, ChevronRight, ArrowLeft, GraduationCap, LayoutDashboard, PlusCircle, Settings, Trash2, MoreVertical
} from 'lucide-react';

// Configure Axios
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

// Attach CSRF token from cookie on every request
api.interceptors.request.use(config => {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    if (match) config.headers['X-CSRFToken'] = match.split('=')[1];
    return config;
});


const Academics = ({ user }) => {
    // Only Teachers have write access to Academics (grades, subjects, reports)
    // Other roles (Principal, Super Admin, etc) are read-only
    const readOnly = user?.role !== 'TEACHER';

    // VIEWS: DASHBOARD -> CLASS_GRADEBOOK
    const [view, setView] = useState('DASHBOARD');

    // Data State
    const [stats, setStats] = useState([]);
    const [allocations, setAllocations] = useState([]); // All teacher allocations
    const [allSubjects, setAllSubjects] = useState([]); // For assignment dropdown
    const [gradingScales, setGradingScales] = useState([]);

    // Selection State
    const [selectedClass, setSelectedClass] = useState(null);   // display label
    const [selectedClassCode, setSelectedClassCode] = useState(null); // DB code
    const [selectedAllocation, setSelectedAllocation] = useState(null);
    const [classSubjects, setClassSubjects] = useState([]);
    const [classRoster, setClassRoster] = useState([]);
    const [rosterLoading, setRosterLoading] = useState(false);

    // Modals
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [showGradingSettings, setShowGradingSettings] = useState(false);
    const [showSubjectManager, setShowSubjectManager] = useState(false);

    const [loading, setLoading] = useState(true);

    // Profile Modal State
    const [viewProfile, setViewProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [reportInput, setReportInput] = useState({});

    // Fetch Stats & Allocations on Mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, allocRes, scalesRes, subRes] = await Promise.all([
                api.get('/students/dashboard-stats/'),
                api.get('/academics/teacher-classes/'),
                api.get('/academics/grading-scales/'),
                api.get('/academics/subjects/')
            ]);

            setStats(statsRes.data);
            setAllocations(allocRes.data);
            setGradingScales(scalesRes.data);
            setAllSubjects(subRes.data);

        } catch (error) {
            console.error("Failed to fetch academic data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClassClick = async (classCode, classLabel) => {
        // Filter allocations by code OR label (support both old and new data)
        const subjects = allocations.filter(a =>
            a.class_grade === classCode || a.class_grade === classLabel
        );

        setSelectedClass(classLabel);       // for display
        setSelectedClassCode(classCode);    // for API calls
        setClassSubjects(subjects);
        setClassRoster([]);

        // If subjects exist, select first.
        if (subjects.length > 0) {
            setSelectedAllocation(subjects[0]);
        } else {
            setSelectedAllocation(null);
        }

        setView('CLASS_GRADEBOOK');

        // Fetch student roster using the CODE so it matches student records
        setRosterLoading(true);
        try {
            const res = await api.get('/students/', { params: { class_grade: classCode } });
            setClassRoster(res.data);
        } catch (e) {
            console.error('Failed to fetch class roster', e);
        } finally {
            setRosterLoading(false);
        }
    };

    const handleAllocationChange = async () => {
        // Refresh allocations logic helper
        const res = await api.get('/academics/teacher-classes/');
        const newAllocations = res.data;
        setAllocations(newAllocations);
        return newAllocations;
    };

    const handleSubjectAdded = async (newAllocation) => {
        const newAllocations = await handleAllocationChange();

        // Update local state for current view — filter by code OR label
        const updatedClassSubjects = newAllocations.filter(a =>
            a.class_grade === selectedClassCode || a.class_grade === selectedClass
        );
        setClassSubjects(updatedClassSubjects);

        // Select the newly added subject
        const added = updatedClassSubjects.find(a => a.subject === newAllocation.subject);
        if (added) setSelectedAllocation(added);

        setShowAddSubject(false);
    };

    const handleUnassignSubject = async () => {
        if (!selectedAllocation || !window.confirm(`Are you sure you want to remove ${selectedAllocation.subject_name} from ${selectedClass}? Grades may be lost.`)) return;

        try {
            await api.post('/academics/unassign-subject/', { allocation_id: selectedAllocation.id });
            const newAllocations = await handleAllocationChange();
            const updatedClassSubjects = newAllocations.filter(a =>
                a.class_grade === selectedClassCode || a.class_grade === selectedClass
            );
            setClassSubjects(updatedClassSubjects);
            setSelectedAllocation(updatedClassSubjects.length > 0 ? updatedClassSubjects[0] : null);
        } catch (e) {
            console.error(e);
            alert("Failed to unassign subject.");
        }
    }

    const goBack = () => {
        setView('DASHBOARD');
        setSelectedClass(null);
        setSelectedClassCode(null);
        setSelectedAllocation(null);
        setClassRoster([]);
    };

    // --- Profile Modal Logic (Reused) ---
    const openProfile = async (studentId) => {
        try {
            const res = await api.get(`/students/${studentId}/`);
            setViewProfile(res.data);
            const txnsRes = await api.get('/accounts/transactions/');
            const studentTxns = txnsRes.data.filter(t => t.admission_number === res.data.admission_number);
            setTransactions(studentTxns);
        } catch (error) {
            console.error("Failed to load profile", error);
            alert("Failed to load student profile.");
        }
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-[#001f3f] tracking-tight">Academic Records</h1>
                    <p className="text-gray-500 mt-1">
                        {view === 'DASHBOARD' && "Manage classes, subjects, and grading."}
                        {view === 'CLASS_GRADEBOOK' && (
                            <span className="flex items-center gap-2">
                                <span className="font-bold text-[#001f3f]">{selectedClass}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-orange-600 font-medium">
                                    {selectedAllocation ? "Entering Scores" : "No Subject Selected"}
                                </span>
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex gap-3">
                    {view === 'DASHBOARD' && !readOnly && (
                        <>
                            <button
                                onClick={() => setShowSubjectManager(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#001f3f] hover:bg-gray-100 rounded-xl transition border border-gray-200"
                            >
                                <BookOpen size={16} />
                                Manage Subjects
                            </button>
                            <button
                                onClick={() => setShowGradingSettings(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#001f3f] hover:bg-gray-100 rounded-xl transition border border-gray-200"
                            >
                                <Settings size={16} />
                                Grading Config
                            </button>
                        </>
                    )}
                    {view !== 'DASHBOARD' && (
                        <button
                            onClick={goBack}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#001f3f] hover:bg-gray-100 rounded-xl transition"
                        >
                            <ArrowLeft size={16} />
                            Back to Classes
                        </button>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-navy border-t-transparent rounded-full opacity-50"></div>
                </div>
            ) : (
                <>
                    {/* LEVEL 1: DASHBOARD */}
                    {view === 'DASHBOARD' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
                            {stats.filter(stat => {
                                // Admin/Principal see all classes
                                if (user?.role !== 'TEACHER') return true;
                                // Teachers only see classes where they have an allocation
                                // 'allocations' holds only their assigned subjects from the backend
                                return allocations.some(a => a.class_grade === stat.code || a.class_grade === stat.label);
                            }).map((stat) => (
                                <div
                                    key={stat.code}
                                    onClick={() => handleClassClick(stat.code, stat.label)}
                                    className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-full"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-[#001f3f]/5 text-[#001f3f] rounded-xl group-hover:bg-[#001f3f] group-hover:text-white transition-colors">
                                                <GraduationCap size={24} />
                                            </div>
                                            <div className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">
                                                {stat.label}
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="text-4xl font-black text-[#001f3f] mb-1">{stat.total_students}</div>
                                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Students</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#ff851b]/5 rounded-xl p-3 text-center border border-orange/10">
                                                <div className="text-xs text-[#ff851b] font-bold uppercase mb-1">Boarding</div>
                                                <div className="text-xl font-black text-[#001f3f]">{stat.boarding}</div>
                                            </div>
                                            <div className="bg-blue-50/50 rounded-xl p-3 text-center border border-blue-100/50">
                                                <div className="text-xs text-blue-600 font-bold uppercase mb-1">Day</div>
                                                <div className="text-xl font-black text-[#001f3f]">{stat.day}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* LEVEL 2: CLASS GRADEBOOK */}
                    {view === 'CLASS_GRADEBOOK' && (
                        <div className="space-y-6">
                            {/* Toolbar */}
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <BookOpen size={18} />
                                        <span className="font-bold">Subject:</span>
                                    </div>

                                    {classSubjects.length > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={selectedAllocation?.id || ''}
                                                onChange={(e) => {
                                                    const alloc = classSubjects.find(a => a.id === parseInt(e.target.value));
                                                    setSelectedAllocation(alloc);
                                                }}
                                                className="p-2 border rounded-lg bg-gray-50 font-bold text-[#001f3f] focus:ring-2 focus:ring-orange-500 outline-none"
                                            >
                                                {classSubjects.map(s => (
                                                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                                                ))}
                                            </select>
                                            {!readOnly && (
                                                <button onClick={handleUnassignSubject} title="Unassign Subject" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-red-500 font-medium italic">No subjects assigned</span>
                                    )}

                                    {!readOnly && (
                                        <button
                                            onClick={() => setShowAddSubject(true)}
                                            className="flex items-center gap-2 text-xs font-bold text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition"
                                        >
                                            <PlusCircle size={14} />
                                            Add Subject
                                        </button>
                                    )}
                                </div>

                                {selectedAllocation && (
                                    <div className="text-sm text-gray-400">
                                        Session: <span className="font-bold text-gray-600">{selectedAllocation.session}</span>
                                    </div>
                                )}
                            </div>

                            {/* Class Roster */}
                            <ClassRosterCard
                                students={classRoster}
                                loading={rosterLoading}
                                className={selectedClass}
                                onOpenProfile={openProfile}
                            />

                            {/* Gradebook Table */}
                            {selectedAllocation ? (
                                <GradebookView
                                    allocation={selectedAllocation}
                                    gradingScales={gradingScales}
                                    onOpenProfile={openProfile}
                                    readOnly={readOnly}
                                />
                            ) : (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                    <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
                                    <h3 className="text-lg font-bold text-gray-500">No Subject Selected</h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {readOnly ? 'No subject assigned to this class yet.' : 'Please select or add a subject to start grading.'}
                                    </p>
                                    {!readOnly && (
                                        <button
                                            onClick={() => setShowAddSubject(true)}
                                            className="mt-6 px-6 py-2 bg-[#001f3f] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                        >
                                            Assign Subject to Class
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODALS */}
                    {viewProfile && (
                        <ProfileModal
                            viewProfile={viewProfile}
                            setViewProfile={setViewProfile}
                            transactions={transactions}
                            reportInput={reportInput}
                            setReportInput={setReportInput}
                        />
                    )}

                    {showAddSubject && (
                        <AddSubjectModal
                            onClose={() => setShowAddSubject(false)}
                            allSubjects={allSubjects}
                            classGrade={selectedClass}
                            onAssign={handleSubjectAdded}
                            refreshSubjects={() => fetchData()}
                        />
                    )}

                    {showGradingSettings && (
                        <GradingSettingsModal
                            onClose={() => setShowGradingSettings(false)}
                            scales={gradingScales}
                            onUpdate={() => fetchData()}
                        />
                    )}

                    {showSubjectManager && (
                        <SubjectManagerModal
                            onClose={() => setShowSubjectManager(false)}
                            subjects={allSubjects}
                            onUpdate={() => fetchData()}
                        />
                    )}
                </>
            )}
        </div>
    );
};

// --- Sub-Components ---

const AddSubjectModal = ({ onClose, allSubjects, classGrade, onAssign, refreshSubjects }) => {
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false); // Toggle creation mode
    const [newSubjectName, setNewSubjectName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let subjectId = selectedSubjectId;

            // If creating new subject inline
            if (isCreating) {
                const createRes = await api.post('/academics/subjects/save/', { name: newSubjectName });
                subjectId = createRes.data.id;
                await refreshSubjects(); // Refresh global list
            }

            if (!subjectId) return;

            const res = await api.post('/academics/assign-subject/', {
                subject_id: subjectId,
                class_grade: classGrade
            });
            onAssign(res.data);
            // onAssign handles closing
        } catch (error) {
            console.error("Assign Error", error);
            alert("Failed to assign/create subject.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#001f3f]/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#001f3f]">{isCreating ? "Create & Assign" : "Assign Subject"}</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isCreating ? (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Select Subject</label>
                            <select
                                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#001f3f]"
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                required={!isCreating}
                            >
                                <option value="">-- Choose Subject --</option>
                                {allSubjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                            <div className="mt-2 text-right">
                                <button type="button" onClick={() => setIsCreating(true)} className="text-xs text-orange-600 font-bold hover:underline">
                                    + Create New Subject
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Subject Name</label>
                            <input
                                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#001f3f]"
                                placeholder="e.g. Robotics, french"
                                value={newSubjectName}
                                onChange={e => setNewSubjectName(e.target.value)}
                                required={isCreating}
                            />
                            <div className="mt-2 text-right">
                                <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-gray-500 font-bold hover:underline">
                                    Cancel Creation
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (!selectedSubjectId && !newSubjectName)}
                        className="w-full py-3 bg-[#001f3f] text-white font-bold rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (isCreating ? 'Create & Assign' : 'Assign to Class')}
                    </button>
                </form>
            </div>
        </div>
    );
};

const GradingSettingsModal = ({ onClose, scales, onUpdate }) => {
    const [localScales, setLocalScales] = useState([...scales]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ min_score: 0, max_score: 100, grade: '', remark: '' });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/academics/grading-scales/save/', { id: editingId, ...formData });
            onUpdate();
            onClose();
        } catch (e) { alert('Failed to save'); }
    }

    const startEdit = (scale) => {
        setEditingId(scale.id);
        setFormData({ min_score: scale.min_score, max_score: scale.max_score, grade: scale.grade, remark: scale.remark });
    }

    const startCreate = () => {
        setEditingId(null);
        setFormData({ min_score: 0, max_score: 100, grade: '', remark: '' });
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this scale?')) return;
        await api.post('/academics/grading-scales/delete/', { id });
        onUpdate();
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#001f3f]/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#001f3f]">Grading Configuration</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {/* Form */}
                    <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                        <h4 className="font-bold text-sm text-gray-500 mb-3">{editingId ? 'Edit Rule' : 'Add New Rule'}</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <div><label className="text-xs text-gray-400">Min Score</label><input type="number" required className="w-full p-2 border rounded" value={formData.min_score} onChange={e => setFormData({ ...formData, min_score: e.target.value })} /></div>
                            <div><label className="text-xs text-gray-400">Max Score</label><input type="number" required className="w-full p-2 border rounded" value={formData.max_score} onChange={e => setFormData({ ...formData, max_score: e.target.value })} /></div>
                            <div><label className="text-xs text-gray-400">Grade (A-F)</label><input type="text" required className="w-full p-2 border rounded" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} /></div>
                            <div><label className="text-xs text-gray-400">Remark</label><input type="text" required className="w-full p-2 border rounded" value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} /></div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            {editingId && <button type="button" onClick={startCreate} className="px-3 py-1 text-xs font-bold text-gray-500">Cancel Edit</button>}
                            <button className="px-4 py-2 bg-[#001f3f] text-white rounded-lg text-sm font-bold">Save Context</button>
                        </div>
                    </form>

                    {/* Table */}
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 font-bold text-gray-600">
                            <tr><th className="p-3 text-left">Range</th><th className="p-3">Grade</th><th className="p-3">Remark</th><th className="p-3">Actions</th></tr>
                        </thead>
                        <tbody>
                            {scales.map(s => (
                                <tr key={s.id} className="border-b">
                                    <td className="p-3">{s.min_score} - {s.max_score}</td>
                                    <td className="p-3 text-center font-bold text-[#001f3f]">{s.grade}</td>
                                    <td className="p-3 text-center text-gray-500">{s.remark}</td>
                                    <td className="p-3 text-center space-x-2">
                                        <button onClick={() => startEdit(s)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit3 size={14} /></button>
                                        <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SubjectManagerModal = ({ onClose, subjects, onUpdate }) => {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '' });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/academics/subjects/save/', { id: editingId, ...formData });
            onUpdate();
            setFormData({ name: '', code: '' });
            setEditingId(null);
        } catch (e) { alert('Failed to save'); }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this Subject? ALL ALLOCATIONS and Grades associated with it will be lost!')) return;
        try {
            await api.post('/academics/subjects/delete/', { id });
            onUpdate();
        } catch (e) { alert('Deletion failed'); }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#001f3f]/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#001f3f]">Subject Manager</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-bold">Subject Name</label>
                            <input className="w-full p-2 border rounded" placeholder="e.g. Mathematics" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="w-32">
                            <label className="text-xs text-gray-400 font-bold">Code (Opt)</label>
                            <input className="w-full p-2 border rounded" placeholder="MTH" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                        </div>
                        <button className="px-6 py-2 bg-[#001f3f] text-white rounded-lg text-sm font-bold">
                            {editingId ? 'Update' : 'Create'}
                        </button>
                    </form>

                    <div className="grid grid-cols-1 gap-2">
                        {subjects.map(s => (
                            <div key={s.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 group">
                                <div>
                                    <div className="font-bold text-[#001f3f]">{s.name}</div>
                                    <div className="text-xs text-gray-400">{s.code}</div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => { setEditingId(s.id); setFormData({ name: s.name, code: s.code }) }} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit3 size={16} /></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-1 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const ClassRosterCard = ({ students, loading, className, onOpenProfile }) => {
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState(false);

    const filtered = students.filter(s =>
        `${s.first_name} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(search.toLowerCase())
    );

    const statusColor = (status) => {
        if (status === 'Active') return 'bg-green-100 text-green-700';
        if (status === 'Inactive' || status === 'Withdrawn') return 'bg-red-100 text-red-600';
        return 'bg-gray-100 text-gray-500';
    };

    const paymentColor = (status) => {
        if (status === 'PAID') return 'bg-green-100 text-green-700';
        if (status === 'PARTIAL') return 'bg-orange-100 text-orange-600';
        return 'bg-red-100 text-red-600';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <Users size={20} className="text-[#ff851b]" />
                    <div>
                        <h3 className="font-bold text-[#001f3f] text-sm">
                            Class Roster
                            <span className="ml-2 bg-[#001f3f]/10 text-[#001f3f] text-xs px-2 py-0.5 rounded-full font-mono">
                                {loading ? '…' : students.length} students
                            </span>
                        </h3>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!collapsed && (
                        <div className="relative">
                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-400 outline-none w-44"
                                placeholder="Search name or ID…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                    >
                        {collapsed ? 'Show ▼' : 'Hide ▲'}
                    </button>
                </div>
            </div>

            {!collapsed && (
                loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-4 border-[#001f3f] border-t-transparent rounded-full opacity-40" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        {search ? 'No students match your search.' : 'No students found in this class.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#001f3f]/5 text-[#001f3f]/60 font-bold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3">Student Name</th>
                                    <th className="px-4 py-3">Admission No.</th>
                                    <th className="px-4 py-3 text-center">Type</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Fees</th>
                                    <th className="px-4 py-3 text-right">Balance (₦)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((s, idx) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => onOpenProfile(s.id)}
                                        className="hover:bg-orange-50/40 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-[#001f3f] group-hover:text-orange-600 transition-colors">
                                                {s.full_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.admission_number}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.is_boarding ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {s.student_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(s.student_status)}`}>
                                                {s.student_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${paymentColor(s.payment_status)}`}>
                                                {s.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-sm text-gray-700">
                                            {Number(s.balance).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};

const GradebookView = ({ allocation, onOpenProfile, gradingScales, readOnly }) => {

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const fetchGrades = async () => {
            setLoading(true);
            try {
                const res = await api.get('/academics/gradebook/', { params: { allocation_id: allocation.id } });
                setStudents(res.data.students);
            } catch (error) {
                console.error("Failed to fetch gradebook", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, [allocation]);

    const calculateGrade = (total) => {
        const sortedScales = [...gradingScales].sort((a, b) => b.min_score - a.min_score);
        for (const scale of sortedScales) {
            if (total >= parseFloat(scale.min_score)) {
                return { grade: scale.grade, remark: scale.remark };
            }
        }
        return { grade: 'F', remark: 'FAIL' };
    };

    const handleScoreChange = (index, field, value) => {
        const updatedStudents = [...students];
        const student = updatedStudents[index];

        const maxScores = { test_score: 20, assignment_score: 10, midterm_score: 20, exam_score: 50 };
        let numValue = parseFloat(value) || 0;
        if (numValue < 0) numValue = 0;
        if (numValue > maxScores[field]) numValue = maxScores[field];

        student[field] = numValue;

        const total =
            parseFloat(student.test_score || 0) +
            parseFloat(student.assignment_score || 0) +
            parseFloat(student.midterm_score || 0) +
            parseFloat(student.exam_score || 0);

        student.total_score = total;

        const { grade, remark } = calculateGrade(total);
        student.grade = grade;
        student.remark = remark;

        setStudents(updatedStudents);
        setHasChanges(true);
    };

    const saveGrades = async () => {
        setSaving(true);
        try {
            await api.post('/academics/save-grades/', {
                allocation_id: allocation.id,
                grades: students.map(s => ({
                    student: s.student,
                    test_score: s.test_score,
                    assignment_score: s.assignment_score,
                    midterm_score: s.midterm_score,
                    exam_score: s.exam_score,
                    term: '1st Term',
                    remark: s.remark
                }))
            });
            setHasChanges(false);
            alert('Grades saved successfully!');
        } catch (error) {
            console.error(error);
            alert("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#001f3f] border-t-transparent rounded-full opacity-50"></div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="font-bold text-[#001f3f] flex items-center gap-2">
                        <Users size={20} className="text-[#ff851b]" />
                        {students.length} Students Enrolled
                    </h3>
                </div>
                {!readOnly && (
                    <button
                        onClick={saveGrades}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${hasChanges
                            ? 'bg-[#001f3f] text-white hover:bg-orange-600 shadow-navy/20'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {saving ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : <Save size={18} />}
                        {hasChanges ? 'Save Changes' : 'Saved'}
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#001f3f]/5 border-b border-navy/10 text-[#001f3f]/60 font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 w-64">Student</th>
                            <th className="px-4 py-4 w-24 text-center">Test (20)</th>
                            <th className="px-4 py-4 w-24 text-center">Assign (10)</th>
                            <th className="px-4 py-4 w-24 text-center">MidTerm (20)</th>
                            <th className="px-4 py-4 w-24 text-center">Exam (50)</th>
                            <th className="px-6 py-4 w-24 text-center bg-gray-50">Total</th>
                            <th className="px-6 py-4 w-20 text-center bg-gray-50">Grade</th>
                            <th className="px-6 py-4 w-32 bg-gray-50">Remark</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                        {students.map((student, idx) => (
                            <tr key={student.student} className="hover:bg-[#001f3f]/5 transition-colors group">
                                <td className="px-6 py-3">
                                    <div
                                        onClick={() => onOpenProfile(student.student)}
                                        className="font-bold text-[#001f3f] hover:text-orange-500 cursor-pointer transition-colors"
                                    >
                                        {student.student_name} {student.student_last_name}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono">{student.admission_number}</div>
                                </td>
                                <td className="px-4 py-3"><input disabled={readOnly} type="number" className="w-full text-center p-2 border rounded bg-white disabled:bg-transparent disabled:border-transparent disabled:font-medium disabled:text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition" value={student.test_score} onChange={(e) => handleScoreChange(idx, 'test_score', e.target.value)} /></td>
                                <td className="px-4 py-3"><input disabled={readOnly} type="number" className="w-full text-center p-2 border rounded bg-white disabled:bg-transparent disabled:border-transparent disabled:font-medium disabled:text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition" value={student.assignment_score} onChange={(e) => handleScoreChange(idx, 'assignment_score', e.target.value)} /></td>
                                <td className="px-4 py-3"><input disabled={readOnly} type="number" className="w-full text-center p-2 border rounded bg-white disabled:bg-transparent disabled:border-transparent disabled:font-medium disabled:text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition" value={student.midterm_score} onChange={(e) => handleScoreChange(idx, 'midterm_score', e.target.value)} /></td>
                                <td className="px-4 py-3"><input disabled={readOnly} type="number" className="w-full text-center p-2 border rounded bg-white disabled:bg-transparent disabled:border-transparent disabled:font-medium disabled:text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition" value={student.exam_score} onChange={(e) => handleScoreChange(idx, 'exam_score', e.target.value)} /></td>
                                <td className="px-6 py-3 text-center font-bold text-[#001f3f]">{student.total_score}</td>
                                <td className={`px-6 py-3 text-center font-bold ${student.grade === 'F' ? 'text-red-500' : 'text-green-600'}`}>{student.grade}</td>
                                <td className="px-6 py-3"><input disabled={readOnly} type="text" className="w-full p-2 border rounded text-xs bg-white disabled:bg-transparent disabled:border-transparent disabled:font-medium disabled:text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition" value={student.remark || ''} onChange={(e) => handleScoreChange(idx, 'remark', e.target.value)} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Extracted Profile Modal Component for cleaner code
const ProfileModal = ({ viewProfile, setViewProfile, transactions, reportInput, setReportInput }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#001f3f]/80 backdrop-blur-sm" onClick={() => setViewProfile(null)} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95">
                <div className="bg-[#001f3f] p-8 text-white flex justify-between items-start">
                    <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white/20">
                            {viewProfile.first_name[0]}{viewProfile.last_name[0]}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">{viewProfile.full_name}</h2>
                            <div className="flex items-center gap-3 mt-2 text-white/70">
                                <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono">{viewProfile.admission_number}</span>
                                <span>•</span>
                                <span>{viewProfile.class_grade}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setViewProfile(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"><X size={20} /></button>
                </div>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white px-8">
                    <button onClick={() => setViewProfile(prev => ({ ...prev, tab: 'INFO' }))} className={`py-4 px-4 font-bold text-sm border-b-2 transition ${(!viewProfile.tab || viewProfile.tab === 'INFO') ? 'border-orange text-[#001f3f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Info</button>
                    <button onClick={() => {
                        setViewProfile(prev => ({ ...prev, tab: 'ACADEMICS' }));
                        if (!viewProfile.report) api.get(`/academics/student-report/?student_id=${viewProfile.id}`).then(res => setViewProfile(p => ({ ...p, report: res.data })));
                    }} className={`py-4 px-4 font-bold text-sm border-b-2 transition ${(viewProfile.tab === 'ACADEMICS') ? 'border-orange text-[#001f3f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Report</button>
                    <button onClick={() => {
                        setViewProfile(prev => ({ ...prev, tab: 'COMMENTS' }));
                        // Init report input logic
                        if (viewProfile.report?.comments) {
                            setReportInput({ ...viewProfile.report.comments });
                        } else {
                            api.get(`/academics/student-report/?student_id=${viewProfile.id}`).then(res => {
                                setViewProfile(prev => ({ ...prev, report: res.data }));
                                setReportInput({ ...res.data.comments } || {});
                            });
                        }
                    }} className={`py-4 px-4 font-bold text-sm border-b-2 transition ${(viewProfile.tab === 'COMMENTS') ? 'border-orange text-[#001f3f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Comments</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {/* INFO TAB */}
                    {(!viewProfile.tab || viewProfile.tab === 'INFO') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                                <h4 className="font-bold mb-2 text-[#001f3f]">Student Details</h4>
                                <div className="text-sm space-y-2 text-gray-600">
                                    <div><span className="text-gray-400 text-xs block">Parent</span>{viewProfile.parent_name}</div>
                                    <div><span className="text-gray-400 text-xs block">Contact</span>{viewProfile.parent_phone}</div>
                                    <div><span className="text-gray-400 text-xs block">Address</span>{viewProfile.parent_address}</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                                <h4 className="font-bold mb-2 text-[#001f3f]">Transaction History</h4>
                                <div className="space-y-2">
                                    {transactions.map(t => (
                                        <div key={t.id} className="flex justify-between text-sm">
                                            <span>{new Date(t.date_paid).toLocaleDateString()}</span>
                                            <span className="font-bold text-green-600">+₦{t.amount_paid}</span>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <div className="text-gray-400 text-sm">No transactions</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACADEMICS TAB */}
                    {viewProfile.tab === 'ACADEMICS' && viewProfile.report && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded border"><div className="text-xs text-gray-500">Total</div><div className="text-2xl font-bold">{viewProfile.report.summary.total_score}</div></div>
                                <div className="bg-white p-4 rounded border"><div className="text-xs text-gray-500">Average</div><div className="text-2xl font-bold">{viewProfile.report.summary.average}%</div></div>
                                <div className="bg-white p-4 rounded border"><div className="text-xs text-gray-500">Subjects</div><div className="text-2xl font-bold">{viewProfile.report.summary.subjects_offered}</div></div>
                            </div>
                            <table className="w-full text-sm bg-white rounded border">
                                <thead className="bg-gray-50 font-bold"><tr><th className="p-3">Subject</th><th className="p-3 text-center">Total</th><th className="p-3 text-center">Grade</th><th className="p-3 font-normal">Remark</th></tr></thead>
                                <tbody>
                                    {viewProfile.report.results.map((r, i) => (
                                        <tr key={i} className="border-t"><td className="p-3">{r.subject}</td><td className="p-3 text-center font-bold">{r.total}</td><td className={`p-3 text-center font-bold ${r.grade === 'F' ? 'text-red-500' : 'text-green-600'}`}>{r.grade}</td><td className="p-3 text-xs text-gray-400">{r.remark}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* COMMENTS TAB */}
                    {viewProfile.tab === 'COMMENTS' && (
                        <div className="space-y-6">
                            <textarea className="w-full p-4 border rounded-xl" rows="3" placeholder="Class Teacher's Remark" value={reportInput.class_teacher_comment || ''} onChange={e => setReportInput(prev => ({ ...prev, class_teacher_comment: e.target.value }))} />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-xl border">
                                    <h4 className="font-bold mb-2">Affective Domain</h4>
                                    <div className="space-y-2">
                                        {reportInput.affective_domain && Object.keys(reportInput.affective_domain).map(k => (
                                            <div key={k} className="flex justify-between items-center"><span className="text-sm">{k}</span><select className="border rounded p-1" value={reportInput.affective_domain[k]} onChange={e => setReportInput(p => ({ ...p, affective_domain: { ...p.affective_domain, [k]: parseInt(e.target.value) } }))}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border">
                                    <h4 className="font-bold mb-2">Psychomotor Domain</h4>
                                    <div className="space-y-2">
                                        {reportInput.psychomotor_domain && Object.keys(reportInput.psychomotor_domain).map(k => (
                                            <div key={k} className="flex justify-between items-center"><span className="text-sm">{k}</span><select className="border rounded p-1" value={reportInput.psychomotor_domain[k]} onChange={e => setReportInput(p => ({ ...p, psychomotor_domain: { ...p.psychomotor_domain, [k]: parseInt(e.target.value) } }))}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <button onClick={async () => { await api.post('/academics/save-student-report/', { student_id: viewProfile.id, ...reportInput }); alert('Saved!'); }} className="px-6 py-3 bg-[#001f3f] text-white rounded-xl font-bold shadow-lg hover:bg-[#001f3f]-light">Save Report Entry</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Academics;
