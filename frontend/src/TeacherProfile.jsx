import React, { useState, useEffect } from 'react';
import api from './api';
import {
    User, Mail, Phone, MapPin, Camera, Save,
    BookOpen, CheckCircle, Calendar, Briefcase,
    Plus, Edit, FileText, Layout, Users, ChevronRight,
    Clock, Bell, AlertTriangle, CheckSquare
} from 'lucide-react';
import Academics from './Academics';

const TeacherProfile = ({ user, onAction }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('DETAILS'); // DETAILS, LESSON_PLANS, GRADING, ATTENDANCE
    const [editingBasic, setEditingBasic] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile/');
            setProfileData(res.data);
            setFormData({
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                email: res.data.email || '',
                phone_number: res.data.phone_number || '',
            });
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch profile", error);
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put('/profile/', formData);
            setEditingBasic(false);
            fetchProfile();
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-navy border-t-transparent rounded-full opacity-50"></div>
        </div>
    );

    const assignments = profileData?.assignments || {};

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-navy to-navy-light rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shadow-inner">
                            {profileData?.profile_picture ? (
                                <img src={profileData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-white/40" />
                            )}
                        </div>
                        <button className="absolute -bottom-2 -right-2 bg-orange p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                            <Camera size={16} className="text-white" />
                        </button>
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-black mb-2">{profileData?.first_name} {profileData?.last_name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/70 text-sm">
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                <Briefcase size={14} /> {profileData?.role_display}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                <Mail size={14} /> {profileData?.email}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                <Phone size={14} /> {profileData?.phone_number || 'No Phone'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Self-Service Actions */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                                <CheckSquare size={24} className="text-orange" /> My Actions (Self-Service)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ActionCard
                                icon={FileText}
                                title="Lesson Plans"
                                desc="Create, edit and manage your teaching curriculum"
                                color="orange"
                                onClick={() => setActiveSection('LESSON_PLANS')}
                                active={activeSection === 'LESSON_PLANS'}
                            />
                            <ActionCard
                                icon={Layout}
                                title="Student Grading"
                                desc="Update scores and record exam grades"
                                color="blue"
                                onClick={() => setActiveSection('GRADING')}
                                active={activeSection === 'GRADING'}
                            />
                            <ActionCard
                                icon={CheckCircle}
                                title="Mark Attendance"
                                desc="Record daily student attendance for your classes"
                                color="green"
                                onClick={() => setActiveSection('ATTENDANCE')}
                                active={activeSection === 'ATTENDANCE'}
                            />
                            <ActionCard
                                icon={User}
                                title="Profile Settings"
                                desc="Update your personal details and preferences"
                                color="purple"
                                onClick={() => setActiveSection('DETAILS')}
                                active={activeSection === 'DETAILS'}
                            />
                        </div>

                        {/* Sub-view Area */}
                        <div className="mt-8 pt-8 border-t border-gray-50">
                            {activeSection === 'DETAILS' && (
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">First Name</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition"
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Last Name</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Email Address</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Phone Number</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition"
                                                value={formData.phone_number}
                                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="bg-orange text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange/30 transition-shadow flex items-center gap-2">
                                        <Save size={18} /> Update Profile
                                    </button>
                                </form>
                            )}
                            {activeSection === 'LESSON_PLANS' && (
                                <div className="p-8 bg-gray-50 rounded-2xl text-center">
                                    <FileText size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">Redirecting to Lesson Plans management...</p>
                                    <button onClick={() => onAction('Academics', { tab: 'LESSON_PLANS' })} className="text-orange font-bold flex items-center gap-1 mx-auto">
                                        Go to Academics Module <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                            {activeSection === 'GRADING' && (
                                <div className="p-8 bg-gray-50 rounded-2xl text-center">
                                    <Layout size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">Redirecting to Grading & Scores...</p>
                                    <button onClick={() => onAction('Academics', { tab: 'GRADING' })} className="text-blue-500 font-bold flex items-center gap-1 mx-auto">
                                        Go to Academics Module <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                            {activeSection === 'ATTENDANCE' && (
                                <div className="p-8 bg-gray-50 rounded-2xl text-center">
                                    <CheckCircle size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">Redirecting to Attendance Marking...</p>
                                    <button onClick={() => onAction('Academics', { tab: 'ATTENDANCE' })} className="text-green-500 font-bold flex items-center gap-1 mx-auto">
                                        Go to Attendance Management <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Assigned Responsibilities */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-navy mb-6 flex items-center gap-2">
                            <AlertTriangle size={24} className="text-blue-500" /> Assigned to Me
                        </h2>

                        <div className="space-y-6">
                            {/* Workload Summary */}
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Workload Summary</h3>
                                <div className="flex justify-between items-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-navy">{assignments.workload_summary?.total_subjects || 0}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Subjects</div>
                                    </div>
                                    <div className="w-px h-8 bg-blue-100"></div>
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-navy">{assignments.workload_summary?.total_classes || 0}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Classes</div>
                                    </div>
                                    <div className="w-px h-8 bg-blue-100"></div>
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-navy">{assignments.extracurricular?.length || 0}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">EC Roles</div>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Classes */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Assigned Classes</h3>
                                <div className="space-y-2">
                                    {assignments.subjects?.map((sub, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <span className="font-bold text-sm text-navy">{sub.name}</span>
                                            <span className="text-xs font-bold text-orange bg-orange/10 px-2 py-1 rounded-lg">{sub.class}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Timetable Preview */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Timetable Preview</h3>
                                <div className="space-y-2">
                                    {assignments.timetable?.slice(0, 3).map((t, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0">
                                            <div className="bg-navy/5 text-navy p-2 rounded-lg">
                                                <Clock size={14} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-navy">{t.subject} • {t.class}</div>
                                                <div className="text-[10px] text-gray-400">{t.day} at {t.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {assignments.timetable?.length > 3 && (
                                        <button className="text-[10px] font-bold text-navy-light uppercase hover:underline">View Full Timetable</button>
                                    )}
                                </div>
                            </div>

                            {/* Extracurricular Roles */}
                            {assignments.extracurricular?.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">EC Activities</h3>
                                    <div className="space-y-2">
                                        {assignments.extracurricular.map((r, i) => (
                                            <div key={i} className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                                <div className="text-sm font-bold text-purple-700">{r.activity}</div>
                                                <div className="text-xs text-purple-600/70">{r.role}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upcoming Events */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Related Events</h3>
                                <div className="space-y-3">
                                    {assignments.upcoming_events?.map((e, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange/10 text-orange rounded-xl flex flex-col items-center justify-center">
                                                <span className="text-[8px] font-bold uppercase">{e.date.split('-')[1]}</span>
                                                <span className="text-sm font-black">{e.date.split('-')[2]}</span>
                                            </div>
                                            <div className="text-xs font-bold text-navy truncate">{e.title}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActionCard = ({ icon: Icon, title, desc, color, onClick, active }) => {
    const colors = {
        orange: 'bg-orange/5 text-orange border-orange/10 hover:bg-orange hover:text-white',
        blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white',
        green: 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white',
        purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-600 hover:text-white',
    };

    const activeColors = {
        orange: 'bg-orange text-white border-orange',
        blue: 'bg-blue-600 text-white border-blue-600',
        green: 'bg-green-600 text-white border-green-600',
        purple: 'bg-purple-600 text-white border-purple-600',
    };

    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-2xl border transition-all text-left flex items-start gap-4 h-full ${active ? activeColors[color] : colors[color]}`}
        >
            <div className={`p-3 rounded-xl ${active ? 'bg-white/20' : 'bg-current opacity-10'}`}></div>
            <div className="relative z-10 -ml-11 flex items-center gap-4">
                <Icon size={24} />
                <div>
                    <div className="font-bold text-sm mb-1">{title}</div>
                    <div className={`text-[10px] leading-relaxed ${active ? 'text-white/80' : 'text-gray-400'}`}>{desc}</div>
                </div>
            </div>
        </button>
    );
};

export default TeacherProfile;
