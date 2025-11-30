import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAPI";

const ErrorPage = () => {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard" : "/login";
  const primaryText = user ? "Kembali ke Dashboard" : "Masuk";

  return (
    <div className="bg-[#f5f5f5] w-full min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-6 sm:p-10 max-w-[640px] w-full text-center translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
        <div className="mb-4">
          <div className="mx-auto w-[72px] h-[72px] rounded-full bg-[#FFF1E6] flex items-center justify-center">
            <span className="font-[Suprema-SemiBold] text-[#faa463] text-2xl">404</span>
          </div>
        </div>
        <h1 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[22px] sm:text-[24px] mb-2">Halaman tidak ditemukan</h1>
        <p className="[font-family:'Inter',Helvetica] font-normal text-[#9e9e9e] text-[12px] sm:text-[13px] mb-6">Link yang Anda akses tidak tersedia atau sudah dipindahkan. Pilih aksi di bawah untuk melanjutkan.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={primaryHref} className="px-5 py-2.5 rounded-[12px] bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-[12px] transition-colors w-full sm:w-auto">
            {primaryText}
          </Link>
          <Link to="/" className="px-5 py-2.5 rounded-[12px] border border-[#e5e5e5] hover:bg-gray-50 text-[#404040] [font-family:'Quicksand',Helvetica] font-bold text-[12px] transition-colors w-full sm:w-auto">
            Ke Beranda
          </Link>
        </div>
      </div>

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

export default ErrorPage;

