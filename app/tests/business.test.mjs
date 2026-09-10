import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoQuote, calculateQuote, validateIssue } from '../src/lib/quotation.js';
import { createContactSender } from '../src/lib/contact.js';
import { hasAdminAccess, hasAdminClaim } from '../src/lib/admin-access.js';
import { validateMedia, validateDocument } from '../src/lib/media.js';
import { newReceipt, calculateReceipt, validateReceipt } from '../src/lib/receipt.js';
test('sample quotation totals, free item and installments match the reference', () => {
 const q = demoQuote(), r = validateIssue(q);
 assert.equal(r.main,5501000); assert.equal(r.optional,4450000); assert.equal(r.total,9951000);
 assert.deepEqual(r.installments.map(i => i.amount),[2200400,2200400,1100200]);
 assert.equal(r.sections[1].items.at(-1).amount,0); assert.equal(r.sections[1].items.at(-1).reference,450000);
 q.sections[1].items[0].included=false;
 assert.equal(calculateQuote(q).total,9051000);
 q.paymentBase='total'; assert.equal(calculateQuote(q).base,9051000);
});
test('decimal rounding, bad quantities and incomplete percentages', () => {
 const q=demoQuote(); q.sections=[{id:'a',title:'test',kind:'main',items:[{id:'1',description:'test',quantity:'1.005',price:'1.00',unit:'งาน',included:true,free:false}]}];
 const r=calculateQuote(q); assert.equal(r.total,101); assert.equal(r.installments.reduce((n,i)=>n+i.amount,0),101);
 for (const value of ['-1','NaN','','1e3','1.1234']) {q.sections[0].items[0].quantity=value;assert.throws(()=>calculateQuote(q));}
 q.sections[0].items[0].quantity='1';q.installments[0].percent='39';assert.throws(()=>calculateQuote(q));
});
test('VAT is included in the total and never changes line-item values', () => {
 const q=demoQuote(),withVat=calculateQuote(q);
 assert.equal(withVat.beforeVat+withVat.vat,withVat.total);
 assert.equal(withVat.total,9951000);
 q.billDiscount='510.00';const discounted=calculateQuote(q);
 assert.equal(discounted.subtotal,9951000);assert.equal(discounted.discount,51000);assert.equal(discounted.total,9900000);
 assert.equal(discounted.beforeVat+discounted.vat,discounted.total);assert.equal(discounted.base,5450000);
 q.vatRate='0';const withoutVat=calculateQuote(q);
 assert.equal(withoutVat.vat,0);assert.equal(withoutVat.beforeVat,withoutVat.total);assert.equal(withoutVat.total,9900000);
 q.vatRate='100.01';assert.throws(()=>calculateQuote(q));
 q.vatRate='7';q.billDiscount='99510.01';assert.throws(()=>calculateQuote(q));
});
test('failed contact save does not notify and can retry; concurrent click is ignored', async () => {
 const data={name:'ทดสอบ',contactInfo:'test',serviceType:'ครัว'};let notify=0,save=0,release;
 const sender=createContactSender(async()=>{save++;if(save===1)throw Error('offline');await new Promise(r=>{release=r;});},()=>{notify++;});
 await assert.rejects(sender(data)); assert.equal(notify,0);
 const pending=sender(data); assert.equal(await sender(data),false); release(); assert.equal(await pending,true);
 await Promise.resolve(); assert.equal(save,2);assert.equal(notify,1);
});
test('admin and media limits fail closed', () => {
 for(const claims of [null,{}, {admin:false},{admin:'true'}])assert.equal(hasAdminClaim(claims),false);
 assert.equal(hasAdminClaim({admin:true}),true);
 assert.equal(hasAdminAccess({},'songyos2528@gmail.com'),true);
 assert.equal(hasAdminAccess({},'SONGYOS2528@GMAIL.COM'),true);
 assert.equal(hasAdminAccess({},'someone@example.com'),false);
 assert.throws(()=>validateMedia({type:'image/svg+xml',size:100}));
 assert.throws(()=>validateMedia({type:'video/mp4',size:25*1024*1024}));
 assert.throws(()=>validateDocument({text:'x'.repeat(800001)}));
});
test('receipt created from quotation totals and validates printable amount', () => {
 const quote=demoQuote(),totals=calculateQuote(quote),receipt=newReceipt({quote,totals});
 receipt.number='RC-001';
 const result=validateReceipt(receipt);
 assert.equal(result.total,totals.total);
 assert.equal(receipt.quoteNumber,quote.number);
 receipt.items.push({id:'extra',description:'ชำระเพิ่ม',amount:'0.01'});
 assert.equal(calculateReceipt(receipt).total,totals.total+1);
 receipt.items[0].amount='1.001';assert.throws(()=>calculateReceipt(receipt));
});
