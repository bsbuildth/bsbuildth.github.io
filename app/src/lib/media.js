export function validateMedia(file) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4'].includes(file.type)) throw new Error('รองรับ JPG, PNG, WebP และ MP4 เท่านั้น');
  if (file.size > 24 * 1024 * 1024) throw new Error('ไฟล์ต้องไม่เกิน 24 MB');
}
export function validateDocument(data) {
  if (new TextEncoder().encode(JSON.stringify(data)).length > 800_000) throw new Error('ข้อมูลรวมรูปมีขนาดใหญ่เกินไป กรุณาลดขนาดหรือใช้ที่เก็บสื่อ');
  return data;
}
