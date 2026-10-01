import { test, expect } from '@playwright/test';

const action = (page, name) => page.locator(`[data-checkout-action="${name}"]`);
async function openCart(page, cart) {
  await page.goto('/');
  await page.evaluate(ids => {
    localStorage.setItem('sks-market-demo-v1', JSON.stringify({ cart: ids, orders: [], favorites: [] }));
    sessionStorage.clear();
  }, cart);
  await page.goto('/checkout');
}
async function login(page) {
  await action(page, 'send-code').click();
  await page.locator('[name="demo-code"]').fill('1234');
  await action(page, 'verify-code').click();
}
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('sks-market-demo-v1')));

test('вход обязателен, код проверяется, смешанная корзина ниже порога обходится без паспорта', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openCart(page, ['g01', 'l01']);
  await page.locator('[data-checkout-step="3"]').click();
  await expect(page.getByRole('alert')).toContainText('Войдите');
  await action(page, 'send-code').click();
  await page.locator('[name="demo-code"]').fill('0000');
  await action(page, 'verify-code').click();
  await expect(page.getByRole('alert')).toContainText('Неверный');
  await page.locator('[name="demo-code"]').fill('1234');
  await action(page, 'verify-code').click();
  await action(page, 'next').click();
  await expect(page.locator('#identification-status')).toContainText('Достаточно авторизации');
  await expect(page.locator('[data-passport]')).toHaveCount(0);
  await action(page, 'next').click();
  await action(page, 'submit').click();
  await expect(page).toHaveURL(/\/checkout\/done$/);
  const order = (await saved(page)).orders[0];
  expect(order.paymentStatus).toBe('awaiting_on_receipt');
  expect(order.identification.goldTotal).toBe(18490);
  expect(order.identification.required).toBe(false);
  await page.goto('/account');
  await action(page, 'logout').click();
  await expect(page.locator('.account-auth')).toContainText('ещё не вошли');
  expect(errors).toEqual([]);
});

test('наличные требуют анкету, смена способа пересчитывает порог и очищает паспорт', async ({ page }, testInfo) => {
  await openCart(page, ['g01', 'g02', 'g03', 'g04']);
  await login(page);
  await action(page, 'next').click();
  await expect(page.locator('.passport-panel')).toBeVisible();
  await page.locator('[data-checkout-step="3"]').click();
  await expect(page.locator('[data-passport="series"]')).toHaveAttribute('aria-invalid', 'true');
  await action(page, 'sample-passport').click();
  await page.locator('[name="payment"][value="card_on_receipt"]').check();
  await expect(page.locator('.passport-panel')).toHaveCount(0);
  await page.locator('[name="payment"][value="cash"]').check();
  await expect(page.locator('[data-passport="series"]')).toHaveValue('');
  await action(page, 'sample-passport').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `screenshots/${testInfo.project.name}-payment-passport.png`, fullPage: true });
  await action(page, 'next').click();
  await action(page, 'edit-payment').first().click();
  await expect(page.locator('[data-passport="series"]')).toHaveValue('0000');
  await action(page, 'next').click();
  await action(page, 'submit').click();
  await expect(page).toHaveURL(/\/checkout\/done$/);
  const order = (await saved(page)).orders[0];
  expect(order.identification.required).toBe(true);
  expect(order.identification.status).toBe('demo_form_completed');
  await expect(page.locator('#route-page')).toContainText('данные анкеты удалены');
});

test('дорогое золото: СБП, отказ, отмена, повтор и безопасное сохранение', async ({ page }, testInfo) => {
  await openCart(page, ['g09', 'a01']);
  const network = [];
  page.on('request', request => network.push(`${request.url()} ${request.postData() || ''}`));
  await login(page);
  await page.locator('#delivery-method').selectOption('delivery');
  await action(page, 'next').click();
  await expect(page.getByRole('alert')).toContainText('адрес');
  await page.locator('[name="deliveryAddress"]').fill('Только демо ПВЗ, Тестовая, 1');
  await action(page, 'next').click();
  await expect(page.locator('[name="payment"][value="cash"]')).toBeDisabled();
  await expect(page.locator('[name="payment"][value="card_on_receipt"]')).toBeDisabled();
  await page.locator('[name="payment"][value="sbp"]').check();
  await expect(page.locator('.passport-panel')).toBeVisible();
  await action(page, 'sample-passport').click();
  await page.locator('[data-passport="fullName"]').fill('Приватный Тестовый');
  await page.locator('[data-passport="number"]').fill('654321');
  await action(page, 'next').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await action(page, 'submit').click();
  await action(page, 'payment-decline').click();
  expect((await saved(page)).orders).toHaveLength(0);
  expect((await saved(page)).cart).toHaveLength(2);
  await action(page, 'submit').click();
  await action(page, 'payment-cancel').click();
  expect((await saved(page)).orders).toHaveLength(0);
  await action(page, 'submit').click();
  await page.screenshot({ path: `screenshots/${testInfo.project.name}-payment-review.png`, fullPage: true });
  await action(page, 'payment-success').click();
  await expect(page).toHaveURL(/\/checkout\/done$/);
  const result = await saved(page);
  expect(result.orders).toHaveLength(1);
  expect(result.cart).toHaveLength(0);
  expect(result.orders[0].payment).toBe('sbp');
  expect(result.orders[0].paymentStatus).toBe('demo_paid');
  expect(result.orders[0].identification.goldTotal).toBe(420000);
  expect(result.orders[0].shipping).toBe(700);
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  for (const secret of ['Приватный', '654321', 'Только демо ПВЗ']) {
    expect(storage).not.toContain(secret);
    expect(decodeURI(network.join('\n'))).not.toContain(secret);
  }
  await page.goBack();
  await expect(page.locator('#checkout-mount')).toContainText('Корзина пуста');
  expect((await saved(page)).orders).toHaveLength(1);
});

test('техника без анкеты, вход переживает обновление, уход очищает паспорт', async ({ page }) => {
  await openCart(page, ['l01', 'l02']);
  await login(page);
  await page.reload();
  await expect(page.locator('#delivery-method')).toBeVisible();
  await action(page, 'next').click();
  await expect(page.locator('[data-passport]')).toHaveCount(0);
  await page.locator('[name="payment"][value="card_on_receipt"]').check();
  await action(page, 'next').click();
  await action(page, 'submit').click();
  await expect(page).toHaveURL(/\/checkout\/done$/);
  expect((await saved(page)).orders[0].identification.required).toBe(false);
  await openCart(page, ['g09']);
  await login(page);
  await action(page, 'next').click();
  await action(page, 'sample-passport').click();
  await page.locator('.checkout-summary a[href="/cart"]').click();
  await page.locator('a[href="/checkout"]').click();
  await expect(page.locator('[data-passport="fullName"]')).toHaveValue('');
  await page.goto('/account');
  await action(page, 'logout').click();
  await page.locator('a[href="/login"]').click();
  await login(page);
  await expect(page).toHaveURL(/\/account$/);
});
