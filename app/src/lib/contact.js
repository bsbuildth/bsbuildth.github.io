export function validateContact(data) {
  const limits = { name: 120, contactInfo: 160, email: 254, serviceType: 160, message: 5000 };
  const clean = {};
  for (const [key, max] of Object.entries(limits)) {
    clean[key] = String(data[key] ?? '').trim();
    if (clean[key].length > max) throw new Error('ข้อมูลยาวเกินกำหนด');
  }
  if (!clean.name || !clean.contactInfo || !clean.serviceType) throw new Error('โปรดกรอกชื่อ ช่องทางติดต่อ และประเภทงาน');
  return clean;
}

// The saved contact is the source of truth. Notifications never determine success.
export function createContactSender(save, notify = () => {}) {
  let pending = false;
  return async (data) => {
    if (pending) return false;
    const clean = validateContact(data);
    pending = true;
    try {
      await save(clean);
      Promise.resolve().then(() => notify(clean)).catch(() => {});
      return true;
    } finally { pending = false; }
  };
}
