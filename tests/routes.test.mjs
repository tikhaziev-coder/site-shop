import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute, estimateValue } from '../routes.js';

test('маршруты различают витрину, модель и экземпляр', () => {
  assert.equal(resolveRoute('/zoloto/kamni/').category, 'stones');
  assert.equal(resolveRoute('/tehnika/smartfony').category, 'phones');
  assert.equal(resolveRoute('/m/iphone-13-128').type, 'model');
  assert.equal(resolveRoute('/p/p01').product.id, 'p01');
  assert.equal(resolveRoute('/p/missing').type, 'notfound');
  assert.equal(resolveRoute('/m/missing').type, 'notfound');
});
test('город отделения проверяется, неизвестные вложенные пути не открывают чужую точку', () => {
  assert.equal(resolveRoute('/shops/ufa/ufa-center').type, 'branch');
  assert.equal(resolveRoute('/shops/sterlitamak/ufa-center').type, 'notfound');
  assert.equal(resolveRoute('/shops/ufa/ufa-center/extra').type, 'notfound');
});
test('условная оценка отбрасывает некорректные данные', () => {
  assert.equal(estimateValue('gold', { purity: '585', weight: '5.2' }).buyout, 26000);
  assert.equal(estimateValue('gold', { purity: '585', weight: '-5' }), null);
  assert.equal(estimateValue('gold', { purity: '111', weight: '5' }), null);
  assert.equal(estimateValue('tech', { model: 'iphone', grade: 'A' }).buyout, 21600);
  assert.equal(estimateValue('tech', { model: 'missing', grade: 'A' }), null);
});
