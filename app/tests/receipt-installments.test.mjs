import test from 'node:test';
import assert from 'node:assert/strict';
import { newReceipt, selectReceiptInstallment, calculateReceipt } from '../src/lib/receipt.js';

test('receipt installment preserves exact quoted amount and survives draft reload', () => {
  const receipt = newReceipt({ quote: { number: 'QT-01' }, totals: { total: 10001, installments: [
    { label: 'งวดที่ 1', percent: '50', condition: 'ก่อนเริ่มงาน', amount: 5001 },
    { label: 'งวดที่ 2', percent: '50', condition: 'ส่งมอบงาน', amount: 5000 },
  ] } });
  const first = selectReceiptInstallment(receipt, '0');
  assert.equal(calculateReceipt(first).total, 5001);
  assert.match(first.items[0].description, /ก่อนเริ่มงาน/);
  const restored = JSON.parse(JSON.stringify(first));
  assert.equal(restored.installmentIndex, '0');
  assert.equal(calculateReceipt(selectReceiptInstallment(restored, '1')).total, 5000);
  assert.equal(calculateReceipt(selectReceiptInstallment(restored, '')).total, 10001);
  assert.throws(() => selectReceiptInstallment(restored, '9'));
  assert.equal(receipt.installmentIndex, '');
});
