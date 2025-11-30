import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from 'xlsx';
import appLogoSvg from '../assets/logo.svg';
import settingsIcon from '../assets/settingIcon.svg';
import usersIcon from '../assets/users.svg';
import { useAuth, useDeliveries } from "../hooks/useAPI";
import { deliveredAPI, fileAPI, systemAPI } from "../services/api";
import { normalizeUrl } from '../utils/url';

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
    isActive: true,
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


// Opsi messenger akan dibangun dinamis dari data pengiriman

// Detail Modal Component
const DetailModal = ({ isOpen, onClose, data, attachments, onDelete, onEdit, onPreview }) => {
  const [imageFail, setImageFail] = useState({})
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[720px] lg:max-w-[860px] p-4 sm:p-6 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <header className="mb-4 sm:mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="font-['Inter',Helvetica] font-bold text-[#0b0b0b] text-sm sm:text-base tracking-[-0.20px] leading-[24px] text-left">
              Detail Delivered
            </h1>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button onClick={onEdit} className="h-auto rounded-[12px] border border-[#e0e0e0] px-2 sm:px-3 py-2 inline-flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                <span className="hidden sm:inline [font-family:'Inter',Helvetica] font-medium text-[#404040] text-[13px] tracking-[0] leading-[18px]">Edit</span>
                <svg className="w-[15px] h-[15px] text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" /></svg>
              </button>

              <button onClick={onDelete} className="h-auto rounded-[12px] border border-[#e0e0e0] px-2 sm:px-3 py-2 inline-flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                <span className="hidden sm:inline [font-family:'Inter',Helvetica] font-medium text-[#404040] text-[13px] tracking-[0] leading-[18px]">Hapus</span>
                <svg className="w-[15px] h-[15px] text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4" /></svg>
              </button>

              <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <p className="max-w-full sm:max-w-[420px] text-[#c7c7c7] text-xs leading-4 font-normal text-left">
            Menampilkan detail pengiriman invoice oleh messenger, termasuk
            informasi customer, tanggal pengiriman, serta keterangan tambahan
            terkait proses pengantaran.
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
                const nameRef = String(att.original_filename || att.stored_filename || '').toLowerCase();
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

const EditModal = ({ isOpen, onClose, data, messengerOptions, onSave, attachments, deliveryId, onUpload, onRemoveAttachment, onPreview }) => {
  const formatDateInput = (d) => {
    if (!d) return ''
    try {
      const dt = new Date(d)
      const yyyy = dt.getFullYear()
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const dd = String(dt.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    } catch { return String(d).slice(0,10) }
  }
  const [form, setForm] = useState(() => ({
    invoice: data?.invoice || '',
    customer: data?.customer || '',
    item: data?.item || '',
    sentDate: formatDateInput(data?.sentDateRaw || ''),
    deliveredDate: formatDateInput(data?.deliveredDateRaw || ''),
    messenger: data?.messenger || '',
    recipient: data?.recipient || '',
    notes: data?.notes || '',
    status: data?.status || (() => {
      const s = formatDateInput(data?.sentDateRaw || '')
      const r = formatDateInput(data?.deliveredDateRaw || '')
      if (!s || !r) return 'Pending'
      try {
        const days = Math.floor((new Date(s).getTime() - new Date(r).getTime()) / (1000*60*60*24))
        return days > 2 ? 'Out of time' : 'On time'
      } catch { return 'Pending' }
    })(),
  }))

  useEffect(() => {
    if (isOpen) {
      setForm({
        invoice: data?.invoice || '',
        customer: data?.customer || '',
        item: data?.item || '',
        sentDate: formatDateInput(data?.sentDateRaw || ''),
        deliveredDate: formatDateInput(data?.deliveredDateRaw || ''),
        messenger: data?.messenger || '',
        recipient: data?.recipient || '',
        notes: data?.notes || '',
        status: data?.status || (() => {
          const s = formatDateInput(data?.sentDateRaw || '')
          const r = formatDateInput(data?.deliveredDateRaw || '')
          if (!s || !r) return 'Pending'
          try {
            const days = Math.floor((new Date(s).getTime() - new Date(r).getTime()) / (1000*60*60*24))
            return days > 2 ? 'Out of time' : 'On time'
          } catch { return 'Pending' }
        })(),
      })
    }
  }, [isOpen, data])

  const setVal = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  
  const [imageFail, setImageFail] = useState({})
  if (!isOpen || !data) return null;
  const handleSelectFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length && deliveryId) await onUpload(files)
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[760px] lg:max-w-[880px] p-4 sm:p-6 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[18px] tracking-[0] leading-[normal]">Edit Delivered</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">No Invoice</label>
            <input value={form.invoice} onChange={e => setVal('invoice', e.target.value)} className="w-full px-3 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Nama Customer</label>
            <input value={form.customer} onChange={e => setVal('customer', e.target.value)} className="w-full px-3 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Nama Item</label>
            <input value={form.item} onChange={e => setVal('item', e.target.value)} className="w-full px-3 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Tanggal Dikirim</label>
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e] pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <input type="date" value={form.sentDate || ''} onChange={e => setVal('sentDate', e.target.value)} className="w-full pl-[44px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] outline-none focus:border-[#197bbd] transition-colors" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Tanggal Diterima</label>
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e] pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <input type="date" value={form.deliveredDate || ''} onChange={e => setVal('deliveredDate', e.target.value)} className="w-full pl-[44px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] outline-none focus:border-[#197bbd] transition-colors" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Nama Messenger</label>
            <div className="relative">
              <select value={form.messenger} onChange={e => setVal('messenger', e.target.value)} className="w-full pl-3 pr-12 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs appearance-none">
                <option value="">- Pilih Messenger -</option>
                {messengerOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Nama Penerima</label>
            <input value={form.recipient} onChange={e => setVal('recipient', e.target.value)} className="w-full px-3 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Status</label>
            <div className="relative">
              <select value={form.status} onChange={e => setVal('status', e.target.value)} className="w-full pl-3 pr-12 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs appearance-none">
                <option value="On time">On time</option>
                <option value="Late">Late</option>
              </select>
              <svg className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="sm:col-span-2 flex flex-col gap-2">
            <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs">Keterangan</label>
            <textarea value={form.notes} onChange={e => setVal('notes', e.target.value)} className="w-full px-3 py-3 bg-white rounded-[10px] border border-[#cccccccc] [font-family:'Inter',Helvetica] text-xs" rows={3} />
          </div>
        </div>

        {Array.isArray(attachments) && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[14px]">Lampiran</h3>
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#197bbd] hover:bg-[#1569a3] text-white rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[12px] cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span>Tambah Lampiran</span>
                <input type="file" multiple onChange={handleSelectFiles} className="hidden" />
              </label>
            </div>
            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {attachments.map(att => {
                  const mime = String(att.mime_type || '').toLowerCase()
                  const nameRef = String(att.original_filename || att.stored_filename || '').toLowerCase()
                  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef)
                  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')
                  const url = `${apiUrl}/files/raw/${att.id}`
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
                      <button onClick={() => onRemoveAttachment(att.id)} className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 border border-[#e5e5e5] rounded-full p-1">
                        <svg className="w-4 h-4 text-[#e53935]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4" /></svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-[#9e9e9e] [font-family:'Inter',Helvetica] text-[12px]">Belum ada lampiran</div>
            )}
          </div>
        )}

        <div className="border-t border-[#e5e5e5] pt-4 mt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button onClick={() => onSave(form)} className="bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-[12px] px-6 py-3 rounded-[12.45px] h-auto transition-all">Simpan</button>
          <button onClick={onClose} className="px-6 py-3 border border-[#cccccccc] rounded-[12.45px] [font-family:'Quicksand',Helvetica] font-bold text-[#404040] text-[12px] hover:bg-gray-50 transition-colors">Batal</button>
        </div>
      </div>
    </div>
  )
}

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[480px] p-4 sm:p-5 transform transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#fff3e0] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#e65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v3h6V4a1 1 0 00-1-1m-4 0h4" /></svg>
          </div>
          <h3 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[16px]">Hapus Delivery</h3>
        </div>
        <p className="[font-family:'Inter',Helvetica] text-[#696969] text-[12px] mb-4">Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data delivery ini?</p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2 border border-[#cccccccc] rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[#404040] text-[12px] hover:bg-gray-50">Batal</button>
          <button onClick={onConfirm} className="px-5 py-2 bg-[#e53935] hover:bg-[#d32f2f] text-white rounded-[10px] [font-family:'Quicksand',Helvetica] font-bold text-[12px]">Hapus</button>
        </div>
      </div>
    </div>
  )
}

const AttachmentPreviewModal = ({ isOpen, att, onClose }) => {
  if (!isOpen || !att) return null
  const mime = String(att.mime_type || '').toLowerCase()
  const nameRef = String(att.original_filename || att.stored_filename || '').toLowerCase()
  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nameRef)
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')
  const url = `${apiUrl}/files/raw/${att.id}`
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
  )
}
// Export Modal Component
const ExportModal = ({ isOpen, onClose, messengerOptions, data }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMessenger, setSelectedMessenger] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const filterRows = () => {
    const rows = Array.isArray(data) ? data : []
    const sd = startDate ? String(startDate).slice(0, 10) : null
    const ed = endDate ? String(endDate).slice(0, 10) : null
    return rows.filter(r => {
      if (selectedMessenger && String(r.messenger || '').toLowerCase() !== String(selectedMessenger).toLowerCase()) return false
      const rcvRaw = r.deliveredDateRaw || r.sentDateRaw || ''
      const rv = String(rcvRaw).slice(0, 10)
      if (sd && rv < sd) return false
      if (ed && rv > ed) return false
      return true
    })
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    const rows = filterRows()
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')
    const baseRoot = apiUrl.replace(/\/api\/?$/, '')
    const settingsResp = await systemAPI.getSettings().catch(() => null)
    const settings = settingsResp?.data || {}
    const envLogo = import.meta.env.VITE_COMPANY_LOGO
    const headOk = async (u) => { try { const r = await fetch(u, { method: 'HEAD' }); return !!r.ok } catch { return false } }
    const logoCandidates = [
      settings.company_logo ? normalizeUrl(settings.company_logo) : null,
      envLogo ? normalizeUrl(envLogo) : null,
      normalizeUrl(`${baseRoot}/uploads/sefas-logo.png`),
      normalizeUrl(`${baseRoot}/uploads/sefas-logo.svg`),
      appLogoSvg
    ].filter(Boolean)
    let logoSrc = appLogoSvg
    for (const c of logoCandidates) { if (await headOk(c)) { logoSrc = c; break } }
    const companyName = settings.company_name || (import.meta.env.VITE_COMPANY_NAME || 'PT. SEFAS PELINDOTAMA')
    const companyAddr = settings.company_address || (import.meta.env.VITE_COMPANY_ADDRESS || 'Landasan Ulin Sel., Kec. Liang Anggang, Kota Banjar Baru, Kalimantan Selatan 70722')
    const companyPhone = settings.company_phone || (import.meta.env.VITE_COMPANY_PHONE || '05116747319')
    const companyEmail = settings.company_email || (import.meta.env.VITE_COMPANY_EMAIL || '')

    const loadImage = async (src) => {
      if (!src) return null
      const finalSrc = src
      const isSvg = String(finalSrc).toLowerCase().endsWith('.svg')
      if (isSvg) {
        try {
          const text = await (await fetch(finalSrc)).text()
          const blob = new Blob([text], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(blob)
          const result = await new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width = img.width || 400
              canvas.height = img.height || 120
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
              URL.revokeObjectURL(url)
              resolve({ dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height, format: 'PNG' })
            }
            img.src = url
          })
          return result
        } catch {
          if (src !== appLogoSvg) {
            try { return await loadImage(appLogoSvg) } catch { /* ignore */ }
          }
          return null
        }
      }
      try {
        const result = await new Promise((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth || img.width || 400
            canvas.height = img.naturalHeight || img.height || 120
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const isPng = String(finalSrc).toLowerCase().endsWith('.png')
            const dataUrl = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.72)
            resolve({ dataUrl, width: canvas.width, height: canvas.height, format: isPng ? 'PNG' : 'JPEG' })
          }
          img.src = finalSrc
        })
        return result
      } catch {
        if (src !== appLogoSvg) {
          try { return await loadImage(appLogoSvg) } catch { /* ignore */ }
        }
        return null
      }
    }

    const exists = async (u) => { try { const res = await fetch(u, { method: 'HEAD' }); return !!res.ok; } catch { return false } }
    const selectLink = async (att) => {
      const baseRoot = apiUrl.replace(/\/api\/?$/, '')
      const upload = att?.stored_filename ? `${baseRoot}/uploads/${att.stored_filename}` : null
      const raw = `${apiUrl}/files/raw/${att.id}`
      if (upload && await exists(upload)) return upload
      if (await exists(raw)) return raw
      return null
    }
    const rowsWithLampiran = await Promise.all(rows.map(async (r) => {
      try {
        const resp = await fileAPI.getAll({ delivery_id: r.id, category: 'delivery_proof' })
        const arr = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : [])
        const primary = Array.isArray(arr) && arr.length ? arr : (Array.isArray((resp?.data ?? resp)?.data) ? (resp?.data ?? resp)?.data : [])
        const initial = Array.isArray(primary) ? primary : []
        const linksPrimary = (await Promise.all(initial.map(selectLink))).filter(Boolean)
        if (linksPrimary.length) return { ...r, lampiranLinks: linksPrimary }
        const fallbackResp = await fileAPI.getAll({ delivery_id: r.id })
        const fArr = Array.isArray(fallbackResp?.data) ? fallbackResp.data : (Array.isArray(fallbackResp) ? fallbackResp : [])
        const fallback = Array.isArray(fArr) && fArr.length ? fArr : (Array.isArray((fallbackResp?.data ?? fallbackResp)?.data) ? (fallbackResp?.data ?? fallbackResp)?.data : [])
        const linksFallback = (await Promise.all((Array.isArray(fallback) ? fallback : []).map(selectLink))).filter(Boolean)
        return { ...r, lampiranLinks: linksFallback }
      } catch { return { ...r, lampiranLinks: [] } }
    }))

    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true, floatPrecision: 2 })
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()

    const logo = await loadImage(logoSrc)
    const ml = 16
    const mr = 16
    let lw = 0
    let lh = 0
    const lx = ml
    const ly = 16
    if (logo?.dataUrl && logo?.width && logo?.height) {
      const maxW = 34
      const maxH = 20
      const scale = Math.min(maxW / logo.width, maxH / logo.height)
      lw = Math.max(1, Math.round(logo.width * scale))
      lh = Math.max(1, Math.round(logo.height * scale))
      try { doc.addImage(logo.dataUrl, logo.format || 'PNG', lx, ly, lw, lh) } catch { void 0 }
    }
    doc.setTextColor(35, 35, 35)
    const tx = lx + lw + 8
    doc.setFontSize(14)
    const ny = ly + (lh ? Math.round(lh * 0.55) : 20)
    doc.text(String(companyName), tx + 6, ny)
    doc.setFontSize(9)
    const contactY = ny + 5
    const addrLine = String(companyAddr || '')
    const phoneEmailLine = companyEmail ? `${companyPhone} | ${companyEmail}` : `${companyPhone}`
    doc.text(addrLine, tx + 6, contactY, { maxWidth: pw - (tx + 6) })
    const contactY2 = contactY + 5
    doc.text(phoneEmailLine, tx + 6, contactY2, { maxWidth: pw - (tx + 6) })
    doc.setFontSize(12)
    doc.setDrawColor(200)
    doc.setLineWidth(0.6)
    const sepX = lx + lw + 4
    const sepTop = ly
    const sepBottom = Math.max(contactY2, ly + lh)
    doc.line(sepX, sepTop, sepX, sepBottom)

    const ty = contactY2 + 14
    doc.text('Laporan Delivered', ml, ty)
    const rangeText = `Rentang: ${startDate || '-'} s.d ${endDate || '-'}`
    doc.setFontSize(9)
    const rangeW = doc.getTextWidth(rangeText)
    doc.text(rangeText, pw - mr - rangeW, ty)
    if (selectedMessenger) {
      const msgText = `Messenger: ${selectedMessenger}`
      const msgW = doc.getTextWidth(msgText)
      doc.text(msgText, pw - mr - msgW, ty + 6)
    }
    doc.setDrawColor(250, 175, 119)
    doc.setLineWidth(0.7)
    doc.setFillColor(248, 248, 248)
    const contentX = ml
    const tableStartY = ty + 12
    const contentY = tableStartY
    const contentW = pw - (ml + mr)
    const contentH = ph - (tableStartY + 22)
    doc.rect(contentX, contentY, contentW, contentH, 'F')
    if (logo?.dataUrl) {
      try {
        if (doc.GState) {
          const gs = new doc.GState({ opacity: 0.08 })
          doc.setGState(gs)
        }
        const wmMaxW = pw * 0.6
        const wmScale = logo.width && logo.height ? Math.min(wmMaxW / logo.width, (ph * 0.6) / logo.height) : 1
        const wmW = logo.width ? Math.round(logo.width * wmScale) : 120
        const wmH = logo.height ? Math.round(logo.height * wmScale) : 60
        const wmX = (pw - wmW) / 2
        const wmY = (ph - wmH) / 2 + 6
        doc.addImage(logo.dataUrl, logo.format || 'PNG', wmX, wmY, wmW, wmH)
        if (doc.GState) {
          const gsReset = new doc.GState({ opacity: 1 })
          doc.setGState(gsReset)
        }
      } catch { void 0 }
    }

    const head = [["Invoice","Customer","Item","Tgl Kirim","Tgl Terima","Messenger","Penerima","Status","Lampiran"]]
    const body = rowsWithLampiran.map(r => [
      r.invoice || '',
      r.customer || '',
      r.item || '',
      String(r.sentDateRaw || '').slice(0,10),
      String(r.deliveredDateRaw || '').slice(0,10),
      r.messenger || '',
      r.recipient || '',
      r.status || '',
      Array.isArray(r.lampiranLinks) && r.lampiranLinks.length ? r.lampiranLinks.join('\n') : ''
    ])
    autoTable(doc, {
      head,
      body,
      startY: tableStartY,
      margin: { left: ml, right: mr, bottom: 26 },
      tableWidth: pw - (ml + mr),
      styles: { fontSize: 7.4, halign: 'left', valign: 'middle', cellPadding: 1.6, overflow: 'linebreak', lineHeight: 1.2 },
      headStyles: { fillColor: [250,175,119], textColor: 255, fontSize: 8.2, halign: 'center', valign: 'middle', cellPadding: 1.9 },
      alternateRowStyles: { fillColor: [253, 244, 236] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { halign: 'left',   cellWidth: 24 },
        2: { halign: 'left',   cellWidth: 24 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'left',   cellWidth: 22 },
        6: { halign: 'left',   cellWidth: 22 },
        7: { halign: 'center', cellWidth: 14 },
        8: { halign: 'left',   cellWidth: 24, fontSize: 7.2 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          data.cell.styles.textColor = [33, 79, 198]
        }
      },
      didDrawCell: (data) => {
        try {
          if (data.section === 'body' && data.column.index === 8) {
            const raw = String(data.cell.raw || '')
            if (!raw) return
            const links = raw.split('\n').filter(Boolean)
            const padX = 1.6
            const padY = 1.4
            let y = data.cell.y + padY + 2
            links.forEach((u) => {
              const x = data.cell.x + padX
              const w = doc.getTextWidth(u)
              doc.link(x, y - 1.5, Math.max(10, w), 4.2, { url: u })
              y += 3.8
            })
          }
        } catch { /* ignore */ }
      },
      didDrawPage: (data) => {
        const pw2 = doc.internal.pageSize.getWidth()
        const ph2 = doc.internal.pageSize.getHeight()
        doc.setFontSize(9)
        doc.setTextColor(120)
        const printedAt = new Date()
        const dd = String(printedAt.getDate()).padStart(2, '0')
        const mm = String(printedAt.getMonth()+1).padStart(2, '0')
        const yyyy = printedAt.getFullYear()
        const hh = String(printedAt.getHours()).padStart(2, '0')
        const ii = String(printedAt.getMinutes()).padStart(2, '0')
        doc.text(`Dicetak: ${dd}/${mm}/${yyyy} ${hh}:${ii}`, 16, ph2 - 11)
        const totalPages = doc.internal.getNumberOfPages()
        doc.text(`Halaman ${data.pageNumber} dari ${totalPages}`, pw2 - 48, ph2 - 11)
        doc.setDrawColor(250, 175, 119)
        doc.setLineWidth(0.5)
        doc.line(12, ph2 - 14, pw2 - 12, ph2 - 14)
        doc.setTextColor(80)
        doc.setFontSize(9)
        const f3 = companyEmail ? `${companyEmail}` : ''
        if (f3) doc.text(f3, pw2 - 14 - doc.getTextWidth(f3), ph2 - 6)
      }
    })
    const fn = `Delivered_Report_${startDate || 'all'}_${endDate || 'all'}_${selectedMessenger || 'all'}.pdf`
    doc.save(fn)
    setIsExporting(false)
  };

  const handleExportExcel = async () => {
    setIsExporting(true)
    const rows = filterRows()
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')
    const exists = async (u) => { try { const res = await fetch(u, { method: 'HEAD' }); return !!res.ok; } catch { return false } }
    const selectLink = async (att) => {
      const baseRoot = apiUrl.replace(/\/api\/?$/, '')
      const upload = att?.stored_filename ? `${baseRoot}/uploads/${att.stored_filename}` : null
      const raw = `${apiUrl}/files/raw/${att.id}`
      if (upload && await exists(upload)) return upload
      if (await exists(raw)) return raw
      return null
    }
    const rowsWithLampiran = await Promise.all(rows.map(async (r) => {
      try {
        const resp = await fileAPI.getAll({ delivery_id: r.id, category: 'delivery_proof' })
        const arr = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : [])
        const primary = Array.isArray(arr) && arr.length ? arr : (Array.isArray((resp?.data ?? resp)?.data) ? (resp?.data ?? resp)?.data : [])
        const initial = Array.isArray(primary) ? primary : []
        const linksPrimary = (await Promise.all(initial.map(selectLink))).filter(Boolean)
        if (linksPrimary.length) return { ...r, lampiranLinks: linksPrimary }
        const fallbackResp = await fileAPI.getAll({ delivery_id: r.id })
        const fArr = Array.isArray(fallbackResp?.data) ? fallbackResp.data : (Array.isArray(fallbackResp) ? fallbackResp : [])
        const fallback = Array.isArray(fArr) && fArr.length ? fArr : (Array.isArray((fallbackResp?.data ?? fallbackResp)?.data) ? (fallbackResp?.data ?? fallbackResp)?.data : [])
        const linksFallback = (await Promise.all((Array.isArray(fallback) ? fallback : []).map(selectLink))).filter(Boolean)
        return { ...r, lampiranLinks: linksFallback }
      } catch { return { ...r, lampiranLinks: [] } }
    }))
    const sheetData = rowsWithLampiran.map(r => ({
      Invoice: r.invoice || '',
      Customer: r.customer || '',
      Item: r.item || '',
      Tanggal_Kirim: String(r.sentDateRaw || '').slice(0,10),
      Tanggal_Terima: String(r.deliveredDateRaw || '').slice(0,10),
      Messenger: r.messenger || '',
      Penerima: r.recipient || '',
      Status: r.status || '',
      Lampiran: Array.isArray(r.lampiranLinks) && r.lampiranLinks.length ? r.lampiranLinks.join('\n') : ''
    }))
    const ws = XLSX.utils.json_to_sheet(sheetData)
    ws['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 65 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Delivered')
    const fn = `Delivered_Report_${startDate || 'all'}_${endDate || 'all'}_${selectedMessenger || 'all'}.xlsx`
    XLSX.writeFile(wb, fn)
    setIsExporting(false)
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-4" role="dialog" aria-modal="true">
      {isExporting && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-[12px] px-4 py-3 flex items-center gap-2 shadow">
            <svg className="animate-spin w-5 h-5 text-[#197bbd]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4"></path>
            </svg>
            <span className="[font-family:'Inter',Helvetica] text-[#404040] text-[13px]">Menyiapkan file…</span>
          </div>
        </div>
      )}
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[800px] p-4 sm:p-6 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto sm:overflow-visible">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#FFF1E6] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#fbaf77]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v8M12 16l4-4m-4 4l-4-4m4 4V8" />
              </svg>
            </div>
            <div className="text-left">
              <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-lg sm:text-[20px]">Export Report Delivered</h2>
              <p className="[font-family:'Inter',Helvetica] text-[#9e9e9e] text-[10px] sm:text-[11px]">Pilih rentang tanggal dan messenger lalu format export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-300"
          >
            <svg className="w-5 h-5 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 relative z-10">
          <div className="flex flex-col gap-2 p-3 rounded-[12px] border border-[#e5e5e5] hover:border-[#fbaf77] transition-colors">
            <span className="[font-family:'Suprema-SemiBold',Helvetica] text-[#404040] text-[13px] mb-1">Tanggal Awal</span>
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e] pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-[44px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] focus:border-[#fbaf77] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] outline-none transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 rounded-[12px] border border-[#e5e5e5] hover:border-[#fbaf77] transition-colors">
            <span className="[font-family:'Suprema-SemiBold',Helvetica] text-[#404040] text-[13px] mb-1">Tanggal Akhir</span>
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e] pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-[44px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] focus:border-[#fbaf77] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] outline-none transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 rounded-[12px] border border-[#e5e5e5] hover:border-[#fbaf77] transition-colors">
            <span className="[font-family:'Suprema-SemiBold',Helvetica] text-[#404040] text-[13px] mb-1">Messenger</span>
            <div className="relative">
              <select
                value={selectedMessenger}
                onChange={(e) => setSelectedMessenger(e.target.value)}
                className="w-full pl-3 pr-10 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] focus:border-[#fbaf77] appearance-none [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px]"
              >
                <option value="">Pilih Messenger</option>
                {(Array.isArray(messengerOptions) ? messengerOptions : []).map((messenger) => (
                  <option key={messenger} value={messenger}>
                    {messenger}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e5e5e5] pt-5">
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

export const Delivered = () => {
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [searchSentDate, setSearchSentDate] = useState("");
  const [searchDeliveredDate, setSearchDeliveredDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

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

  const [deliveryAttachments, setDeliveryAttachments] = useState([]);
  const { deliveries, deleteDelivery, updateDelivery } = useDeliveries();

  const handleCustomerClick = async (row) => {
    setSelectedDetail(row);
    try {
      const resp = await fileAPI.getAll({ delivery_id: row.id, category: 'delivery_proof' });
      const data = resp?.data ?? resp;
      const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length) {
        setDeliveryAttachments(list);
      } else {
        const fallbackResp = await fileAPI.getAll({ delivery_id: row.id });
        const fallbackData = fallbackResp?.data ?? fallbackResp;
        const fallbackList = Array.isArray(fallbackData.data) ? fallbackData.data : (Array.isArray(fallbackData) ? fallbackData : []);
        setDeliveryAttachments(Array.isArray(fallbackList) ? fallbackList : []);
      }
    } catch {
      setDeliveryAttachments([]);
    }
    setIsDetailModalOpen(true);
  };

  const { user, logout } = useAuth();
  const navItems = useMemo(() => {
    const base = navigationItems.map(i => ({ ...i }));
    return user?.role === 'admin'
      ? [...base, { id: 'management', label: 'Users', icon: usersIcon, href: '/management', isActive: false }]
      : base;
  }, [user]);
  const messengerOptions = Array.from(new Set((Array.isArray(deliveries) ? deliveries : []).map(d => d.messenger))).filter(Boolean);
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
    } catch { return String(d).slice(0,10); }
  };

  const sourceData = Array.isArray(deliveries) ? deliveries.map(r => ({
    id: r.id,
    customer: r.customer || r.customerName || "",
    invoice: r.invoice || "",
    item: r.item || "",
    sentDate: formatDateText(r.sentDate || r.sent_date),
    deliveredDate: formatDateText(r.deliveredDate || r.delivered_date),
    sentDateRaw: r.sentDate || r.sent_date || "",
    deliveredDateRaw: r.deliveredDate || r.delivered_date || "",
    sentDateKey: toLocalYMD(r.sentDate || r.sent_date || ""),
    deliveredDateKey: toLocalYMD(r.deliveredDate || r.delivered_date || ""),
    messenger: r.messenger || "",
    recipient: r.recipient || "",
    notes: r.notes || "",
    status: r.status || (() => {
      const s = r.sentDate || r.sent_date
      const rcv = r.deliveredDate || r.delivered_date
      if (!s || !rcv) return 'Pending'
      try {
        const days = Math.floor((new Date(s).getTime() - new Date(rcv).getTime()) / (1000*60*60*24))
        return days > 2 ? 'Out of time' : 'On time'
      } catch { return '' }
    })(),
  })) : [];
  const filteredData = sourceData.filter((row) => {
    const matchesCustomer = row.customer
      .toLowerCase()
      .includes(searchCustomer.toLowerCase());
    const matchesItem = row.item
      .toLowerCase()
      .includes(searchItem.toLowerCase());
    const matchesSent = searchSentDate ? String(row.sentDateKey) === String(searchSentDate).slice(0,10) : true;
    const matchesDelivered = searchDeliveredDate ? String(row.deliveredDateKey) === String(searchDeliveredDate).slice(0,10) : true;
    const matchesDate = matchesSent && matchesDelivered;
    const matchesStatus =
      statusFilter === "all" ||
      row.status.toLowerCase().includes(statusFilter.toLowerCase());

    return matchesCustomer && matchesItem && matchesDate && matchesStatus;
  });

  const displayedData = filteredData.slice(0, entriesPerPage);

  return (
    <div className="bg-[#f5f5f5] w-full min-h-screen flex">
      {/* Header mobile: logo + tombol menu, fixed di atas, khusus perangkat mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 flex items-center justify-between shadow-md z-50">
        <img className="h-8 opacity-100" alt="Logo" src={appLogoSvg} />
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

      {/* Overlay menu mobile: navigasi utama, settings, logout; tutup saat klik di luar */}
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
              <img className="w-24 h-auto mb-8 opacity-100" alt="Logo" src={appLogoSvg} />
              
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

      {/* Sidebar desktop: navigasi utama dengan layout sticky, hanya tampil di desktop */}
      <aside className="hidden lg:flex w-[200px] flex-shrink-0 bg-white shadow-[2px_24px_53px_#0000000d,8px_95px_96px_#0000000a,19px_214px_129px_#00000008,33px_381px_153px_#00000003,52px_596px_167px_transparent] px-[15px] py-[30px] flex-col justify-between h-screen sticky top-0">
        <div>
          <img
            className="w-[100px] h-[41px] mb-[45px] opacity-100"
            alt="Logo"
            src={appLogoSvg}
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
              Delivered On Time
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
            Delivered On Time
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4 sm:mb-7 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <Link to="/delivered/input" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-[#fbaf77] hover:bg-[#f89d5a] text-white [font-family:'Quicksand',Helvetica] font-bold text-[10.2px] px-3.5 py-2.5 rounded-[12.45px] h-auto transition-colors duration-300 cursor-pointer">
                New
              </button>
            </Link>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="w-full sm:w-auto bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-[10.2px] px-3.5 py-2.5 rounded-[12.45px] h-auto transition-colors duration-300 cursor-pointer"
            >
              Report
            </button>
          </div>

          <div className="text-left mb-4 sm:mb-7 rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms] bg-white">
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Nama Customer
                  </label>
                  <div className="relative">
                    <svg className="absolute left-[13.68px] top-1/2 -translate-y-1/2 w-[13.68px] h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="Nama Customer"
                      value={searchCustomer}
                      onChange={(e) => setSearchCustomer(e.target.value)}
                      className="w-full pl-[35px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Nama Item
                  </label>
                  <div className="relative">
                    <svg className="absolute left-[13.68px] top-1/2 -translate-y-1/2 w-[13.68px] h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="Invoice, Invoice JNT, Invoice JNE ......"
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      className="w-full pl-[35px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">Tanggal Diterima</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9e9e9e]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <path d="M16 2v4M8 2v4M3 10h18"></path>
                    </svg>
                    <input type="date" value={searchDeliveredDate} onChange={(e) => setSearchDeliveredDate(e.target.value)} className="w-full pl-[44px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px]" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">Tanggal Dikirim</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9e9e9e]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <path d="M16 2v4M8 2v4M3 10h18"></path>
                    </svg>
                    <input type="date" value={searchSentDate} onChange={(e) => setSearchSentDate(e.target.value)} className="w-full pl-[44px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px]" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-auto pl-[13.68px] pr-12 py-[17.1px] bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] appearance-none"
                    >
                      <option value="all">All Status</option>
                      <option value="on time">On Time</option>
                      <option value="out of time">Out of Time</option>
                    </select>
                    <svg className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
            <section className="w-full flex flex-col gap-[15px]">
              <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6 overflow-x-auto">
                {/* Desktop Table */}
                <table className="hidden md:table w-full">
                  <thead>
                    <tr className="border-none">
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Nama Customer
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        No. Invoice
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Nama Item
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Tanggal Diterima
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Tanggal Dikirim
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Messenger
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-right pb-2">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedData.length > 0 ? (
                      displayedData.map((row, index) => (
                        <tr
                          key={`history-${row.invoice}-${index}`}
                          className="border-b border-[#e5e5e5] text-left"
                        >
                          <td 
                            onClick={() => handleCustomerClick(row)}
                            className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[12.8px] tracking-[0] leading-[normal] underline py-2 cursor-pointer hover:text-[#faa463] transition-colors"
                          >
                            {row.customer}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.invoice}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.item}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.deliveredDate}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.sentDate}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-2">
                            {row.messenger}
                          </td>
                          <td className="[font-family:'Lato',Helvetica] font-bold text-[#404040] text-[12.8px] tracking-[0] leading-[normal] text-right py-2">
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
                        key={`history-mobile-${row.invoice}-${index}`}
                        onClick={() => handleCustomerClick(row)}
                        className="bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3.5 cursor-pointer hover:border-[#faa463] hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[13px] mb-1 leading-tight truncate">
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
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[70px]">Diterima:</span>
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.deliveredDate}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[70px]">Dikirim:</span>
                            <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.sentDate}</span>
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

        <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} messengerOptions={messengerOptions} data={sourceData} />
      <DetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetail(null);
        }} 
        data={selectedDetail} 
        attachments={deliveryAttachments}
        onDelete={() => setIsDeleteModalOpen(true)}
        onEdit={() => setIsEditModalOpen(true)}
        onPreview={(att) => { setPreviewAttachment(att); setIsPreviewOpen(true); }}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        data={selectedDetail}
        messengerOptions={messengerOptions}
        attachments={deliveryAttachments}
        deliveryId={selectedDetail?.id}
        onUpload={async (files) => {
          const added = []
          for (const f of files) {
            try {
              const resp = await fileAPI.upload(f, 'delivery_proof', { delivery_id: selectedDetail?.id })
              const d = resp?.data ?? resp
              const row = d?.data ?? d
              if (row) added.push(row)
            } catch { void 0 }
          }
          if (added.length) setDeliveryAttachments(prev => [...prev, ...added])
        }}
        onRemoveAttachment={async (attId) => {
          try {
            await fileAPI.delete(attId)
            setDeliveryAttachments(prev => prev.filter(a => a.id !== attId))
          } catch { void 0 }
        }}
        onSave={async (payload) => {
          if (!selectedDetail?.id) return;
          await updateDelivery(selectedDetail.id, payload);
          try {
            const resp = await deliveredAPI.getById(selectedDetail.id)
            const data = resp?.data ?? resp
            const d = data?.data ?? data
            if (d) {
              setSelectedDetail(prev => ({
                ...prev,
                invoice: d.invoice ?? prev?.invoice,
                customer: d.customer ?? prev?.customer,
                item: d.item ?? prev?.item,
                sentDateRaw: d.sentDate || prev?.sentDateRaw || "",
                deliveredDateRaw: d.deliveredDate || prev?.deliveredDateRaw || "",
                sentDate: (d.sentDate ? formatDateText(d.sentDate) : prev?.sentDate),
                deliveredDate: (d.deliveredDate ? formatDateText(d.deliveredDate) : prev?.deliveredDate),
                messenger: d.messenger ?? prev?.messenger,
                recipient: d.recipient ?? prev?.recipient,
                notes: d.notes ?? prev?.notes,
                status: (d.status ?? (() => {
                  const s = d.sentDate || prev?.sentDateRaw
                  const rcv = d.deliveredDate || prev?.deliveredDateRaw
                  if (!s || !rcv) return prev?.status
                  try {
                    const days = Math.floor((new Date(s).getTime() - new Date(rcv).getTime()) / (1000*60*60*24))
                    return days > 2 ? 'Out of time' : 'On time'
                  } catch { return prev?.status }
                })()),
              }))
            }
          } catch { /* ignore */ }
          setIsEditModalOpen(false);
        }}
        onPreview={(att) => { setPreviewAttachment(att); setIsPreviewOpen(true); }}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedDetail?.id) return;
          const r = await deleteDelivery(selectedDetail.id);
          if (r?.success) {
            setIsDeleteModalOpen(false);
            setIsDetailModalOpen(false);
            setSelectedDetail(null);
            setDeliveryAttachments([]);
          }
        }}
      />

      <AttachmentPreviewModal
        isOpen={isPreviewOpen}
        att={previewAttachment}
        onClose={() => { setIsPreviewOpen(false); setPreviewAttachment(null); }}
      />

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
    </div>
  );
};

export default Delivered;
