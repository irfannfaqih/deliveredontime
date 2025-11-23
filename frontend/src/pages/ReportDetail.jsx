import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useDeliveries, useAuth } from "../hooks/useAPI";
import settingsIcon from '../assets/settingIcon.svg';

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
    isActive: true,
  },
  {
    id: "customer",
    label: "Customer",
    icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-2.svg",
    href: "/customer",
    isActive: false,
  },
];

const formatDateText = (d) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    const day = dt.getDate();
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    return `${day} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  } catch { return String(d); }
};

// Detail Delivered Modal Component
const DetailModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const detailFields = [
    {
      label: "No. Invoice",
      value: data.invoice,
      column: "left",
    },
    {
      label: "Nama Item",
      value: data.item,
      column: "left",
    },
    {
      label: "Tanggal Dikirim",
      value: data.sentDate,
      column: "left",
    },
    {
      label: "Nama Messenger",
      value: data.messenger,
      column: "left",
    },
    {
      label: "Status",
      value: data.status,
      column: "left",
    },
    {
      label: "Nama Customer",
      value: data.customer,
      column: "right",
    },
    {
      label: "Tanggal Terima",
      value: data.deliveredDate,
      column: "right",
    },
    {
      label: "Nama Penerima",
      value: data.recipient,
      column: "right",
    },
    {
      label: "Keterangan",
      value: data.notes,
      column: "right",
    },
  ];

  const leftFields = detailFields.filter((field) => field.column === "left");
  const rightFields = detailFields.filter((field) => field.column === "right");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[720px] p-4 sm:p-6 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <header className="mb-4 sm:mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="font-['Inter',Helvetica] font-bold text-[#0b0b0b] text-sm sm:text-base tracking-[-0.20px] leading-[24px] text-left">
              Detail Delivered
            </h1>

            <div className="flex items-center gap-2">
              <button className="h-auto rounded-[12px] border border-[#cdcdcd] px-2 py-2 flex items-center gap-0.5 hover:bg-gray-50 transition-colors">
                <span className="hidden sm:inline font-['Inter',Helvetica] font-medium text-[#63676a] text-xs tracking-[0] leading-4 text-left">
                  Edit
                </span>
                <img
                  className="w-5 h-5"
                  alt="Edit"
                  src="https://c.animaapp.com/mh45d3fhl0zAog/img/frame-72.svg"
                />
              </button>

              <button className="h-auto rounded-[12px] border border-[#cdcdcd] px-2 py-2 flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                <span className="hidden sm:inline font-['Inter',Helvetica] font-medium text-[#63676a] text-xs tracking-[0] leading-4 text-left">
                  Hapus
                </span>
                <img
                  className="w-5 h-5"
                  alt="Delete outline"
                  src="https://c.animaapp.com/mh45d3fhl0zAog/img/delete-outline.svg"
                />
              </button>

              <button 
                onClick={onClose}
                className="h-5 w-5 p-0 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              >
                <img
                  className="w-5 h-5"
                  alt="Close"
                  src="https://c.animaapp.com/mh45d3fhl0zAog/img/close.svg"
                />
              </button>
            </div>
          </div>

          <p className="max-w-full sm:max-w-[420px] text-[#c7c7c7] text-xs leading-4 font-normal text-left">
            Menampilkan detail pengiriman invoice oleh messenger, termasuk
            informasi customer, tanggal pengiriman, serta keterangan tambahan
            terkait proses pengantaran.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-12">
          <div className="flex flex-col gap-5">
            {leftFields.map((field, index) => (
              <div key={`left-${index}`} className="flex flex-col gap-0.5 text-left">
                <div className="font-['Inter',Helvetica] font-bold text-black text-sm tracking-[-0.20px] leading-5 text-left">
                  {field.label}
                </div>
                <div className="text-xs font-normal text-[#c7c7c7] leading-4 text-left break-words">
                  {field.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {rightFields.map((field, index) => (
              <div key={`right-${index}`} className="flex flex-col gap-0.5 text-left">
                <div className="font-['Inter',Helvetica] font-bold text-black text-sm tracking-[-0.20px] leading-5 text-left">
                  {field.label}
                </div>
                <div className="text-xs font-normal text-[#c7c7c7] leading-4 text-left break-words">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReportDetail = () => {
  const { date } = useParams(); // Get date from URL parameter
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { deliveries } = useDeliveries({ date });
  const { user, logout } = useAuth();
  const navItems = useMemo(() => {
    const base = navigationItems.map(i => ({ ...i }));
    return user?.role === 'admin'
      ? [...base, { id: 'management', label: 'Users', icon: usersIcon, href: '/management', isActive: false }]
      : base;
  }, [user]);

  const selectedDate = date ? formatDateText(decodeURIComponent(date)) : "";

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

  const handleCustomerClick = (row) => {
    setSelectedDetail(row);
    setIsDetailModalOpen(true);
  };

  const sourceData = Array.isArray(deliveries) ? deliveries.map(r => ({
    customer: r.customer || r.customerName || "",
    invoice: r.invoice || "",
    item: r.item || "",
    sentDate: formatDateText(r.sentDate || r.sent_date),
    deliveredDate: formatDateText(r.deliveredDate || r.delivered_date),
    messenger: r.messenger || "",
    recipient: r.recipient || "",
    notes: r.notes || "",
    status: r.status || "",
  })) : [];
  const displayedData = sourceData.slice(0, entriesPerPage);

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
                  <span className={`font-[Lato] font-bold text-[13px] tracking-[0] leading-normal transition-colors duration-300 ${item.isActive ? "text-[#faa463]" : "text-[#c7c7c7]"}`}>
                    {item.label}
                  </span>
                </ItemWrapper>
              );
            })}
          </div>
        </div>

        <Link to="/settings" className="flex items-center gap-[14px] justify-start h-auto px-2.5 py-1.5 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#FFF1E6] hover:translate-x-1">
          <img className="w-[16px] h-[16px] flex-shrink-0" alt="Settings" src={settingsIcon} />
          <span className="font-[Lato] font-bold text-[#c7c7c7] text-[13px] tracking-[0] leading-normal transition-colors duration-300">
            Settings
          </span>
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-[30px] py-4 lg:py-[24px] flex flex-col overflow-hidden pt-20 lg:pt-[24px]">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          <div className="mb-3 sm:mb-0">
            {/* Desktop Header */}
            <div className="hidden lg:block">
              <h1 className="text-left [font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[23.8px] tracking-[0] leading-[normal]">
                Report
              </h1>
              <p className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#9e9e9e] text-[14px] tracking-[0] leading-[normal] mt-1">
                {selectedDate}
              </p>
            </div>
            
            {/* Mobile Header */}
            <div className="lg:hidden">
              <h1 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-xl sm:text-[23.8px] tracking-[0] leading-[normal]">
                Report
              </h1>
              <p className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#9e9e9e] text-sm sm:text-[14px] tracking-[0] leading-[normal] mt-1">
                {selectedDate}
              </p>
            </div>
          </div>

          {/* Desktop Profile Menu */}
          <div className="hidden lg:block relative" ref={profileMenuRef}>
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[12.8px] tracking-[0] leading-[normal]">
                Rizky Renaldy
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src="https://c.animaapp.com/mgugyb88wyMpAb/img/group-137.png"
                  alt="Rizky Renaldy"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-[10px] shadow-[0px_4px_12px_rgba(0,0,0,0.15)] py-2 z-50 animate-fade-in">
                <Link 
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF1E6] transition-colors"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 text-[#c7c7c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[12.8px] tracking-[0] leading-[normal]">
                    Settings
                  </span>
                </Link>
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    console.log('Logout clicked');
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

        {/* Back Button */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
          <Link to="/report" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-[10.2px] px-3.5 py-2.5 rounded-[12.45px] h-auto transition-colors duration-300 cursor-pointer">
              Back
            </button>
          </Link>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
          <div className="flex-1 bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6 flex flex-col overflow-hidden">
            <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[18px] tracking-[0] leading-[normal] mb-4 text-left">
              Ringkasan Laporan
            </h2>
            
            <div className="flex-1 overflow-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-none">
                    <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] w-[270px] text-left pb-3">
                      Nama Customer
                    </th>
                    <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] w-[140px] text-left pb-3">
                      No. Invoice
                    </th>
                    <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] w-[151px] text-left pb-3">
                      Nama Item
                    </th>
                    <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] w-[151px] text-left pb-3">
                      Tanggal Dikirim
                    </th>
                    <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] w-[151px] text-left pb-3">
                      Tanggal Diterima
                    </th>
                    <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] w-[151px] text-left pb-3">
                      Messenger
                    </th>
                    <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-right w-[90px] pb-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedData.length > 0 ? (
                    displayedData.map((row, index) => (
                      <tr
                        key={`delivered-${row.invoice}-${index}`}
                        className="border-b border-[#e5e5e5] text-left"
                      >
                        <td 
                          onClick={() => handleCustomerClick(row)}
                          className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[12.8px] tracking-[0] leading-[normal] underline py-3 cursor-pointer hover:text-[#faa463] transition-colors"
                        >
                          {row.customer}
                        </td>
                        <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                          {row.invoice}
                        </td>
                        <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                          {row.item}
                        </td>
                        <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                          {row.sentDate}
                        </td>
                        <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                          {row.deliveredDate}
                        </td>
                        <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                          {row.messenger}
                        </td>
                        <td className="[font-family:'Lato',Helvetica] font-bold text-[#404040] text-[12.8px] tracking-[0] leading-[normal] text-right py-3">
                          {row.status}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-[#9e9e9e] [font-family:'Inter',Helvetica]"
                      >
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {displayedData.length > 0 ? (
                  displayedData.map((row, index) => (
                    <div
                      key={`delivered-mobile-${row.invoice}-${index}`}
                      onClick={() => handleCustomerClick(row)}
                      className="bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3.5 cursor-pointer hover:border-[#faa463] hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[13px] mb-1 leading-tight underline truncate">
                            {row.customer}
                          </p>
                          <p className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#9e9e9e] text-[11px]">
                            #{row.invoice}
                          </p>
                        </div>
                        <span className={`[font-family:'Lato',Helvetica] font-bold text-[10px] px-2.5 py-1 rounded-md whitespace-nowrap flex-shrink-0 ${
                          row.status.toLowerCase().includes('on time') 
                            ? 'bg-[#e8f5e9] text-[#2e7d32]' 
                            : 'bg-[#fff3e0] text-[#e65100]'
                        }`}>
                          {row.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-[#e5e5e5]">
                        <div className="flex items-start gap-2">
                          <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[70px]">Item:</span>
                          <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.item}</span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[70px]">Dikirim:</span>
                          <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.sentDate}</span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[70px]">Diterima:</span>
                          <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.deliveredDate}</span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[70px]">Messenger:</span>
                          <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.messenger}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#9e9e9e] [font-family:'Inter',Helvetica] text-sm">
                    No data found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4">
            <div className="flex items-center gap-2">
              <span className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[11.4px] tracking-[0] leading-[normal]">
                Show
              </span>
              <select
                value={entriesPerPage.toString()}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="flex items-center gap-[9.21px] px-[4.6px] py-[1.53px] bg-[#fbaf77] rounded-[9.56px] h-[17.54px] border-none [font-family:'Quicksand',Helvetica] font-bold text-white text-[11.4px] tracking-[0] leading-[normal]"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[11.4px] tracking-[0] leading-[normal]">
                Entries
              </span>
            </div>
            <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#9e9e9e] text-[11.4px] tracking-[0] leading-[normal] sm:ml-2">
              (Showing {displayedData.length} of {sourceData.length} entries)
            </span>
          </div>
        </div>
      </main>

      <DetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetail(null);
        }} 
        data={selectedDetail} 
      />

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

export default ReportDetail;
import usersIcon from '../assets/users.svg';