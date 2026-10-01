import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentSummary, validatePassport, checkoutErrors, safePaymentRecord } from '../payments.js';
import { products, createOrder } from '../data.js';

const gold = (price, id = 'gold') => ({ id, price, identificationCategory: 'precious_jewelry', storefront: 'gold', sellerId: 'karat', warehouseId: 'ufa-gold' });
const tech = price => ({ id: 'tech', price, identificationCategory: 'none', storefront: 'tech', sellerId: 'smart', warehouseId: 'ufa-tech' });
const identity = { fullName: 'Тестов Тест', birthDate: '1990-01-01', series: '0000', number: '000000', issueDate: '2020-01-01', division: '000-000', issuer: 'Тестовое подразделение', address: 'Демо-город, Тестовая, 1' };
const draft = (method = 'cash') => ({ method, delivery: 'pickup', recipient: 'Демо-покупатель', deliveryAddress: '', identity: { ...identity } });

for (const [method, threshold] of [['cash', 60000], ['card', 400000], ['sbp', 400000], ['card_on_receipt', 400000]]) {
  test(`${method}: порог включительный, копейка ниже не требует анкеты`, () => {
    for (const [price, expected] of [[threshold - 0.01, false], [threshold, true], [threshold + 0.01, true]]) {
      assert.equal(paymentSummary([gold(price)], method).requiresIdentity, expected);
    }
  });
}

test('в смешанной корзине порог учитывает только золото, независимо от общей суммы', () => {
  assert.equal(paymentSummary([gold(59999.99), tech(900000)], 'cash').requiresIdentity, false);
  assert.equal(paymentSummary([gold(60000), tech(1)], 'cash').requiresIdentity, true);
  assert.equal(paymentSummary([gold(399999.99), tech(900000)], 'card').requiresIdentity, false);
  assert.equal(paymentSummary([gold(400000), tech(1)], 'card').requiresIdentity, true);
  assert.equal(paymentSummary([tech(900000)], 'cash').requiresIdentity, false);
  assert.equal(paymentSummary([tech(900000)], 'card').requiresAuth, true);
});

test('золото суммируется между складами, дубликаты и доставка не увеличивают порог', () => {
  const first = gold(200000, 'one');
  const second = { ...gold(199999.99, 'two'), warehouseId: 'another-gold' };
  const result = paymentSummary([first, first, second, tech(900000)], 'card', 'delivery');
  assert.equal(result.goldTotal, 399999.99);
  assert.equal(result.shipping, 1050);
  assert.equal(result.requiresIdentity, false);
  assert.equal(paymentSummary([first, { ...second, price: 200000 }], 'card').requiresIdentity, true);
});

test('признак идентификации не выводится из витрины или продавца', () => {
  for (const item of products) assert.equal(item.identificationCategory === 'precious_jewelry', item.category === 'gold');
  const nonGold = products.filter(item => ['stones', 'watches'].includes(item.category)).map(item => ({ ...item, price: 900000 }));
  assert.ok(nonGold.length);
  assert.equal(paymentSummary(nonGold, 'cash').requiresIdentity, false);
  const items = products.filter(item => ['g09', 'a01'].includes(item.id));
  assert.equal(paymentSummary(items, 'card', 'delivery').total, createOrder(items.map(item => item.id), [], 'delivery').total);
});

test('нельзя завершить покупку без входа, анкеты, адреса или с несовместимой оплатой', () => {
  assert.throws(() => safePaymentRecord([tech(1)], draft(), false), /вход/);
  assert.throws(() => safePaymentRecord([gold(60000)], { ...draft(), identity: {} }, true), /анкету/);
  assert.deepEqual(checkoutErrors([gold(59999.99)], { ...draft(), identity: {} }, true), []);
  assert.ok(checkoutErrors([tech(1)], { ...draft('card'), delivery: 'delivery' }, true).some(error => error.includes('адрес')));
  assert.ok(checkoutErrors([tech(1)], { ...draft(), delivery: 'delivery' }, true).some(error => error.includes('онлайн')));
  assert.throws(() => safePaymentRecord([], draft(), true), /пуста/);
  assert.throws(() => paymentSummary([gold(-1)], 'cash'), /цен/);
  assert.throws(() => paymentSummary([gold(1)], 'unknown'), /оплат/);
  assert.throws(() => paymentSummary([gold(1)], 'toString'), /оплат/);
});

test('паспорт проверяется по формату и реальным календарным датам', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  assert.deepEqual(validatePassport(identity, now), {});
  for (const [field, value] of [['fullName', 'Тест'], ['series', '000'], ['number', '1234567'], ['division', '123456'], ['birthDate', '1990-02-30'], ['issueDate', '2099-01-01'], ['issuer', ''], ['address', '']]) {
    assert.ok(validatePassport({ ...identity, [field]: value }, now)[field], field);
  }
  assert.ok(validatePassport({ ...identity, issueDate: '1989-01-01' }, now).issueDate);
});

test('заказ хранит только результат сценария, без паспорта, телефона и адресов', () => {
  const values = { ...draft('card'), phone: '+7 000 000-00-00', deliveryAddress: 'Секретный ПВЗ' };
  const record = safePaymentRecord([gold(400000)], values, true, 'success');
  assert.equal(record.paymentStatus, 'demo_paid');
  assert.equal(record.identification.status, 'demo_form_completed');
  const json = JSON.stringify(record);
  for (const value of [...Object.values(identity), values.recipient, values.phone, values.deliveryAddress]) assert.ok(!json.includes(JSON.stringify(value)), value);
  assert.equal(safePaymentRecord([tech(1)], draft(), true).paymentStatus, 'awaiting_on_receipt');
  for (const outcome of ['cancel', 'decline', undefined]) assert.throws(() => safePaymentRecord([tech(1)], values, true, outcome), /не подтверждена/);
});
