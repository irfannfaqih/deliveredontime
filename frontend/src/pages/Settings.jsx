import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import settingsIcon from '../assets/settingIcon.svg';
import { useAuth } from "../hooks/useAPI";
import { authAPI, fileAPI } from "../services/api";

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-3.svg",
    href: "/dashboard",
    isActive: false,
  },
  {
    id: "delivered",
    label: "Delivered",
    icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-4.svg",
    href: "/delivered",
    isActive: false,
  },
  {
    id: "bbm",
    label: "BBM",
    icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-5.svg",
    href: "/bbm",
    isActive: false,
  },
  {
    id: "report",
    label: "Report",
    icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7.svg",
    href: "/report",
    isActive: false,
  },
  {
    id: "customer",
    label: "Customer",
    icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-2.svg",
    href: "/customer",
    isActive: false,
  },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const UPLOADS_BASE = API_BASE.replace(/\/api$/, '');
const normalizeUrl = (u) => {
  if (!u) return u;
  return String(u).startsWith('/uploads/') ? `${UPLOADS_BASE}${u}` : u;
};

export const Settings = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState("https://c.animaapp.com/mgugyb88wyMpAb/img/group-137.png");
  const [previewImage, setPreviewImage] = useState(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { user, logout, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profileMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    setFormData({
      fullName: user?.name || "",
      email: user?.email || "",
      role: user?.role || "",
    });
    if (user?.profile_image) {
      setProfileImage(user.profile_image);
      setPreviewImage(normalizeUrl(user.profile_image));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validasi file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSuccessMessage('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setSuccessMessage('Ukuran file terlalu besar. Maksimal 5MB.');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    setIsUploadingImage(true);
    try {
      // Cek apakah user sudah login
      const token = localStorage.getItem('access_token');
      if (!token) {
        setSuccessMessage('Session expired. Please login again.');
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }
      
      console.log('=== UPLOAD DEBUG ===');
      console.log('File:', file.name, file.type, file.size);
      console.log('Token exists:', !!token);
      console.log('User:', user);
      
      // Panggil API dengan file dan category 'profile_image'
      const resp = await fileAPI.upload(file, 'profile_image');
      console.log('Upload response:', resp);
      
      // Backend mengembalikan format: { data: { url: '/uploads/...', file: {...} } }
      const data = resp?.data ?? resp;
      const url = data?.url;
      
      console.log('Extracted URL:', url);
      
      if (url) {
        // Update state dengan URL yang sudah dinormalisasi
        const normalizedUrl = normalizeUrl(url);
        console.log('Normalized URL:', normalizedUrl);
        
        setProfileImage(url); // Simpan URL asli dari server
        setPreviewImage(normalizedUrl); // Tampilkan preview dengan URL lengkap
        setSuccessMessage('Photo uploaded successfully! Profile updated.');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        console.error('No URL in response:', data);
        setSuccessMessage('Upload gagal: server tidak mengembalikan URL');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      
      let errorMsg = 'Upload gagal';
      
      if (error?.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (error?.response?.status === 500) {
        errorMsg = error?.response?.data?.error || 'Server error. Check console for details.';
      } else {
        errorMsg = error?.response?.data?.error 
          || error?.response?.data?.message 
          || error?.error 
          || error?.message 
          || 'Upload gagal. Coba lagi.';
      }
      
      setSuccessMessage(errorMsg);
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally { 
      setIsUploadingImage(false); 
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Hanya kirim nama, karena profile_image sudah di-update otomatis saat upload
      const payload = { name: formData.fullName };
      
      const result = await updateProfile(payload);
      if (result?.success) {
        setSuccessMessage("Profile updated successfully!");
      } else {
        setSuccessMessage(result?.error || "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      setSuccessMessage("Failed to update profile");
    } finally {
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New password and confirmation do not match!");
      return;
    }
    try {
      await authAPI.changePassword({ current: passwordData.currentPassword, next: passwordData.newPassword });
      setSuccessMessage("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (error) {
      console.error(error);
      alert("Failed to change password");
    } finally {
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          animation-delay: var(--animation-delay, 0ms);
        }
      `}</style>
      
      <div className="bg-[#f5f5f5] w-full min-h-screen flex">
        {/* Mobile Header - Only visible on mobile */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 flex items-center justify-between shadow-md z-50">
          <img
            className="h-8"
            alt="Logo"
            src="https://c.animaapp.com/mgrgm0itqrnJXn/img/chatgpt-image-28-sep-2025--18-41-25-1.png"
          />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div 
              className="bg-white w-64 h-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <img
                  className="w-24 h-auto mb-8"
                  alt="Logo"
                  src="https://c.animaapp.com/mgrgm0itqrnJXn/img/chatgpt-image-28-sep-2025--18-41-25-1.png"
                />
                
                <div className="flex flex-col gap-2 mb-8">
                  {navigationItems.map((item) => {
                    const ItemWrapper = item.href !== "#" ? Link : "button";
                    const wrapperProps = item.href !== "#" ? { to: item.href } : {};

                    return (
                      <ItemWrapper
                        key={item.id}
                        {...wrapperProps}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          item.isActive 
                            ? "bg-[#FFF1E6]" 
                            : "hover:bg-[#FFF1E6]"
                        }`}
                      >
                        <img
                          className="w-6 h-6"
                          alt={item.label}
                          src={item.icon}
                          style={item.isActive ? { filter: 'brightness(0) saturate(100%) invert(66%) sepia(45%) saturate(1641%) hue-rotate(332deg) brightness(99%) contrast(97%)' } : { filter: 'brightness(0) saturate(100%) invert(84%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(92%) contrast(87%)' }}
                        />
                        <span className={`font-[Lato] font-bold text-sm ${item.isActive ? "text-[#faa463]" : "text-[#c7c7c7]"}`}>
                          {item.label}
                        </span>
                      </ItemWrapper>
                    );
                  })}
                </div>

                <Link 
                  to="/settings" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#FFF1E6] transition-all"
                >
                  <img 
                    className="w-4 h-4" 
                    alt="Settings" 
                    src={settingsIcon}
                    style={{ filter: 'brightness(0) saturate(100%) invert(66%) sepia(45%) saturate(1641%) hue-rotate(332deg) brightness(99%) contrast(97%)' }}
                  />
                <span className="font-[Lato] font-bold text-[#faa463] text-sm">Settings</span>
              </Link>

              <button 
                onClick={async () => { setIsMobileMenuOpen(false); await logout(); }}
                className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#FFF1E6] transition-all"
              >
                <svg className="w-4 h-4 text-[#c7c7c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-[Lato] font-bold text-[#c7c7c7] text-sm">Logout</span>
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar - Only visible on desktop */}
        <aside className="hidden lg:flex w-[200px] flex-shrink-0 bg-white shadow-[2px_24px_53px_#0000000d,8px_95px_96px_#0000000a,19px_214px_129px_#00000008,33px_381px_153px_#00000003,52px_596px_167px_transparent] px-[15px] py-[30px] flex-col justify-between h-screen sticky top-0">
          <div>
            <img
              className="w-[100px] h-[41px] mb-[45px]"
              alt="Logo"
              src="https://c.animaapp.com/mgrgm0itqrnJXn/img/chatgpt-image-28-sep-2025--18-41-25-1.png"
            />
            
            <div className="flex flex-col gap-3">
              {navigationItems.map((item) => {
                const ItemWrapper = item.href !== "#" ? Link : "button";
                const wrapperProps = item.href !== "#" ? { to: item.href } : {};
            
                return (
                  <ItemWrapper
                    key={item.id}
                    {...wrapperProps}
                    className={`flex items-center gap-[14px] justify-start h-auto px-2.5 py-1.5 rounded-lg transition-all duration-300 ease-in-out ${
                      item.isActive 
                        ? "bg-[#FFF1E6]" 
                        : "hover:bg-[#FFF1E6] hover:translate-x-1"
                    }`}
                  >
                    <img
                      className="w-[24px] h-[24px] flex-shrink-0"
                      alt={item.label}
                      src={item.icon}
                      style={item.isActive ? { filter: 'brightness(0) saturate(100%) invert(66%) sepia(45%) saturate(1641%) hue-rotate(332deg) brightness(99%) contrast(97%)' } : { filter: 'brightness(0) saturate(100%) invert(84%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(92%) contrast(87%)' }}
                    />
                    <span
                      className={`font-[Lato] font-bold text-[13px] tracking-[0] leading-normal transition-colors duration-300 ${
                        item.isActive ? "text-[#faa463]" : "text-[#c7c7c7]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </ItemWrapper>
                );
              })}
            </div>
          </div>

          <Link to="/settings" className="flex items-center gap-[14px] justify-start h-auto px-2.5 py-1.5 rounded-lg bg-[#FFF1E6]">
            <img
              className="w-[16px] h-[16px] flex-shrink-0"
              alt="Settings"
              src={settingsIcon}
              style={{ filter: 'brightness(0) saturate(100%) invert(66%) sepia(45%) saturate(1641%) hue-rotate(332deg) brightness(99%) contrast(97%)' }}
            />
            <span className="font-[Lato] font-bold text-[#faa463] text-[13px] tracking-[0] leading-normal transition-colors duration-300">
              Settings
            </span>
          </Link>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-[30px] py-4 lg:py-[24px] overflow-auto pt-20 lg:pt-[24px]">
          <div className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
            {/* Header - Desktop Only */}
            <div className="hidden lg:flex items-center justify-between mb-7">
              <h1 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[23.8px] tracking-[0] leading-[normal]">
                Settings
              </h1>

              <div className="relative" ref={profileMenuRef}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <span className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[12.8px] tracking-[0] leading-[normal]">
                    {user?.name || formData.fullName || "User"}
                  </span>
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={previewImage || normalizeUrl(user?.profile_image || profileImage)}
                      alt={user?.name || formData.fullName || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-[10px] shadow-[0px_4px_12px_rgba(0,0,0,0.15)] py-2 z-50 animate-fade-in">
                    <Link 
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 bg-[#FFF1E6] transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 text-[#faa463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#faa463] text-[12.8px] tracking-[0] leading-[normal]">
                        Settings
                      </span>
                    </Link>
                    <button 
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF1E6] transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#c7c7c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[12.8px] tracking-[0] leading-[normal]">
                        Logout
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Title */}
            <h1 className="lg:hidden [font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-xl sm:text-[23.8px] tracking-[0] leading-[normal] mb-4">
              Settings
            </h1>

            {successMessage && (
              <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-[12.45px] p-3 sm:p-4 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:100ms]">
                <div className="flex items-center gap-2">
                  <svg className="w-4 sm:w-5 h-4 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-green-700 text-xs sm:text-[12.8px]">
                    {successMessage}
                  </span>
                </div>
              </div>
            )}

            {/* Profile Section */}
            <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6 mb-4 sm:mb-6 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
              <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-base sm:text-[18px] tracking-[0] leading-[normal] mb-4 sm:mb-6">
                Profile Information
              </h2>

              <div className="flex flex-col lg:flex-row items-start gap-6 sm:gap-8 mb-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
                  <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-full overflow-hidden border-4 border-[#fbaf77] shadow-lg">
                    <img
                      src={previewImage || normalizeUrl(profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className={`bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs sm:text-[10.2px] px-3 sm:px-4 py-2 rounded-[12.45px] transition-colors duration-300 w-full lg:w-auto ${isUploadingImage ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                  </button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 w-full grid grid-cols-1 gap-4 sm:gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-[13.68px] py-3 sm:py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[12.8px]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-[13.68px] py-3 sm:py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[12.8px]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                      Role
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      disabled
                      className="w-full px-3 sm:px-[13.68px] py-3 sm:py-[17.1px] h-auto bg-[#f5f5f5] rounded-[10.26px] border-[0.85px] border-[#e5e5e5] [font-family:'Inter',Helvetica] font-medium text-[#9e9e9e] text-xs sm:text-[12.8px] cursor-not-allowed"
                    />
                    <span className="[font-family:'Inter',Helvetica] font-normal text-[#9e9e9e] text-[9px] sm:text-[10px] tracking-[0] leading-[normal]">
                      Contact administrator to change your role
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <button
                  onClick={handleSaveProfile}
                  className="bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs sm:text-[10.2px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-[12.45px] transition-colors duration-300 w-full sm:w-auto"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Password Section */}
            <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div>
                  <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-base sm:text-[18px] tracking-[0] leading-[normal]">
                    Security
                  </h2>
                  <p className="[font-family:'Inter',Helvetica] font-normal text-[#9e9e9e] text-[10px] sm:text-[11px] tracking-[0] leading-[normal] mt-1">
                    Manage your password and account security
                  </p>
                </div>
                {!showPasswordSection && (
                  <button
                    onClick={() => setShowPasswordSection(true)}
                    className="bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs sm:text-[10.2px] px-3 sm:px-4 py-2 rounded-[12.45px] transition-colors duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordSection ? (
                <div className="bg-[#FFF9F3] border border-[#fbaf77] rounded-[12.45px] p-4 sm:p-6">
                  <div className="flex items-start gap-3 mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-[#fdd9b8]">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#fbaf77] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-sm sm:text-[14px] tracking-[0] leading-[normal] mb-1">
                        Change Your Password
                      </h3>
                      <p className="[font-family:'Inter',Helvetica] font-normal text-[#9e9e9e] text-[9px] sm:text-[10.5px] tracking-[0] leading-[normal]">
                        Make sure your password is at least 8 characters long and includes a mix of letters, numbers, and symbols
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal] flex items-center gap-1">
                        Current Password
                        <span className="text-[#fb6b6b]">*</span>
                      </label>
                      <div className="relative">
                        <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          className="w-full pl-8 sm:pl-[44px] pr-3 sm:pr-[13.68px] py-3 sm:py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none transition-colors placeholder:text-[#9e9e9e]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal] flex items-center gap-1">
                          New Password
                          <span className="text-[#fb6b6b]">*</span>
                        </label>
                        <div className="relative">
                          <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter new password"
                            className="w-full pl-8 sm:pl-[44px] pr-3 sm:pr-[13.68px] py-3 sm:py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none transition-colors placeholder:text-[#9e9e9e]"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal] flex items-center gap-1">
                          Confirm New Password
                          <span className="text-[#fb6b6b]">*</span>
                        </label>
                        <div className="relative">
                          <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Confirm new password"
                            className="w-full pl-8 sm:pl-[44px] pr-3 sm:pr-[13.68px] py-3 sm:py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[12.8px] focus:border-[#fbaf77] focus:outline-none transition-colors placeholder:text-[#9e9e9e]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#fdd9b8] gap-3">
                    <button
                      onClick={() => {
                        setShowPasswordSection(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="bg-white hover:bg-[#f5f5f5] text-[#404040] border border-[#cccccc] [font-family:'Quicksand',Helvetica] font-bold text-xs sm:text-[10.2px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-[12.45px] transition-colors duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePassword}
                      className="bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs sm:text-[10.2px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-[12.45px] transition-colors duration-300 flex items-center gap-2 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
                    >
                      <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Password
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-[#9e9e9e] p-3 sm:p-0">
                  <svg className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-xs sm:text-[12.8px]">
                    Your password is secure. Last changed 30 days ago.
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Settings;