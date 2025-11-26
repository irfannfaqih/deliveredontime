import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import settingsIcon from '../assets/settingIcon.svg';
import sefasLogoPng from '../assets/sefas-logo.png';
import { useAuth, useBBM, useDeliveries } from "../hooks/useAPI";
import { fileAPI } from "../services/api";
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

const formatRupiah = (n) => {
  const v = Number(n || 0);
  if (!isFinite(v)) return "";
  const iv = Math.round(v);
  return `Rp ${iv.toLocaleString('id-ID')}`;
};

const AttachmentsModal = ({ isOpen, onClose, attachments, onPreview }) => {
  if (!isOpen) return null;
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[95vw] sm:max-w-[800px] p-4 sm:p-6 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-lg sm:text-[20px] tracking-[0] leading-[normal]">Lampiran BBM</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {Array.isArray(attachments) && attachments.length > 0 && (
          <div className="flex justify-end mb-3">
            <button
              onClick={() => {
                const links = (attachments || []).map(a => `${apiUrl}/files/raw/${a.id}`).join('\n');
                navigator.clipboard.writeText(links);
              }}
              className="bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-[10.2px] px-3.5 py-2 rounded-[10px] h-auto transition-colors duration-300"
            >
              Copy semua link
            </button>
          </div>
        )}
        {Array.isArray(attachments) && attachments.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {attachments.map(att => {
              const mime = String(att.mime_type || '').toLowerCase();
              const nameRef = String(att.stored_filename || att.original_filename || '').toLowerCase();
              const isImage = mime.startsWith('image/') || /(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.bmp)$/i.test(nameRef);
              const url = `${apiUrl}/files/raw/${att.id}`;
              return (
                <div key={att.id} className="relative group">
                  {isImage ? (
                    <>
                      <img className="w-full h-[140px] sm:h-[160px] lg:h-[180px] rounded-[12px] object-cover cursor-pointer transition-opacity hover:opacity-90" alt={att.original_filename} src={url} onClick={() => onPreview && onPreview(att)} />
                      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-2">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="bg-white/90 hover:bg-white text-[#404040] text-[10px] px-2 py-1 rounded">Open</a>
                        <button onClick={() => navigator.clipboard.writeText(url)} className="bg-white/90 hover:bg-white text-[#404040] text-[10px] px-2 py-1 rounded">Copy</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3 text-[#404040] text-xs">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 flex-1">
                        <svg className="w-4 h-4 text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h10M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="truncate">{att.original_filename}</span>
                      </a>
                      <button onClick={() => navigator.clipboard.writeText(url)} className="text-[#197bbd] hover:text-[#1569a3] text-[10px] font-bold">Copy</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[#9e9e9e] [font-family:'Inter',Helvetica] text-sm">Tidak ada lampiran</div>
        )}
      </div>
    </div>
  );
};

// Opsi messenger akan dibangun dinamis dari data pengiriman/BBM

// Export Modal Component
const ExportModal = ({ isOpen, onClose, deliveries, bbmRecords }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMessenger, setSelectedMessenger] = useState("");

  const messengerOptions = Array.from(new Set([
    ...((Array.isArray(deliveries) ? deliveries : []).map(d => d.messenger)).filter(Boolean),
    ...((Array.isArray(bbmRecords) ? bbmRecords : []).map(b => b.messenger)).filter(Boolean),
  ])).filter(Boolean);

  if (!isOpen) return null;

  const buildRows = () => {
    const inRange = (k) => {
      const d = toLocalYMD(k);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };
    const byDateMessenger = {};
    (Array.isArray(deliveries) ? deliveries : []).forEach(r => {
      const dateKey = r.sentDate || r.sent_date;
      if (!dateKey) return;
      if (!inRange(dateKey)) return;
      const messenger = r.messenger || 'Unknown';
      if (selectedMessenger && String(messenger || '').toLowerCase() !== String(selectedMessenger).toLowerCase()) return;
      const key = `${toLocalYMD(dateKey)}_${messenger}`;
      if (!byDateMessenger[key]) byDateMessenger[key] = { date: toLocalYMD(dateKey), messenger, invoiceCount: 0, kmAwal: null, kmAkhir: null };
      byDateMessenger[key].invoiceCount += 1;
    });
    (Array.isArray(bbmRecords) ? bbmRecords : []).forEach(b => {
      const dateKey = b.tanggal;
      if (!dateKey) return;
      if (!inRange(dateKey)) return;
      const messenger = b.messenger || 'Unknown';
      if (selectedMessenger && String(messenger || '').toLowerCase() !== String(selectedMessenger).toLowerCase()) return;
      const key = `${toLocalYMD(dateKey)}_${messenger}`;
      if (!byDateMessenger[key]) byDateMessenger[key] = { date: toLocalYMD(dateKey), messenger, invoiceCount: 0, kmAwal: null, kmAkhir: null };
      const awal = b.kilometer_awal != null ? Number(b.kilometer_awal) : null;
      const akhir = b.kilometer_akhir != null ? Number(b.kilometer_akhir) : null;
      if (awal != null) byDateMessenger[key].kmAwal = byDateMessenger[key].kmAwal == null ? awal : Math.min(byDateMessenger[key].kmAwal, awal);
      if (akhir != null) byDateMessenger[key].kmAkhir = byDateMessenger[key].kmAkhir == null ? akhir : Math.max(byDateMessenger[key].kmAkhir, akhir);
    });
    const rows = Object.values(byDateMessenger).map(r => ({
      date: r.date,
      messenger: r.messenger,
      invoice: r.invoiceCount,
      kmAwal: r.kmAwal == null ? '' : r.kmAwal,
      kmAkhir: r.kmAkhir == null ? '' : r.kmAkhir,
      totalKm: r.kmAwal != null && r.kmAkhir != null ? (r.kmAkhir - r.kmAwal) : ''
    }));
    rows.sort((a,b) => a.date.localeCompare(b.date) || String(a.messenger).localeCompare(String(b.messenger)));
    return rows;
  };

  const handleExportPDF = async () => {
    const rows = buildRows();
    const rowsWithExtras = await Promise.all(rows.map(async (r) => {
      const matched = (Array.isArray(bbmRecords) ? bbmRecords : []).filter(b => toLocalYMD(b.tanggal) === String(r.date) && String(b.messenger || '').toLowerCase() === String(r.messenger || '').toLowerCase());
      let sumRupiah = 0;
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
      const linkList = [];
      for (const b of matched) {
        const amt = b.jumlah_bbm_rupiah != null ? Number(b.jumlah_bbm_rupiah) : 0;
        if (isFinite(amt)) sumRupiah += amt;
      }
      let attCount = 0;
      for (const b of matched) {
        try {
          const resp = await fileAPI.getAll({ bbm_record_id: b.id });
          const data = resp?.data ?? resp;
          const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
          attCount += rows.length;
          rows.forEach(x => linkList.push(`${apiUrl}/files/raw/${x.id}`));
        } catch { void 0 }
      }
      return { ...r, jumlahBbm: sumRupiah, lampiran: attCount, lampiranLinks: linkList };
    }));
    const loadImage = async (src) => {
      const finalSrc = normalizeUrl(src);
      const isSvg = String(finalSrc).toLowerCase().endsWith('.svg');
      if (isSvg) {
        try {
          const text = await (await fetch(finalSrc)).text();
          const blob = new Blob([text], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const result = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width || 400;
              canvas.height = img.height || 120;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              URL.revokeObjectURL(url);
              resolve({ dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height, format: 'PNG' });
            };
            img.src = url;
          });
          return result;
        } catch { return null }
      }
      try {
        const result = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 400;
            canvas.height = img.naturalHeight || img.height || 120;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const isPng = String(finalSrc).toLowerCase().endsWith('.png');
            const dataUrl = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.72);
            resolve({ dataUrl, width: canvas.width, height: canvas.height, format: isPng ? 'PNG' : 'JPEG' });
          };
          img.src = finalSrc;
        });
        return result;
      } catch { return null }
    };

    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true, floatPrecision: 2 });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const companyName = (import.meta.env.VITE_COMPANY_NAME || 'PT. SEFAS PELINDOTAMA');
    const companyAddr = (import.meta.env.VITE_COMPANY_ADDRESS || 'Landasan Ulin Sel., Kec. Liang Anggang, Kota Banjar Baru, Kalimantan Selatan 70722');
    const companyPhone = (import.meta.env.VITE_COMPANY_PHONE || '05116747319');
    const companyEmail = (import.meta.env.VITE_COMPANY_EMAIL || '');
    const logoSrc = import.meta.env.VITE_COMPANY_LOGO || sefasLogoPng;

    
    const logo = await loadImage(logoSrc);
    const marginLeft = 16;
    const marginRight = 16;
    let logoH = 0;
    let logoW = 0;
    const logoX = marginLeft;
    const logoY = 16;
    if (logo?.dataUrl && logo?.width && logo?.height) {
      const maxW = 34;
      const maxH = 20;
      const scale = Math.min(maxW / logo.width, maxH / logo.height);
      logoW = Math.max(1, Math.round(logo.width * scale));
      logoH = Math.max(1, Math.round(logo.height * scale));
      try { doc.addImage(logo.dataUrl, logo.format || 'PNG', logoX, logoY, logoW, logoH); } catch { void 0 }
    }
    doc.setTextColor(35, 35, 35);
    const textX = logoX + logoW + 8;
    const nameFS = 16;
    doc.setFontSize(nameFS);
    const nameY = logoY + (logoH ? Math.round(logoH * 0.55) : 20);
    doc.text(String(companyName), textX + 6, nameY);
    doc.setFontSize(9.5);
    const contactLine = companyEmail ? `${companyAddr} | ${companyPhone} | ${companyEmail}` : `${companyAddr} | ${companyPhone}`;
    const contactY = nameY + 5;
    doc.text(contactLine, textX + 6, contactY, { maxWidth: pageWidth - (textX + 6) });
    doc.setFontSize(13);
    doc.setDrawColor(200);
    doc.setLineWidth(0.6);
    const sepX = logoX + logoW + 4;
    const sepTop = logoY;
    const sepBottom = Math.max(contactY, logoY + logoH);
    doc.line(sepX, sepTop, sepX, sepBottom);

    const titleY = contactY + 14;
    doc.text('Laporan Pergantian BBM', marginLeft, titleY);
    const rangeText = `Rentang: ${startDate || '-'} s.d ${endDate || '-'}`;
    doc.setFontSize(10);
    const rangeW = doc.getTextWidth(rangeText);
    doc.text(rangeText, pageWidth - marginRight - rangeW, titleY);
    if (selectedMessenger) {
      const msgText = `Messenger: ${selectedMessenger}`;
      const msgW = doc.getTextWidth(msgText);
      doc.text(msgText, pageWidth - marginRight - msgW, titleY + 6);
    }
    doc.setDrawColor(250, 175, 119);
    doc.setLineWidth(0.7);
    

    doc.setFillColor(248, 248, 248);
    doc.setFillColor(248, 248, 248);
    const contentX = marginLeft;
    const tableStartY = titleY + 12;
    const contentY = tableStartY;
    const contentW = pageWidth - (marginLeft + marginRight);
    const contentH = pageHeight - (tableStartY + 22);
    doc.rect(contentX, contentY, contentW, contentH, 'F');

    if (logo?.dataUrl) {
      try {
        if (doc.GState) {
          const gs = new doc.GState({ opacity: 0.08 });
          doc.setGState(gs);
        }
        const wmMaxW = pageWidth * 0.6;
        const wmScale = logo.width && logo.height ? Math.min(wmMaxW / logo.width, (pageHeight * 0.6) / logo.height) : 1;
        const wmW = logo.width ? Math.round(logo.width * wmScale) : 120;
        const wmH = logo.height ? Math.round(logo.height * wmScale) : 60;
        const wmX = (pageWidth - wmW) / 2;
        const wmY = (pageHeight - wmH) / 2 + 6;
        doc.addImage(logo.dataUrl, logo.format || 'PNG', wmX, wmY, wmW, wmH);
        if (doc.GState) {
          const gsReset = new doc.GState({ opacity: 1 });
          doc.setGState(gsReset);
        }
      } catch { void 0 }
    }

    autoTable(doc, {
      head: [["Tanggal","Messenger","Invoice","KM Awal","KM Akhir","Total KM","Jumlah BBM","Lampiran"]],
      body: rowsWithExtras.map(r => [
        formatDateText(r.date),
        r.messenger,
        String(r.invoice),
        String(r.kmAwal),
        String(r.kmAkhir),
        String(r.totalKm),
        formatRupiah(r.jumlahBbm),
        Array.isArray(r.lampiranLinks) && r.lampiranLinks.length ? r.lampiranLinks.join('\n') : ''
      ]),
      startY: tableStartY,
      margin: { left: marginLeft, right: marginRight, bottom: 60 },
      tableWidth: pageWidth - (marginLeft + marginRight),
      styles: { fontSize: 9, halign: 'center', valign: 'middle', cellPadding: 2.2 },
      headStyles: { fillColor: [250,175,119], textColor: 255, fontSize: 10, halign: 'center', valign: 'middle', cellPadding: 2.2 },
      alternateRowStyles: { fillColor: [253, 244, 236] },
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'left' } },
      didDrawPage: (data) => {
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();
        doc.setFontSize(9);
        doc.setTextColor(120);
        const printedAt = new Date();
        const dd = String(printedAt.getDate()).padStart(2, '0');
        const mm = String(printedAt.getMonth()+1).padStart(2, '0');
        const yyyy = printedAt.getFullYear();
        const hh = String(printedAt.getHours()).padStart(2, '0');
        const ii = String(printedAt.getMinutes()).padStart(2, '0');
        doc.text(`Dicetak: ${dd}/${mm}/${yyyy} ${hh}:${ii}`, 16, ph - 11);
        const totalPages = doc.internal.getNumberOfPages();
        doc.text(`Halaman ${data.pageNumber} dari ${totalPages}`, pw - 48, ph - 11);
        doc.setDrawColor(250, 175, 119);
        doc.setLineWidth(0.5);
        doc.line(12, ph - 14, pw - 12, ph - 14);
        doc.setTextColor(80);
        doc.setFontSize(9);
        const f3 = companyEmail ? `${companyEmail}` : '';
        if (f3) doc.text(f3, pw - 14 - doc.getTextWidth(f3), ph - 6);

        if (data.pageNumber === totalPages) {
          doc.setTextColor(60);
          doc.setFontSize(10);
          const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
          const dateLine = `${dd} ${monthNames[printedAt.getMonth()]} ${yyyy}`;
          doc.text(dateLine, pw - marginRight, ph - 58, { align: 'right' });

          doc.text('Hormat kami,', pw - marginRight, ph - 52, { align: 'right' });

          doc.setTextColor(70);
          doc.setFontSize(10);
          const nameText = 'Kresna Aditya';
          const nameY = ph - 32;
          doc.text(nameText, pw - marginRight, nameY, { align: 'right' });
          const nameWidth = doc.getTextWidth(nameText);
          doc.setDrawColor(160);
          doc.setLineWidth(0.4);
          const underlineY = nameY + 1;
          doc.line(pw - marginRight - nameWidth, underlineY, pw - marginRight, underlineY);

          doc.setTextColor(70);
          doc.setFontSize(10);
          doc.text('HRGA Coordinator', pw - marginRight, ph - 26, { align: 'right' });
        }
      }
    });

    const fileName = `report-summary_${startDate || 'all'}_${endDate || 'all'}_${selectedMessenger || 'all'}.pdf`;
    doc.save(fileName);
  };

  const handleExportExcel = async () => {
    const rows = buildRows();
    const rowsWithExtras = await Promise.all(rows.map(async (r) => {
      const matched = (Array.isArray(bbmRecords) ? bbmRecords : []).filter(b => toLocalYMD(b.tanggal) === String(r.date) && String(b.messenger || '').toLowerCase() === String(r.messenger || '').toLowerCase());
      let sumRupiah = 0;
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
      const linkList = [];
      for (const b of matched) {
        const amt = b.jumlah_bbm_rupiah != null ? Number(b.jumlah_bbm_rupiah) : 0;
        if (isFinite(amt)) sumRupiah += amt;
      }
      for (const b of matched) {
        try {
          const resp = await fileAPI.getAll({ bbm_record_id: b.id });
          const data = resp?.data ?? resp;
          const rowsA = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
          rowsA.forEach(x => linkList.push(`${apiUrl}/files/raw/${x.id}`));
        } catch { void 0 }
      }
      return { ...r, jumlahBbm: sumRupiah, lampiranLinks: linkList };
    }));

    const sheetData = rowsWithExtras.map(r => ({
      Tanggal: formatDateText(r.date),
      Messenger: r.messenger,
      Invoice: r.invoice,
      KM_Awal: r.kmAwal,
      KM_Akhir: r.kmAkhir,
      Total_KM: r.totalKm,
      Jumlah_BBM: r.jumlahBbm,
      Lampiran: Array.isArray(r.lampiranLinks) && r.lampiranLinks.length ? r.lampiranLinks.join('\n') : ''
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    const fn = `report-summary_${startDate || 'all'}_${endDate || 'all'}_${selectedMessenger || 'all'}.xlsx`;
    XLSX.writeFile(wb, fn);
  };

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] w-full max-w-[800px] p-5 sm:p-7 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto sm:overflow-visible">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#FFF1E6] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#fbaf77]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v8M12 16l4-4m-4 4l-4-4m4 4V8" />
              </svg>
            </div>
            <div className="text-left">
              <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-lg sm:text-[20px] tracking-[0] leading-[normal]">Export Report</h2>
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
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] focus:border-[#fbaf77] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px]"
            />
          </div>

          <div className="flex flex-col gap-2 p-3 rounded-[12px] border border-[#e5e5e5] hover:border-[#fbaf77] transition-colors">
            <span className="[font-family:'Suprema-SemiBold',Helvetica] text-[#404040] text-[13px] mb-1">Tanggal Akhir</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-3 bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] focus:border-[#fbaf77] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px]"
            />
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
                {messengerOptions.map((messenger) => (
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

export const Report = () => {
  const [searchKmAwal, setSearchKmAwal] = useState("");
  const [searchKmAkhir, setSearchKmAkhir] = useState("");
  const [searchInvoice, setSearchInvoice] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchMessenger, setSearchMessenger] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { deliveries } = useDeliveries();
  const { bbmRecords } = useBBM();
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

  

  const buildSummary = () => {
    const byDateMessenger = {};
    (Array.isArray(deliveries) ? deliveries : []).forEach(r => {
      const dateKey = r.sentDate || r.sent_date || r.tanggal;
      if (!dateKey) return;
      const messenger = r.messenger || 'Unknown';
      const d = toLocalYMD(dateKey);
      const key = `${d}_${messenger}`;
      if (!byDateMessenger[key]) byDateMessenger[key] = { rawDate: d, messenger, invoiceCount: 0, kmAwal: null, kmAkhir: null, jumlahBbm: 0 };
      byDateMessenger[key].invoiceCount += 1;
    });
    (Array.isArray(bbmRecords) ? bbmRecords : []).forEach(b => {
      const dateKey = b.tanggal || b.sentDate || b.sent_date;
      if (!dateKey) return;
      const messenger = b.messenger || 'Unknown';
      const d = toLocalYMD(dateKey);
      const key = `${d}_${messenger}`;
      if (!byDateMessenger[key]) byDateMessenger[key] = { rawDate: d, messenger, invoiceCount: 0, kmAwal: null, kmAkhir: null, jumlahBbm: 0 };
      const awal = b.kilometer_awal != null ? Number(b.kilometer_awal) : null;
      const akhir = b.kilometer_akhir != null ? Number(b.kilometer_akhir) : null;
      if (awal != null) byDateMessenger[key].kmAwal = byDateMessenger[key].kmAwal == null ? awal : Math.min(byDateMessenger[key].kmAwal, awal);
      if (akhir != null) byDateMessenger[key].kmAkhir = byDateMessenger[key].kmAkhir == null ? akhir : Math.max(byDateMessenger[key].kmAkhir, akhir);
      const amt = b.jumlah_bbm_rupiah != null ? Number(b.jumlah_bbm_rupiah) : 0;
      if (isFinite(amt)) byDateMessenger[key].jumlahBbm += amt;
    });
    const rows = Object.values(byDateMessenger).map(r => ({
      rawDate: r.rawDate,
      dateText: formatDateText(r.rawDate),
      messenger: r.messenger,
      invoiceCount: r.invoiceCount,
      kmAwal: r.kmAwal,
      kmAkhir: r.kmAkhir,
      totalKm: r.kmAwal != null && r.kmAkhir != null ? (r.kmAkhir - r.kmAwal) : null,
      jumlahBbm: r.jumlahBbm,
    }));
    rows.sort((a,b) => (new Date(a.rawDate) - new Date(b.rawDate)) || String(a.messenger).localeCompare(String(b.messenger)));
    return rows.reverse();
  };

  const sourceData = buildSummary();

  const filteredData = sourceData.filter((row) => {
    const matchesKmAwal = searchKmAwal
      ? String(row.kmAwal ?? '').includes(searchKmAwal)
      : true;
    const matchesKmAkhir = searchKmAkhir
      ? String(row.kmAkhir ?? '').includes(searchKmAkhir)
      : true;
    const matchesInvoice = searchInvoice
      ? row.invoiceCount.toString().includes(searchInvoice)
      : true;
    const matchesDate = searchDate
      ? String(row.dateText || '').toLowerCase().includes(searchDate.toLowerCase())
      : true;
    const matchesMessenger = searchMessenger
      ? String(row.messenger || '').toLowerCase().includes(searchMessenger.toLowerCase())
      : true;

    return matchesKmAwal && matchesKmAkhir && matchesInvoice && matchesDate && matchesMessenger;
  });

  const displayedData = filteredData.slice(0, entriesPerPage);

  const _handleView = async (rawDate) => {
    try {
      const list = [];
      const matched = (Array.isArray(bbmRecords) ? bbmRecords : []).filter(b => toLocalYMD(b.tanggal || b.sentDate || b.sent_date) === String(rawDate));
      for (const b of matched) {
        const resp = await fileAPI.getAll({ bbm_record_id: b.id });
        const data = resp?.data ?? resp;
        const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        rows.forEach(x => list.push(x));
      }
      setAttachments(list);
      setIsAttachmentModalOpen(true);
    } catch {
      setAttachments([]);
      setIsAttachmentModalOpen(true);
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
              Report
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
            Report
          </h1>

          <div className="flex items-center gap-2 mb-4 sm:mb-7 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="w-full sm:w-auto bg-[#197bbd] hover:bg-[#1569a3] text-white [font-family:'Quicksand',Helvetica] font-bold text-[10.2px] px-3.5 py-2.5 rounded-[12.45px] h-auto transition-colors duration-300 cursor-pointer"
            >
              Cetak Report
            </button>
          </div>

          <div className="text-left mb-4 sm:mb-7 rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms] bg-white">
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    Jumlah Invoice
                  </label>
                  <div className="relative">
                    <svg className="absolute left-[13.68px] top-1/2 -translate-y-1/2 w-[13.68px] h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="Jumlah Invoice"
                      value={searchInvoice}
                      onChange={(e) => setSearchInvoice(e.target.value)}
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
                      placeholder="Tanggal"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full pl-[44px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                    Messenger
                  </label>
                  <div className="relative">
                    <svg className="absolute left-[13.68px] top-1/2 -translate-y-1/2 w-[13.68px] h-[13.68px] text-[#9e9e9e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      placeholder="Messenger"
                      value={searchMessenger}
                      onChange={(e) => setSearchMessenger(e.target.value)}
                      className="w-full pl-[35px] pr-[13.68px] py-[17.1px] h-auto bg-white rounded-[10.26px] border-[0.85px] border-[#cccccccc] [font-family:'Inter',Helvetica] font-medium text-black text-[10.3px] placeholder:text-[#9e9e9e]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
            <section className="w-full flex flex-col gap-[15px]">
              <div className="bg-white rounded-[17.38px] shadow-[0px_0px_0.91px_#0000000a,0px_1.83px_5.49px_#0000000a,0px_14.63px_21.95px_#0000000f] p-4 sm:p-6 overflow-x-auto text-left">
                <h2 className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-black text-[18px] tracking-[0] leading-[normal] mb-4">
                  Ringkasan Laporan
                </h2>
                
                {/* Desktop Table */}
                <table className="hidden md:table w-full">
                  <thead>
                    <tr className="border-none">
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Tanggal
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Messenger
                      </th>
                      <th className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#aeaeae] text-[12.8px] tracking-[0] leading-[normal] text-left pb-2">
                        Jumlah Invoice
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
                        Jumlah BBM
                      </th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {displayedData.length > 0 ? (
                      displayedData.map((row, index) => (
                        <tr
                          key={`report-${row.rawDate}-${index}`}
                          className="border-b border-[#e5e5e5] text-left"
                        >
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[12.8px] tracking-[0] leading-[normal] py-3 underline">
                            <Link 
                              to={`/report/detail/${encodeURIComponent(row.rawDate)}?messenger=${encodeURIComponent(row.messenger)}`}
                              className="hover:text-[#faa463] transition-colors cursor-pointer"
                            >
                              {row.dateText}
                            </Link>
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                            {row.messenger}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                            {row.invoiceCount}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                            {row.kmAwal}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                            {row.kmAkhir}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                            {row.totalKm}
                          </td>
                          <td className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#c7c7c7] text-[12.8px] tracking-[0] leading-[normal] py-3">
                            {formatRupiah(row.jumlahBbm)}
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
                      <Link
                        key={`report-mobile-${row.rawDate}-${row.messenger}-${index}`}
                        to={`/report/detail/${encodeURIComponent(row.rawDate)}?messenger=${encodeURIComponent(row.messenger)}`}
                        className="block"
                      >
                        <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] p-3.5 hover:border-[#faa463] hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="[font-family:'Suprema-SemiBold',Helvetica] font-semibold text-[#404040] text-[13px] mb-1 leading-tight underline">
                                {row.dateText}
                              </p>
                              <p className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#9e9e9e] text-[11px]">
                                {row.invoiceCount} Invoice
                              </p>
                              <p className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#9e9e9e] text-[11px]">
                                Messenger: {row.messenger}
                              </p>
                            </div>
                            
                          </div>
                          
                          <div className="space-y-2 pt-2 border-t border-[#e5e5e5]">
                            <div className="flex items-start gap-2">
                              <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[85px]">KM Awal:</span>
                              <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.kmAwal}</span>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[85px]">KM Akhir:</span>
                              <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.kmAkhir}</span>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[85px]">Total KM:</span>
                              <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{row.totalKm}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="[font-family:'Suprema-Regular',Helvetica] font-medium text-[#696969] text-[11px] min-w-[85px]">Jumlah BBM:</span>
                              <span className="[font-family:'Suprema-Regular',Helvetica] font-normal text-[#404040] text-[11px] flex-1">{formatRupiah(row.jumlahBbm)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
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

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} deliveries={deliveries} bbmRecords={bbmRecords} />
      <AttachmentsModal isOpen={isAttachmentModalOpen} onClose={() => setIsAttachmentModalOpen(false)} attachments={attachments} />

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

export default Report;
import usersIcon from '../assets/users.svg';