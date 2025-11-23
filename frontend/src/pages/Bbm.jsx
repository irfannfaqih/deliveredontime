import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import settingsIcon from '../assets/settingIcon.svg';
import { useAuth, useBBM } from "../hooks/useAPI";
import { normalizeUrl } from '../utils/url';
import { fileAPI } from "../services/api";

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
    isActive: true,
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


// Detail BBM Modal Component
const DetailBBMModal = ({ isOpen, onClose, data, attachments, onPreview, onEdit, onDelete }) => {
  const [imageFail, setImageFail] = useState({})
  if (!isOpen || !data) return null;

  const detailFields = [
    {
      label: "Tanggal",
      value: data.tanggal,
      column: "left",
    },
    {
      label: "Kilometer Awal",
      value: data.kilometerAwal,
      column: "left",
    },
    {
      label: "Total Kilometer",
      value: data.totalKilometer,
      column: "left",
    },
    {
    label: "Jumlah BBM", // TAMBAH FIELD INI
    value: `Rp ${data.jumlahBbmRupiahFormatted}`,
    column: "left",
    },
    {
      label: "Mesengger",
      value: data.messenger,
      column: "right",
    },
    {
      label: "Kilometer Akhir",
      value: data.kilometerAkhir,
      column: "right",
    },
    
  ];

  const leftFields = detailFields.filter((field) => field.column === "left");
  const rightFields = detailFields.filter((field) => field.column === "right");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[720px] lg:max-w-[860px] p-4 sm:p-6 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <header className="mb-4 sm:mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="font-['Inter',Helvetica] font-bold text-[#0b0b0b] text-sm sm:text-base tracking-[-0.20px] leading-[24px] text-left">
              Detail Pergantian BBM
            </h1>

            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="h-auto rounded-[12px] border border-[#cdcdcd] px-2 py-2 flex items-center gap-0.5 hover:bg-gray-50 transition-colors">
                <span className="hidden sm:inline font-['Inter',Helvetica] font-medium text-[#63676a] text-xs tracking-[0] leading-4 text-left">
                  Edit
                </span>
                <img
                  className="w-5 h-5"
                  alt="Edit"
                  src="https://c.animaapp.com/mh45d3fhl0zAog/img/frame-72.svg"
                />
              </button>

              <button onClick={onDelete} className="h-auto rounded-[12px] border border-[#cdcdcd] px-2 py-2 flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
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




          <p className="max-w-full sm:max-w-[520px] text-[#c7c7c7] text-xs leading-4 font-normal text-left">
            Menampilkan detail pergantian BBM yang diisikan oleh messenger, termasuk informasi tanggal, Kilometer Awal, Kilometer Akhir, Total Kilometer, Mesengger dan Attachment
          </p>
        </header>

        {Array.isArray(attachments) && attachments.length > 0 && (
          <div className="mb-6">
            <div className="font-['Inter',Helvetica] font-bold text-black text-sm tracking-[-0.20px] leading-5 mb-2 text-left">
              Lampiran
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {attachments.map(att => {
                const mime = String(att.mime_type || '').toLowerCase();
                const nameRef = String(att.stored_filename || att.original_filename || '').toLowerCase();
                const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef);
                const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
                const url = `${apiUrl}/files/raw/${att.id}`;
                return (
                  <div key={att.id} className="relative group">
                    {isImage && !imageFail[att.id] ? (
                      <img
                        className="w-full h-[140px] sm:h-[160px] lg:h-[180px] rounded-[12px] object-cover cursor-pointer transition-opacity hover:opacity-90"
                        alt={att.original_filename}
                        src={url}
                        onError={() => setImageFail(prev => ({ ...prev, [att.id]: true }))}
                        onClick={() => onPreview && onPreview(att)}
                      />
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3 text-[#404040] text-xs">
                        <svg className="w-4 h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h10M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{att.original_filename}</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-12">
          <div className="flex flex-col gap-5">
            {leftFields.map((field, index) => (
              <div key={`left-${index}`} className="flex flex-col gap-0.5 text-left">
                <div className="font-['Inter',Helvetica] font-bold text-black text-sm tracking-[-0.20px] leading-5 text-left">
                  {field.label}
                </div>
                <div className="text-xs font-normal text-[#c7c7c7] leading-4 text-left">
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

const AttachmentPreviewModal = ({ isOpen, att, onClose }) => {
  if (!isOpen || !att) return null;
  const mime = String(att.mime_type || '').toLowerCase();
  const nameRef = String(att.stored_filename || att.original_filename || '').toLowerCase();
  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef);
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
  const url = `${apiUrl}/files/raw/${att.id}`;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-[96vw] sm:max-w-[90vw] lg:max-w-[80vw] h-auto">
        <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow">
          <svg className="w-5 h-5 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {isImage ? (
          <img src={url} alt={att.original_filename} className="w-full max-h-[85vh] object-contain rounded-[12px] bg-black" />
        ) : (
          <div className="bg-white rounded-[12px] p-4">
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-3 bg-[#197bbd] hover:bg-[#1569a3] text-white rounded-[10px]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" /></svg>
              <span>Buka Lampiran</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const EditBBMModal = ({ isOpen, onClose, data, onSave }) => {
  const base = data || {};
  const [form, setForm] = useState({
    tanggal: base.tanggalRaw || '',
    kilometer_awal: Number(base.kilometerAwal || 0) || 0,
    kilometer_akhir: Number(base.kilometerAkhir || 0) || 0,
    jumlah_bbm_rupiah: Number(base.jumlahBbmRupiah || 0) || 0,
    messenger: base.messenger || ''
  });
  const [errors, setErrors] = useState({});
  if (!isOpen || !data) return null;
  const onChange = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };
  const validate = () => {
    const next = {};
    const tgl = String(form.tanggal || '').trim();
    const ms = String(form.messenger || '').trim();
    const awalRaw = String(form.kilometer_awal ?? '').trim();
    const akhirRaw = String(form.kilometer_akhir ?? '').trim();
    const bbmRaw = String(form.jumlah_bbm_rupiah ?? '').trim();
    const awal = awalRaw === '' ? NaN : Number(awalRaw);
    const akhir = akhirRaw === '' ? NaN : Number(akhirRaw);
    const bbm = bbmRaw === '' ? NaN : Number(bbmRaw);
    if (!tgl) next['tanggal'] = 'Wajib diisi';
    if (!ms) next['messenger'] = 'Wajib diisi';
    if (awalRaw === '') next['kilometer_awal'] = 'Wajib diisi';
    else if (Number.isNaN(awal)) next['kilometer_awal'] = 'Harus angka';
    else if (awal < 0) next['kilometer_awal'] = 'Tidak boleh negatif';
    if (akhirRaw === '') next['kilometer_akhir'] = 'Wajib diisi';
    else if (Number.isNaN(akhir)) next['kilometer_akhir'] = 'Harus angka';
    else if (akhir < awal) next['kilometer_akhir'] = 'Harus ≥ kilometer awal';
    if (bbmRaw === '') next['jumlah_bbm_rupiah'] = 'Wajib diisi';
    else if (Number.isNaN(bbm)) next['jumlah_bbm_rupiah'] = 'Harus angka';
    else if (bbm < 0) next['jumlah_bbm_rupiah'] = 'Tidak boleh negatif';
    return next;
  };
  const save = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).filter(k => next[k]).length) return;
    const total = Number(form.kilometer_akhir) - Number(form.kilometer_awal);
    const payload = {
      tanggal: form.tanggal,
      kilometer_awal: Number(form.kilometer_awal),
      kilometer_akhir: Number(form.kilometer_akhir),
      total_kilometer: isNaN(total) ? undefined : total,
      jumlah_bbm_rupiah: Number(form.jumlah_bbm_rupiah),
      messenger: form.messenger
    };
    onSave && onSave(payload);
  };
  const formatDateInput = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch { return String(d); }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[720px] lg:max-w-[860px] p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[16px]">Edit BBM</h2>
          <button onClick={onClose} className="h-5 w-5 p-0 flex items-center justify-center hover:bg-gray-100 rounded transition-colors">
            <img className="w-5 h-5" alt="Close" src="https://c.animaapp.com/mh45d3fhl0zAog/img/close.svg" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#63676a]">Tanggal</span>
            <input type="date" className={`border rounded-[10px] p-2 text-xs ${errors.tanggal ? 'border-red-500' : 'border-[#cccccccc]'}`} value={formatDateInput(form.tanggal)} onChange={e => onChange('tanggal', e.target.value)} />
            {errors.tanggal && <span className="text-red-600 text-[10px] mt-0.5">{errors.tanggal}</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#63676a]">Messenger</span>
            <input className={`border rounded-[10px] p-2 text-xs ${errors.messenger ? 'border-red-500' : 'border-[#cccccccc]'}`} value={form.messenger} onChange={e => onChange('messenger', e.target.value)} />
            {errors.messenger && <span className="text-red-600 text-[10px] mt-0.5">{errors.messenger}</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#63676a]">Kilometer Awal</span>
            <input type="number" min="0" className={`border rounded-[10px] p-2 text-xs ${errors.kilometer_awal ? 'border-red-500' : 'border-[#cccccccc]'}`} value={form.kilometer_awal} onChange={e => onChange('kilometer_awal', e.target.value)} />
            {errors.kilometer_awal && <span className="text-red-600 text-[10px] mt-0.5">{errors.kilometer_awal}</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#63676a]">Kilometer Akhir</span>
            <input type="number" min="0" className={`border rounded-[10px] p-2 text-xs ${errors.kilometer_akhir ? 'border-red-500' : 'border-[#cccccccc]'}`} value={form.kilometer_akhir} onChange={e => onChange('kilometer_akhir', e.target.value)} />
            {errors.kilometer_akhir && <span className="text-red-600 text-[10px] mt-0.5">{errors.kilometer_akhir}</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#63676a]">Jumlah BBM (Rp)</span>
            <input type="number" min="0" className={`border rounded-[10px] p-2 text-xs ${errors.jumlah_bbm_rupiah ? 'border-red-500' : 'border-[#cccccccc]'}`} value={form.jumlah_bbm_rupiah} onChange={e => onChange('jumlah_bbm_rupiah', e.target.value)} />
            {errors.jumlah_bbm_rupiah && <span className="text-red-600 text-[10px] mt-0.5">{errors.jumlah_bbm_rupiah}</span>}
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button onClick={save} className="px-4 py-2 bg-[#197bbd] hover:bg-[#1569a3] text-white rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[12px]">Simpan</button>
          <button onClick={onClose} className="px-4 py-2 bg-white border border-[#cdcdcd] text-[#404040] rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[12px]">Batal</button>
        </div>
      </div>
    </div>
  );
};

const DeleteBBMModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[480px] p-4 sm:p-5 transform transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#fff3e0] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#e65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v3h6V4a1 1 0 00-1-1m-4 0h4" /></svg>
          </div>
          <h3 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[16px]">Hapus BBM</h3>
        </div>
        <p className="[font-family:'Inter',Helvetica] text-[#696969] text-[12px] mb-4">Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data BBM ini?</p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2 border border-[#cccccccc] rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[#404040] text-[12px] hover:bg-gray-50">Batal</button>
          <button onClick={onConfirm} className="px-5 py-2 bg-[#e53935] hover:bg-[#d32f2f] text-white rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[12px]">Hapus</button>
        </div>
      </div>
    </div>
  );
};

export const BBM = () => {
  const [searchKmAwal, setSearchKmAwal] = useState("");
  const [searchKmAkhir, setSearchKmAkhir] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [bbmAttachments, setBbmAttachments] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const navItems = useMemo(() => {
    const base = navigationItems.map(i => ({ ...i }));
    return user?.role === 'admin'
      ? [...base, { id: 'management', label: 'Users', icon: usersIcon, href: '/management', isActive: false }]
      : base;
  }, [user]);

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

  const formatDateText = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      const day = dt.getDate();
      const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
      return `${day} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
    } catch { return String(d); }
  };

  const toLocalYMD = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch { return String(d).slice(0, 10); }
  };

  const handleDateClick = async (row) => {
    setSelectedDetail(row);
    try {
      const resp = await fileAPI.getAll({ bbm_record_id: row.id });
      const data = resp?.data ?? resp;
      setBbmAttachments(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch {
      setBbmAttachments([]);
    }
    setIsDetailModalOpen(true);
  };

  const { bbmRecords, updateBBMRecord, deleteBBMRecord } = useBBM();
  const sourceData = Array.isArray(bbmRecords) ? bbmRecords.map(r => ({
    id: r.id,
    tanggal: formatDateText(r.tanggal || r.date || ""),
    tanggalRaw: r.tanggal || r.date || "",
    tanggalKey: toLocalYMD(r.tanggal || r.date || ""),
    kilometerAwal: String(r.kilometer_awal ?? r.km_awal ?? ""),
    kilometerAkhir: String(r.kilometer_akhir ?? r.km_akhir ?? ""),
    totalKilometer: String(r.total_kilometer ?? r.totalKm ?? ""),
    jumlahBbmRupiah: r.jumlah_bbm_rupiah ?? r.bbmRupiah ?? null,
    jumlahBbmRupiahFormatted: r.jumlah_bbm_rupiah ? new Intl.NumberFormat('id-ID').format(Number(r.jumlah_bbm_rupiah)) : "",
    messenger: r.messenger || "",
    attachment: r.attachment || "",
  })) : [];
  const filteredData = sourceData.filter((row) => {
    const matchesKmAwal = row.kilometerAwal
      .toLowerCase()
      .includes(searchKmAwal.toLowerCase());
    const matchesKmAkhir = row.kilometerAkhir
      .toLowerCase()
      .includes(searchKmAkhir.toLowerCase());
    const matchesDate = searchDate
      ? String(row.tanggalKey || '') === String(searchDate).slice(0, 10)
      : true;

    return matchesKmAwal && matchesKmAkhir && matchesDate;
  });

  const handlePreview = (att) => {
    setPreviewAttachment(att);
    setIsPreviewOpen(true);
  };

  const handleViewAttachment = async (row) => {
    try {
      const resp = await fileAPI.getAll({ bbm_record_id: row.id });
      const data = resp?.data ?? resp;
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      if (!Array.isArray(list) || !list.length) return;
      const pick = list.find(att => String(att?.mime_type || '').toLowerCase().startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(String(att?.stored_filename || att?.original_filename || '').toLowerCase())) || list[0];
      setPreviewAttachment(pick);
      setIsPreviewOpen(true);
    } catch (e) { void e }
  };

  const displayedData = filteredData.slice(0, entriesPerPage);

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
      <main className="flex-1 px-4 sm:px-6 lg:px-[30px] py-4 lg:py-[24px] overflow-auto max-h-screen pt-20 lg:pt-[24px]">
        <div className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          {/* Header - Desktop Only */}
          <div className="hidden lg:flex items-center justify-between mb-7">
            <h1 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[23.8px] tracking-[0] leading-[normal]">
              Pergantian BBM
            </h1>

            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[12.8px] tracking-[0] leading-[normal]">
                  {user?.name || 'User'}
                </span>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                     src={normalizeUrl(user?.profile_image) || "https://c.animaapp.com/mgrgm0itqrnJXn/img/profile.png"}
                     alt={user?.name || 'User'}
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
                      logout();
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
            Pergantian BBM
          </h1>

          <div className="flex items-center gap-2 mb-4 sm:mb-7 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <Link to="/bbm/input" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-[10.2px] px-3.5 py-2.5 rounded-[12.45px] h-auto transition-colors duration-300 cursor-pointer">
                New
              </button>
            </Link>
            
          </div>


          <div className="text-left mb-4 sm:mb-7 rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms] bg-white">
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Kilometer Awal
                  </label>
                  <div className="relative">
                    <svg className="absolute left-[13.68px] top-1/2 -translate-y-1/2 w-[13.68px] h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="Kilometer Awal"
                      value={searchKmAwal}
                      onChange={(e) => setSearchKmAwal(e.target.value)}
                      className="w-full pl-[35px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Kilometer Akhir
                  </label>
                  <div className="relative">
                    <svg className="absolute left-[13.68px] top-1/2 -translate-y-1/2 w-[13.68px] h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="Kilometer Akhir"
                      value={searchKmAkhir}
                      onChange={(e) => setSearchKmAkhir(e.target.value)}
                      className="w-full pl-[35px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Tanggal
                  </label>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full pl-[44px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
            <section className="w-full flex flex-col gap-[15px]">
              <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6 overflow-x-auto">
                <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[18px] tracking-[0] leading-[normal] mb-4 text-left">
                  History Pergantian BBM
                </h2>
                
                {/* Desktop Table */}
                <table className="hidden md:table w-full">
                  <thead>
                    <tr className="border-none">
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Tanggal
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Kilometer Awal
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Kilometer Akhir
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Total Kilometer
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Jumlah BBM</th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Mesengger
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Attachment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedData.length > 0 ? (
                      displayedData.map((row, index) => (
                        <tr
                          key={`bbm-${row.tanggal}-${index}`}
                          className="border-b border-[#e5e5e5] text-left"
                        >
                          <td 
                            onClick={() => handleDateClick(row)}
                            className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[12.8px] tracking-[0] leading-[normal] underline py-2 cursor-pointer hover:text-[#faa463] transition-colors"
                          >
                            {row.tanggal}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.kilometerAwal}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.kilometerAkhir}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.totalKilometer}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            Rp {row.jumlahBbmRupiahFormatted}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.messenger}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            <button onClick={() => handleViewAttachment(row)} className="underline hover:text-[#5aa6e8] transition-colors">
                              Lihat
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
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
                        key={`bbm-mobile-${row.tanggal}-${index}`}
                        onClick={() => handleDateClick(row)}
                        className="bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3.5 cursor-pointer hover:border-[#faa463] hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[13px] mb-1 leading-tight truncate">
                              {row.tanggal}
                            </p>
                            <p className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#9e9e9e] text-[11px]">
                              {row.messenger}
                            </p>
                          </div>
                          <button onClick={() => handleViewAttachment(row)} className="[font-family:'Lato',Helvetica] font-bold text-[10px] px-2.5 py-1 rounded-md bg-[#e8f5e9] text-[#2e7d32] whitespace-nowrap flex-shrink-0">
                            Lihat
                          </button>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-[#e5e5e5]">
                          <div className="flex items-start gap-2">
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[85px]">KM Awal:</span>
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.kilometerAwal}</span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[85px]">KM Akhir:</span>
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.kilometerAkhir}</span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[85px]">Total KM:</span>
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.totalKilometer}</span>
                            <div className="flex items-start gap-2">
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[85px]">BBM:</span>
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">Rp {row.jumlahBbmRupiahFormatted}</span>
                            </div>
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
            </section>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
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
              (Showing {displayedData.length} of {filteredData.length} entries)
            </span>
          </div>
        </div>
      </main>

      <DetailBBMModal 
        isOpen={isDetailModalOpen} 
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetail(null);
        }} 
        data={selectedDetail} 
        attachments={bbmAttachments}
        onPreview={handlePreview}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      <AttachmentPreviewModal 
        isOpen={isPreviewOpen} 
        att={previewAttachment} 
        onClose={() => { setIsPreviewOpen(false); setPreviewAttachment(null); }} 
      />

      <EditBBMModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        data={selectedDetail}
        onSave={async (payload) => {
          try {
            const r = await updateBBMRecord(selectedDetail.id, payload);
            setIsEditModalOpen(false);
            setIsDetailModalOpen(false);
            setSelectedDetail(null);
            if (!r?.success) console.error('BBM update error', r?.error);
          } catch (e) {
            console.error('BBM update error', e);
          }
        }}
      />

      <DeleteBBMModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          try {
            const r = await deleteBBMRecord(selectedDetail.id);
            setIsDeleteModalOpen(false);
            setIsDetailModalOpen(false);
            setSelectedDetail(null);
            setBbmAttachments([]);
            if (!r?.success) console.error('BBM delete error', r?.error);
          } catch (e) {
            console.error('BBM delete error', e);
          }
        }}
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

export default BBM;
import usersIcon from '../assets/users.svg';