import { collection, doc, getDocs, limit, query, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { calculateCatalogPrice, STARTER_PRICE_CATALOG } from '../lib/priceCatalog';

const catalog = collection(db, 'priceCatalog');
const cleanText = value => String(value ?? '').trim();
const cleanNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

export function prepareCatalogItem(input) {
  const price = calculateCatalogPrice(input);
  return {
    code: cleanText(input.code).slice(0, 50), category: cleanText(input.category).slice(0, 120), materialGroup: cleanText(input.materialGroup).slice(0, 120),
    name: cleanText(input.name).slice(0, 240), specification: cleanText(input.specification).slice(0, 500), unit: cleanText(input.unit).slice(0, 40),
    materialCost: cleanNumber(input.materialCost), laborCost: cleanNumber(input.laborCost), wastePercent: cleanNumber(input.wastePercent),
    transportPercent: cleanNumber(input.transportPercent), materialMarkupPercent: cleanNumber(input.materialMarkupPercent), overheadPercent: cleanNumber(input.overheadPercent),
    centralPrice: price.centralPrice, companyMode: input.companyMode === 'fixed' ? 'fixed' : 'percent',
    companyAdjustmentPercent: cleanNumber(input.companyAdjustmentPercent), companyPrice: price.companyPrice,
    source: cleanText(input.source).slice(0, 500), active: input.active !== false,
  };
}

export async function listPriceCatalog() {
  const snapshot = await getDocs(catalog);
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => `${a.category}${a.code}`.localeCompare(`${b.category}${b.code}`, 'th'));
}

export async function savePriceCatalogItem(id, input) {
  const reference = id ? doc(db, 'priceCatalog', id) : doc(catalog);
  return runTransaction(db, async transaction => {
    const existing = await transaction.get(reference);
    const current = existing.exists() ? existing.data() : null;
    const version = Number(current?.version || 0) + 1;
    const data = prepareCatalogItem(input);
    transaction.set(reference, { ...data, version, createdAt: current?.createdAt || serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    transaction.set(doc(reference, 'history', String(version)), { ...data, version, changedAt: serverTimestamp() });
    return reference.id;
  });
}

export async function seedPriceCatalog() {
  const existing = await getDocs(query(catalog, limit(1)));
  if (!existing.empty) throw new Error('มีคลังราคาอยู่แล้ว จึงไม่เพิ่มชุดตั้งต้นซ้ำ');
  const batch = writeBatch(db);
  for (const item of STARTER_PRICE_CATALOG) {
    const reference = doc(catalog);
    const data = prepareCatalogItem(item);
    batch.set(reference, { ...data, version: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.set(doc(reference, 'history', '1'), { ...data, version: 1, changedAt: serverTimestamp() });
  }
  await batch.commit();
  return STARTER_PRICE_CATALOG.length;
}
