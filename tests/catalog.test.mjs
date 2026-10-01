import test from 'node:test';
import assert from 'node:assert/strict';
import { products, selectProducts, getCartGroups, createOrder } from '../data.js';

test('город, категория, состояние и цена применяются вместе', () => {
  const selected = selectProducts({ city: 'Уфа', category: 'gold', condition: 'Как новый', max: 20000, sort: 'cheap' });
  assert.deepEqual(selected.map(product => product.id), ['g03', 'g01']);
});
test('поиск работает без учёта регистра и с обрезкой пробелов', () => {
  assert.equal(selectProducts({ city: 'all', query: '  IPHONE 13 ' }).length, 4);
  assert.equal(selectProducts({ city: 'Уфа', query: 'нет такого товара' }).length, 0);
});
test('избранное сохраняет ограничения города', () => {
  assert.deepEqual(selectProducts({ city: 'Уфа', favorites: true }, ['g01', 'g04']).map(product => product.id), ['g01']);
});
test('склады золота и техники одного подразделения разделены', () => {
  const groups = getCartGroups(['g01', 'a01', 'p01', 'g01']);
  assert.equal(Object.keys(groups).length, 3);
  assert.equal(groups['karat:ufa-center-gold'].length, 1);
  assert.equal(groups['smart:ufa-center-tech'][0].id, 'a01');
});
test('заказ содержит уникальные экземпляры и тариф по складам', () => {
  const order = createOrder(['g01', 'g01', 'a01', 'p01'], [], 'delivery');
  assert.equal(order.items.length, 3);
  assert.equal(order.shipping, 1050);
  assert.equal(order.total, 18490 + 8990 + 29990 + 1050);
  assert.equal(createOrder(['g01'], [], 'pickup').shipping, 0);
});
test('нельзя повторно зарезервировать товар или оформить пустой заказ', () => {
  assert.throws(() => createOrder(['g01'], ['g01'], 'pickup'), /зарезервирован/);
  assert.throws(() => createOrder([], [], 'pickup'), /пуста/);
  assert.throws(() => createOrder(['bad-id'], [], 'pickup'), /зарезервирован/);
  assert.throws(() => createOrder(['g01'], [], 'unknown'), /способ/);
});
test('все экземпляры имеют отдельный склад правильного типа', () => {
  assert.equal(new Set(products.map(product => product.id)).size, products.length);
  assert.ok(products.every(product => product.stock === 1 && product.warehouseId.endsWith(`-${product.storefront}`)));
});

test('модель техники объединяет экземпляры одной памяти, grade и АКБ независимы', () => {
  assert.equal(selectProducts({ model: 'iphone-13-128', city: 'all' }).length, 3);
  assert.deepEqual(selectProducts({ model: 'iphone-13-128', grade: 'A', battery: 85 }).map(product => product.id), ['p01']);
  assert.deepEqual(selectProducts({ model: 'iphone-13-128', itemState: 'new' }).map(product => product.id), ['p04']);
});
test('камни не получают параметры металла, часы принадлежат ювелирному продавцу', () => {
  const stones = selectProducts({ category: 'stones' });
  assert.ok(stones.length > 0 && stones.every(product => !product.weight && !product.metal && !product.pricePerGram));
  assert.ok(products.filter(product => product.category === 'watches').every(product => product.sellerId === 'karat' && product.storefront === 'gold'));
  assert.ok(products.every(product => product.category !== 'tools'));
});
test('заказ фиксирует отправления и продавцов', () => {
  const order = createOrder(['g01', 'a01'], [], 'delivery');
  assert.equal(order.shipments.length, 2);
  assert.deepEqual(order.shipments.map(shipment => shipment.sellerId), ['karat', 'smart']);
});
