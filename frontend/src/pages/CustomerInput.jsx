import { useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import settingsIcon from '../assets/settingIcon.svg';
import { useAuth, useCustomers } from "../hooks/useAPI";
import { fileAPI } from "../services/api";
import usersIcon from '../assets/users.svg';

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
    isActive: true,
  },
];

const formFields = [
  {
    id: "nama-customer",
    label: "Nama Customer",
    placeholder: "Nama Customer",
    required: true,
    type: "input",
  },
  {
    id: "no-hp-customer",
    label: "No Hp Customer",
    placeholder: "No Hp Customer",
    required: true,
    type: "input",
  },
  {
    id: "alamat",
    label: "Alamat",
    placeholder: "Alamat",
    required: true,
    type: "textarea",
  },
  {
    id: "google-maps",
    label: "Google Maps",
    placeholder: "Link Google Maps",
    required: false,
    type: "input",
  },
];

const CustomerInput = () => {
  const [formData, setFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [errors, setErrors] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { createCustomer } = useCustomers();
  const { user, logout } = useAuth();

  const navItems = useMemo(() => {
    const base = navigationItems.map(i => ({ ...i }));
    return user?.role === 'admin'
      ? [...base, { id: 'management', label: 'Users', icon: usersIcon, href: '/management', isActive: false }]
      : base;
  }, [user]);

  const handleInputChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadedFiles.length >= 1) { setUploadError("Maksimum 1 lampiran. Hapus terlebih dahulu jika ingin mengganti."); return; }
    const files = Array.from(e.dataTransfer.files).slice(0,1);
    addFiles(files);
  };

  const handleFileSelect = (e) => {
    if (uploadedFiles.length >= 1) { setUploadError("Maksimum 1 lampiran. Hapus terlebih dahulu jika ingin mengganti."); e.target.value = ""; return; }
    const files = Array.from(e.target.files).slice(0,1);
    addFiles(files);
  };

  const addFiles = (files) => {
    if (uploadedFiles.length >= 1) { setUploadError("Maksimum 1 lampiran. Hapus terlebih dahulu jika ingin mengganti."); return; }
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: formatFileSize(file.size),
      file: file
    }));
    setUploadedFiles(prev => newFiles.length ? [newFiles[0]] : prev);
    setUploadError("");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    setUploadError("");
  };

  const validate = () => {
    const next = {};
    formFields.forEach(f => {
      const v = String(formData[f.id] || '').trim();
      if (f.required && !v) next[f.id] = 'Wajib diisi';
    });
    return next;
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).filter(k => nextErrors[k]).length) return;
    const payload = {
      namaCustomer: formData["nama-customer"],
      noHp: formData["no-hp-customer"],
      alamat: formData["alamat"],
      google_maps: formData["google-maps"],
    };
    const res = await createCustomer(payload);
    const customerId = res?.data?.id ?? res?.data?.data?.id ?? null;
    if (res?.success && customerId) {
      const first = uploadedFiles[0];
      if (first) {
        try { await fileAPI.upload(first.file, 'customer_proof', { customer_id: customerId }); } catch { void 0 }
      }
      navigate('/customer');
    }
  };

  return (
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
                {navItems.map((item) => {
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
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#FFF1E6] transition-all"
              >
                <img className="w-4 h-4" alt="Settings" src={settingsIcon} />
                <span className="font-[Lato] font-bold text-[#c7c7c7] text-sm">Settings</span>
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
            {navItems.map((item) => {
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

        <Link 
          to="/settings"
          className="flex items-center gap-[14px] justify-start h-auto px-2.5 py-1.5 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#FFF1E6] hover:translate-x-1"
        >
          <img className="w-[16px] h-[16px] flex-shrink-0" alt="Settings" src={settingsIcon} />
          <span className="font-[Lato] font-bold text-[#c7c7c7] text-[13px] tracking-[0] leading-normal transition-colors duration-300">
            Settings
          </span>
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 overflow-auto pt-20 lg:pt-6">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          <header className="flex items-center justify-start gap-2.5 p-4 sm:p-6 lg:px-9 lg:pt-8">
            <h1 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-xl sm:text-2xl tracking-[0] leading-[normal]">
              Add Customer
            </h1>
          </header>

          <section className="flex flex-col w-full items-end gap-4 sm:gap-6 px-4 sm:px-6 lg:px-9 pb-6 lg:pb-8 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
              {formFields.map((field) => (
                <div
                  key={field.id}
                  className={`flex flex-col items-start gap-2 ${
                    field.type === 'textarea' ? 'md:col-span-2' : ''
                  }`}
                >
                  <label
                    htmlFor={field.id}
                    className="[font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-sm tracking-[0] leading-[normal]"
                  >
                    {field.label}
                    {field.required && <span className="text-red-600 ml-1">*</span>}
                  </label>
                  {field.type === "input" ? (
                    <input
                      id={field.id}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full bg-white rounded-[10.26px] border-[0.85px] px-3 sm:px-4 py-3 sm:py-[17.1px] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[10.3px] outline-none focus:border-[#197bbd] transition-colors placeholder:text-[#9e9e9e] ${errors[field.id] ? 'border-red-500' : 'border-[#cccccccc]'}`}
                    />
                  ) : (
                    <textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      rows={4}
                      className={`w-full bg-white rounded-[10.26px] border-[0.85px] px-3 sm:px-4 py-3 sm:py-[17.1px] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[10.3px] resize-none outline-none focus:border-[#197bbd] transition-colors placeholder:text-[#9e9e9e] ${errors[field.id] ? 'border-red-500' : 'border-[#cccccccc]'}`}
                    />
                  )}
                  {errors[field.id] && (
                    <span className="text-red-600 text-[10px] mt-0.5">{errors[field.id]}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Attachment Field */}
            <div className="flex flex-col items-start gap-2 w-full">
              <label
                htmlFor="attachment"
                className="[font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-sm tracking-[0] leading-[normal]"
              >
                Attachment
              </label>
              <div 
                onClick={() => uploadedFiles.length === 0 ? setIsModalOpen(true) : null}
                className={`w-full h-20 sm:h-24 bg-white rounded-[10.26px] border-[0.85px] border-dashed flex items-center justify-center px-4 py-4 transition-colors ${uploadedFiles.length === 0 ? 'border-[#cccccccc] cursor-pointer hover:border-[#197bbd]' : 'border-[#e0e0e0] cursor-not-allowed opacity-60'}`}
              >
                {uploadedFiles.length === 0 ? (
                  <div className="[font-family:'Inter',Helvetica] font-medium text-xs sm:text-sm text-center">
                    <span className="text-[#9e9e9e]">Drag &amp; Drop or </span>
                    <span className="text-[#197bbd]">Browse</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#2e7d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="[font-family:'Inter',Helvetica] font-semibold text-[#404040] text-xs">Lampiran sudah ditambahkan</p>
                      <p className="[font-family:'Inter',Helvetica] text-[#9e9e9e] text-[10px]">Hapus lampiran di bawah untuk mengganti</p>
                    </div>
                  </div>
                )}
              </div>
              {uploadError && (
                <span className="text-red-600 text-[10px] mt-2">{uploadError}</span>
              )}
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="w-full mt-3 space-y-2">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-[#fafafa] rounded-[10.26px] border border-[#e5e5e5] px-3 sm:px-4 py-2.5 sm:py-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-[#197bbd] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#197bbd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="[font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-sm truncate">{file.name}</p>
                          <p className="[font-family:'Inter',Helvetica] text-[#9e9e9e] text-[10px] sm:text-xs">{file.size}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-700 transition-colors ml-2 flex-shrink-0 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto sm:justify-end mt-4">
              <Link to="/customer" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#404040] border-[0.85px] border-[#cccccccc] [font-family:'Quicksand',Helvetica] font-bold text-xs px-6 py-2.5 rounded-[12.45px] transition-colors duration-300">
                  Cancel
                </button>
              </Link>
              <button 
                onClick={handleSubmit}
                className="w-full sm:w-auto bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs px-6 py-2.5 rounded-[12.45px] transition-colors duration-300"
              >
                Simpan
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[17.38px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 lg:pb-5 border-b border-[#e5e5e5] sticky top-0 bg-white rounded-t-[17.38px]">
              <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-lg sm:text-xl lg:text-[20px] tracking-[0] leading-[normal]">
                Upload Attachment
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#9e9e9e] hover:text-black transition-colors p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => { if (uploadedFiles.length === 0) fileInputRef.current?.click(); }}
                className={`w-full h-32 sm:h-40 lg:h-52 bg-white rounded-[10.26px] border-2 border-dashed ${
                  isDragging ? 'border-[#197bbd] bg-[#197bbd] bg-opacity-5' : 'border-[#cccccccc]'
                } flex flex-col items-center justify-center px-4 py-4 ${uploadedFiles.length >= 1 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#197bbd]'} transition-all`}
              >
                <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-[#197bbd] mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploadedFiles.length === 0 ? (
                  <div className="[font-family:'Inter',Helvetica] font-medium text-xs sm:text-sm lg:text-base text-center">
                    <span className="text-[#9e9e9e]">Drag &amp; Drop files here or </span>
                    <span className="text-[#197bbd]">Browse</span>
                  </div>
                ) : (
                  <div className="[font-family:'Inter',Helvetica] font-medium text-xs sm:text-sm lg:text-base text-center text-[#9e9e9e]">
                    Nonaktif: hapus lampiran terlebih dahulu untuk mengganti
                  </div>
                )}
                <p className="[font-family:'Inter',Helvetica] text-[#9e9e9e] text-[10px] sm:text-xs mt-2 text-center">
                  Support: PDF, JPG, PNG, DOC (Max 10MB)
                </p>
                {uploadError && (
                  <p className="mt-2 text-red-600 [font-family:'Inter',Helvetica] text-xs">{uploadError}</p>
                )}
              </div>

              {/* Modal File List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 max-h-48 sm:max-h-52 overflow-y-auto">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-[#fafafa] rounded-[10.26px] px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#197bbd] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#197bbd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="[font-family:'Inter',Helvetica] font-medium text-black text-sm truncate">{file.name}</p>
                          <p className="[font-family:'Inter',Helvetica] text-[#9e9e9e] text-xs">{file.size}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="text-red-600 hover:text-red-700 transition-colors p-1 ml-2 flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8 border-t border-[#e5e5e5]">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#404040] border-[0.85px] border-[#cccccccc] [font-family:'Quicksand',Helvetica] font-bold text-xs px-6 py-2.5 rounded-[12.45px] transition-colors duration-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleModalConfirm}
                className="w-full sm:w-auto bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs px-6 py-2.5 rounded-[12.45px] transition-colors duration-300"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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
    </div>
  );
};

export default CustomerInput;