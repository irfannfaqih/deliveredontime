import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import containerBg from "../assets/container.svg";
import iconOntime from "../assets/ontime.svg";
import iconOntimePlane from "../assets/ontimePlane.svg";
import iconOuttime from "../assets/outtime.svg";
import searchIcon from "../assets/searchIcon.svg";
import settingsIcon from '../assets/settingIcon.svg';
import iconTotal from "../assets/total.svg";
import { useAPIData, useAuth, useDeliveries } from "../hooks/useAPI";
import { deliveredAPI } from "../services/api";
import { normalizeUrl } from '../utils/url';

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "https://c.animaapp.com/mgrgm0itqrnJXn/img/frame-7-3.svg",
    href: "/dashboard",
    isActive: true,
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

const formatDateID = (d) => {
  try {
    const dt = new Date(String(d));
    return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(d || '');
  }
};

export const Dashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { deliveries } = useDeliveries();
  const { data: statsResp } = useAPIData(() => deliveredAPI.getStats());
  const stats = statsResp?.data ?? statsResp;
  const { user, logout } = useAuth();

  const total = useMemo(() => {
    if (stats && typeof stats.total === 'number') return stats.total;
    return Array.isArray(deliveries) ? deliveries.length : 0;
  }, [stats, deliveries]);
  const ontime = useMemo(() => {
    if (stats && typeof stats.ontime === 'number') return stats.ontime;
    return (Array.isArray(deliveries) ? deliveries.filter(d => String(d.status || '').toLowerCase().includes('on time')).length : 0);
  }, [stats, deliveries]);
  const outtime = useMemo(() => Math.max(total - ontime, 0), [total, ontime]);
  const onPercent = useMemo(() => total > 0 ? Math.round((ontime / total) * 100) : 0, [ontime, total]);
  const outPercent = useMemo(() => total > 0 ? Math.round((outtime / total) * 100) : 0, [outtime, total]);

  const achievementData = useMemo(() => ([
    { value: String(total), label: 'Total', date: formatDateID(new Date()), icon: iconTotal },
    { value: String(ontime), label: 'On time', date: formatDateID(new Date()), icon: iconOntimePlane },
  ]), [total, ontime]);

  const statisticsData = useMemo(() => ([
    { label: 'On time', percentage: onPercent, progressValue: onPercent, icon: iconOntime, gradientClass: 'bg-[linear-gradient(90deg,rgba(32,157,67,1)_0%,rgba(43,194,85,1)_100%)]' },
    { label: 'Out of time', percentage: outPercent, progressValue: outPercent, icon: iconOuttime, gradientClass: 'bg-[linear-gradient(270deg,rgba(252,174,115,1)_0%,rgba(247,144,66,1)_100%)]' },
  ]), [onPercent, outPercent]);

  const historyData = useMemo(() => {
    const rows = Array.isArray(deliveries) ? deliveries.slice(0, 10) : [];
    return rows.map(r => ({
      customer: r.customer || '',
      invoice: r.invoice || '',
      itemName: r.item || '',
      date: formatDateID(r.sentDate || r.sent_date),
      status: r.status || '',
    }));
  }, [deliveries]);

  return (
    <div className="bg-[#f5f5f5] w-full min-h-screen flex">
      {/* Mobile Header - Tetap sama seperti halaman lain */}
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

      {/* Mobile Menu Overlay - Tetap sama seperti halaman lain */}
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

      {/* Desktop Sidebar - Tidak berubah sama sekali */}
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

      {/* Main Content - Hanya dashboard content yang diubah */}
      <main className="flex-1 px-4 sm:px-6 lg:px-[30px] py-4 lg:py-[24px] overflow-auto max-h-screen pt-20 lg:pt-[24px]">
        {/* Search Bar - Enhanced untuk mobile/tablet */}
        <div className="flex w-full items-start justify-start mb-6 sm:mb-8 lg:mb-[19px] max-w-full lg:max-w-[800px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4 lg:gap-2 px-4 sm:px-6 lg:px-3 py-4 sm:py-5 lg:py-3 bg-white rounded-[16px] sm:rounded-[20px] lg:rounded-[10px] border-2 border-[#e5e5e5] lg:border lg:border-[#cccccccc] shadow-lg sm:shadow-xl lg:shadow-none hover:shadow-xl lg:hover:shadow-none hover:border-[#faa463] transition-all duration-300">
            <div className="p-2 sm:p-2.5 lg:p-0 bg-gradient-to-br from-[#faa463] to-[#f7944a] lg:bg-none rounded-lg lg:rounded-none">
              <img src={searchIcon} alt="Search" className="w-4 h-4 sm:w-5 sm:h-5 lg:w-3.5 lg:h-3.5 filter brightness-0 invert lg:filter-none" />
            </div>
            <input
              placeholder="Search Delivered Here.."
              className="flex-1 border-0 bg-transparent font-[Suprema-Regular] font-normal text-[#404040] text-base sm:text-lg lg:text-xs outline-none placeholder:text-[#9e9e9e]"
            />
          </div>
        </div>

        {/* Mobile Hero Section - Hanya di mobile */}
        <div className="block sm:hidden w-full rounded-[20px] bg-gradient-to-br from-[#faa463] to-[#f7944a] p-6 mb-6 shadow-xl translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:150ms]">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="font-[Suprema-SemiBold] font-semibold text-xl mb-2">{user?.name || 'Welcome!'}</h2>
              <p className="font-[Suprema-Regular] font-normal text-sm opacity-90">Delivery Overview Dashboard</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Hero Card - Desktop tetap sama, tablet enhanced */}
        <div className="hidden sm:block lg:block w-full max-w-full lg:max-w-[800px] rounded-[20px] sm:rounded-[24px] lg:rounded-[16px] overflow-hidden mb-6 sm:mb-8 lg:mb-[18px] h-[140px] sm:h-[160px] lg:h-[120px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms] shadow-xl sm:shadow-2xl lg:shadow-none">
          <img src={containerBg} alt="Hero Background" className="w-full h-full object-cover" />
        </div>

        {/* Stats Grid - Enhanced untuk mobile/tablet */}
        <div className="flex flex-col lg:flex-row w-full max-w-full lg:max-w-[800px] items-start gap-6 sm:gap-6 lg:gap-6 mb-6 sm:mb-8 lg:mb-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
          {/* Capaian Section */}
          <div className="flex flex-col items-start gap-4 sm:gap-4 lg:gap-4 w-full lg:w-auto lg:flex-shrink-0">
            <h3 className="font-[Suprema-SemiBold] font-semibold text-[#404040] text-lg sm:text-xl lg:text-[16px]">
              Capaian
            </h3>
            <div className="flex items-center gap-4 sm:gap-4 lg:gap-4 w-full">
              {achievementData.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 lg:w-[120px] bg-white rounded-[20px] sm:rounded-[24px] lg:rounded-[20px] shadow-lg sm:shadow-xl lg:shadow-[0px_0px_0.83px_#0000000a,0px_1.65px_4.96px_#0000000a,0px_13.22px_19.84px_#0000000f] flex flex-col items-start gap-3 sm:gap-4 lg:gap-2 px-5 sm:px-6 lg:px-4 py-5 sm:py-6 lg:py-3 h-[130px] sm:h-[150px] lg:h-[120px] relative hover:shadow-xl sm:hover:shadow-2xl lg:hover:shadow-lg hover:scale-[1.02] lg:hover:scale-100 transition-all duration-300 border border-[#f0f0f0]"
                >
                  <div className="font-[Suprema-Regular] font-normal text-[#696969] text-2xl sm:text-3xl lg:text-[18px] font-bold -mt-[2px] sm:-mt-[2px] lg:-mt-[1px]">
                    {item.value}
                  </div>
                  <div className="absolute top-[47px] sm:top-[57px] lg:top-[34px] left-5 sm:left-6 lg:left-[17px] font-[Suprema-Regular] font-normal text-[#aeaeae] text-xs sm:text-sm lg:text-[10px]">
                    {item.date}
                  </div>
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="absolute top-[66px] sm:top-[81px] lg:top-[61px] left-5 sm:left-6 lg:left-4 w-7 h-7 sm:w-8 sm:h-8 lg:w-[26px] lg:h-[26px]"
                  />
                  <div className="absolute top-[101px] sm:top-[116px] lg:top-[88px] left-5 sm:left-6 lg:left-4 font-[Suprema-Regular] font-normal text-[#404040] text-sm sm:text-base lg:text-[15px] font-medium">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistik Section */}
          <div className="flex flex-col flex-1 items-start gap-4 sm:gap-4 lg:gap-4 min-w-0 w-full">
            <h3 className="font-[Suprema-SemiBold] font-semibold text-[#404040] text-lg sm:text-xl lg:text-[16px]">
              Statistik Pengiriman
            </h3>
            <div className="flex flex-col items-start gap-5 sm:gap-5 lg:gap-5 w-full max-w-full lg:max-w-[424px]">
              {statisticsData.map((item, index) => (
                <div key={index} className="relative w-full h-[70px] sm:h-[80px] lg:h-[42px] bg-white lg:bg-transparent rounded-[18px] sm:rounded-[20px] lg:rounded-none p-4 sm:p-5 lg:p-0 shadow-md sm:shadow-lg lg:shadow-none hover:shadow-lg sm:hover:shadow-xl lg:hover:shadow-none transition-all duration-300 border border-[#f0f0f0] lg:border-none">
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="absolute top-3 sm:top-4 lg:top-0 left-3 sm:left-4 lg:-left-2 w-[50px] h-[50px] sm:w-[55px] sm:h-[55px] lg:w-[70px] lg:h-[70px]"
                  />
                  <div className="absolute top-[25px] sm:top-[30px] lg:top-[9px] left-[65px] sm:left-[70px] lg:left-16 right-[60px] sm:right-[65px] lg:right-[70px] h-[30px] sm:h-[35px] lg:h-[29px]">
                    <div className="absolute top-[8px] sm:top-[10px] lg:top-px left-0 right-0 h-3 sm:h-4 lg:h-2 bg-[#f1f1f1] rounded-[12px] lg:rounded-[11.39px]" />
                    <div
                      className={`absolute top-[7px] sm:top-[9px] lg:top-0 left-px h-3 sm:h-4 lg:h-2 rounded-[10px] lg:rounded-[9.01px] ${item.gradientClass} transition-all duration-700 ease-out`}
                      style={{ width: `${item.progressValue}%` }}
                    />
                    <div className="absolute top-[26px] sm:top-[30px] lg:top-[15px] left-0.5 font-[Suprema-Regular] font-normal text-[#aeaeae] text-sm sm:text-base lg:text-[11.7px] whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                  <div className="absolute top-[3px] sm:top-[5px] lg:top-0 right-4 sm:right-5 lg:right-0 font-[Suprema-Regular] font-normal text-[#696969] text-xl sm:text-2xl lg:text-[20.1px] font-bold">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History Table - Enhanced mobile cards */}
        <div className="w-full max-w-full lg:max-w-[800px] bg-white rounded-[20px] sm:rounded-[24px] lg:rounded-[17px] shadow-lg sm:shadow-xl lg:shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] overflow-hidden translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms] border border-[#f0f0f0] lg:border-none">
          <div className="p-5 sm:p-6 lg:px-[30px] lg:py-[14px]">
            <h3 className="font-[Suprema-SemiBold] font-semibold text-[#404040] text-lg sm:text-xl lg:text-base mb-5 sm:mb-6 lg:mb-[18px] text-left">
              History Pengiriman
            </h3>
            
            {/* Desktop/Tablet Table - Tidak berubah */}
            <div className="hidden md:block overflow-x-auto">
              <div className="grid grid-cols-[1.8fr_0.9fr_1fr_1fr_0.6fr] gap-x-4 mb-3 min-w-[600px]">
                <div className="font-[Suprema-Regular] font-normal text-[#aeaeae] text-xs text-left">
                  Nama Customer
                </div>
                <div className="font-[Suprema-Regular] font-normal text-[#aeaeae] text-xs text-left">
                  No. Invoice
                </div>
                <div className="font-[Suprema-Regular] font-normal text-[#aeaeae] text-xs text-left">
                  Item Name
                </div>
                <div className="font-[Suprema-Regular] font-normal text-[#aeaeae] text-xs text-left">
                  Tanggal Dikirim
                </div>
                <div className="font-[Suprema-Regular] font-normal text-[#aeaeae] text-xs text-left">
                  Status
                </div>
              </div>
              {historyData.map((row, index) => (
                <div key={index}>
                  <div className="grid grid-cols-[1.8fr_0.9fr_1fr_1fr_0.6fr] gap-x-4 py-3 min-w-[600px] hover:bg-[#f9f9f9] transition-colors duration-200">
                    <div className="font-[Suprema-Regular] font-normal text-[#404040] text-xs text-left">
                      {row.customer}
                    </div>
                    <div className="font-[Suprema-Regular] font-normal text-[#c7c7c7] text-xs text-left">
                      {row.invoice}
                    </div>
                    <div className="font-[Suprema-Regular] font-normal text-[#c7c7c7] text-xs text-left">
                      {row.itemName}
                    </div>
                    <div className="font-[Suprema-Regular] font-normal text-[#c7c7c7] text-xs text-left">
                      {row.date}
                    </div>
                    <div className="font-[Suprema-SemiBold] font-semibold text-[#404040] text-xs text-left">
                      {row.status}
                    </div>
                  </div>
                  {index < historyData.length - 1 && (
                    <div className="w-full h-px bg-[#e5e5e5]" />
                  )}
                </div>
              ))}
            </div>

            {/* Enhanced Mobile Cards */}
            <div className="md:hidden space-y-4">
              {historyData.map((row, index) => (
                <div key={index} className="bg-gradient-to-br from-white to-[#fafafa] border-2 border-[#e5e5e5] rounded-[16px] p-4 cursor-pointer hover:border-[#faa463] hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group">
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-base mb-2 leading-tight">
                        {row.customer}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="bg-[#faa463]/10 px-3 py-1 rounded-full border border-[#faa463]/20">
                          <p className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#faa463] text-sm">
                            #{row.invoice}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`[font-family:'Lato',Helvetica] font-bold text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-sm ${
                      row.status.toLowerCase().includes('on time') 
                        ? 'bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] text-[#2e7d32] border border-[#4caf50]/20' 
                        : 'bg-gradient-to-r from-[#fff3e0] to-[#ffe0b2] text-[#e65100] border border-[#ff9800]/20'
                    }`}>
                      {row.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 pt-3 border-t border-[#e5e5e5]">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#faa463]/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#faa463]/20">
                        <svg className="w-3.5 h-3.5 text-[#faa463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-sm">Item:</span>
                        <span className="[font-family:'Suprema-Regular',Helvetica] font-semibold text-[#404040] text-sm ml-2">{row.itemName}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#faa463]/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#faa463]/20">
                        <svg className="w-3.5 h-3.5 text-[#faa463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-sm">Tanggal:</span>
                        <span className="[font-family:'Suprema-Regular',Helvetica] font-semibold text-[#404040] text-sm ml-2">{row.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Desktop Profile Sidebar - Tidak berubah sama sekali */}
      <aside className="hidden lg:flex w-[280px] flex-shrink-0 bg-white rounded-[0px_17.83px_17.83px_0px] shadow-[0px_12.48px_37.45px_#080f340f] overflow-hidden">
        <div className="flex flex-col items-center gap-[20px] px-[21.4px] py-[24px] w-full">
          <header className="flex items-center justify-center w-full">
            <h2 className="font-[Suprema-SemiBold] font-semibold text-[#202020] text-[14.3px] tracking-[0] leading-[normal]">
              Your Profile
            </h2>
          </header>

          <div className="flex flex-col w-full items-center justify-center gap-[10px] px-[17.83px]">
           <div className="w-[70px] h-[70px] rounded-[16px] overflow-hidden">
  <img
    src={normalizeUrl(user?.profile_image) || "https://c.animaapp.com/mgrgm0itqrnJXn/img/profile.png"}
    alt={user?.name || 'User'}
    className="w-full h-full object-cover"
  />
</div>
            <div className="flex flex-col items-center gap-[4px] w-full">
              <h3 className="font-[Suprema-SemiBold] font-semibold text-[#202020] text-[13px] text-center tracking-[0] leading-[normal]">
                {user?.name || 'User'}
              </h3>

              <p className="font-[Suprema-Regular] font-normal text-[#7e7e7e] text-[10px] text-center tracking-[0] leading-[normal]">
                {user?.role || 'Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/settings">
              <button className="h-[32px] w-[32px] rounded-[44.59px] border-[0.89px] border-[#9e9e9e] hover:bg-gray-100 transition-colors flex items-center justify-center bg-white">
                <svg className="w-[13px] h-[13px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </aside>

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

export default Dashboard;