import { catalogTree, products, branches } from './data.js';

export const citySlugs = { ufa: 'Уфа', sterlitamak: 'Стерлитамак' };
export const citySlug = city => Object.keys(citySlugs).find(slug => citySlugs[slug] === city);
export const publicPages = {
  '/': { type: 'catalog', title: 'Вещи с новой историей' },
  '/catalog': { type: 'catalog', title: 'Все находки' },
  '/zoloto': { type: 'catalog', storefront: 'gold', title: 'Золото и украшения' },
  '/tehnika': { type: 'catalog', storefront: 'tech', title: 'Техника' },
  '/search': { type: 'catalog', title: 'Результаты поиска' },
  '/favorites': { type: 'catalog', favorites: true, title: 'Избранное' },
  '/collections/sale': { type: 'catalog', sale: true, title: 'Цена снижена' },
  '/collections/new': { type: 'catalog', sort: 'new', title: 'Новые поступления' },
  '/collections/pawnshop': { type: 'catalog', origin: 'Из ломбарда', title: 'Из ломбарда' },
  '/cart': { type: 'cart', title: 'Ваша корзина' },
  '/checkout': { type: 'checkout', title: 'Оформление демо-заказа' },
  '/checkout/done': { type: 'done', title: 'Заказ оформлен' },
  '/account': { type: 'account', title: 'Личный кабинет' },
  '/login': { type: 'login', title: 'Вход в демо-аккаунт' },
  '/sell': { type: 'sell', title: 'Пусть ваша вещь начнёт новую историю' },
  '/sell/zoloto': { type: 'estimate', direction: 'gold', title: 'Предварительная оценка золота' },
  '/sell/tehnika': { type: 'estimate', direction: 'tech', title: 'Предварительная оценка техники' },
  '/sell/ocenka': { type: 'estimate', direction: 'tech', title: 'Онлайн-оценка вещи' },
  '/sell/komissiya': { type: 'estimate', direction: 'tech', commission: true, title: 'Сдать вещь на комиссию' },
  '/shops': { type: 'shops', title: 'Отделения СКС' },
  '/help': { type: 'help', title: 'Поможем разобраться' },
  '/help/delivery': { type: 'help', topic: 'delivery', title: 'Доставка и оплата' },
  '/help/inspection': { type: 'help', topic: 'inspection', title: 'Как проверяем товары' },
  '/help/guarantee': { type: 'help', topic: 'guarantee', title: 'Гарантия и возврат' },
  '/about': { type: 'about', title: 'О СКС Маркете' },
  '/legal': { type: 'legal', title: 'Информация о продавцах' }
};

export function resolveRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (publicPages[path]) return { ...publicPages[path], path };
  const category = catalogTree.find(item => item.path === path);
  if (category) return { type: 'catalog', path, title: category.name, category: category.id, storefront: category.storefront };
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'p') {
    const product = products.find(item => item.id === parts[1]);
    if (product) return { type: 'product', path, title: product.name, product };
  }
  if (parts.length === 2 && parts[0] === 'm') {
    const offers = products.filter(item => item.modelId === parts[1]);
    if (offers.length) return { type: 'model', path, title: offers[0].name, model: parts[1] };
  }
  if (parts[0] === 'shops' && citySlugs[parts[1]]) {
    if (parts.length === 2) return { type: 'shops', path, city: citySlugs[parts[1]], title: `Отделения: ${citySlugs[parts[1]]}` };
    const branch = branches.find(item => item.id === parts[2] && item.city === citySlugs[parts[1]]);
    if (parts.length === 3 && branch) return { type: 'branch', path, branch, title: branch.name };
  }
  return { type: 'notfound', path, title: 'Страница не найдена' };
}

export function estimateValue(direction, values) {
  if (direction === 'gold') {
    const rates = { 375: 3100, 500: 4200, 583: 4900, 585: 5000, 750: 6400, 958: 7900, 999: 8200 };
    const weight = Number(values.weight);
    if (!rates[values.purity] || !Number.isFinite(weight) || weight <= 0 || weight > 500) return null;
    const buyout = Math.round(weight * rates[values.purity]);
    return { buyout, commission: Math.round(buyout * 1.2), rate: rates[values.purity] };
  }
  const prices = { iphone: 24000, laptop: 42000, other: 7000 };
  const factors = { 'A+': 1, A: .9, B: .75, C: .55, D: .3 };
  if (!prices[values.model] || !factors[values.grade]) return null;
  const buyout = Math.round(prices[values.model] * factors[values.grade]);
  return { buyout, commission: Math.round(buyout * 1.2) };
}
