import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (data, columns, filename = 'export') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Delivered Ontime Report', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  
  doc.autoTable({
    head: [columns],
    body: data,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  doc.save(`${filename}_${new Date().getTime()}.pdf`);
};