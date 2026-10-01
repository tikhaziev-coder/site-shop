import { products, branches, sellers, catalogTree, grades, selectProducts, getCartGroups, createOrder } from './data.js';
import { resolveRoute, citySlug, estimateValue } from './routes.js';
import { icon, money, escapeHtml } from './ui.js';
import { readSaved, storageKey } from './state.js';
import { createCheckoutController } from './checkout.js';
import { paymentMethods } from './payments.js';
import { appPath, sitePath } from './navigation.js';

const byId = id => products.find(product => product.id === id);
const branchById = id => branches.find(branch => branch.id === id);
const link = (path, label, className = '') => `<a href="${escapeHtml(sitePath(path))}" data-route class="${className}">${label}</a>`;
const branchPath = branch => `/shops/${citySlug(branch.city)}/${branch.id}`;
const modal = document.querySelector('#modal');
const page = document.querySelector('#route-page');
let saved = readSaved();
let currentRoute;
let filters;
let limit = 8;
let slide = 0;
let previewId = null;
let lastOrderId;
let toastTimeout;
const reservedIds = () => saved.orders.flatMap(order => order.items);
const defaults = () => ({ city: saved.city, storefront: 'all', category: 'all', query: '', branch: 'all', condition: 'all', itemState: 'all', grade: 'all', origin: 'all', metal: 'all', stone: 'all', battery: '', min: '', max: '', sort: 'recommended' });
const queryKeys = ['city', 'storefront', 'query', 'branch', 'condition', 'itemState', 'grade', 'origin', 'metal', 'stone', 'battery', 'min', 'max', 'sort'];
const checkout = createCheckoutController({
  getSaved: () => saved,
  commitOrder: ({ delivery, paymentRecord }) => {
    const latest = readSaved();
    const order = { ...createOrder(saved.cart, latest.orders.flatMap(item => item.items), delivery), ...paymentRecord, kind: 'purchase' };
    saved.orders = [order, ...latest.orders]; saved.cart = []; lastOrderId = order.id;
    persist(); navigate('/checkout/done');
  },
  navigate, toast, rerender: render
});

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove('visible'), 3200);
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
  catch { toast('Изменения доступны до обновления страницы: хранилище браузера недоступно.'); }
}
function navigate(path, replace = false) {
  modal.close();
  previewId = null;
  const storefront = resolveRoute(appPath(new URL(sitePath(path), location.origin).pathname)).storefront;
  if (storefront && saved.storefront !== storefront) { saved.storefront = storefront; persist(); }
  history[replace ? 'replaceState' : 'pushState']({}, '', sitePath(path));
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function syncUrl() {
  const params = new URLSearchParams();
  const baseline = defaults();
  for (const key of queryKeys) {
    if (key === 'city' || filters[key] && filters[key] !== baseline[key]) params.set(key === 'query' ? 'q' : key, filters[key]);
  }
  history.replaceState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
}
function syncCounters() {
  for (const [selector, count] of [['#cart-count', saved.cart.length], ['#favorite-count', saved.favorites.length]]) {
    const element = document.querySelector(selector);
    element.textContent = count;
    element.hidden = !count;
  }
  document.querySelector('#mobile-cart-count').textContent = saved.cart.length || '';
  document.querySelector('#city-label').textContent = saved.city === 'all' ? 'Все города' : saved.city;
}
function showModal(title, html) {
  document.querySelector('#modal-title').textContent = title;
  document.querySelector('#modal-body').innerHTML = html;
  if (!modal.open) modal.showModal();
}
function empty(title, description, path = '/catalog', label = 'В каталог') {
  return `<div class="empty">${icon('search')}<h3>${title}</h3><p>${description}</p>${link(path, label, 'primary')}</div>`;
}
function productState(product) {
  return product.itemState === 'new' ? 'Новое' : product.grade ? `Б/у · ${product.grade} — ${grades[product.grade]}` : 'Б/у · после подготовки';
}
function card(product) {
  const isReserved = reservedIds().includes(product.id);
  const inCart = saved.cart.includes(product.id);
  const favorite = saved.favorites.includes(product.id);
  const discount = Math.round((1 - product.price / product.oldPrice) * 100);
  return `<article class="product-card" data-product-id="${product.id}"><div class="product-visual">${link(`/p/${product.id}`, `<img src="${product.image}" alt="${product.name}" loading="lazy">`, 'product-open')}<span class="badge ${discount && !isReserved ? 'sale' : ''}">${isReserved ? 'В резерве' : discount ? `−${discount}%` : 'Новое поступление'}</span><button class="heart-button ${favorite ? 'selected' : ''}" data-favorite="${product.id}" aria-pressed="${favorite}" aria-label="Избранное: ${product.name}">${icon('heart')}</button><button class="quick-view" data-preview="${product.id}">Быстрый просмотр</button></div><div class="product-state">${productState(product)}</div><div class="price-row"><strong>${money(product.price)}</strong>${discount ? `<del>${money(product.oldPrice)}</del>` : ''}</div>${link(`/p/${product.id}`, product.name, 'product-name')}<p class="product-meta">${product.summary}</p><p class="product-location">${icon('pin')}${branchById(product.branchId).name}</p><div class="card-bottom"><span>${product.itemState === 'used' ? 'Единственный экземпляр' : 'Новое · отдельное изделие'}</span><button class="add-button ${inCart ? 'in-cart' : ''}" data-add="${product.id}" ${isReserved ? 'disabled' : ''}>${icon('bag')}${isReserved ? 'В резерве' : inCart ? 'В корзине ✓' : 'В корзину'}</button></div>${product.modelId ? link(`/m/${product.modelId}`, 'Все предложения модели →', 'model-link') : ''}</article>`;
}
function renderChrome() {
  const storefront = currentRoute.storefront || currentRoute.product?.storefront || (currentRoute.type === 'model' ? 'tech' : saved.storefront);
  document.body.dataset.storefront = storefront;
  document.querySelectorAll('.storefront-switch [data-storefront]').forEach(element => element.classList.toggle('active', element.dataset.storefront === storefront));
  document.querySelector('#storefront-description').textContent = storefront === 'gold' ? 'Золото, серебро, камни и часы · ООО «Карат»' : 'Новая и проверенная техника · ООО «Смарт»';
  document.querySelector('.navigation').innerHTML = `${link('/catalog', 'Все категории')}${link('/collections/new', 'Новые поступления')}${link('/collections/sale', 'Цена снижена', 'red')}${link('/collections/pawnshop', 'Из ломбарда')}${link('/shops', 'Отделения')}${link('/sell', 'Продать или сдать ↗', 'sell-nav')}<span class="demo-tag">Демо-магазин</span>`;
  syncCounters();
}
function buildFilters() {
  const tech = filters.storefront === 'tech' || currentRoute.type === 'model';
  const stones = filters.category === 'stones';
  const option = (value, label, selected) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`;
  const select = (key, title, values) => `<label>${title}<select data-filter="${key}" id="${key === 'branch' ? 'branch' : key}">${option('all', 'Все', filters[key])}${values.map(([value, label]) => option(value, label, filters[key])).join('')}</select></label>`;
  document.querySelector('#filter-panel').innerHTML = select('itemState', 'Состояние', [['new', 'Новое'], ['used', 'Б/у']]) +
    (tech ? select('grade', 'Оценка техники', Object.entries(grades)) : '') +
    `<label>Цена от, ₽<input data-filter="min" id="min-price" type="number" min="0" value="${escapeHtml(filters.min)}" placeholder="0"></label><label>Цена до, ₽<input data-filter="max" id="max-price" type="number" min="0" value="${escapeHtml(filters.max)}" placeholder="Без ограничений"></label>` +
    (stones ? select('stone', 'Камень', [['Аметист', 'Аметист'], ['Розовый кварц', 'Розовый кварц']]) : filters.storefront === 'gold' && filters.category !== 'watches' ? select('metal', 'Металл', [['Золото', 'Золото'], ['Серебро', 'Серебро'], ['Платина', 'Платина']]) : '') +
    (tech ? `<label>Аккумулятор от, %<input data-filter="battery" type="number" min="0" max="100" value="${escapeHtml(filters.battery)}" placeholder="Любой"></label>` : '') +
    select('branch', 'Подразделение', branches.map(branch => [branch.id, branch.name])) + select('origin', 'Происхождение', ['От производителя', 'Комиссия', 'Скупка', 'Из ломбарда'].map(value => [value, value])) + '<button data-action="reset" class="text-button">Сбросить</button>';
}
function renderListing() {
  const selected = selectProducts(filters, saved.favorites, reservedIds());
  document.querySelector('#products').innerHTML = selected.length ? selected.slice(0, limit).map(card).join('') : empty('Пока нет подходящих находок', 'Измените город или фильтры. Некоторые категории в прототипе ещё без товаров.', currentRoute.path, 'Сбросить фильтры');
  document.querySelector('#result-count').textContent = `${selected.length} товаров`;
  document.querySelector('#shown-count').textContent = `Показано ${Math.min(limit, selected.length)} из ${selected.length}`;
  document.querySelector('#load-more').hidden = limit >= selected.length;
  document.querySelector('#catalog-heading').textContent = currentRoute.type === 'model' ? 'Выберите свой экземпляр' : currentRoute.path === '/' ? 'Стоит присмотреться ↗' : currentRoute.title;
  document.querySelector('#tabs').innerHTML = ['all', 'new', 'used'].map(value => `<button data-state="${value}" class="${filters.itemState === value ? 'active' : ''}">${{ all: 'Все находки', new: 'Только новое', used: 'Только б/у' }[value]}</button>`).join('');
  const badges = [];
  if (filters.city !== 'all') badges.push([filters.city, 'city']);
  if (filters.query) badges.push([`Поиск: ${filters.query}`, 'query']);
  if (filters.branch !== 'all') badges.push([branchById(filters.branch)?.name || 'Подразделение', 'branch']);
  for (const key of ['grade', 'origin', 'stone', 'metal']) if (filters[key] !== 'all') badges.push([filters[key], key]);
  if (filters.min || filters.max) badges.push([`${filters.min || 0} — ${filters.max || '∞'} ₽`, 'price']);
  if (filters.battery) badges.push([`АКБ от ${filters.battery}%`, 'battery']);
  document.querySelector('#active-filters').innerHTML = badges.map(([label, key]) => `<button data-clear-filter="${key}">${escapeHtml(label)} ×</button>`).join('');
  const modelArea = document.querySelector('#model-area');
  if (currentRoute.type === 'model') {
    modelArea.innerHTML = `<div class="model-intro"><span class="eyebrow">ОДНА МОДЕЛЬ — РАЗНЫЕ ИСТОРИИ</span><h1>${currentRoute.title}</h1><p>${selected.length} предложений${selected.length ? ` от ${money(Math.min(...selected.map(product => product.price)))}` : ''}. Сравните состояние, АКБ, цену и отделение.</p></div>`;
  } else if (filters.category === 'phones' || filters.query.toLowerCase().includes('iphone')) {
    const models = [...new Set(selected.map(product => product.modelId).filter(Boolean))];
    modelArea.innerHTML = models.map(model => { const offers = selected.filter(product => product.modelId === model); return link(`/m/${model}`, `<strong>${offers[0].name}</strong><span>${offers.length} предложений · от ${money(Math.min(...offers.map(product => product.price)))} →</span>`, 'model-summary'); }).join('');
  } else modelArea.innerHTML = '';
  syncCounters();
}
function renderCatalog() {
  const landing = ['/', '/zoloto', '/tehnika'].includes(currentRoute.path);
  document.querySelector('.hero').hidden = !landing;
  document.querySelector('.benefits').hidden = !landing;
  document.querySelector('.story-banner').hidden = !landing;
  document.querySelector('.categories-section').hidden = currentRoute.type === 'model' || currentRoute.favorites;
  const storefront = filters.storefront === 'all' ? saved.storefront : filters.storefront;
  const categoryItems = catalogTree.filter(category => category.storefront === storefront);
  document.querySelector('#categories').innerHTML = categoryItems.map(category => link(category.path, `<strong>${category.name}</strong><small>${category.note}</small><img src="assets/${category.image}" alt="${category.name}" loading="lazy">`, `category ${filters.category === category.id ? 'active' : ''}`)).join('');
  document.querySelector('.categories-section h2').textContent = storefront === 'gold' ? 'Украшения с характером' : 'Техника для ваших планов';
  document.querySelector('#sort').innerHTML = '<option value="recommended">Рекомендуем</option><option value="cheap">Сначала дешевле</option><option value="expensive">Сначала дороже</option><option value="new">Новые поступления</option><option value="discount">По размеру скидки</option>' + (storefront === 'gold' && filters.category !== 'stones' ? '<option value="gram">По цене за грамм</option>' : '');
  document.querySelector('#sort').value = filters.sort;
  document.querySelector('#search').value = filters.query;
  buildFilters();
  renderListing();
  renderSlide();
}
function detail(product, preview = false) {
  const branch = branchById(product.branchId);
  const isReserved = reservedIds().includes(product.id);
  const variants = products.filter(item => item.articleId === product.articleId && item.id !== product.id);
  return `<div class="detail"><div><div class="detail-image"><img src="${product.image}" alt="${product.name}"></div><p class="muted" style="margin-top:10px">Иллюстрация. Фото реального экземпляра появятся после интеграции.</p><section class="inspection"><span class="eyebrow">ПАСПОРТ ПРОВЕРКИ · ДЕМО</span><h3>У каждой вещи — свои факты</h3><ul>${product.inspection.map(item => `<li>✓ ${item}</li>`).join('')}</ul><p>Пример чек-листа, не подтверждение реальной экспертизы.</p></section></div><div><span class="eyebrow red">${productState(product)} · ${product.origin}</span><h3>${product.name}</h3><span class="muted">Артикул ${product.id.toUpperCase()} · ${product.itemState === 'used' ? 'Единственный экземпляр' : 'Новое изделие'}</span><div class="price-row"><strong>${money(product.price)}</strong>${product.oldPrice > product.price ? `<del>${money(product.oldPrice)}</del>` : ''}</div>${product.pricePerGram ? `<p class="gram-price">${money(product.pricePerGram)} за грамм</p>` : ''}<dl>${Object.entries(product.specs).map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}<div><dt>Происхождение</dt><dd>${product.origin}</dd></div><div><dt>Следы использования</dt><dd>${product.defects}</dd></div><div><dt>Продавец</dt><dd>${link('/legal', sellers[product.sellerId].name)}</dd></div></dl>${variants.length ? `<div class="variant-selector">Другой размер: ${variants.map(item => link(`/p/${item.id}`, `${item.specs['Размер']} · ${money(item.price)}`)).join(' ')}</div>` : ''}<p class="stock">${isReserved ? 'Зарезервирован в демо-заказе' : 'В наличии · 1 экземпляр'}</p><p class="muted">${link(branchPath(branch), `${branch.city}, ${branch.address}`)}<br>Склад «${product.warehouseType}» · ${product.warehouseId}</p><button class="primary" data-add="${product.id}" ${isReserved ? 'disabled' : ''}>${icon('bag')}${isReserved ? 'В резерве' : saved.cart.includes(product.id) ? 'Перейти в корзину' : 'Добавить в корзину'}</button><button class="secondary" data-book="${product.id}" ${isReserved ? 'disabled' : ''}>${product.storefront === 'gold' ? 'Примерить' : 'Посмотреть'} в отделении</button><button class="text-button" data-favorite="${product.id}" style="margin-top:15px">${saved.favorites.includes(product.id) ? '♥ В избранном' : '♡ Сохранить в избранное'}</button>${product.modelId ? link(`/m/${product.modelId}`, 'Сравнить экземпляры этой модели →', 'model-link') : ''}${preview ? link(`/p/${product.id}`, 'Открыть полную карточку →', 'model-link') : ''}</div></div><p class="detail-description">${product.description}</p><div class="notice">Все характеристики и результаты проверки демонстрационные. Заказ и бронь сохраняются только в этом браузере.</div>`;
}
function cartContent() {
  if (!saved.cart.length) return empty('Здесь будет ваша находка', 'Добавьте украшение или технику. Корзина общая для обеих витрин.');
  return `<div class="notice">Одна корзина, отдельные отправления по продавцам и складам. Добавление в корзину само по себе не резервирует экземпляр.</div>${Object.values(getCartGroups(saved.cart)).map(items => `<section class="cart-group"><h3>${sellers[items[0].sellerId].name} · ${branchById(items[0].branchId).name}<span class="muted"> / Склад «${items[0].warehouseType}»</span></h3>${items.map(product => `<div class="cart-row"><img src="${product.image}" alt="${product.name}"><div>${link(`/p/${product.id}`, `<strong>${product.name}</strong>`)}<p>${product.summary}</p><p>1 шт. · ${productState(product)}</p></div><b>${money(product.price)}</b><button class="icon-button" data-remove="${product.id}" aria-label="Удалить ${product.name}">✕</button></div>`).join('')}</section>`).join('')}<div class="cart-total"><span>Итого</span><span>${money(saved.cart.reduce((total, id) => total + byId(id).price, 0))}</span></div>${link('/checkout', 'Оформить демо-заказ →', 'primary full-width')}`;
}
function checkoutContent() {
  return checkout.content();
}
function accountContent() {
  return `${checkout.accountStatus()}<div class="account-links">${link('/account', 'Заказы и брони', 'active')}${link('/favorites', `Избранное · ${saved.favorites.length}`)}${link('/sell', 'Оценить вещь')}${link('/shops', 'Мои отделения')}</div><div class="notice">Демонстрационный кабинет. Для покупки нужен демо-вход; заказы доступны только в этом браузере. Паспортные данные не сохраняются.</div><h2 class="subheading">Заказы и брони</h2>${saved.orders.length ? saved.orders.map(order => `<div class="order-item"><h3>${escapeHtml(order.id)}<span class="order-status">${order.kind === 'fitting' ? 'Бронь на просмотр' : order.paymentStatus === 'demo_paid' ? 'Демо-оплата успешна' : 'Ожидает оплаты при получении'}</span></h3><p>${new Date(order.createdAt).toLocaleString('ru-RU')} · ${order.delivery === 'pickup' ? 'Самовывоз' : 'СДЭК (демо)'}</p><p>${order.items.map(id => link(`/p/${id}`, byId(id).name)).join(' · ')}</p><p>${paymentMethods[order.payment]?.label || 'Демо-резерв'}${order.identification?.required ? ' · Паспортная анкета заполнена (демо)' : ''}</p><strong>${money(order.total)}</strong><button class="text-button red" data-cancel="${escapeHtml(order.id)}" style="margin-top:16px">Отменить ${order.kind === 'fitting' ? 'бронь' : 'демо-заказ'}</button></div>`).join('') : '<p class="info-text">Пока нет заказов. Выберите вещь в каталоге или забронируйте просмотр в отделении.</p>'}<h2 class="subheading">Мои заявки на оценку</h2>${saved.appointments.length ? saved.appointments.map(item => `<div class="order-item"><h3>${escapeHtml(item.id)}<span class="order-status">Демо-запись</span></h3><p>${escapeHtml(item.summary)}</p><p>${branchById(item.branchId).name} · ${escapeHtml(item.date)}</p><button class="text-button red" data-cancel-appointment="${escapeHtml(item.id)}">Отменить запись</button></div>`).join('') : '<p class="info-text">Здесь появятся ваши демонстрационные записи в отделение.</p>'}`;
}
function sellContent() {
  return `<div class="sell-intro"><span class="eyebrow red">ПОКУПАЙТЕ. ПРОДАВАЙТЕ. ДАВАЙТЕ ВЕЩАМ ВТОРОЙ ШАНС.</span><h2>Освободите место<br>для нового.</h2><p>Предварительная оценка онлайн, знакомство с вещью — в отделении.</p></div><div class="service-grid">${link('/sell/zoloto', `${icon('diamond')}<h3>Оценить золото</h3><p>Проба и вес → предварительная сумма → отделение</p><span>Рассчитать стоимость ↗</span>`, 'service-card gold-service')}${link('/sell/tehnika', `${icon('refresh')}<h3>Продать технику</h3><p>Модель и состояние → оценка → проверка товароведом</p><span>Начать оценку ↗</span>`, 'service-card tech-service')}${link('/sell/komissiya', `${icon('bag')}<h3>Сдать на комиссию</h3><p>Оставьте заявку на обсуждение цены и условий продажи.</p><span>Записаться ↗</span>`, 'service-card')}</div><div class="notice" style="margin-top:22px">Трейд-ин запланирован на следующий этап. Займы под залог оформляются отдельно на <a href="https://sks-lombard.ru/" target="_blank" rel="noopener">сайте СКС Ломбард ↗</a>.</div>`;
}
function estimateContent() {
  const isGold = currentRoute.direction === 'gold';
  return `<form id="estimate-form" class="estimate-form"><div class="notice">Условный калькулятор для проверки сценария. Ставки вымышлены, это не предложение СКС. Итоговую цену определяет товаровед после осмотра.</div><div class="estimate-layout"><section><h2 class="subheading">1. Расскажите о вещи</h2>${isGold ? '<label>Проба<select name="purity"><option>375</option><option>500</option><option>583</option><option selected>585</option><option>750</option><option>958</option><option>999</option></select></label><label>Вес, г<input name="weight" type="number" step="0.01" min="0.01" max="500" value="5.2" required></label>' : '<label>Модель<select name="model"><option value="iphone">Apple iPhone 13, 128 ГБ</option><option value="laptop">Apple MacBook Pro 14</option><option value="other">Другая техника — пример расчёта</option></select></label><label>Состояние<select name="grade"><option>A+</option><option selected>A</option><option>B</option><option>C</option><option>D</option></select></label>'}<label>Фото для осмотра<input name="photo" type="file" accept="image/*"><span class="muted">Можно выбрать файл для демонстрации. Он не загружается и не сохраняется.</span></label><div id="estimate-result" class="estimate-result" aria-live="polite"></div></section><section><h2 class="subheading">2. Выберите отделение</h2><label>Куда удобно прийти<select name="branch">${branches.map(branch => `<option value="${branch.id}">${branch.name}</option>`).join('')}</select></label><label>Желаемая дата<input name="date" type="date" min="${new Date().toLocaleDateString('en-CA')}" required></label><label>Способ продажи<select name="method"><option value="buyout">Скупка</option><option value="commission" ${currentRoute.commission ? 'selected' : ''}>Комиссия</option></select></label><p class="info-text">Выбранная дата не подтверждает реальную запись. Демо-заявка появится в личном кабинете.</p><button class="primary full-width" type="submit">Создать демо-запись</button></section></div></form>`;
}
function shopsContent() {
  const selected = branches.filter(branch => !currentRoute.city || branch.city === currentRoute.city);
  return `<div class="account-links">${link('/shops', 'Все города')}${link('/shops/ufa', 'Уфа')}${link('/shops/sterlitamak', 'Стерлитамак')}</div><div class="notice">Адреса и часы взяты для демонстрации структуры и требуют проверки. Действующей карты и геолокации пока нет.</div><div class="service-grid" style="margin-top:20px">${selected.map(branch => `<article class="service-card"><span class="eyebrow">${branch.city}</span><h3>${branch.name}</h3><p>${branch.address}<br>${branch.hours}</p><div class="service-tags"><span>Примерка</span><span>Выдача</span><span>Оценка</span></div>${link(branchPath(branch), 'Товары и услуги отделения →', 'model-link')}</article>`).join('')}</div>`;
}
function branchContent() {
  const branch = currentRoute.branch;
  return `<div class="branch-summary"><div><span class="eyebrow red">ВАША НАХОДКА РЯДОМ</span><h2>${branch.address}</h2><p>${branch.hours}</p><p>Примерка украшений · просмотр техники · выдача · приёмка на оценку</p></div>${link('/sell/ocenka', 'Записаться на оценку →', 'primary')}</div><h2 class="subheading">В наличии в этом отделении</h2><div class="product-grid">${products.filter(product => product.branchId === branch.id).map(card).join('')}</div>`;
}
function helpContent() {
  return `<div class="account-links">${link('/help/delivery', 'Доставка и оплата')}${link('/help/inspection', 'Паспорт проверки')}${link('/help/guarantee', 'Гарантия и возврат')}</div><div class="info-text">${currentRoute.topic === 'inspection' ? '<p>В карточке экземпляра предусмотрен паспорт проверки: чек-лист товароведа, состояние, дефекты и комплектация. Для украшений — параметры изделия; для техники — функциональная диагностика и АКБ.</p><p>Шкала техники: N — новое, A+ — как новое, A — отличное, B — хорошее, C — удовлетворительное, D — уценка с описанием неисправности.</p>' : currentRoute.topic === 'guarantee' ? '<p>Условия гарантии и возврата будут зависеть от продавца и категории. В прототипе нет утверждённых сроков, оферт и обещаний возврата.</p><p>Карточка показывает состояние и дефекты до оформления покупки. Утверждённые документы должны быть доступны здесь и при оформлении заказа.</p>' : '<p>Обе витрины используют общую корзину. Отправления формируются отдельно по продавцу, подразделению и складу.</p><p>Доступны демонстрационные самовывоз и доставка СДЭК. Расчёт 350 ₽ за отправление — условный. Выбор оплаты по СБП или карте не запускает платёж.</p><p>Для просмотра и примерки нажмите кнопку в карточке товара. Локальную бронь можно отменить в кабинете.</p>'}</div>`;
}
function legalContent() {
  return `<div class="service-grid">${Object.values(sellers).map(seller => `<article class="service-card"><span class="eyebrow">${seller.storefront === 'gold' ? 'УКРАШЕНИЯ И ЧАСЫ' : 'ТЕХНИКА'}</span><h3>${seller.name}</h3><p>Продавец указан по черновику маркетинга от 25.09.2026.</p><p>Реквизиты и отдельная оферта ещё не добавлены. Вымышленные ИНН и юридические документы не используются.</p></article>`).join('')}</div>`;
}
function doneContent() {
  const order = saved.orders.find(item => item.id === lastOrderId) || saved.orders[0];
  return order ? `<div class="success"><div class="success-icon">✓</div><span class="eyebrow red">ДЕМО-ЗАКАЗ СОЗДАН</span><h3>${order.kind === 'fitting' ? 'Ждём вас на просмотр' : order.paymentStatus === 'demo_paid' ? 'Демо-оплата успешна' : 'Оплата при получении'}</h3><p>${escapeHtml(order.id)}<br>${order.items.length} товар(а) · ${money(order.total)}</p><p>${paymentMethods[order.payment]?.label || 'Бронь на просмотр'}</p>${order.identification?.required ? '<p>Паспортная анкета заполнена в демо-режиме. Проверка личности не выполнялась, данные анкеты удалены.</p>' : ''}<div class="notice">СКС не получил заказ, деньги не списаны. Резерв локальный, без таймера истечения в этой версии.</div>${link('/account', 'Перейти в кабинет', 'primary')}</div>` : empty('Заказ ещё не создан', 'Оформите покупку или бронь просмотра.');
}

function render() {
  currentRoute = resolveRoute(appPath(location.pathname));
  if (currentRoute.type !== 'checkout') checkout.leave();
  const params = new URLSearchParams(location.search);
  filters = { ...defaults(), ...Object.fromEntries(queryKeys.map(key => [key, params.get(key === 'query' ? 'q' : key)]).filter(([, value]) => value !== null)), ...Object.fromEntries(['category', 'storefront', 'favorites', 'sale', 'sort', 'origin', 'model'].filter(key => currentRoute[key] !== undefined).map(key => [key, currentRoute[key]])) };
  if (currentRoute.path === '/' && !params.has('storefront')) filters.storefront = saved.storefront;
  if (currentRoute.type === 'model') { filters.storefront = 'tech'; if (!params.has('city')) filters.city = 'all'; }
  if (!['all', ...branches.map(branch => branch.city)].includes(filters.city)) filters.city = saved.city;
  if (!['all', ...branches.map(branch => branch.id)].includes(filters.branch)) filters.branch = 'all';
  limit = 8;
  document.title = `${currentRoute.title} — СКС Маркет`;
  renderChrome();
  const catalog = currentRoute.type === 'catalog' || currentRoute.type === 'model';
  document.querySelector('#catalog-page').hidden = !catalog;
  page.hidden = catalog;
  page.innerHTML = '';
  document.querySelector('#modal-body').innerHTML = '';
  previewId = null;
  if (catalog) return renderCatalog();
  const views = { product: () => detail(currentRoute.product), cart: cartContent, checkout: checkoutContent, login: () => checkout.loginContent(), account: accountContent, sell: sellContent, estimate: estimateContent, shops: shopsContent, branch: branchContent, help: helpContent, legal: legalContent, done: doneContent, about: () => '<p class="info-text">СКС Маркет — прототип единой площадки группы СКС. Две витрины, общая корзина и сеть отделений для покупки, просмотра и оценки вещей.</p>' };
  const content = views[currentRoute.type]?.() || empty('Такой страницы нет', 'Проверьте адрес или вернитесь в каталог.');
  page.innerHTML = `<nav class="breadcrumbs">${link('/', 'Главная')}<span>/</span>${currentRoute.type === 'product' ? link(currentRoute.product.storefront === 'gold' ? '/zoloto' : '/tehnika', currentRoute.product.storefront === 'gold' ? 'Украшения' : 'Техника') + '<span>/</span>' : ''}<span>${currentRoute.title}</span></nav><div class="route-heading"><span class="eyebrow red">СКС МАРКЕТ</span><h1>${currentRoute.title}</h1></div>${content}`;
  if (currentRoute.type === 'checkout') checkout.mount();
  if (currentRoute.type === 'login') checkout.mount(true);
  if (currentRoute.type === 'estimate') updateEstimate();
}
function refresh() {
  if (['catalog', 'model'].includes(currentRoute.type)) renderListing();
  else render();
  syncCounters();
}
function addToCart(id) {
  if (!byId(id)) return;
  if (reservedIds().includes(id)) return toast('Экземпляр уже зарезервирован.');
  if (saved.cart.includes(id)) return navigate('/cart');
  saved.cart.push(id); persist();
  const activePreview = previewId;
  refresh();
  if (activePreview) { previewId = activePreview; showModal('Быстрый просмотр', detail(byId(id), true)); }
  toast('Находка добавлена в общую корзину');
}
function updateEstimate() {
  const form = document.querySelector('#estimate-form');
  const result = estimateValue(currentRoute.direction, Object.fromEntries(new FormData(form)));
  document.querySelector('#estimate-result').innerHTML = result ? `<span class="eyebrow">ПРИМЕР РАСЧЁТА</span><div><span>Скупка</span><strong>${money(result.buyout)}</strong></div><div><span>Комиссия, ориентир до расходов</span><strong>${money(result.commission)}</strong></div>${result.rate ? `<p>${money(result.rate)} / г — условная ставка</p>` : ''}` : '<p>Укажите корректные параметры вещи.</p>';
}
function renderSlide() {
  const tech = (currentRoute.storefront || saved.storefront) === 'tech';
  const slides = tech ? [
    ['ПРОВЕРЕННАЯ ТЕХНИКА', 'Большие планы.<br>Умные покупки.', 'Выбирайте модель. Сравнивайте экземпляры.<br>Знакомьтесь с техникой в отделении.', 'Выбрать смартфон', '/tehnika/smartfony'],
    ['У КАЖДОЙ ВЕЩИ СВОЯ ИСТОРИЯ', 'Все факты.<br>Перед покупкой.', 'Состояние, аккумулятор и комплектация.<br>Паспорт проверки в каждой карточке.', 'Смотреть ноутбуки', '/tehnika/noutbuki'],
    ['ДАЙТЕ ТЕХНИКЕ НОВЫЙ СТАРТ', 'Освободите место<br>для нового.', 'Узнайте предварительную цену<br>и выберите удобное отделение.', 'Оценить технику', '/sell/tehnika']
  ] : [
    ['НОВАЯ ИСТОРИЯ ВАШИХ ПОКУПОК', 'Больше радости.<br>Меньше затрат.', 'Золото, серебро и натуральные камни.<br>Особенные вещи по приятной цене.', 'Найти своё', '/zoloto/koltsa'],
    ['ЦВЕТ САМОЙ ПРИРОДЫ', 'Маленькие детали.<br>Большое чувство.', 'Украшения из натуральных камней.<br>Выберите свой цвет и настроение.', 'Смотреть камни', '/zoloto/kamni'],
    ['ХОРОШИЕ ВЕЩИ ОБЪЕДИНЯЮТ', 'Сначала примерка.<br>Потом — любовь.', 'Забронируйте украшение онлайн<br>и примерьте его в отделении.', 'Выбрать украшение', '/zoloto']
  ];
  const current = slides[slide];
  document.querySelector('#hero-eyebrow').textContent = current[0];
  document.querySelector('#hero-title').innerHTML = current[1];
  document.querySelector('#hero-description').innerHTML = current[2];
  const cta = document.querySelector('#hero-cta');
  cta.innerHTML = `${current[3]} <span>↗</span>`;
  cta.removeAttribute('data-category'); cta.dataset.go = current[4];
  document.querySelector('.hero-ring').src = tech ? 'assets/laptop.png' : 'assets/ring.png';
  document.querySelector('.hero-phone').src = tech ? 'assets/phone.png' : 'assets/stones.svg';
  const side = document.querySelector('.hero-side');
  side.dataset.go = tech ? '/sell/tehnika' : '/sell/zoloto'; side.removeAttribute('data-category');
  side.innerHTML = `<span class="eyebrow">ДЛЯ ВАШЕЙ НОВОЙ ИСТОРИИ</span><h2>Покупаете?<br>Продаёте?<br>Поможем.</h2><span>Предварительная оценка онлайн</span><img src="assets/${tech ? 'audio.svg' : 'necklace.png'}" alt=""><span class="circle-arrow">↗</span>`;
  document.querySelectorAll('[data-slide]').forEach(button => { button.classList.toggle('active', Number(button.dataset.slide) === slide); button.setAttribute('aria-pressed', Number(button.dataset.slide) === slide); });
}

document.querySelector('.header-main').insertAdjacentHTML('afterend', `<div class="container storefront-bar"><div class="storefront-switch">${link('/zoloto', `${icon('diamond')} Золото и украшения`, '')}${link('/tehnika', `${icon('grid')} Техника`, '')}</div><span id="storefront-description"></span>${link('/sell', 'Продать или сдать ↗', 'sell-link')}</div>`);
document.querySelectorAll('.storefront-switch a').forEach((element, index) => { element.dataset.storefront = index === 0 ? 'gold' : 'tech'; });
document.querySelector('#catalog').insertAdjacentHTML('afterbegin', '<div id="model-area"></div>');
document.querySelector('.mobile-nav').innerHTML = `<button data-go="/">${icon('home')}Главная</button><button data-go="/catalog">${icon('grid')}Каталог</button><button data-go="/sell" class="mobile-sell">${icon('refresh')}Оценить</button><button data-go="/cart">${icon('bag')}Корзина<span id="mobile-cart-count"></span></button><button data-go="/account">${icon('user')}Профиль</button>`;
document.querySelector('.footer-top').innerHTML = `${link('/', '<span class="brand-symbol">СКС</span><span class="brand-name">маркет</span>', 'brand')}<p>Две витрины.<br>Одна новая история.</p>${link('/help', 'Покупателям')}${link('/sell', 'Продать или сдать')}${link('/shops', 'Отделения')}${link('/legal', 'Продавцы и документы')}`;
document.querySelectorAll('.brand').forEach(element => { element.href = sitePath('/'); element.dataset.route = ''; });
document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
document.querySelectorAll('.header-actions button').forEach(button => { button.setAttribute('aria-label', { favorites: 'Избранное', orders: 'Личный кабинет', cart: 'Корзина' }[button.dataset.action]); });
document.querySelector('.header-actions [data-action="orders"] span:last-of-type').textContent = 'Кабинет';

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[data-route]');
  if (anchor && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); return navigate(anchor.getAttribute('href')); }
  const target = event.target.closest('button');
  if (!target || target.disabled) return;
  const data = target.dataset;
  if (data.go) return navigate(data.go);
  if (data.preview) { previewId = data.preview; return showModal('Быстрый просмотр', detail(byId(data.preview), true)); }
  if (data.add) return addToCart(data.add);
  if (data.favorite) {
    saved.favorites = saved.favorites.includes(data.favorite) ? saved.favorites.filter(id => id !== data.favorite) : [...saved.favorites, data.favorite]; persist();
    const activePreview = previewId; refresh();
    if (activePreview) { previewId = activePreview; showModal('Быстрый просмотр', detail(byId(activePreview), true)); }
    return;
  }
  if (data.remove) { saved.cart = saved.cart.filter(id => id !== data.remove); persist(); return render(); }
  if (data.book) return showModal('Просмотр в отделении', `<p class="info-text">${byId(data.book).name}<br>${branchById(byId(data.book).branchId).name} · ${branchById(byId(data.book).branchId).address}</p><div class="notice">После подтверждения экземпляр перейдёт в локальный демо-резерв до отмены в кабинете. Реальная запись не отправляется.</div><button class="primary" data-confirm-book="${data.book}" style="margin-top:20px">Подтвердить демо-бронь</button>`);
  if (data.confirmBook) {
    try { saved = readSaved(); const order = { ...createOrder([data.confirmBook], reservedIds(), 'pickup'), kind: 'fitting' }; saved.orders.unshift(order); saved.cart = saved.cart.filter(id => id !== data.confirmBook); persist(); lastOrderId = order.id; navigate('/checkout/done'); }
    catch (error) { toast(error.message); }
    return;
  }
  if (data.cancel) { saved.orders = saved.orders.filter(order => order.id !== data.cancel); persist(); render(); return toast('Резерв снят, экземпляры снова доступны'); }
  if (data.cancelAppointment) { saved.appointments = saved.appointments.filter(item => item.id !== data.cancelAppointment); persist(); return render(); }
  if (data.state) { filters.itemState = data.state; limit = 8; syncUrl(); buildFilters(); return renderListing(); }
  if (data.clearFilter) { const key = data.clearFilter; if (key === 'price') { filters.min = ''; filters.max = ''; } else filters[key] = key === 'query' || key === 'battery' ? '' : 'all'; syncUrl(); buildFilters(); document.querySelector('#search').value = filters.query; return renderListing(); }
  if (data.city) { saved.city = data.city; persist(); modal.close(); if (['catalog', 'model'].includes(currentRoute.type)) { filters.city = data.city; filters.branch = 'all'; syncUrl(); } return render(); }
  if (target.hasAttribute('data-slide')) { slide = Number(data.slide); return renderSlide(); }
  if (data.info) return navigate({ shops: '/shops', delivery: '/help/delivery', guarantee: '/help/guarantee' }[data.info]);
  const actions = {
    home: () => navigate('/'), catalog: () => navigate('/catalog'), favorites: () => navigate('/favorites'), orders: () => navigate('/account'), cart: () => navigate('/cart'), close: () => modal.close(),
    city: () => showModal('Где будем искать?', `<div class="city-grid">${['all', ...new Set(branches.map(branch => branch.city))].map(city => `<button data-city="${city}" class="${saved.city === city ? 'selected' : ''}">${city === 'all' ? 'Все города' : city}</button>`).join('')}</div>`),
    filters: () => { const panel = document.querySelector('#filter-panel'); panel.hidden = !panel.hidden; }, reset: () => navigate(currentRoute.path), more: () => { limit += 8; renderListing(); }, sale: () => navigate('/collections/sale'),
    'next-slide': () => { slide = (slide + 1) % 3; renderSlide(); }, 'previous-slide': () => { slide = (slide + 2) % 3; renderSlide(); },
    'reset-demo': () => showModal('Начать заново?', '<p class="info-text">Очистятся только демо-корзина, избранное, заказы и записи этого прототипа.</p><button class="primary" data-action="confirm-reset" style="margin-top:20px">Очистить демо-данные</button>'),
    'confirm-reset': () => { checkout.reset(); saved = { cart: [], favorites: [], orders: [], appointments: [], city: 'Уфа', storefront: 'gold' }; persist(); navigate('/'); toast('Демо-данные очищены'); }
  };
  actions[data.action]?.();
});
document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); navigate(`/search?q=${encodeURIComponent(document.querySelector('#search').value)}&city=${encodeURIComponent(saved.city)}`); });
document.querySelector('#search').addEventListener('input', event => {
  if (!['catalog', 'model'].includes(currentRoute.type)) return;
  filters.query = event.target.value; limit = 8; syncUrl(); renderListing();
});
document.addEventListener('input', event => {
  if (event.target.dataset.filter) { filters[event.target.dataset.filter] = event.target.value; limit = 8; syncUrl(); renderListing(); }
  if (event.target.closest('#estimate-form') && ['purity', 'weight', 'model', 'grade'].includes(event.target.name)) updateEstimate();
});
document.querySelector('#sort').addEventListener('change', event => { filters.sort = event.target.value; syncUrl(); renderListing(); });
document.addEventListener('submit', event => {
  if (event.target.id === 'estimate-form') {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    const result = estimateValue(currentRoute.direction, values);
    if (!result) return toast('Проверьте параметры вещи');
    saved.appointments.unshift({ id: `REQUEST-${Date.now()}`, summary: `${currentRoute.direction === 'gold' ? `Золото ${values.purity}, ${values.weight} г` : values.model === 'iphone' ? 'iPhone 13' : values.model === 'laptop' ? 'MacBook Pro' : 'Другая техника'} · ${values.method === 'commission' ? 'комиссия' : 'скупка'} · ориентир ${money(values.method === 'commission' ? result.commission : result.buyout)}`, branchId: values.branch, date: values.date });
    persist(); navigate('/account'); toast('Демо-запись добавлена в кабинет');
  }
});
modal.addEventListener('click', event => { if (event.target === modal) { const bounds = modal.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close(); } });
modal.addEventListener('close', () => { previewId = null; document.querySelector('#modal-body').innerHTML = ''; });
window.addEventListener('popstate', () => { modal.close(); render(); });
window.addEventListener('storage', event => { if (event.key === storageKey) { saved = readSaved(); modal.close(); render(); toast('Демо-данные обновлены в другой вкладке'); } });
const initialStorefront = resolveRoute(appPath(location.pathname)).storefront;
if (initialStorefront && saved.storefront !== initialStorefront) { saved.storefront = initialStorefront; persist(); }
render();
