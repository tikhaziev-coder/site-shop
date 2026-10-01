import { test, expect } from '@playwright/test';

const action = (page, name) => page.locator(`[data-checkout-action="${name}"]`);
test('публичный подкаталог: ссылки, картинки, поиск, корзина и паспортная демо-оплата', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const requests = [];
  page.on('request', request => requests.push(request));
  await page.goto('./');
  await expect(page.locator('#products .product-card')).not.toHaveCount(0);
  await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator('.storefront-switch a').first()).toHaveAttribute('href', '/site-shop/zoloto');
  await page.locator('.storefront-switch [data-storefront="tech"]').click();
  await expect(page).toHaveURL(/\/site-shop\/tehnika\/?$/);
  await page.reload();
  await expect(page.locator('#hero-title')).toContainText('Большие планы');
  await page.locator('#search').fill('iPhone');
  await page.locator('#search-form').evaluate(form => form.requestSubmit());
  await expect(page).toHaveURL(/\/site-shop\/search\?q=iPhone/);
  await expect(page.locator('.product-card')).toHaveCount(3);
  await page.goBack();
  await expect(page.locator('#hero-title')).toContainText('Большие планы');
  const product = await page.goto('p/g09');
  expect(product.status()).toBe(200);
  await expect(page.locator('#route-page')).toContainText('Большая история');
  await page.locator('[data-add="g09"]').click();
  await page.goto('p/a01');
  await page.locator('[data-add="a01"]').click();
  await page.locator('[data-action="cart"]').click();
  await expect(page.locator('.cart-group')).toHaveCount(2);
  await page.locator('a[href="/site-shop/checkout"]').click();
  await page.reload();
  await action(page, 'send-code').click();
  await page.locator('[name="demo-code"]').fill('1234');
  await action(page, 'verify-code').click();
  await action(page, 'next').click();
  await page.locator('[name="payment"][value="sbp"]').check();
  await expect(page.locator('.passport-panel')).toBeVisible();
  await action(page, 'sample-passport').click();
  await action(page, 'next').click();
  await action(page, 'submit').click();
  await action(page, 'payment-decline').click();
  await expect(page.getByRole('alert')).toContainText('отклонил');
  await action(page, 'submit').click();
  await action(page, 'payment-success').click();
  await expect(page).toHaveURL(/\/site-shop\/checkout\/done\/?$/);
  await page.locator('#route-page a[href="/site-shop/account"]').click();
  await page.reload();
  await expect(page.locator('.order-item')).toHaveCount(1);
  await expect(page.locator('.order-item')).toContainText('Демо-оплата успешна');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `screenshots/${testInfo.project.name}-pages-account.png`, fullPage: true });
  await page.locator('[data-cancel]').click();
  await page.goto('p/g09');
  await expect(page.locator('[data-add="g09"]')).toBeEnabled();
  for (const request of requests) {
    expect(request.method()).toBe('GET');
    expect(new URL(request.url()).pathname).toMatch(/^\/site-shop\//);
  }
  expect(errors).toEqual([]);
});

test('прямые ссылки на остальные разделы и неизвестный маршрут', async ({ page }) => {
  for (const [route, text] of [['zoloto/kamni', 'Натуральные камни'], ['m/iphone-13-128', 'iPhone'], ['sell/zoloto', 'Предварительная оценка'], ['shops/ufa/ufa-center', 'Уфа'], ['help/delivery', 'Доставка и оплата'], ['login', 'Вход в демо-аккаунт']]) {
    const response = await page.goto(route);
    expect(response.status(), route).toBe(200);
    await expect(page.locator('body')).toContainText(text);
  }
  const response = await page.goto('not-a-real-route');
  expect(response.status()).toBe(404);
  await expect(page.locator('#route-page')).toContainText('Такой страницы нет');
  await expect(page.locator('#route-page a[href="/site-shop/catalog"]')).toBeVisible();
});
