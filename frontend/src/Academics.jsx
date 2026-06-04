
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BookOpen, Users, Edit3, Save, CheckCircle, Search, Filter, X,
    User, CreditCard, ChevronRight, ArrowLeft, GraduationCap, LayoutDashboard, PlusCircle, Settings, Trash2, MoreVertical,
    Calendar, ClipboardList, Settings2, History, Download, Upload, FileText, Clock, UserCheck, Trophy, ClipboardCheck, Briefcase as ECIcon
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


const Academics = ({ user, navData }) => {
    // Only Teachers have write access to Academics (grades, subjects, reports)
    // Other roles (Principal, Super Admin, etc) are read-only
    const readOnly = user?.role !== 'TEACHER';

    // VIEWS: DASHBOARD -> CLASS_GRADEBOOK, LESSON_PLANS, TIMETABLE, ATTENDANCE, EXTRACURRICULAR, ADMIN
    const [view, setView] = useState('DASHBOARD');
    const [lessonPlans, setLessonPlans] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [ecActivities, setEcActivities] = useState([]);
    const [ecRoles, setEcRoles] = useState([]);

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
        if (navData?.tab) {
            setView(navData.tab);
        }
        fetchData();
    }, [navData]);

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

            // New: Fetch Lesson Plans and Timetable if needed
            fetchLessonPlans();
            fetchExtracurricularData();

        } catch (error) {
            console.error("Failed to fetch academic data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLessonPlans = async () => {
        try {
            const res = await api.get('/academics/lesson-plans/');
            setLessonPlans(res.data);
        } catch (error) {
            console.error("Failed to fetch lesson plans", error);
        }
    };

    const fetchTimetable = async (classCode) => {
        try {
            const res = await api.get(`/academics/timetable/?class_grade=${classCode}`);
            setTimetable(res.data);
        } catch (error) {
            console.error("Failed to fetch timetable", error);
        }
    };

    const fetchExtracurricularData = async () => {
        try {
            const [activitiesRes, rolesRes] = await Promise.all([
                api.get('/staff/extracurricular-activities/'),
                api.get('/staff/teacher-extracurricular-roles/')
            ]);
            setEcActivities(activitiesRes.data);
            setEcRoles(rolesRes.data);
        } catch (error) {
            console.error("Failed to fetch extracurricular data", error);
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
                    <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-gray-100 backdrop-blur-sm mr-auto ml-12">
                        <button
                            onClick={() => setView('DASHBOARD')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${view === 'DASHBOARD' ? 'bg-[#001f3f] text-white shadow-lg shadow-navy/20' : 'text-[#001f3f]/60 hover:bg-white'}`}
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setView('LESSON_PLANS')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${view === 'LESSON_PLANS' ? 'bg-[#001f3f] text-white shadow-lg shadow-navy/20' : 'text-[#001f3f]/60 hover:bg-white'}`}
                        >
                            <ClipboardList size={18} />
                            Lesson Plans
                        </button>
                        <button
                            onClick={() => setView('TIMETABLE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${view === 'TIMETABLE' ? 'bg-[#001f3f] text-white shadow-lg shadow-navy/20' : 'text-[#001f3f]/60 hover:bg-white'}`}
                        >
                            <Calendar size={18} />
                            Timetable
                        </button>
                        <button
                            onClick={() => setView('ATTENDANCE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${view === 'ATTENDANCE' ? 'bg-[#001f3f] text-white shadow-lg shadow-navy/20' : 'text-[#001f3f]/60 hover:bg-white'}`}
                        >
                            <UserCheck size={18} />
                            Attendance
                        </button>
                        <button
                            onClick={() => setView('EXTRACURRICULAR')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${view === 'EXTRACURRICULAR' ? 'bg-[#001f3f] text-white shadow-lg shadow-navy/20' : 'text-[#001f3f]/60 hover:bg-white'}`}
                        >
                            <Trophy size={18} />
                            Extracurricular
                        </button>
                        {user?.role === 'SUPER_ADMIN' && (
                            <button
                                onClick={() => setView('ADMIN')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${view === 'ADMIN' ? 'bg-[#ff851b] text-white shadow-lg shadow-orange/20' : 'text-[#001f3f]/60 hover:bg-white'}`}
                            >
                                <Settings2 size={18} />
                                Admin
                            </button>
                        )}
                    </div>

                    <h1 className="text-3xl font-black text-[#001f3f] tracking-tight ml-auto">Academic Records</h1>
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
                    {/* LEVEL 4: LESSON PLANS */}
                    {view === 'LESSON_PLANS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <LessonPlansView plans={lessonPlans} onRefresh={fetchLessonPlans} user={user} allSubjects={allSubjects} />
                        </div>
                    )}

                    {/* LEVEL 5: TIMETABLE */}
                    {view === 'TIMETABLE' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <TimetableView timetable={timetable} onRefresh={fetchTimetable} user={user} allSubjects={allSubjects} />
                        </div>
                    )}

                    {/* LEVEL 7: ATTENDANCE */}
                    {view === 'ATTENDANCE' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <StudentAttendanceView
                                user={user}
                                allocations={allocations}
                                stats={stats}
                            />
                        </div>
                    )}

                    {/* LEVEL 8: EXTRACURRICULAR */}
                    {view === 'EXTRACURRICULAR' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <ExtracurricularView
                                user={user}
                                activities={ecActivities}
                                roles={ecRoles}
                                onRefresh={fetchExtracurricularData}
                            />
                        </div>
                    )}

                    {/* LEVEL 6: ADMIN MANAGEMENT */}
                    {view === 'ADMIN' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <AdminManagementView user={user} allSubjects={allSubjects} allocations={allocations} setAllocations={setAllocations} onRefresh={fetchData} />
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

        if (field === 'grade') {
            student.grade = value.toUpperCase();
            setStudents(updatedStudents);
            setHasChanges(true);
            return;
        }

        const maxScores = { test_score: 20, assignment_score: 10, midterm_score: 20, exam_score: 50 };
        let numValue = parseFloat(value) || 0;
        if (numValue < 0) numValue = 0;
        if (numValue > maxScores[field]) numValue = maxScores[field];

        student[field] = numValue;

        const ca = parseFloat(student.test_score || 0) + parseFloat(student.assignment_score || 0) + parseFloat(student.midterm_score || 0);
        student.ca_score = ca;

        const total = ca + parseFloat(student.exam_score || 0);
        student.total_score = total;

        // Auto-calculate grade only if it was empty or not manually set before
        // For simplicity in this UI, we auto-calculate on score change. 
        // If they want to override, they can change the grade field after.
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
                    grade: s.grade, // Manual/Calculated Grade
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
                            <th className="px-4 py-4 w-24 text-center bg-orange-50/50">CA (50)</th>
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
                                <td className="px-4 py-3 text-center font-bold text-orange-600 bg-orange-50/30">
                                    {((parseFloat(student.test_score) || 0) + (parseFloat(student.assignment_score) || 0) + (parseFloat(student.midterm_score) || 0)).toFixed(1)}
                                </td>
                                <td className="px-4 py-3"><input disabled={readOnly} type="number" className="w-full text-center p-2 border rounded bg-white disabled:bg-transparent disabled:border-transparent disabled:font-medium disabled:text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition" value={student.exam_score} onChange={(e) => handleScoreChange(idx, 'exam_score', e.target.value)} /></td>
                                <td className="px-6 py-3 text-center font-bold text-[#001f3f] bg-gray-50/50">{student.total_score}</td>
                                <td className="px-4 py-3 bg-gray-50/50">
                                    <select
                                        disabled={readOnly}
                                        value={student.grade}
                                        onChange={(e) => handleScoreChange(idx, 'grade', e.target.value)}
                                        className={`w-full text-center p-1 rounded font-bold border-none bg-transparent cursor-pointer hover:bg-white transition ${student.grade === 'F' ? 'text-red-500' : 'text-green-600'}`}
                                    >
                                        {['A', 'B', 'C', 'D', 'E', 'F'].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-3 bg-gray-50/50"><input disabled={readOnly} type="text" className="w-full p-2 border rounded text-xs bg-white disabled:bg-transparent disabled:border-transparent disabled:font-medium disabled:text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition" value={student.remark || ''} onChange={(e) => handleScoreChange(idx, 'remark', e.target.value)} /></td>
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
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-[#001f3f]">Performance Summary</h4>
                                <button
                                    onClick={() => window.open(`/api/academics/report/export/?student_id=${viewProfile.id}`, '_blank')}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition flex items-center gap-2"
                                >
                                    <CreditCard size={16} /> {/* Using CreditCard icon for Download as a placeholder if no Download icon */}
                                    Download PDF Report
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Score</div>
                                    <div className="text-2xl font-black text-[#001f3f]">{viewProfile.report.summary.total_score}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Average</div>
                                    <div className="text-2xl font-black text-[#001f3f]">{viewProfile.report.summary.average}%</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Position</div>
                                    <div className="text-2xl font-black text-orange-600">
                                        {viewProfile.report.summary.position} <span className="text-xs text-gray-400 font-normal">/ {viewProfile.report.summary.class_total}</span>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Subjects</div>
                                    <div className="text-2xl font-black text-[#001f3f]">{viewProfile.report.summary.subjects_offered}</div>
                                </div>
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
                                <button onClick={async () => { await api.post('/academics/report/save/', { student_id: viewProfile.id, ...reportInput }); alert('Saved!'); }} className="px-6 py-3 bg-[#001f3f] text-white rounded-xl font-bold shadow-lg hover:bg-[#001f3f]-light">Save Report Entry</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const LessonPlansView = ({ plans, onRefresh, user, allSubjects }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        if (editingPlan) data.id = editingPlan.id;

        try {
            await api.post('/academics/lesson-plans/save/', data);
            setShowModal(false);
            setEditingPlan(null);
            onRefresh();
        } catch (err) {
            alert("Error saving lesson plan");
        }
    };

    const viewHistory = async (id) => {
        const res = await api.get(`/academics/lesson-plans/${id}/history/`);
        setHistory(res.data);
        setShowHistory(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#001f3f] flex items-center gap-2">
                    <ClipboardList className="text-orange-500" /> Lesson Plans
                </h2>
                <button onClick={() => { setEditingPlan(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#001f3f] text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition">
                    <PlusCircle size={18} /> Create New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {plan.subject_name}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => viewHistory(plan.id)} className="p-2 text-gray-400 hover:text-blue-500"><History size={16} /></button>
                                <button onClick={() => { setEditingPlan(plan); setShowModal(true); }} className="p-2 text-gray-400 hover:text-orange-500"><Edit3 size={16} /></button>
                                <button onClick={async () => { if (confirm('Delete?')) { await api.delete(`/academics/lesson-plans/${plan.id}/delete/`); onRefresh(); } }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <h3 className="font-bold text-[#001f3f] text-lg mb-2">{plan.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{plan.objectives}</p>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold border-t pt-4">
                            <div className="flex items-center gap-1 uppercase tracking-wider"><Users size={12} /> {plan.class_grade}</div>
                            <div className="flex items-center gap-1 uppercase tracking-wider"><Clock size={12} /> {plan.date}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-2xl font-black text-[#001f3f]">{editingPlan ? 'Edit Lesson Plan' : 'Create Lesson Plan'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Subject</label>
                                    <select name="subject" required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition" defaultValue={editingPlan?.subject}>
                                        {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Class</label>
                                    <select name="class_grade" required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition" defaultValue={editingPlan?.class_grade}>
                                        {['JSS_1', 'JSS_2', 'JSS_3', 'SS_1', 'SS_2', 'SS_3'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</label>
                                <input name="title" required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl" placeholder="e.g. Introduction to Algebra" defaultValue={editingPlan?.title} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Objectives</label>
                                <textarea name="objectives" required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl" rows="3" defaultValue={editingPlan?.objectives} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Activities</label>
                                <textarea name="activities" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl" rows="3" defaultValue={editingPlan?.activities} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Date</label>
                                    <input type="date" name="date" required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl" defaultValue={editingPlan?.date} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Support File</label>
                                    <input type="file" name="support_file" className="w-full text-sm" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#001f3f] text-white rounded-2xl font-black text-lg shadow-xl hover:bg-orange-600 transition-all active:scale-95">Save Lesson Plan</button>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-end z-50">
                    <div className="bg-white h-full w-full max-w-lg shadow-2xl p-8 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-8 border-b pb-4">
                            <h2 className="text-2xl font-black text-[#001f3f]">Version History</h2>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={24} /></button>
                        </div>
                        <div className="space-y-6 overflow-y-auto max-h-[80vh]">
                            {history.map((h, i) => (
                                <div key={i} className="relative pl-8 border-l-2 border-orange-100 pb-6">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-4 border-white shadow-sm" />
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-orange-600">{new Date(h.history_date).toLocaleString()}</span>
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{h.history_type === '+' ? 'Created' : 'Updated'}</span>
                                        </div>
                                        <h4 className="font-bold text-[#001f3f] mb-1">{h.title}</h4>
                                        <p className="text-xs text-gray-400 line-clamp-2">{h.objectives}</p>
                                        <div className="mt-3 text-[10px] text-gray-400 uppercase font-black tracking-widest">Modified by {h.updated_by}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TimetableView = ({ timetable, onRefresh, user, allSubjects }) => {
    const [selectedClass, setSelectedClass] = useState('JSS_1');
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => {
        onRefresh(selectedClass);
    }, [selectedClass]);

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-[#001f3f]">Weekly Timetable</h2>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-2 bg-white border border-gray-200 rounded-xl font-bold text-[#001f3f] shadow-sm outline-none focus:ring-2 focus:ring-orange-500">
                        {['JSS_1', 'JSS_2', 'JSS_3', 'SS_1', 'SS_2', 'SS_3'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                    <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange/20 hover:bg-orange-700 transition">
                        <PlusCircle size={18} /> Add Entry
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="grid grid-cols-6 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
                    <div className="p-4 bg-gray-100/50" />
                    {days.map(day => (
                        <div key={day} className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</div>
                    ))}
                </div>
                {/* Simplified Time Grid */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                    <div key={period} className="grid grid-cols-6 divide-x divide-gray-100 border-b border-gray-100">
                        <div className="p-6 bg-gray-50/30 flex flex-col items-center justify-center">
                            <span className="text-xs font-black text-[#001f3f]">Period {period}</span>
                            <span className="text-[10px] text-gray-400">{8 + period}:00</span>
                        </div>
                        {days.map(day => {
                            const entry = timetable.find(e => e.day_of_week === day && e.start_time.startsWith(`${8 + period < 10 ? '0' + (8 + period) : 8 + period}`));
                            return (
                                <div key={day} className="p-2 min-h-[100px] flex flex-col gap-1 items-center justify-center group relative">
                                    {entry ? (
                                        <div className="bg-orange-50/80 p-3 rounded-2xl border border-orange-100 w-full h-full flex flex-col items-center justify-center text-center">
                                            <span className="text-xs font-black text-orange-700 leading-tight mb-1 uppercase tracking-tight">{entry.subject_name}</span>
                                            <span className="text-[10px] text-orange-500/80 font-bold">{entry.room_number || 'Room 1'}</span>
                                            {user?.role === 'SUPER_ADMIN' && (
                                                <button onClick={async () => { if (confirm('Del?')) { await api.delete(`/academics/timetable/${entry.id}/delete/`); onRefresh(selectedClass); } }} className="absolute inset-0 bg-red-500/90 text-white opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-all">
                                                    <Trash2 size={24} />
                                                </button>
                                            )}
                                        </div>
                                    ) : '-'}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-[#001f3f]">Add Period</h2>
                            <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={24} /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());
                            data.class_grade = selectedClass;
                            await api.post('/academics/timetable/save/', data);
                            setShowAdd(false);
                            onRefresh(selectedClass);
                        }} className="space-y-4">
                            <select name="subject" required className="w-full p-3 bg-gray-50 border rounded-xl font-bold">
                                {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select name="day_of_week" required className="w-full p-3 bg-gray-50 border rounded-xl font-bold">
                                {days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="start_time" type="time" required className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                                <input name="end_time" type="time" required className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                            </div>
                            <input name="room_number" placeholder="Room Number" className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                            <button type="submit" className="w-full py-4 bg-[#001f3f] text-white rounded-2xl font-black">Save Period</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminManagementView = ({ user, allSubjects, allocations, setAllocations, onRefresh }) => {
    const [subName, setSubName] = useState('');
    const [subCode, setSubCode] = useState('');

    const handleCreateSubject = async () => {
        if (!subName || !subCode) return;
        await api.post('/academics/subjects/save/', { name: subName, code: subCode });
        setSubName(''); setSubCode('');
        onRefresh();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Subject Management */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-[#001f3f] mb-6 flex items-center gap-2">
                    <BookOpen className="text-orange-500" /> Subject Catalog
                </h3>
                <div className="flex gap-2 mb-6">
                    <input className="flex-1 p-3 bg-gray-50 border rounded-xl" placeholder="Name" value={subName} onChange={e => setSubName(e.target.value)} />
                    <input className="w-24 p-3 bg-gray-50 border rounded-xl" placeholder="Code" value={subCode} onChange={e => setSubCode(e.target.value)} />
                    <button onClick={handleCreateSubject} className="p-3 bg-orange-600 text-white rounded-xl shadow-lg hover:bg-orange-700 transition"><PlusCircle /></button>
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {allSubjects.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                            <div>
                                <div className="font-bold text-[#001f3f]">{s.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{s.code}</div>
                            </div>
                            <button onClick={async () => { if (confirm('Del?')) { await api.delete(`/academics/subjects/${s.id}/delete/`); onRefresh(); } }} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 transition-opacity"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Assignments Summary */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-[#001f3f] mb-6 flex items-center gap-2">
                    <Users className="text-blue-500" /> Teaching Assignments
                </h3>
                <div className="max-h-[500px] overflow-y-auto space-y-3">
                    {allocations.slice(0, 50).map(a => (
                        <div key={a.id} className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 flex justify-between items-center">
                            <div>
                                <div className="text-sm font-black text-blue-900">{a.subject_name}</div>
                                <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{a.class_grade}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-[#001f3f]">{a.teacher_name}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StudentAttendanceView = ({ user, allocations, stats }) => {
    const [selectedClass, setSelectedClass] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Get classes assigned to this teacher
    const teacherClasses = stats.filter(stat => {
        if (user?.role !== 'TEACHER') return true;
        return allocations.some(a => a.class_grade === stat.code || a.class_grade === stat.label);
    });

    useEffect(() => {
        if (teacherClasses.length > 0 && !selectedClass) {
            setSelectedClass(teacherClasses[0].code);
        }
    }, [teacherClasses]);

    useEffect(() => {
        if (selectedClass) {
            fetchAttendance();
        }
    }, [selectedClass, date]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get('/academics/attendance/', {
                params: { class_grade: selectedClass, date: date }
            });
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, status } : s
        ));
    };

    const saveAttendance = async () => {
        setSaving(true);
        try {
            await api.post('/academics/attendance/mark/', {
                class_grade: selectedClass,
                date: date,
                attendance: students.map(s => ({
                    student_id: s.student_id,
                    status: s.status,
                    remarks: s.remarks || ''
                }))
            });
            alert('Attendance saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save attendance.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="p-2 border rounded-xl font-bold bg-gray-50 text-navy focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            {teacherClasses.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="p-2 border rounded-xl font-bold bg-gray-50 text-navy focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>
                <button
                    onClick={saveAttendance}
                    disabled={saving || students.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-[#001f3f] text-white rounded-xl font-black shadow-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                    {saving ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : <Save size={18} />}
                    Save Attendance
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin h-8 w-8 border-4 border-navy border-t-transparent rounded-full opacity-50"></div>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {students.map(s => (
                                <tr key={s.student_id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-navy">{s.student_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{s.admission_number}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(s.student_id, status)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${s.status === status
                                                        ? (status === 'PRESENT' ? 'bg-green-600 text-white' : status === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white')
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            placeholder="Optional note..."
                                            className="w-full p-2 bg-gray-50 border rounded-lg text-sm"
                                            value={s.remarks || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setStudents(prev => prev.map(item =>
                                                    item.student_id === s.student_id ? { ...item, remarks: val } : item
                                                ));
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const ExtracurricularView = ({ user, activities, roles, onRefresh }) => {
    const [showGrant, setShowGrant] = useState(false);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-navy flex items-center gap-2">
                    <Trophy className="text-orange-500" /> Extracurricular Activities
                </h2>
                {user?.role === 'SUPER_ADMIN' && (
                    <button onClick={() => setShowGrant(true)} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition">
                        <PlusCircle size={18} /> Manage Activities
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* My Roles */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                    <h3 className="text-lg font-black text-navy mb-6 flex items-center gap-2">
                        <UserCheck className="text-blue-500" /> My Assigned Roles
                    </h3>
                    <div className="space-y-4">
                        {roles.length > 0 ? roles.map(r => (
                            <div key={r.id} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-navy">{r.activity_name}</div>
                                    <div className="text-xs text-blue-600 font-bold uppercase tracking-widest">{r.role}</div>
                                </div>
                                <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    Since {new Date(r.assigned_date).toLocaleDateString()}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-gray-400 italic">No assigned extracurricular roles.</div>
                        )}
                    </div>
                </div>

                {/* All Activities */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                    <h3 className="text-lg font-black text-navy mb-6 flex items-center gap-2">
                        <ECIcon className="text-green-500" /> School Activities
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {activities.map(a => (
                            <div key={a.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-orange-200 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-navy text-lg">{a.name}</h4>
                                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-orange-600 uppercase tracking-widest border border-gray-100 shadow-sm">
                                        {a.category}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">{a.description}</p>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-bold">AJ</div>
                                        <span className="text-xs font-bold text-gray-600 underline">OnPoint Konceptz</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ongoing Activity</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Admin Modal for Activities */}
            {showGrant && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-navy">Manage Activity</h2>
                            <button onClick={() => setShowGrant(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={24} /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());
                            await api.post('/staff/extracurricular-activities/save/', data);
                            setShowGrant(false);
                            onRefresh();
                        }} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Activity Name</label>
                                <input name="name" required placeholder="e.g. Football Club" className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                                <select name="category" required className="w-full p-3 bg-gray-50 border rounded-xl font-bold">
                                    <option value="SPORTS">Sports</option>
                                    <option value="ARTS">Arts & Culture</option>
                                    <option value="ACADEMIC">Academic Club</option>
                                    <option value="COMMUNITY">Community Service</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                                <textarea name="description" rows="3" className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="Describe the activity..." />
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#001f3f] text-white rounded-2xl font-black shadow-xl">Create Activity</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Academics;
