const filePart = value => String(value || '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

export async function exportSiteUpdatePdf({ root, projectName, dateStamp }) {
  if (!root) throw new Error('ไม่พบรายงานสำหรับสร้าง PDF');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const pages = [...root.querySelectorAll('.site-summary-pdf-page')];
  if (!pages.length) throw new Error('ยังไม่มีข้อมูลสำหรับสร้าง PDF');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  for (let index = 0; index < pages.length; index += 1) {
    const canvas = await html2canvas(pages[index], { scale: 1.5, backgroundColor: '#fffdf8', useCORS: true, logging: false });
    const width = 190; const height = canvas.height * width / canvas.width;
    if (index) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', .9), 'JPEG', 10, 10, width, Math.min(277, height), undefined, 'FAST');
  }
  const filename = `สรุปโครงการ_${filePart(projectName) || 'โครงการ'}_${dateStamp || new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = pdf.output('blob'); pdf.save(filename);
  return new File([blob], filename, { type: 'application/pdf' });
}
