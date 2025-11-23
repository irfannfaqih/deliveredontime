import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import settingsIcon from '../assets/settingIcon.svg';
import usersIcon from '../assets/users.svg';
import { useAuth } from "../hooks/useAPI";
import { authAPI } from "../services/api";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-3.svg", href: "/dashboard", isActive: false },
  { id: "delivered", label: "Delivered", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-4.svg", href: "/delivered", isActive: false },
  { id: "bbm", label: "BBM", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-5.svg", href: "/bbm", isActive: false },
  { id: "report", label: "Report", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7.svg", href: "/report", isActive: false },
  { id: "customer", label: "Customer", icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-2.svg", href: "/customer", isActive: false },
];

const InputUser = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "messenger", phone: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user && user.role !== 'admin') navigate('/dashboard');

  const navItems = (user?.role === 'admin')
    ? [...navigationItems, { id: 'management', label: 'Users', icon: usersIcon, href: '/management', isActive: true }]
    : navigationItems;

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!String(formData.name).trim()) next.name = 'Wajib diisi';
    if (!String(formData.email).trim()) next.email = 'Wajib diisi';
    if (!String(formData.password).trim()) next.password = 'Wajib diisi';
    return next;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).filter(k => nextErrors[k]).length) return;
    try {
      const resp = await authAPI.createUser(formData);
      if (resp?.data?.user || resp?.success) navigate('/management');
    } catch { void 0 }
  };

  return (
    <div className="bg-[#f5f5f5] w-full min-h-screen flex">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 flex items-center justify-between shadow-md z-50">
        <img className="h-8" alt="Logo" src="https://c.animaapp.com/mgrgm0itqrnJXn/img/chatgpt-image-28-sep-2025--18-41-25-1.png" />
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

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <img className="w-24 h-auto mb-8" alt="Logo" src="https://c.animaapp.com/mgrgm0itqrnJXn/img/chatgpt-image-28-sep-2025--18-41-25-1.png" />
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

      <aside className="hidden lg:flex w-[200px] flex-shrink-0 bg-white shadow-[2px_24px_53px_#0000000d,8px_95px_96px_#0000000a,19px_214px_129px_#00000008,33px_381px_153px_#00000003,52px_596px_167px_transparent] px-[15px] py-[30px] flex-col justify-between h-screen sticky top-0">
        <div>
          <img className="w-[100px] h-[41px] mb-[45px]" alt="Logo" src="https://c.animaapp.com/mgrgm0itqrnJXn/img/chatgpt-image-28-sep-2025--18-41-25-1.png" />
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
        <div className="w-full max-w-4xl mx-auto translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-base sm:text-[18px]">Create User</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="flex flex-col gap-2">
                <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Nama</label>
                <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Nama lengkap" className="w-full px-3 sm:px-[13.68px] py-3 sm:py-[17.1px] bg-white rounded-[10.26px] border-[0.85px] border-[#cccccc] text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none" />
                {errors.name && (<span className="text-red-600 text-[10px] mt-0.5">{errors.name}</span>)}
              </div>
              <div className="flex flex-col gap-2">
                <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Email</label>
                <input type="email" autoComplete="off" name="new-email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="email@domain.com" className="w-full px-3 sm:px-[13.68px] py-3 sm:py-[17.1px] bg-white rounded-[10.26px] border-[0.85px] border-[#cccccc] text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none" />
                {errors.email && (<span className="text-red-600 text-[10px] mt-0.5">{errors.email}</span>)}
              </div>
              <div className="flex flex-col gap-2">
                <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Password</label>
                <div className="relative w-full">
                  <input type={showPass ? 'text' : 'password'} autoComplete="new-password" name="new-password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Minimal 8 karakter" className="w-full pl-3 pr-10 sm:pr-12 py-3 sm:py-[17.1px] bg-white rounded-[10.26px] border-[0.85px] border-[#cccccc] text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#9e9e9e] hover:text-[#616161]">
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a10.05 10.05 0 013.093-4.412M6.223 6.223A10.05 10.05 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.05 10.05 0 01-3.093 4.412M15 12a3 3 0 00-3-3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
                {errors.password && (<span className="text-red-600 text-[10px] mt-0.5">{errors.password}</span>)}
              </div>
              <div className="flex flex-col gap-2">
                <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Role</label>
                <div className="relative w-full">
                  <select value={formData.role} onChange={(e) => handleInputChange('role', e.target.value)} className="w-full pl-3 pr-10 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs appearance-none focus:border-[#fbaf77] focus:outline-none">
                    <option value="messenger">messenger</option>
                    <option value="admin">admin</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Phone (opsional)</label>
                <input type="tel" name="new-phone" autoComplete="tel" inputMode="tel" maxLength={15} value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value.replace(/[^0-9+]/g, ''))} placeholder="08xxxxxxxxxx" className="w-full px-3 sm:px-[13.68px] py-3 sm:py-[17.1px] bg-white rounded-[10.26px] border-[0.85px] border-[#cccccc] text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end mt-4 sm:mt-6 gap-3">
              <Link to="/management">
                <button className="bg-white hover:bg-gray-50 text-[#404040] border-[0.85px] border-[#cccccccc] [font-family:'Quicksand',Helvetica] font-bold text-xs px-4 sm:px-6 py-2 sm:py-2.5 rounded-[12.45px] transition-colors">Cancel</button>
              </Link>
              <button onClick={handleSubmit} className="bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs sm:text-[10.2px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-[12.45px] transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InputUser;