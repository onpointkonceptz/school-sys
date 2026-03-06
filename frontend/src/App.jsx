import { useState, useEffect } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import { Students, Inventory, Accounts, Academics, UserManagement } from './Pages'
import { LayoutDashboard, Users, Package, FileText, LogOut, BookOpen, Settings as SettingsIcon, Camera, Key, User as UserIcon, X, CheckCircle, UserCog, ChevronDown } from 'lucide-react'
import axios from 'axios';

function App() {
  // 1. ALL HOOKS MUST BE AT THE TOP
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [user, setUser] = useState(null);
  const [navData, setNavData] = useState({}); // Moved up here to fix the crash
  const [showProfile, setShowProfile] = useState(false);

  // 2. USEEFFECTS
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // 3. HANDLERS
  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab('Dashboard');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      // Since you are working with Antigravity/Django, ensure your CSRF tokens are handled
      await axios.post('/api/logout/');
    } catch (e) {
      console.error("Logout failed", e);
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleNavigate = (tab, data = {}) => {
    setActiveTab(tab);
    setNavData(data);
  };

  // 4. CONDITIONAL RENDERING (Must come AFTER all hooks)
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': return <Dashboard onNavigate={handleNavigate} user={user} />;
      case 'Students': return <Students onNavigate={handleNavigate} navData={navData} user={user} />;
      case 'Inventory': return <Inventory />;
      case 'Accounts': return <Accounts onNavigate={handleNavigate} />;
      case 'Academics': return <Academics />;
      case 'Staff': return <UserManagement user={user} />;
      default: return <Dashboard onNavigate={handleNavigate} user={user} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#001f3f] text-white flex flex-col fixed h-full z-10 shadow-2xl">
        <div className="p-6 flex flex-col items-center text-center">
          <img
            src="https://kadwelinternationalschools.com/assets/img/logo.png"
            alt="KADWEL Logo"
            className="w-20 h-20 mb-3 object-contain bg-white rounded-full p-1"
          />
          <h2 className="text-lg font-bold text-orange-400 tracking-tight leading-tight">
            KADWEL <br /><span className="text-white text-sm font-normal">International Schools</span>
          </h2>
          <div className="mt-4 px-3 py-1 bg-white/10 rounded-full text-xs text-orange-400 font-mono uppercase tracking-widest border border-white/20">
            {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ACCOUNT_OFFICER' ? 'Bursar' : user.role || 'User'} Portal
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <NavItem icon={Users} label="Students" active={activeTab === 'Students'} onClick={() => setActiveTab('Students')} />
          {/* Hide Inventory/Accounts from Teachers */}
          {(!['TEACHER'].includes(user.role)) && (
            <>
              <NavItem icon={Package} label="Inventory" active={activeTab === 'Inventory'} onClick={() => setActiveTab('Inventory')} />
              <NavItem icon={FileText} label="Accounts" active={activeTab === 'Accounts'} onClick={() => setActiveTab('Accounts')} />
            </>
          )}

          {(['TEACHER', 'PRINCIPAL', 'CHAIRMAN', 'SUPER_ADMIN'].includes(user.role) || user.is_superuser) && (
            <NavItem icon={BookOpen} label="Academics" active={activeTab === 'Academics'} onClick={() => setActiveTab('Academics')} />
          )}

          {/* Admin Tools - Manage Users */}
          {(['PRINCIPAL', 'SUPER_ADMIN'].includes(user.role) || user.is_superuser) && (
            <NavItem icon={UserCog} label="System Users" active={activeTab === 'Staff'} onClick={() => setActiveTab('Staff')} />
          )}
        </nav>

        <div className="p-8 border-t border-[#001f3f]/10">
          {/* Logout button was moved to the header dropdown */}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 transition-all duration-300 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white h-[72px] shadow-sm border-b border-gray-200 flex items-center justify-end px-8 sticky top-0 z-20">
          <div className="relative group cursor-pointer inline-block h-full flex items-center">
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-[#001f3f] leading-tight">
                  {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                </p>
                <p className="text-xs text-gray-500 font-medium capitalize mt-0.5">
                  {user.role.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              {user.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-orange-400/30" />
              ) : (
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {(user.first_name?.[0] || user.username?.[0] || 'U')}
                </div>
              )}
              <ChevronDown size={16} className="text-gray-400" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-[60px] w-56 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:mt-1 transition-all transform origin-top-right z-50">
              <div className="p-2">
                <button onClick={() => setShowProfile(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#001f3f] rounded-lg transition-colors">
                  <UserIcon size={18} /> Profile Settings
                </button>
                <button onClick={() => { setShowProfile(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#001f3f] rounded-lg transition-colors">
                  <Key size={18} /> Change Password
                </button>
                <hr className="my-2 border-gray-100" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 bg-slate-100">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {showProfile && (
        <ProfileSettings
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={(updatedUser) => {
            handleLogin({ ...user, ...updatedUser });
          }}
        />
      )}
    </div>
  )
}

function NavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  )
}

function ProfileSettings({ user, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('DETAILS'); // DETAILS, PASSWORD
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Profile Form States
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(user?.profile_picture || null);

  // Password Form States
  const [passData, setPassData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Fetch latest profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/profile/');
        // Sync local form state with fresh DB pull
        setProfileData({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          phone_number: res.data.phone_number || ''
        });
        setPreviewPic(res.data.profile_picture || null);

        // Also update parent state if it differs
        if (res.data.profile_picture !== user.profile_picture || res.data.first_name !== user.first_name) {
          onUpdate(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    };
    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      setPreviewPic(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => formData.append(key, profileData[key]));
      if (profilePic) {
        formData.append('profile_picture', profilePic);
      }

      const res = await axios.put('/api/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      // Notify parent to update cached user details
      onUpdate({ ...profileData, profile_picture: res.data.profile_picture });

    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Update failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.confirm_password) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/api/password/', {
        old_password: passData.old_password,
        new_password: passData.new_password
      });
      setMessage({ text: 'Password changed successfully!', type: 'success' });
      setPassData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Password change failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#001f3f]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 md:hidden">
            <h2 className="font-bold text-[#001f3f]">Settings</h2>
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setActiveTab('DETAILS'); setMessage({}); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'DETAILS' ? 'bg-[#001f3f] text-white shadow-lg shadow-navy/20' : 'text-gray-500 hover:bg-white hover:shadow-sm'}`}
            >
              <UserIcon size={18} /> Profile Details
            </button>
            <button
              onClick={() => { setActiveTab('PASSWORD'); setMessage({}); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'PASSWORD' ? 'bg-[#001f3f] text-white shadow-lg shadow-navy/20' : 'text-gray-500 hover:bg-white hover:shadow-sm'}`}
            >
              <Key size={18} /> Change Password
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 hidden md:block transition-colors">
            <X size={24} />
          </button>

          <h2 className="text-2xl font-black text-[#001f3f] mb-6">
            {activeTab === 'DETAILS' ? 'Profile Details' : 'Security Settings'}
          </h2>

          {message.text && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
              {message.text}
            </div>
          )}

          {activeTab === 'DETAILS' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer">
                  {previewPic ? (
                    <img src={previewPic} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl font-black text-gray-300 border-4 border-white shadow-sm">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#001f3f]">Profile Picture</h3>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#001f3f] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#001f3f]-light transition-all shadow-lg shadow-navy/20 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'PASSWORD' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                  value={passData.old_password}
                  onChange={(e) => setPassData({ ...passData, old_password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                  value={passData.new_password}
                  onChange={(e) => setPassData({ ...passData, new_password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                  value={passData.confirm_password}
                  onChange={(e) => setPassData({ ...passData, confirm_password: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default App;