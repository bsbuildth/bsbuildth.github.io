const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function safeFilename(value) {
  const cleaned = String(value || 'quotation').replace(/[\\/:*?"<>|]/g, '-').trim();
  return `${cleaned || 'quotation'}.pdf`;
}

export function quotationFilename(quote = {}, timestamp = new Date()) {
  const date = timestamp instanceof Date && !Number.isNaN(timestamp.getTime()) ? timestamp : new Date();
  const pad = value => String(value).padStart(2, '0');
  const dateTime = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return [quote.number || 'ใบเสนอราคา', quote.customer || 'ลูกค้า', dateTime].map(value => String(value).trim()).filter(Boolean).join('_');
}

async function waitForImages(element) {
  const images = [...element.querySelectorAll('img')];
  await Promise.all(images.map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  })));
}

export function quotationReviewPrompt(number = '') {
  return `ช่วยตรวจสอบใบเสนอราคา${number ? `เลขที่ ${number}` : ''}ในไฟล์ PDF ที่แนบมา โดยตรวจ:\n1. จำนวน × ราคาต่อหน่วยและยอดแต่ละรายการ\n2. ยอดรวม ส่วนลด ภาษีมูลค่าเพิ่ม และยอดสุทธิ\n3. ยอดและเปอร์เซ็นต์ของงวดชำระ\n4. วันที่ เลขเอกสาร รายการซ้ำ คำผิด และเงื่อนไขที่ขัดกัน\nรายงานเฉพาะจุดที่พบ พร้อมระบุหน้าหรือรายการ และอย่าแก้หรือสมมติตัวเลขแทนข้อมูลในเอกสาร`;
}

export function redactQuotationForAi(quote) {
  return {
    ...structuredClone(quote),
    customer: 'ลูกค้า (ปกปิดข้อมูล)',
    phone: 'ข้อมูลถูกปกปิด',
    project: quote.project ? 'โครงการ (ปกปิดข้อมูล)' : '',
    sellerPhone: '',
    sellerTaxId: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    customerSignatureImage: '',
    customerSignerName: '',
    customerSignedAt: '',
    sellerSignatureImage: '',
    sellerSignerName: '',
    sellerSignedAt: '',
  };
}

export async function quotationElementToPdfFile(element, filename, redacted = false) {
  if (!element) throw new Error('ไม่พบตัวอย่างใบเสนอราคาสำหรับสร้าง PDF');
  await document.fonts.ready;
  await waitForImages(element);
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  element.classList.add('pdf-rendering');
  let canvas;
  try {
    const contentHeight = Math.max(element.scrollHeight, element.clientHeight);
    const scale = Math.max(1, Math.min(2, 28000 / Math.max(1, contentHeight)));
    canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      width: element.scrollWidth,
      height: contentHeight,
      windowWidth: element.scrollWidth,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    element.classList.remove('pdf-rendering');
  }
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pagePixelHeight = Math.floor(canvas.width * A4_HEIGHT_MM / A4_WIDTH_MM);
  let offset = 0;
  let page = 0;
  while (offset < canvas.height) {
    const sliceHeight = Math.min(pagePixelHeight, canvas.height - offset);
    const slice = document.createElement('canvas');
    slice.width = canvas.width; slice.height = sliceHeight;
    const context = slice.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    if (page > 0) pdf.addPage('a4', 'portrait');
    pdf.addImage(slice.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, A4_WIDTH_MM, sliceHeight / pagePixelHeight * A4_HEIGHT_MM, undefined, 'FAST');
    offset += sliceHeight; page += 1;
  }
  const suffix = redacted ? '-AI-REVIEW' : '';
  return new File([pdf.output('blob')], safeFilename(`${filename || 'quotation'}${suffix}`), { type: 'application/pdf' });
}

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = file.name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
