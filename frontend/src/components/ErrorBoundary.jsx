import React from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#f5f5f5] w-full min-h-screen flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-6 sm:p-10 max-w-[640px] w-full text-center translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
            <div className="mb-4">
              <div className="mx-auto w-[72px] h-[72px] rounded-full bg-[#FFF1E6] flex items-center justify-center">
                <span className="font-[Suprema-SemiBold] text-[#faa463] text-2xl">Error</span>
              </div>
            </div>
            <h1 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[22px] sm:text-[24px] mb-2">Terjadi kesalahan tak terduga</h1>
            <p className="[font-family:'Inter',Helvetica] font-normal text-[#9e9e9e] text-[12px] sm:text-[13px] mb-6">Silakan muat ulang halaman atau kembali ke halaman utama.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-[12px] bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-[12px] transition-colors w-full sm:w-auto">Muat Ulang</button>
              <Link to="/dashboard" className="px-5 py-2.5 rounded-[12px] border border-[#e5e5e5] hover:bg-gray-50 text-[#404040] [font-family:'Quicksand',Helvetica] font-bold text-[12px] transition-colors w-full sm:w-auto">Ke Dashboard</Link>
              <Link to="/login" className="px-5 py-2.5 rounded-[12px] border border-[#e5e5e5] hover:bg-gray-50 text-[#404040] [font-family:'Quicksand',Helvetica] font-bold text-[12px] transition-colors w-full sm:w-auto">Masuk</Link>
            </div>
          </div>
          <style>{`
            @keyframes fade-in { from { opacity: 0; transform: translateY(-1rem); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fade-in 0.6s ease-out forwards; animation-delay: var(--animation-delay, 0ms); }
          `}</style>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

