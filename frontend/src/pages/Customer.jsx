import { Edit2Icon, Trash2Icon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import settingsIcon from '../assets/settingIcon.svg';
import { useAuth, useCustomers } from "../hooks/useAPI";
import { fileAPI } from "../services/api";
import { normalizeUrl } from '../utils/url';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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


// Image Lightbox Component
const ImageLightbox = ({ isOpen, onClose, imageUrl }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop div, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-4 cursor-pointer"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:opacity-70 transition-opacity z-10 cursor-pointer"
        title="Close (ESC)"
      >
        <XIcon className="w-6 sm:w-8 h-6 sm:h-8" />
      </button>

      {/* Instructions for closing */}
      <div className="absolute top-4 left-4 text-white text-sm opacity-75 z-10 pointer-events-none">
        <p className="hidden sm:block">Press ESC or click outside to close</p>
        <p className="sm:hidden">Tap outside to close</p>
      </div>

      {/* Image */}
      <img
        src={imageUrl}
        alt="Full size"
        className="max-w-full max-h-full object-contain cursor-default"
        onClick={(e) => e.stopPropagation()}
        onLoad={(e) => {
          // Optional: Add fade-in effect when image loads
          e.target.style.opacity = '1';
        }}
        style={{ opacity: '0', transition: 'opacity 0.3s ease-in-out' }}
      />
    </div>
  );
};

const AttachmentPreviewModal = ({ isOpen, att, onClose }) => {
  if (!isOpen || !att) return null;
  const mime = String(att.mime_type || '').toLowerCase();
  const nameRef = String(att.stored_filename || att.original_filename || '').toLowerCase();
  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef);
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
  const ver = att.updated_at || att.created_at || '';
  const url = `${apiUrl}/files/raw/${att.id}${ver ? `?v=${encodeURIComponent(ver)}` : ''}`;
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

const EditCustomerModal = ({ isOpen, onClose, customer, onSave, attachments = [], customerId, onUpload, onRemoveAttachment, onPreview }) => {
  const [form, setForm] = useState(() => ({
    namaCustomer: customer?.namaCustomer || '',
    noHp: customer?.noHp || '',
    alamat: customer?.alamat || '',
    google_maps: customer?.googleMaps || ''
  }));
  useEffect(() => {
    if (isOpen && customer) {
      setForm({
        namaCustomer: customer.namaCustomer || '',
        noHp: customer.noHp || '',
        alamat: customer.alamat || '',
        google_maps: customer.googleMaps || ''
      });
    }
  }, [isOpen, customer]);
  const setVal = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const [imageFail, setImageFail] = useState({});
  const handleSelectFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    const first = files[0];
    if (first && customerId && onUpload) await onUpload([first]);
    e.target.value = '';
  };
  if (!isOpen || !customer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[800px] p-4 sm:p-6 transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[16px] sm:text-[18px]">Edit Customer</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Nama Customer</label>
            <input value={form.namaCustomer} onChange={e => setVal('namaCustomer', e.target.value)} className="w-full px-3 py-[17.1px] bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-[10.3px]" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">No Hp</label>
            <input value={form.noHp} onChange={e => setVal('noHp', e.target.value)} className="w-full px-3 py-[17.1px] bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-[10.3px]" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Alamat</label>
            <textarea value={form.alamat} onChange={e => setVal('alamat', e.target.value)} className="w-full px-3 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-[10.3px]" rows={3} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Google Maps</label>
            <input value={form.google_maps} onChange={e => setVal('google_maps', e.target.value)} className="w-full px-3 py-[17.1px] bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-[10.3px]" />
          </div>
        </div>
        {Array.isArray(attachments) && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[14px]">Lampiran</h3>
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#197bbd] hover:bg-[#1569a3] text-white rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[12px] cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span>{attachments.length > 0 ? 'Ganti Lampiran' : 'Tambah Lampiran'}</span>
                <input type="file" onChange={handleSelectFiles} className="hidden" />
              </label>
            </div>
            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {[...attachments].sort((a,b) => {
                  if (a.created_at && b.created_at) return new Date(b.created_at) - new Date(a.created_at);
                  return (b.id || 0) - (a.id || 0);
                }).map(att => {
                  const mime = String(att.mime_type || '').toLowerCase();
                  const nameRef = String(att.stored_filename || att.original_filename || '').toLowerCase();
                  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef);
                  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
                  const ver = att.updated_at || att.created_at || '';
                  const url = `${apiUrl}/files/raw/${att.id}${ver ? `?v=${encodeURIComponent(ver)}` : ''}`;
                  return (
                    <div key={att.id} className="relative group">
                      {isImage && !imageFail[att.id] ? (
                        <img className="w-full h-[140px] sm:h-[160px] lg:h-[180px] rounded-[12px] object-cover cursor-pointer" alt={att.original_filename} src={url} onError={() => setImageFail(prev => ({ ...prev, [att.id]: true }))} onClick={() => onPreview && onPreview(att)} />
                      ) : (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3 text-[#404040] text-xs">
                          <svg className="w-4 h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h10M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          <span className="truncate">{att.original_filename}</span>
                        </a>
                      )}
                      <button onClick={() => onRemoveAttachment && onRemoveAttachment(att.id)} className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 border border-[#e5e5e5] rounded-full p-1">
                        <svg className="w-4 h-4 text-[#e53935]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[#9e9e9e] [font-family:'Inter',Helvetica] text-[12px]">Belum ada lampiran</div>
            )}
          </div>
        )}

        <div className="border-t border-[#e5e5e5] pt-4 mt-4 flex items-center justify-end gap-3">
          <button onClick={() => onSave(form)} className="bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-[12px] px-6 py-3 rounded-[12.45px] h-auto transition-all">Simpan</button>
          <button onClick={onClose} className="px-6 py-3 border border-[#cccccccc] rounded-[12.45px] [font-family:'Quicksand',Helvetica] font-bold text-[#404040] text-[12px] hover:bg-gray-50 transition-colors">Batal</button>
        </div>
      </div>
    </div>
  );
};

const DeleteCustomerModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[480px] p-4 sm:p-5 transform transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#fff3e0] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#e65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v3h6V4a1 1 0 00-1-1m-4 0h4" /></svg>
          </div>
          <h3 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[16px]">Hapus Customer</h3>
        </div>
        <p className="[font-family:'Inter',Helvetica] text-[#696969] text-[12px] mb-4">Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data customer ini?</p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2 border border-[#cccccccc] rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[#404040] text-[12px] hover:bg-gray-50">Batal</button>
          <button onClick={onConfirm} className="px-5 py-2 bg-[#e53935] hover:bg-[#d32f2f] text-white rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[12px]">Hapus</button>
        </div>
      </div>
    </div>
  );
};

// Customer Detail Modal Component
const CustomerDetailModal = ({ isOpen, onClose, customer, attachments, onPreview, onClosePreview, onEdit, onDelete }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isOpen || !customer) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-[20px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[750px] max-h-[85vh] overflow-y-auto transform transition-all duration-300 scale-100">
          <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
            <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="flex flex-col gap-0.5 flex-1">
                <h1 className="text-left [font-family:'Inter',Helvetica] font-bold text-black text-base sm:text-[18px] tracking-[0] leading-[24px]">
                  Detail Customer
                </h1>
                <p className="text-left [font-family:'Inter',Helvetica] font-normal text-[#9e9e9e] text-xs sm:text-[13px] tracking-[0] leading-[18px]">
                  Detail customer berisi data identitas, nomor telepon, alamat lengkap, dan tautan lokasi
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={onEdit} className="h-auto rounded-[12px] border border-[#e0e0e0] px-2 sm:px-3 py-2 gap-1.5 inline-flex items-center hover:bg-gray-50 transition-colors">
                  <span className="hidden sm:inline [font-family:'Inter',Helvetica] font-medium text-[#404040] text-[13px] tracking-[0] leading-[18px]">
                    Edit
                  </span>
                  <Edit2Icon className="w-[15px] h-[15px] text-[#404040]" />
                </button>

                <button onClick={onDelete} className="h-auto rounded-[12px] border border-[#e0e0e0] px-2 sm:px-3 py-2 gap-1.5 inline-flex items-center hover:bg-gray-50 transition-colors">
                  <span className="hidden sm:inline [font-family:'Inter',Helvetica] font-medium text-[#404040] text-[13px] tracking-[0] leading-[18px]">
                    Hapus
                  </span>
                  <Trash2Icon className="w-[15px] h-[15px] text-[#404040]" />
                </button>

                <button 
                  onClick={onClose}
                  className="h-auto w-auto p-1 hover:opacity-70 transition-opacity"
                >
                  <XIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[#404040]" />
                </button>
              </div>
            </header>

            <div className="flex flex-col gap-4 sm:gap-5">
              {(() => {
                const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
                const imageAtt = Array.isArray(attachments) ? attachments.find(att => {
                  const mime = String(att?.mime_type || '').toLowerCase();
                  const nameRef = String(att?.stored_filename || att?.original_filename || '').toLowerCase();
                  return mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef);
                }) : null;
                const heroUrl = imageAtt ? `${apiUrl}/files/raw/${imageAtt.id}` : (customer.image ? normalizeUrl(customer.image) : null);
                if (!heroUrl) return null;
                return (
                  <div className="relative group">
                    <img
                      className="w-full h-[200px] sm:h-[240px] rounded-[16px] object-cover cursor-pointer transition-opacity hover:opacity-90"
                      alt="Customer location"
                      src={heroUrl}
                      onClick={() => { onClosePreview && onClosePreview(); setIsLightboxOpen(true); }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black bg-opacity-50 rounded-full p-3">
                        <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {Array.isArray(attachments) && attachments.length > 0 && (() => {
                const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
                const imageAtt = attachments.find(att => {
                  const mime = String(att?.mime_type || '').toLowerCase();
                  const nameRef = String(att?.stored_filename || att?.original_filename || '').toLowerCase();
                  return mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef);
                });
                const list = imageAtt ? attachments.filter(a => a.id !== imageAtt.id) : attachments;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {list.map(att => {
                    const mime = String(att.mime_type || '').toLowerCase();
                    const nameRef = String(att.stored_filename || att.original_filename || '').toLowerCase();
                    const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef);
                    const url = `${apiUrl}/files/raw/${att.id}`;
                    return (
                      <div key={att.id} className="relative group">
                        {isImage ? (
                          <img
                            className="w-full h-[140px] sm:h-[160px] rounded-[12px] object-cover cursor-pointer transition-opacity hover:opacity-90"
                            alt={att.original_filename}
                            src={url}
                            onClick={() => { setIsLightboxOpen(false); onPreview && onPreview(att); }}
                          />
                        ) : (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3 text-[#404040] text-xs">
                            <svg className="w-4 h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h10M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{att.original_filename}</span>
                          </a>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-black bg-opacity-50 rounded-full p-2">
                            <svg className="w-4 sm:w-5 h-4 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })()}

              <div className="flex flex-col gap-4 sm:gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-left [font-family:'Inter',Helvetica] font-bold text-black text-sm sm:text-[15px] tracking-[0] leading-[20px]">
                      Nama Customer
                    </h2>
                    <p className="text-left text-[#9e9e9e] [font-family:'Inter',Helvetica] font-normal text-xs sm:text-[13px] tracking-[0] leading-[18px]">
                      {customer.namaCustomer}
                    </p>
                  </div>

                  <div className="text-left flex flex-col gap-1">
                    <h2 className="text-left [font-family:'Inter',Helvetica] font-bold text-black text-sm sm:text-[15px] tracking-[0] leading-[20px]">
                      No Hp Customer
                    </h2>
                    <p className="text-left text-[#9e9e9e] [font-family:'Inter',Helvetica] font-normal text-xs sm:text-[13px] tracking-[0] leading-[18px]">
                      {customer.noHp}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-left [font-family:'Inter',Helvetica] font-bold text-black text-sm sm:text-[15px] tracking-[0] leading-[20px]">
                      Alamat
                    </h2>
                    <p className="text-left [font-family:'Inter',Helvetica] font-normal text-[#9e9e9e] text-xs sm:text-[13px] tracking-[0] leading-[18px]">
                      {customer.alamat}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-left [font-family:'Inter',Helvetica] font-bold text-black text-sm sm:text-[15px] tracking-[0] leading-[20px]">
                      Google Maps
                    </h2>
                    <a
                      href={customer.googleMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-left text-[#9e9e9e] [font-family:'Inter',Helvetica] font-normal text-xs sm:text-[13px] tracking-[0] leading-[18px] underline break-all hover:text-[#5aa6e8] transition-colors"
                    >
                      {customer.googleMaps}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
        const imageAtt = Array.isArray(attachments) ? attachments.find(att => {
          const mime = String(att?.mime_type || '').toLowerCase();
          const nameRef = String(att?.stored_filename || att?.original_filename || '').toLowerCase();
          return mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef);
        }) : null;
        const heroUrl = imageAtt ? `${apiUrl}/files/raw/${imageAtt.id}` : (customer?.image ? normalizeUrl(customer.image) : null);
        return (
          <ImageLightbox 
            isOpen={isLightboxOpen} 
            onClose={() => setIsLightboxOpen(false)} 
            imageUrl={heroUrl}
          />
        );
      })()}
    </>
  );
};

// Export Modal Component
const ExportModal = ({ isOpen, onClose, rows = [] }) => {

  if (!isOpen) return null;

  const handleExportPDF = () => {
    const head = [["Nama Customer","No Hp","Alamat","Google Maps"]];
    const body = (Array.isArray(rows) ? rows : []).map(r => [
      r.namaCustomer || "",
      r.noHp || "",
      r.alamat || "",
      r.googleMaps || ""
    ]);
    const doc = new jsPDF();
    autoTable(doc, { head, body, styles: { fontSize: 8 } });
    const fn = `Customer_Report.pdf`;
    doc.save(fn);
  };

  const handleExportExcel = () => {
    const data = (Array.isArray(rows) ? rows : []).map(r => ({
      Nama_Customer: r.namaCustomer || "",
      No_Hp: r.noHp || "",
      Alamat: r.alamat || "",
      Google_Maps: r.googleMaps || ""
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer');
    const fn = `Customer_Report.xlsx`;
    XLSX.writeFile(wb, fn);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[720px] overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-7 pt-5 pb-4 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#FFF1E6] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#fbaf77]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v8M12 16l4-4m-4 4l-4-4m4 4V8" />
              </svg>
            </div>
            <div className="text-left">
              <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[16px] sm:text-[20px] leading-[normal]">Export Report Customer</h2>
              <p className="[font-family:'Inter',Helvetica] text-[#9e9e9e] text-[10px] sm:text-[11px]">Pilih format untuk menyimpan data list customer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-2 p-4 rounded-[12px] border border-[#e5e5e5] hover:border-[#fca5a5] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#fee2e2] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#f87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 3h16v18H4zM8 7h8M8 11h8M8 15h5" />
                  </svg>
                </div>
                <span className="[font-family:'Suprema-SemiBold',Helvetica] text-[#404040] text-[13px]">Format PDF</span>
              </div>
              <p className="[font-family:'Inter',Helvetica] text-[#9e9e9e] text-[10px]">Cocok untuk berbagi dan mencetak</p>
              <button
                onClick={handleExportPDF}
                className="mt-2 bg-[#f87171] hover:bg-[#ef4444] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs px-4 py-2.5 rounded-[10px] shadow-sm hover:shadow-md"
              >
                Export PDF
              </button>
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-[12px] border border-[#e5e5e5] hover:border-[#86efac] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#dcfce7] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#34d399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4zM8 9h8M8 13h4" />
                  </svg>
                </div>
                <span className="[font-family:'Suprema-SemiBold',Helvetica] text-[#404040] text-[13px]">Format Excel</span>
              </div>
              <p className="[font-family:'Inter',Helvetica] text-[#9e9e9e] text-[10px]">Ideal untuk analisis dan editing data</p>
              <button
                onClick={handleExportExcel}
                className="mt-2 bg-[#34d399] hover:bg-[#22c55e] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs px-4 py-2.5 rounded-[10px] shadow-sm hover:shadow-md"
              >
                Export Excel
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#cccccccc] rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[#404040] text-[12px] hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Customer = () => {
  const [searchNamaCustomer, setSearchNamaCustomer] = useState("");
  const [searchNoHp, setSearchNoHp] = useState("");
  const [searchAlamat, setSearchAlamat] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAttachments, setCustomerAttachments] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, logout } = useAuth();

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

  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const resp = await fileAPI.getAll({ customer_id: customer.id });
      const data = resp?.data ?? resp;
      setCustomerAttachments(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch {
      setCustomerAttachments([]);
    }
    setIsDetailModalOpen(true);
  };

  const { customers, updateCustomer, deleteCustomer } = useCustomers();
  const refetchCustomerAttachments = async (id) => {
    try {
      const resp = await fileAPI.getAll({ customer_id: id });
      const data = resp?.data ?? resp;
      setCustomerAttachments(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch { setCustomerAttachments([]); }
  };
  const handleUploadCustomerFiles = async (files) => {
    if (!selectedCustomer) return;
    const arr = Array.isArray(files) ? files : [files];
    const first = arr[0];
    try {
      const existing = Array.isArray(customerAttachments) ? customerAttachments : [];
      for (const att of existing) { try { await fileAPI.delete(att.id); } catch { void 0 } }
      if (first) { await fileAPI.upload(first, 'customer_proof', { customer_id: selectedCustomer.id }); }
    } catch { void 0 }
    await refetchCustomerAttachments(selectedCustomer.id);
  };
  const handleRemoveCustomerAttachment = async (id) => {
    if (!selectedCustomer) return;
    try { await fileAPI.delete(id); } catch { void 0 }
    await refetchCustomerAttachments(selectedCustomer.id);
  };
  const sourceData = Array.isArray(customers) ? customers.map(r => ({
    id: r.id,
    namaCustomer: r.namaCustomer || r.nama_customer || "",
    noHp: r.noHp || r.no_hp || "",
    alamat: r.alamat || "",
    googleMaps: r.google_maps || r.googleMaps || "",
    image: r.image || "",
  })) : [];
  const filteredData = sourceData.filter((row) => {
    const matchesNama = row.namaCustomer
      .toLowerCase()
      .includes(searchNamaCustomer.toLowerCase());
    const matchesNoHp = row.noHp
      .toLowerCase()
      .includes(searchNoHp.toLowerCase());
    const matchesAlamat = row.alamat
      .toLowerCase()
      .includes(searchAlamat.toLowerCase());
    return matchesNama && matchesNoHp && matchesAlamat;
  });

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
      <main className="flex-1 px-4 sm:px-6 lg:px-[30px] py-4 lg:py-[24px] overflow-auto pt-20 lg:pt-[24px]">
        <div className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          {/* Header - Desktop Only */}
          <div className="hidden lg:flex items-center justify-between mb-7">
            <h1 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[23.8px] tracking-[0] leading-[normal]">
              Informasi Customer
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
            Informasi Customer
          </h1>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4 sm:mb-7 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <Link to="/customer/input" className="flex-1 sm:flex-initial">
                <button className="w-full sm:w-auto bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs sm:text-[10.2px] px-3 sm:px-3.5 py-2.5 rounded-[12.45px] h-auto transition-colors duration-300 cursor-pointer">
                    New
                </button>
            </Link>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="w-full sm:w-auto bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-xs sm:text-[10.2px] px-3 sm:px-3.5 py-2.5 rounded-[12.45px] h-auto transition-colors duration-300 cursor-pointer"
            >
              Report
            </button>
          </div>

          {/* Search Filters */}
          <div className="text-left mb-4 sm:mb-7 rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms] bg-white">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-2 flex-1 sm:w-[280px] sm:flex-initial">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Nama Customer
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 sm:left-[13.68px] top-1/2 -translate-y-1/2 w-3 sm:w-[13.68px] h-3 sm:h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="Nama Customer"
                      value={searchNamaCustomer}
                      onChange={(e) => setSearchNamaCustomer(e.target.value)}
                      className="w-full pl-8 sm:pl-[35px] pr-3 sm:pr-[13.68px] py-3 sm:py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1 sm:w-[280px] sm:flex-initial">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    No Hp
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 sm:left-[13.68px] top-1/2 -translate-y-1/2 w-3 sm:w-[13.68px] h-3 sm:h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="No Hp Customer"
                      value={searchNoHp}
                      onChange={(e) => setSearchNoHp(e.target.value)}
                      className="w-full pl-8 sm:pl-[35px] pr-3 sm:pr-[13.68px] py-3 sm:py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1 sm:w-[280px] sm:flex-initial">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Alamat
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 sm:left-[13.68px] top-1/2 -translate-y-1/2 w-3 sm:w-[13.68px] h-3 sm:h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="Alamat Customer"
                      value={searchAlamat}
                      onChange={(e) => setSearchAlamat(e.target.value)}
                      className="w-full pl-8 sm:pl-[35px] pr-3 sm:pr-[13.68px] py-3 sm:py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-xs sm:text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
            <section className="w-full flex flex-col gap-[15px]">
              <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6">
                <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-base sm:text-[18px] tracking-[0] leading-[normal] mb-4 text-left">
                  List Customer
                </h2>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-none">
                        <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-3 w-[200px]">
                          Nama Customer
                        </th>
                        <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-3 w-[140px]">
                          No Hp Customer
                        </th>
                        <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-3">
                          Alamat
                        </th>
                        <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-3 w-[120px]">
                          Google Maps
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedData.length > 0 ? (
                        displayedData.map((row, index) => (
                          <tr
                            key={`customer-${row.namaCustomer}-${index}`}
                            className="border-b border-[#e5e5e5] text-left"
                          >
                            <td 
                              className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[12.8px] tracking-[0] leading-[normal] underline py-3 align-top cursor-pointer hover:text-[#faa463] transition-colors"
                              onClick={() => handleCustomerClick(row)}
                            >
                              {row.namaCustomer}
                            </td>
                            <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3 align-top">
                              {row.noHp}
                            </td>
                            <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3 align-top">
                              {row.alamat}
                            </td>
                            <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3 align-top">
                              <a 
                                href={row.googleMaps} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline hover:text-[#5aa6e8] transition-colors inline-block"
                              >
                                View Map
                              </a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-8 text-[#9e9e9e] [font-family:'Inter',Helvetica]"
                          >
                            No data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {displayedData.length > 0 ? (
                    displayedData.map((row, index) => (
                      <div
                        key={`customer-mobile-${row.namaCustomer}-${index}`}
                        onClick={() => handleCustomerClick(row)}
                        className="bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3.5 cursor-pointer hover:border-[#faa463] hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[13px] mb-1 leading-tight underline truncate">
                              {row.namaCustomer}
                            </p>
                            <p className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#9e9e9e] text-[11px]">
                              {row.noHp}
                            </p>
                          </div>
                          <a 
                            href={row.googleMaps} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="[font-family:'Lato',Helvetica] font-bold text-[10px] px-2.5 py-1 rounded-md bg-[#e8f5e9] text-[#2e7d32] whitespace-nowrap flex-shrink-0 hover:bg-[#dcedc8] transition-colors"
                          >
                            View Map
                          </a>
                        </div>
                        
                        <div className="pt-2 border-t border-[#e5e5e5]">
                          <div className="flex items-start gap-2">
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[45px]">Alamat:</span>
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1 line-clamp-2">{row.alamat}</span>
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

          {/* Pagination Controls */}
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

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} rows={filteredData} />
      <CustomerDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        customer={selectedCustomer}
        attachments={customerAttachments}
        onPreview={(att) => { setPreviewAttachment(att); setIsPreviewOpen(true); }}
        onClosePreview={() => { setIsPreviewOpen(false); setPreviewAttachment(null); }}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      <AttachmentPreviewModal isOpen={isPreviewOpen} att={previewAttachment} onClose={() => setIsPreviewOpen(false)} />

      <EditCustomerModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        customer={selectedCustomer}
        attachments={customerAttachments}
        customerId={selectedCustomer?.id}
        onUpload={handleUploadCustomerFiles}
        onRemoveAttachment={handleRemoveCustomerAttachment}
        onPreview={(att) => { setPreviewAttachment(att); setIsPreviewOpen(true); }}
        onSave={async (payload) => {
          if (!selectedCustomer) return;
          try {
            const res = await updateCustomer(selectedCustomer.id, payload);
            setIsEditModalOpen(false);
            if (res?.success) {
              const updated = res?.data?.data ?? res?.data;
              setSelectedCustomer(updated);
              await refetchCustomerAttachments(selectedCustomer.id);
            }
          } catch { void 0 }
        }}
      />

      <DeleteCustomerModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={async () => {
          if (!selectedCustomer) return;
          try {
            await deleteCustomer(selectedCustomer.id);
            setIsDeleteModalOpen(false);
            setIsDetailModalOpen(false);
            setSelectedCustomer(null);
            setCustomerAttachments([]);
          } catch { void 0 }
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

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Customer;