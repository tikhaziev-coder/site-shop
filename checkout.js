import { paymentMethods, paymentSummary, validatePassport, checkoutErrors, safePaymentRecord, identificationPolicy } from './payments.js';
import { products, branches, sellers, getCartGroups } from './data.js';
import { money, escapeHtml } from './ui.js';
import { sitePath } from './navigation.js';

const authKey = 'sks-demo-auth-v1';
const initialDraft = () => ({ delivery: 'pickup', method: 'cash', recipient: 'Демо-покупатель', deliveryAddress: '', identity: {} });
export function createCheckoutController({ getSaved, commitOrder, navigate, rerender }) {
  let authenticated = false;
  try { authenticated = sessionStorage.getItem(authKey) === 'signed-in-demo'; } catch {}
  let draft = initialDraft();
  let step = authenticated ? 1 : 0;
  let cartSignature = '';
  let codeSent = false;
  let phone = '+7 000 000-00-00';
  let code = '';
  let identityErrors = {};
  let errorMessage = '';
  let busy = false;
  let gateway = false;
  let loginOnly = false;
  const items = () => getSaved().cart.map(id => products.find(product => product.id === id)).filter(Boolean);
  const summary = () => paymentSummary(items(), draft.method, draft.delivery);
  const container = () => document.querySelector(loginOnly ? '#login-mount' : '#checkout-mount');
  const button = (action, label, className = 'primary') => `<button type="button" data-checkout-action="${action}" class="${className}">${label}</button>`;

  function signOut() {
    authenticated = false;
    try { sessionStorage.removeItem(authKey); } catch {}
    draft = initialDraft(); step = 0; code = ''; phone = '+7 000 000-00-00'; codeSent = false; gateway = false;
  }
  function authContent() {
    if (authenticated) return `<div class="auth-success"><span>✓</span><h2>Вы вошли в демо-аккаунт</h2><p>Авторизация не заменяет паспортную идентификацию.</p>${button('logout', 'Выйти из демо-аккаунта', 'secondary')}${!loginOnly ? button('next', 'Продолжить →') : `<a href="${sitePath('/account')}" data-route class="primary">Перейти в кабинет</a>`}</div>`;
    return `<div class="auth-content"><span class="eyebrow red">ОДИН АККАУНТ ДЛЯ ОБЕИХ ВИТРИН</span><h2>Сначала войдите</h2><p>Вход нужен для любой покупки. Паспортные данные запрашиваются отдельно, если достигнут порог по золоту.</p><label>Демонстрационный телефон<input name="demo-phone" type="tel" inputmode="tel" autocomplete="off" value="${escapeHtml(phone)}" maxlength="22"></label>${button('send-code', codeSent ? 'Получить код ещё раз' : 'Получить демо-код', 'secondary')}${codeSent ? `<div class="notice">SMS не отправляется. Код для проверки: <strong>1234</strong>.</div><label>Код из SMS (демо)<input name="demo-code" inputmode="numeric" autocomplete="off" maxlength="4" value="${escapeHtml(code)}" placeholder="1234"></label>${button('verify-code', 'Войти и продолжить →')}` : ''}</div>`;
  }
  function deliveryContent() {
    const groups = Object.values(getCartGroups(getSaved().cart));
    return `<h2>Как получить покупку?</h2><p class="checkout-muted">Товары разных продавцов и складов оформляются отдельными отправлениями.</p><label>Способ получения<select id="delivery-method" name="delivery"><option value="pickup" ${draft.delivery === 'pickup' ? 'selected' : ''}>Самовывоз — бесплатно</option><option value="delivery" ${draft.delivery === 'delivery' ? 'selected' : ''}>Доставка СДЭК — демо-тариф</option></select></label><label>Имя получателя<input name="recipient" autocomplete="off" maxlength="60" value="${escapeHtml(draft.recipient)}" required></label>${draft.delivery === 'pickup' ? `<div id="pickup-details">${groups.map(group => { const branch = branches.find(item => item.id === group[0].branchId); return `<div class="pickup-card"><strong>${sellers[group[0].sellerId].name} · ${branch.name}</strong><p>${branch.address}</p><span>${group.length} товар(а) · склад «${group[0].warehouseType}»</span></div>`; }).join('')}</div>` : `<label id="address-field">Демонстрационный адрес ПВЗ<input name="deliveryAddress" autocomplete="off" maxlength="180" value="${escapeHtml(draft.deliveryAddress)}" placeholder="Город, улица и адрес ПВЗ" required></label><p class="checkout-muted">Тариф для тестирования: 350 ₽ за отправление. ПВЗ и доставка не бронируются.</p>`}`;
  }
  function passportContent() {
    const fields = [
      ['fullName', 'Фамилия, имя, отчество при наличии', 'text', 'Тестов Тест Тестович'],
      ['birthDate', 'Дата рождения', 'date', ''],
      ['series', 'Серия паспорта', 'text', '0000'],
      ['number', 'Номер паспорта', 'text', '000000'],
      ['issueDate', 'Дата выдачи', 'date', ''],
      ['division', 'Код подразделения', 'text', '000-000'],
      ['issuer', 'Кем выдан', 'text', 'Тестовое подразделение'],
      ['address', 'Адрес регистрации', 'text', 'Демо-город, Тестовая улица, 1']
    ];
    return `<section class="passport-panel"><div class="passport-heading"><h3>Паспортная анкета</h3>${button('sample-passport', 'Заполнить пример', 'text-button')}</div><p>Используйте только вымышленные данные. Анкета не отправляется по сети и не сохраняется в браузере. Заполнение не является реальной проверкой личности.</p><div class="passport-fields">${fields.map(([name, label, type, placeholder]) => `<label>${label}<input data-passport="${name}" name="passport-${name}" type="${type}" ${['series', 'number', 'division'].includes(name) ? 'inputmode="numeric"' : ''} maxlength="${name === 'series' ? 4 : name === 'number' ? 6 : name === 'division' ? 7 : 180}" autocomplete="off" value="${escapeHtml(draft.identity[name] || '')}" placeholder="${placeholder}" aria-invalid="${Boolean(identityErrors[name])}" aria-describedby="error-${name}"><small id="error-${name}" class="field-error">${identityErrors[name] || ''}</small></label>`).join('')}</div></section>`;
  }
  function paymentContent() {
    const totals = summary();
    return `<h2>Выберите способ оплаты</h2><p class="checkout-muted">Порог зависит от способа оплаты, а не от доставки или оплаты при получении.</p><div class="payment-options">${Object.entries(paymentMethods).map(([key, method]) => `<label class="payment-option ${draft.method === key ? 'selected' : ''} ${draft.delivery === 'delivery' && method.pickupOnly ? 'unavailable' : ''}"><input type="radio" name="payment" value="${key}" ${draft.method === key ? 'checked' : ''} ${draft.delivery === 'delivery' && method.pickupOnly ? 'disabled' : ''}><span><strong>${method.label}</strong><small>${method.pickupOnly ? draft.delivery === 'delivery' ? 'Доступно только при самовывозе' : 'Оплата при получении' : 'Имитация платежа без списания'}</small></span></label>`).join('')}</div><div id="identification-status" class="identity-status ${totals.requiresIdentity ? 'required' : ''}"><strong>${totals.requiresIdentity ? 'Требуется паспортная анкета' : 'Достаточно авторизации'}</strong><p>${totals.goldTotal ? `Золото в корзине: ${money(totals.goldTotal)}. Порог для этого способа: ${money(totals.limit)}${identificationPolicy.inclusive ? ' включительно' : ', при превышении'}.` : 'В этой корзине нет золота, учитываемого в пороге.'} Техника, другие товары и доставка в сумму золота не входят.</p></div>${totals.requiresIdentity ? passportContent() : ''}`;
  }
  function reviewContent() {
    const totals = summary();
    return `<h2>Проверьте заказ</h2><div class="review-block"><div><strong>Получение</strong>${button('edit-delivery', 'Изменить', 'text-button')}</div><p>${draft.delivery === 'pickup' ? 'Самовывоз из подразделений' : `СДЭК · ${escapeHtml(draft.deliveryAddress)}`}</p><p>Получатель: ${escapeHtml(draft.recipient)}</p></div><div class="review-block"><div><strong>Оплата</strong>${button('edit-payment', 'Изменить', 'text-button')}</div><p>${paymentMethods[draft.method].label}</p></div><div class="review-block"><div><strong>Проверки</strong>${totals.requiresIdentity ? button('edit-payment', 'Изменить анкету', 'text-button') : ''}</div><p>✓ Демо-вход выполнен</p><p>${totals.requiresIdentity ? '✓ Поля паспортной анкеты заполнены. Реальная идентификация не выполнялась.' : 'Паспортная анкета по текущему правилу не требуется.'}</p></div><div class="checkout-items">${items().map(item => `<div><img src="${item.image}" alt=""><span>${item.name}<small>${sellers[item.sellerId].name}</small></span><strong>${money(item.price)}</strong></div>`).join('')}</div>${gateway ? `<section class="demo-gateway"><span class="eyebrow">ТЕСТОВЫЙ ПЛАТЁЖ</span><h3>${draft.method === 'sbp' ? 'Имитация оплаты по СБП' : 'Имитация оплаты картой'}</h3><p>Платёжная ссылка и QR не создаются. Выберите результат для проверки сценария.</p>${button('payment-success', 'Успешная демо-оплата')}${button('payment-decline', 'Банк отклонил платёж', 'secondary')}${button('payment-cancel', 'Отменить оплату', 'text-button')}</section>` : ''}`;
  }
  function sideContent() {
    const totals = summary();
    return `<aside class="checkout-summary"><span class="eyebrow">ВАШ ЗАКАЗ</span><h3>${items().length} товар(а)</h3><dl><div><dt>Золото</dt><dd id="checkout-gold-total">${money(totals.goldTotal)}</dd></div><div><dt>Техника</dt><dd>${money(totals.techTotal)}</dd></div>${totals.otherTotal ? `<div><dt>Другие товары</dt><dd>${money(totals.otherTotal)}</dd></div>` : ''}<div><dt>Доставка</dt><dd>${totals.shipping ? money(totals.shipping) : 'Бесплатно'}</dd></div></dl><div class="checkout-summary-total"><span>Итого</span><strong id="checkout-total">${money(totals.total)}</strong></div><p>Идентификация рассчитывается по сумме золота, а не по общей стоимости заказа.</p><a href="${sitePath('/cart')}" data-route class="text-button">← Изменить корзину</a></aside>`;
  }
  function draw() {
    const root = container();
    if (!root) return;
    if (loginOnly) { root.innerHTML = `${errorMessage ? `<div class="checkout-error" role="alert">${escapeHtml(errorMessage)}</div>` : ''}${authContent()}`; return; }
    if (!items().length) { root.innerHTML = `<div class="empty"><h3>Корзина пуста</h3><p>Добавьте товары для проверки оформления.</p><a href="${sitePath('/catalog')}" data-route class="primary">Перейти в каталог</a></div>`; return; }
    const labels = ['Вход', 'Получение', 'Оплата и документы', 'Подтверждение'];
    root.innerHTML = `<div class="notice">Демонстрационный режим. Не вводите реальные паспортные и платёжные данные. SMS и платежи не отправляются.</div><nav class="checkout-stepper" aria-label="Шаги оформления">${labels.map((label, index) => `<button type="button" data-checkout-step="${index}" class="${index === step ? 'active' : index < step ? 'complete' : ''}" ${index === step ? 'aria-current="step"' : ''}><span>${index < step ? '✓' : index + 1}</span>${label}</button>`).join('')}</nav><div class="checkout-layout"><section class="checkout-stage">${errorMessage ? `<div class="checkout-error" role="alert">${escapeHtml(errorMessage)}</div>` : ''}${[authContent, deliveryContent, paymentContent, reviewContent][step]()}<div class="checkout-controls">${step > 0 ? button('back', '← Назад', 'secondary') : ''}${step > 0 && step < 3 ? button('next', 'Продолжить →') : step === 3 && !gateway ? button('submit', paymentMethods[draft.method].online ? 'Перейти к демо-оплате →' : 'Подтвердить демо-заказ') : ''}</div></section>${sideContent()}</div>`;
  }
  function fail(message) { errorMessage = message; draw(); container()?.querySelector('.checkout-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  function validateThrough(target) {
    if (target > 0 && !authenticated) { step = 0; fail('Войдите по демонстрационному коду'); return false; }
    if (target > 1 && (draft.recipient.trim().length < 2 || draft.delivery === 'delivery' && draft.deliveryAddress.trim().length < 8)) { step = 1; fail('Укажите имя получателя и адрес ПВЗ для доставки'); return false; }
    if (target > 2) {
      const totals = summary();
      if (!totals.methodAllowed) { step = 2; fail('Для доставки выберите оплату онлайн'); return false; }
      identityErrors = totals.requiresIdentity ? validatePassport(draft.identity) : {};
      if (Object.keys(identityErrors).length) { step = 2; fail('Заполните паспортную анкету перед подтверждением'); return false; }
    }
    return true;
  }
  function goStep(target) {
    errorMessage = ''; gateway = false;
    if (!Number.isInteger(target) || target < 0 || target > 3 || !validateThrough(target)) return;
    step = target; draw();
  }
  function complete(outcome) {
    if (busy) return;
    const errors = checkoutErrors(items(), draft, authenticated);
    if (errors.length) { validateThrough(3); return; }
    busy = true;
    try {
      const record = safePaymentRecord(items(), draft, authenticated, outcome);
      commitOrder({ delivery: draft.delivery, paymentRecord: record });
      draft = initialDraft(); cartSignature = ''; gateway = false; identityErrors = {}; step = authenticated ? 1 : 0;
    } catch (error) { gateway = false; fail(error.message); }
    finally { busy = false; }
  }
  function handleAction(action) {
    errorMessage = '';
    if (action === 'send-code') {
      if (!/^\+?\d[\d ()-]{9,21}$/.test(phone)) return fail('Укажите телефон в формате +7 000 000-00-00');
      codeSent = true; code = ''; draw(); return;
    }
    if (action === 'verify-code') {
      if (!codeSent || code !== '1234') return fail('Неверный демо-код. Для тестирования введите 1234.');
      authenticated = true; code = ''; phone = ''; codeSent = false;
      try { sessionStorage.setItem(authKey, 'signed-in-demo'); } catch {}
      if (loginOnly) return navigate('/account');
      step = 1; draw(); return;
    }
    if (action === 'logout') { signOut(); if (container()) draw(); else rerender(); return; }
    if (action === 'next') return goStep(step + 1);
    if (action === 'back') return goStep(step - 1);
    if (action === 'edit-delivery') return goStep(1);
    if (action === 'edit-payment') return goStep(2);
    if (action === 'sample-passport') {
      draft.identity = { fullName: 'Тестов Тест Тестович', birthDate: '1990-01-01', series: '0000', number: '000000', issueDate: '2020-01-01', division: '000-000', issuer: 'Тестовое подразделение — пример', address: 'Демо-город, Тестовая улица, дом 1' };
      identityErrors = {}; draw(); return;
    }
    if (action === 'submit') {
      if (!validateThrough(3)) return;
      if (paymentMethods[draft.method].online) { gateway = true; draw(); return; }
      return complete('on_receipt');
    }
    if (action === 'payment-success' && gateway) return complete('success');
    if (action === 'payment-decline' && gateway) { gateway = false; return fail('Банк отклонил демо-платёж. Заказ не создан, товары остались в корзине. Можно повторить оплату или изменить способ.'); }
    if (action === 'payment-cancel' && gateway) { gateway = false; return fail('Демо-оплата отменена. Заказ не создан, корзина сохранена.'); }
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-checkout-action], [data-checkout-step]');
    if (!target || target.disabled) return;
    event.preventDefault();
    if (target.dataset.checkoutAction) handleAction(target.dataset.checkoutAction);
    else goStep(Number(target.dataset.checkoutStep));
  });
  document.addEventListener('input', event => {
    if (!event.target.closest('#checkout-mount, #login-mount')) return;
    if (event.target.dataset.passport) draft.identity[event.target.dataset.passport] = event.target.value;
    if (event.target.name === 'demo-phone') phone = event.target.value;
    if (event.target.name === 'demo-code') code = event.target.value;
    if (['recipient', 'deliveryAddress'].includes(event.target.name)) draft[event.target.name] = event.target.value;
  });
  document.addEventListener('change', event => {
    if (!event.target.closest('#checkout-mount')) return;
    if (event.target.name === 'delivery') {
      draft.delivery = event.target.value;
      if (draft.delivery === 'delivery' && paymentMethods[draft.method].pickupOnly) draft.method = 'card';
      draft.identity = {}; identityErrors = {}; gateway = false; errorMessage = ''; draw();
    }
    if (event.target.name === 'payment') { draft.method = event.target.value; draft.identity = {}; identityErrors = {}; gateway = false; errorMessage = ''; draw(); }
  });
  return {
    content: () => '<div id="checkout-mount"></div>',
    loginContent: () => '<div id="login-mount"></div>',
    accountStatus: () => `<div class="account-auth"><strong>${authenticated ? '✓ Демо-вход выполнен' : 'Вы ещё не вошли'}</strong>${authenticated ? button('logout', 'Выйти', 'text-button') : `<a href="${sitePath('/login')}" data-route class="primary">Войти по демо-коду</a>`}</div>`,
    mount: (isLogin = false) => {
      loginOnly = isLogin;
      const signature = items().map(item => `${item.id}:${item.price}`).sort().join('|');
      if (signature !== cartSignature) { draft = initialDraft(); step = authenticated ? 1 : 0; cartSignature = signature; identityErrors = {}; gateway = false; }
      if (!authenticated) step = 0;
      errorMessage = ''; draw();
    },
    leave: () => { draft.identity = {}; draft.recipient = 'Демо-покупатель'; draft.deliveryAddress = ''; identityErrors = {}; gateway = false; code = ''; phone = '+7 000 000-00-00'; codeSent = false; if (step > 2) step = 2; },
    reset: signOut
  };
}
