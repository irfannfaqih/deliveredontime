import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import appLogoSvg from '../assets/logo.svg';
import searchIcon from '../assets/searchIcon.svg';
import settingsIcon from '../assets/settingIcon.svg';
import usersIcon from '../assets/users.svg';
import { useAuth } from "../hooks/useAPI";
import { authAPI } from "../services/api";
import { normalizeUrl } from '../utils/url';

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-3.svg", href: "/dashboard", isActive: false },
  { id: "delivered", label: "Delivered", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-4.svg", href: "/delivered", isActive: false },
  { id: "bbm", label: "BBM", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-5.svg", href: "/bbm", isActive: false },
  { id: "report", label: "Report", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7.svg", href: "/report", isActive: false },
  { id: "customer", label: "Customer", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-2.svg", href: "/customer", isActive: false },
];

export const Management = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard');
  }, [user, navigate]);

  const navItems = useMemo(() => {
    const base = navigationItems.map(i => ({ ...i, isActive: i.id === 'management' ? true : i.isActive }));
    return user?.role === 'admin'
      ? [...base, { id: 'management', label: 'Users', icon: usersIcon, href: '/management', isActive: true }]
      : base;
  }, [user]);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'messenger', phone: '', is_active: 1, password: '' });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const matchesRole = roleFilter === 'all' ? true : String(u.role) === roleFilter;
      const matchesQuery = !q ? true : [u.name, u.email].some(v => String(v || '').toLowerCase().includes(q));
      return matchesRole && matchesQuery;
    });
  }, [users, searchQuery, roleFilter]);

  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'admin') return;
    setLoadingUsers(true);
    try {
      const resp = await authAPI.listUsers();
      const raw = resp?.data ?? resp;
      const arr = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.users)
            ? raw.users
            : Array.isArray(raw?.user_list)
              ? raw.user_list
              : [];
      setUsers(arr);
    } catch {
      setSuccessMessage('Failed to load users');
      setTimeout(() => setSuccessMessage(''), 2000);
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const onFocus = () => { fetchUsers(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchUsers(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchUsers]);

  

  const handleUpdateUser = async (id, payload) => {
    try {
      const resp = await authAPI.updateUser(id, payload);
      setUsers(prev => prev.map(u => (u.id === id ? (resp?.data || u) : u)));
      setSuccessMessage('User updated');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch {
      setSuccessMessage('Failed to update user');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      name: String(u.name || ''),
      email: String(u.email || ''),
      role: String(u.role || 'messenger'),
      phone: String(u.phone || ''),
      is_active: typeof u.is_active === 'number' ? u.is_active : (u.is_active ? 1 : 0),
      password: ''
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    await handleUpdateUser(editingUser.id, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      role: editForm.role,
      is_active: editForm.is_active
    });
    if (String(editForm.password || '').trim().length) {
      try {
        await authAPI.resetUserPassword(editingUser.id, String(editForm.password))
        setSuccessMessage('Password diubah')
        setTimeout(() => setSuccessMessage(''), 2000)
      } catch {
        setSuccessMessage('Gagal ubah password')
        setTimeout(() => setSuccessMessage(''), 2000)
      }
    }
    setEditOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (id) => {
    if (!id) return;
    if (String(user?.id) === String(id)) {
      setSuccessMessage('Cannot delete own account');
      setTimeout(() => setSuccessMessage(''), 2000);
      return;
    }
    setDeletingUserId(id);
    try {
      await authAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccessMessage('User deleted');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch {
      setSuccessMessage('Failed to delete user');
      setTimeout(() => setSuccessMessage(''), 2000);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="bg-[#f5f5f5] w-full min-h-screen flex">
      {/* Header mobile: logo + tombol menu, fixed di atas, khusus perangkat mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 flex items-center justify-between shadow-md z-50">
        <img className="h-8 opacity-100" alt="Logo" src={appLogoSvg} />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Overlay menu mobile: navigasi utama, settings, logout; tutup saat klik di luar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <img className="w-24 h-auto mb-8 opacity-100" alt="Logo" src={appLogoSvg} />
              <div className="flex flex-col gap-2 mb-8">
                {navItems.map((item) => {
                  const ItemWrapper = item.href !== "#" ? Link : "button";
                  const wrapperProps = item.href !== "#" ? { to: item.href } : {};
                  return (
                    <ItemWrapper key={item.id} {...wrapperProps} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${item.isActive ? 'bg-[#FFF1E6]' : 'hover:bg-[#FFF1E6]'}`}>
                      <img className="w-6 h-6" alt={item.label} src={item.icon} style={item.isActive ? { filter: 'brightness(0) saturate(100%) invert(66%) sepia(45%) saturate(1641%) hue-rotate(332deg) brightness(99%) contrast(97%)' } : { filter: 'brightness(0) saturate(100%) invert(84%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(92%) contrast(87%)' }} />
                      <span className={`font-[Lato] font-bold text-sm ${item.isActive ? 'text-[#faa463]' : 'text-[#c7c7c7]'}`}>{item.label}</span>
                    </ItemWrapper>
                  );
                })}
              </div>
              <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#FFF1E6] transition-all">
                <img className="w-4 h-4" alt="Settings" src={settingsIcon} />
                <span className="font-[Lato] font-bold text-[#c7c7c7] text-sm">Settings</span>
              </Link>
              <button onClick={async () => { setIsMobileMenuOpen(false); await logout(); }} className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#FFF1E6] transition-all">
                <svg className="w-4 h-4 text-[#c7c7c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span className="font-[Lato] font-bold text-[#c7c7c7] text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar desktop: navigasi utama dengan layout sticky, hanya tampil di desktop */}
      <aside className="hidden lg:flex w-[200px] flex-shrink-0 bg-white shadow-[2px_24px_53px_#0000000d,8px_95px_96px_#0000000a,19px_214px_129px_#00000008,33px_381px_153px_#00000003,52px_596px_167px_transparent] px-[15px] py-[30px] flex-col justify-between h-screen sticky top-0">
        <div>
          <img className="w-[100px] h-[41px] mb-[45px] opacity-100" alt="Logo" src={appLogoSvg} />
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const ItemWrapper = item.href !== "#" ? Link : "button";
              const wrapperProps = item.href !== "#" ? { to: item.href } : {};
              return (
                <ItemWrapper key={item.id} {...wrapperProps} className={`flex items-center gap-[14px] justify-start h-auto px-2.5 py-1.5 rounded-lg transition-all duration-300 ease-in-out ${item.isActive ? 'bg-[#FFF1E6]' : 'hover:bg-[#FFF1E6] hover:translate-x-1'}`}>
                  <img className="w-[24px] h-[24px] flex-shrink-0" alt={item.label} src={item.icon} style={item.isActive ? { filter: 'brightness(0) saturate(100%) invert(66%) sepia(45%) saturate(1641%) hue-rotate(332deg) brightness(99%) contrast(97%)' } : { filter: 'brightness(0) saturate(100%) invert(84%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(92%) contrast(87%)' }} />
                  <span className={`font-[Lato] font-bold text-[13px] tracking-[0] leading-normal transition-colors duration-300 ${item.isActive ? 'text-[#faa463]' : 'text-[#c7c7c7]'}`}>{item.label}</span>
                </ItemWrapper>
              );
            })}
          </div>
        </div>
        <Link to="/settings" className="flex items-center gap-[14px] justify-start h-auto px-2.5 py-1.5 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#FFF1E6] hover:translate-x-1">
          <img className="w-[16px] h-[16px] flex-shrink-0" alt="Settings" src={settingsIcon} />
          <span className="font-[Lato] font-bold text-[#c7c7c7] text-[13px] tracking-[0] leading-normal transition-colors duration-300">Settings</span>
        </Link>
      </aside>

      <main className="flex-1 px-4 sm:px-6 lg:px-[30px] py-4 lg:py-[24px] overflow-auto pt-20 lg:pt-[24px]">
        <div className="w-full max-w-[1000px] mx-auto translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 relative">
            <div>
              <h1 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-xl sm:text-[23.8px] text-left">Users Management</h1>
            </div>
            <div className="hidden sm:block relative">
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[12.8px]">{user?.name || 'User'}</span>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {user?.profile_image && !avatarError ? (
                    <img src={normalizeUrl(user?.profile_image)} alt={user?.name || 'User'} className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                  ) : (
                    <div className="w-full h-full bg-[#e0e0e0] flex items-center justify-center text-[#404040] text-[11px] [font-family:'Suprema-SemiBold',Helvetica]">
                      {(user?.name || 'U').slice(0,1)}
                    </div>
                  )}
                </div>
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-[10px] shadow-[0px_4px_12px_rgba(0,0,0,0.15)] py-2 z-50">
                  <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF1E6] transition-colors" onClick={() => setIsProfileMenuOpen(false)}>
                    <img className="w-4 h-4" alt="Settings" src={settingsIcon} />
                    <span className="[font-family:'Suprema-Regular',Helvetica] text-[#404040] text-[12.8px]">Settings</span>
                  </Link>
                  <button onClick={() => { setIsProfileMenuOpen(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF1E6] transition-colors">
                    <svg className="w-4 h-4 text-[#c7c7c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="[font-family:'Suprema-Regular',Helvetica] text-[#404040] text-[12.8px]">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-[#FFF9F3] border border-[#fbaf77] rounded-[12px] text-[#fbaf77] text-sm">{successMessage}</div>
          )}

          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4 sm:mb-7 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <Link to="/management/input" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-[10.2px] px-3.5 py-2.5 rounded-[12.45px] h-auto transition-colors">New</button>
            </Link>
          </div>

            <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6 mt-6 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:300ms]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-base sm:text-[18px]">Users List</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or email"
                  className="w-full pl-9 pr-3 sm:pr-4 py-2.5 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none placeholder:text-[#9e9e9e]"
                />
                <img src={searchIcon} alt="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-70" />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">admin</option>
                <option value="messenger">messenger</option>
              </select>
              <div className="hidden sm:block" />
            </div>
            <div className="block md:hidden">
              {loadingUsers ? (
                <div className="py-3 text-center text-[#9e9e9e] [font-family:'Inter',Helvetica] text-xs">Loading...</div>
              ) : filteredUsers.length ? (
                <div className="flex flex-col gap-3">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="group border border-[#e5e5e5] rounded-[12px] p-3 bg-white cursor-pointer transition-all duration-200 hover:border-[#faa463] hover:shadow-md focus-within:border-[#faa463] focus-within:shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <div className="[font-family:'Inter',Helvetica] text-xs text-[#404040] break-words">{u.name}</div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-[10px] border text-[10px] [font-family:'Inter',Helvetica] ${String(u.role)==='admin' ? 'border-[#e0e0e0] bg-[#fff3e0] text-[#fb8c00]' : 'border-[#e0e0e0] bg-[#e3f2fd] text-[#1976d2]'}`}>{u.role}</span>
                      </div>
                      <div className="mt-1 [font-family:'Inter',Helvetica] text-[10px] text-[#6b6b6b] break-words">{u.email}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <button onClick={() => handleUpdateUser(u.id, { is_active: u.is_active ? 0 : 1 })} className={`inline-flex items-center gap-2 px-2 py-1 rounded-[10px] border text-[10px] ${u.is_active ? 'border-[#e0e0e0] bg-[#e8f5e9] text-[#2e7d32]' : 'border-[#e0e0e0] bg-[#f5f5f5] text-[#616161]'}`}>
                          <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(u)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#e0e0e0] rounded-[10px] text-[#404040] text-[10px] [font-family:'Quicksand',Helvetica]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4h2M4 20h16M4 8h16M4 12h16M4 16h16" /></svg>
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} disabled={deletingUserId === u.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#e0e0e0] rounded-[10px] ${deletingUserId === u.id ? 'text-[#9e9e9e] cursor-not-allowed' : 'text-[#e53935]'} text-[10px] [font-family:'Quicksand',Helvetica]`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4" /></svg>
                            <span>{deletingUserId === u.id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-[#9e9e9e] [font-family:'Inter',Helvetica] text-xs">No data</div>
              )}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-[#aeaeae] [font-family:'Suprema-Regular'] text-xs">
                    <th className="py-2 pr-4 text-left">Name</th>
                    <th className="py-2 pr-4 text-left">Email</th>
                    <th className="py-2 pr-4 text-left">Role</th>
                    <th className="py-2 pr-4 text-left">Active</th>
                    <th className="py-2 pr-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr><td className="py-3" colSpan={5}>Loading...</td></tr>
                  ) : filteredUsers.length ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t border-[#f0f0f0]">
                        <td className="py-2 pr-4 [font-family:'Inter',Helvetica] text-xs sm:text-[12.8px] text-[#404040]">{u.name}</td>
                        <td className="py-2 pr-4 [font-family:'Inter',Helvetica] text-xs sm:text-[12.8px] text-[#404040]">{u.email}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-[10px] border text-xs [font-family:'Inter',Helvetica] ${String(u.role)==='admin' ? 'border-[#e0e0e0] bg-[#fff3e0] text-[#fb8c00]' : 'border-[#e0e0e0] bg-[#e3f2fd] text-[#1976d2]'}`}>{u.role}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <button onClick={() => handleUpdateUser(u.id, { is_active: u.is_active ? 0 : 1 })} className={`inline-flex items-center gap-2 px-2 py-1 rounded-[10px] border text-xs ${u.is_active ? 'border-[#e0e0e0] bg-[#e8f5e9] text-[#2e7d32]' : 'border-[#e0e0e0] bg-[#f5f5f5] text-[#616161]'}`}>
                          <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button onClick={() => openEdit(u)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#e0e0e0] rounded-[10px] text-[#404040] text-xs [font-family:'Quicksand',Helvetica]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4h2M4 20h16M4 8h16M4 12h16M4 16h16" /></svg>
                              <span>Edit</span>
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} disabled={deletingUserId === u.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#e0e0e0] rounded-[10px] ${deletingUserId === u.id ? 'text-[#9e9e9e] cursor-not-allowed' : 'text-[#e53935]'} text-xs [font-family:'Quicksand',Helvetica]`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4" /></svg>
                              <span>{deletingUserId === u.id ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="py-3 text-center text-[#9e9e9e] [font-family:'Inter',Helvetica] text-xs" colSpan={5}>No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4">
            <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[600px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[18px]">Edit User</h2>
                <button onClick={() => { setEditOpen(false); setEditingUser(null); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Nama</label>
                  <input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-3 bg-white rounded-[10px] border border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Email</label>
                  <input value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-3 bg-white rounded-[10px] border border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Password Baru</label>
                  <div className="relative w-full">
                    <input type={showEditPassword ? 'text' : 'password'} autoComplete="new-password" value={editForm.password} onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Kosongkan jika tidak diubah" className="w-full pl-3 pr-10 py-3 bg-white rounded-[10px] border border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" />
                    <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#9e9e9e] hover:text-[#616161]">
                      {showEditPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a10.05 10.05 0 013.093-4.412M6.223 6.223A10.05 10.05 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.05 10.05 0 01-3.093 4.412M15 12a3 3 0 00-3-3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Role</label>
                  <div className="relative">
                    <select value={editForm.role} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))} className="w-full pl-3 pr-10 py-3 bg-white rounded-[10px] border border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs appearance-none">
                      <option value="admin">admin</option>
                      <option value="messenger">messenger</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-3 bg-white rounded-[10px] border border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" />
                </div>
                <div className="flex items-center gap-3 sm:col-span-2 flex-wrap">
                  <span className="[font-family:'Inter',Helvetica] font-medium text-black text-xs w-[60px]">Status</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditForm(prev => ({ ...prev, is_active: 1 }))} className={`px-3 py-1 rounded-[10px] border text-xs ${editForm.is_active ? 'border-[#e0e0e0] bg-[#e8f5e9] text-[#2e7d32]' : 'border-[#e0e0e0] bg-white text-[#404040]'}`}>Aktif</button>
                    <button onClick={() => setEditForm(prev => ({ ...prev, is_active: 0 }))} className={`px-3 py-1 rounded-[10px] border text-xs ${!editForm.is_active ? 'border-[#e0e0e0] bg-[#f5f5f5] text-[#616161]' : 'border-[#e0e0e0] bg-white text-[#404040]'}`}>Nonaktif</button>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#e5e5e5] pt-4 mt-4 flex items-center justify-end gap-3">
                <button onClick={() => { setEditOpen(false); setEditingUser(null); }} className="bg-white hover:bg-gray-50 text-[#404040] border-[0.85px] border-[#cccccccc] [font-family:'Quicksand',Helvetica] font-bold text-xs px-6 py-2.5 rounded-[12.45px]">Batal</button>
                <button onClick={saveEdit} className="bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs px-6 py-2.5 rounded-[12.45px]">Simpan</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-1rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; animation-delay: var(--animation-delay, 0ms); }
      `}</style>
    </div>
  );
};

export default Management;
