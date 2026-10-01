export const identificationPolicy = Object.freeze({ cash: 60000, cashless: 400000, inclusive: true, version: 'sks-demo-2026-10-01' });
export const paymentMethods = Object.freeze({
  cash: { label: 'Наличными в отделении', type: 'cash', online: false, pickupOnly: true },
  card_on_receipt: { label: 'Картой в отделении', type: 'cashless', online: false, pickupOnly: true },
  card: { label: 'Картой онлайн', type: 'cashless', online: true, pickupOnly: false },
  sbp: { label: 'СБП', type: 'cashless', online: true, pickupOnly: false }
});

export function paymentSummary(items, method, delivery = 'pickup', policy = identificationPolicy) {
  if (!Object.hasOwn(paymentMethods, method)) throw new Error('Выберите способ оплаты');
  if (!['pickup', 'delivery'].includes(delivery)) throw new Error('Выберите способ получения');
  const unique = [...new Map(items.map(item => [item.id, item])).values()];
  if (unique.some(item => !Number.isFinite(item.price) || item.price < 0)) throw new Error('Некорректная цена товара');
  const total = unique.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
  const gold = unique.filter(item => item.identificationCategory === 'precious_jewelry').reduce((sum, item) => sum + Math.round(item.price * 100), 0);
  const tech = unique.filter(item => item.storefront === 'tech').reduce((sum, item) => sum + Math.round(item.price * 100), 0);
  const limit = policy[paymentMethods[method].type];
  const requiresIdentity = gold > 0 && (policy.inclusive ? gold >= limit * 100 : gold > limit * 100);
  const shipments = new Set(unique.map(item => `${item.sellerId}:${item.warehouseId}`)).size;
  const shipping = delivery === 'delivery' ? shipments * 350 : 0;
  return { goodsTotal: total / 100, goldTotal: gold / 100, techTotal: tech / 100, otherTotal: (total - gold - tech) / 100, shipping, total: total / 100 + shipping, limit, requiresIdentity, requiresAuth: true, methodAllowed: !(delivery === 'delivery' && paymentMethods[method].pickupOnly) };
}

export function validatePassport(values, now = new Date()) {
  const errors = {};
  if (!values.fullName || values.fullName.trim().split(/\s+/).length < 2) errors.fullName = 'Укажите фамилию и имя';
  const validDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  };
  const birthDate = validDate(values.birthDate);
  const issueDate = validDate(values.issueDate);
  if (!birthDate || birthDate >= now || birthDate.getUTCFullYear() < 1900) errors.birthDate = 'Укажите корректную дату рождения';
  if (!/^\d{4}$/.test(values.series || '')) errors.series = 'Серия: 4 цифры';
  if (!/^\d{6}$/.test(values.number || '')) errors.number = 'Номер: 6 цифр';
  if (!issueDate || issueDate > now || birthDate && issueDate <= birthDate) errors.issueDate = 'Проверьте дату выдачи';
  if (!values.issuer || values.issuer.trim().length < 5) errors.issuer = 'Укажите, кем выдан документ';
  if (!/^\d{3}-\d{3}$/.test(values.division || '')) errors.division = 'Код подразделения: 000-000';
  if (!values.address || values.address.trim().length < 8) errors.address = 'Укажите адрес регистрации';
  return errors;
}

export function checkoutErrors(items, draft, authenticated) {
  const errors = [];
  if (!items.length) errors.push('Корзина пуста');
  if (!authenticated) errors.push('Сначала выполните демо-вход');
  let summary;
  try { summary = paymentSummary(items, draft.method, draft.delivery); }
  catch (error) { return [...errors, error.message]; }
  if (!summary.methodAllowed) errors.push('Для доставки выберите оплату онлайн');
  if (!draft.recipient || draft.recipient.trim().length < 2) errors.push('Укажите имя получателя');
  if (draft.delivery === 'delivery' && (!draft.deliveryAddress || draft.deliveryAddress.trim().length < 8)) errors.push('Укажите адрес ПВЗ');
  if (summary.requiresIdentity && Object.keys(validatePassport(draft.identity || {})).length) errors.push('Заполните паспортную анкету');
  return errors;
}

export function safePaymentRecord(items, draft, authenticated, outcome) {
  const errors = checkoutErrors(items, draft, authenticated);
  if (errors.length) throw new Error(errors[0]);
  const summary = paymentSummary(items, draft.method, draft.delivery);
  if (paymentMethods[draft.method].online && outcome !== 'success') throw new Error('Демо-оплата не подтверждена');
  return {
    payment: draft.method,
    paymentStatus: paymentMethods[draft.method].online ? 'demo_paid' : 'awaiting_on_receipt',
    authentication: 'demo_session',
    identification: { required: summary.requiresIdentity, goldTotal: summary.goldTotal, threshold: summary.limit, inclusive: identificationPolicy.inclusive, status: summary.requiresIdentity ? 'demo_form_completed' : 'not_required', policyVersion: identificationPolicy.version }
  };
}
