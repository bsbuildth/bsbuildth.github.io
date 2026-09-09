import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { demoQuote } from '../src/lib/quotation.js';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
 const { default: Preview } = await server.ssrLoadModule('/src/components/QuotationPreview.jsx');
 mkdirSync('tmp/quote-qa', { recursive: true });
 const css = readFileSync('src/pages/Quotations.css','utf8');
 for (const long of [false,true]) {
  const quote=demoQuote();
  if(long) quote.sections[0].items=Array.from({length:45},(_,i)=>({...quote.sections[0].items[i%7],id:String(i),description:`รายการที่ ${i+1} รายละเอียดงานและวัสดุสำหรับตรวจการตัดบรรทัดภาษาไทยในใบเสนอราคา`}));
  const markup=renderToStaticMarkup(createElement(Preview,{quote,status:'issued',revision:1}));
  writeFileSync(`tmp/quote-qa/${long ? 'multi' : 'single'}.html`,`<!DOCTYPE html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ใบเสนอราคาตัวอย่าง</title><style>${css}</style><body>${markup}</body></html>`);
 }
} finally { await server.close(); }
