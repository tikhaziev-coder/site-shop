export const branches = [
  { id: 'ufa-center', city: 'Уфа', name: 'Уфа · Центр', address: 'ул. Ленина, 26', hours: 'Ежедневно, 09:00–20:00' },
  { id: 'ufa-north', city: 'Уфа', name: 'Уфа · Проспект', address: 'проспект Октября, 74', hours: 'Ежедневно, 10:00–20:00' },
  { id: 'sterlitamak', city: 'Стерлитамак', name: 'Стерлитамак · Центр', address: 'ул. Гоголя, 118', hours: 'Ежедневно, 09:00–19:00' }
];

export const categories = [
  { id: 'gold', name: 'Украшения', image: 'ring.png', note: 'Маленькие сокровища' },
  { id: 'phones', name: 'Смартфоны', image: 'phone.png', note: 'Всегда на связи' },
  { id: 'laptops', name: 'Ноутбуки', image: 'laptop.png', note: 'Для больших планов' },
  { id: 'watches', name: 'Часы', image: 'watch.png', note: 'Ваше время' },
  { id: 'audio', name: 'Аудиотехника', image: 'audio.svg', note: 'Поймайте свой ритм' },
  { id: 'tools', name: 'Инструменты', image: 'drill.svg', note: 'Всё в ваших руках' }
];

export const sellers = {
  karat: { id: 'karat', name: 'ООО «Карат»', storefront: 'gold' },
  smart: { id: 'smart', name: 'ООО «Смарт»', storefront: 'tech' }
};

export const catalogTree = [
  { id: 'rings', path: '/zoloto/koltsa', name: 'Кольца', storefront: 'gold', image: 'ring.png', note: 'Ваш маленький повод сиять' },
  { id: 'earrings', path: '/zoloto/sergi', name: 'Серьги', storefront: 'gold', image: 'earrings.png', note: 'Детали с характером' },
  { id: 'chains', path: '/zoloto/cepi', name: 'Цепи', storefront: 'gold', image: 'necklace.png', note: 'На каждый день' },
  { id: 'bracelets', path: '/zoloto/braslety', name: 'Браслеты', storefront: 'gold', image: 'necklace.png', note: 'Красота в движении' },
  { id: 'pendants', path: '/zoloto/podveski', name: 'Подвески и кулоны', storefront: 'gold', image: 'ring.png', note: 'Особенный смысл' },
  { id: 'sets', path: '/zoloto/komplekty', name: 'Колье, комплекты, броши', storefront: 'gold', image: 'necklace.png', note: 'Идеальная пара' },
  { id: 'watches', path: '/zoloto/chasy', name: 'Часы', storefront: 'gold', image: 'watch.png', note: 'Ваше время' },
  { id: 'silver', path: '/zoloto/serebro', name: 'Серебро', storefront: 'gold', image: 'earrings.png', note: 'Лёгкое сияние' },
  { id: 'stones', path: '/zoloto/kamni', name: 'Натуральные камни', storefront: 'gold', image: 'stones.svg', note: 'Цвет самой природы' },
  { id: 'phones', path: '/tehnika/smartfony', name: 'Смартфоны и гаджеты', storefront: 'tech', image: 'phone.png', note: 'Всегда на связи' },
  { id: 'laptops', path: '/tehnika/noutbuki', name: 'Ноутбуки и компьютеры', storefront: 'tech', image: 'laptop.png', note: 'Для больших планов' },
  { id: 'audio', path: '/tehnika/tv-audio', name: 'ТВ, аудио, фото', storefront: 'tech', image: 'audio.svg', note: 'Поймайте свой ритм' },
  { id: 'games', path: '/tehnika/igry', name: 'Игры и консоли', storefront: 'tech', image: 'gamepad.svg', note: 'Время для себя' },
  { id: 'kitchen', path: '/tehnika/kuhnya', name: 'Техника для кухни', storefront: 'tech', image: 'appliance.svg', note: 'Вкусные привычки' },
  { id: 'home', path: '/tehnika/dom', name: 'Техника для дома', storefront: 'tech', image: 'appliance.svg', note: 'Меньше забот' },
  { id: 'beauty', path: '/tehnika/krasota', name: 'Красота и здоровье', storefront: 'tech', image: 'audio.svg', note: 'Забота о себе' }
];

export const grades = { N: 'Новое', 'A+': 'Как новое', A: 'Отличное', B: 'Хорошее', C: 'Удовлетворительное', D: 'Уценка' };

const records = [
  ['g01', 'Кольцо с сияющей вставкой', 'gold', 'ring.png', 18490, 24900, 'ufa-center', 'Как новый', 'Золото 585 · 2,8 г · размер 17', { 'Проба': '585', 'Вес': '2,8 г', 'Размер': '17', 'Вставка': 'Фианит' }],
  ['p01', 'Apple iPhone 13, 128 ГБ', 'phones', 'phone.png', 29990, 37990, 'ufa-north', 'Отличное', '128 ГБ · синий · АКБ 89%', { 'Память': '128 ГБ', 'Аккумулятор': '89%', 'Комплект': 'Кабель', 'Проверка': 'Все функции исправны' }],
  ['g02', 'Золотой браслет «Нежность»', 'gold', 'necklace.png', 32500, 41900, 'ufa-center', 'Как новый', 'Золото 585 · 5,2 г · 18 см', { 'Проба': '585', 'Вес': '5,2 г', 'Длина': '18 см', 'Плетение': 'Панцирное' }],
  ['l01', 'Apple MacBook Pro 14″', 'laptops', 'laptop.png', 89900, 109900, 'ufa-north', 'Отличное', 'Apple M1 Pro · 16/512 ГБ', { 'Процессор': 'Apple M1 Pro', 'Память': '16 ГБ / 512 ГБ SSD', 'Экран': '14 дюймов', 'Комплект': 'Зарядное устройство' }],
  ['g03', 'Серьги-пусеты «Линии света»', 'gold', 'earrings.png', 12900, 16900, 'ufa-center', 'Как новый', 'Золото 585 · 1,9 г · пара', { 'Проба': '585', 'Вес': '1,9 г', 'Замок': 'Винтовой', 'Вставка': 'Без вставок' }],
  ['w01', 'Наручные часы Classic', 'watches', 'watch.png', 7490, 9900, 'ufa-north', 'Хорошее', 'Кварцевые · сталь · 42 мм', { 'Механизм': 'Кварцевый', 'Корпус': 'Сталь', 'Диаметр': '42 мм', 'Комплект': 'Без коробки' }],
  ['a01', 'Наушники Studio Wireless', 'audio', 'audio.svg', 8990, 11990, 'ufa-center', 'Отличное', 'Bluetooth · шумоподавление', { 'Подключение': 'Bluetooth', 'Тип': 'Полноразмерные', 'Комплект': 'Кейс, кабель', 'Проверка': 'Звук и микрофон исправны' }],
  ['t01', 'Аккумуляторная дрель 18 В', 'tools', 'drill.svg', 6490, 8900, 'ufa-north', 'Хорошее', '18 В · 2 аккумулятора · кейс', { 'Напряжение': '18 В', 'Аккумуляторы': '2 шт.', 'Комплект': 'Кейс, зарядное устройство', 'Режимы': 'Сверление, шуруповёрт' }],
  ['g04', 'Кольцо «Тёплый свет»', 'gold', 'ring.png', 21500, 27500, 'sterlitamak', 'Отличное', 'Золото 585 · 3,2 г · размер 18', { 'Проба': '585', 'Вес': '3,2 г', 'Размер': '18', 'Вставка': 'Фианит' }],
  ['p02', 'Apple iPhone 13, 256 ГБ', 'phones', 'phone.png', 33900, 42900, 'sterlitamak', 'Как новый', '256 ГБ · синий · АКБ 95%', { 'Память': '256 ГБ', 'Аккумулятор': '95%', 'Комплект': 'Коробка, кабель', 'Проверка': 'Все функции исправны' }],
  ['g05', 'Браслет «Золотая нить»', 'gold', 'necklace.png', 25900, 25900, 'ufa-north', 'Отличное', 'Золото 585 · 4,1 г · 19 см', { 'Проба': '585', 'Вес': '4,1 г', 'Длина': '19 см', 'Плетение': 'Панцирное' }],
  ['l02', 'Apple MacBook Pro 14″, 1 ТБ', 'laptops', 'laptop.png', 104900, 129900, 'sterlitamak', 'Как новый', 'Apple M1 Pro · 16 ГБ / 1 ТБ', { 'Процессор': 'Apple M1 Pro', 'Память': '16 ГБ / 1 ТБ SSD', 'Экран': '14 дюймов', 'Комплект': 'Коробка, зарядное устройство' }],
  ['g06', 'Серьги «Минимализм»', 'gold', 'earrings.png', 15900, 19900, 'sterlitamak', 'Как новый', 'Золото 585 · 2,3 г · пара', { 'Проба': '585', 'Вес': '2,3 г', 'Замок': 'Винтовой', 'Вставка': 'Без вставок' }],
  ['w02', 'Часы Classic с кожаным ремешком', 'watches', 'watch.png', 5900, 7900, 'sterlitamak', 'Хорошее', 'Кварцевые · кожа · 40 мм', { 'Механизм': 'Кварцевый', 'Ремешок': 'Кожа', 'Диаметр': '40 мм', 'Комплект': 'Без коробки' }],
  ['a02', 'Наушники Studio Wireless Pro', 'audio', 'audio.svg', 11490, 14990, 'ufa-north', 'Как новый', 'Bluetooth · до 40 часов', { 'Подключение': 'Bluetooth', 'Автономность': 'До 40 часов', 'Комплект': 'Кейс, кабель', 'Проверка': 'Все функции исправны' }],
  ['t02', 'Дрель-шуруповёрт Compact', 'tools', 'drill.svg', 4990, 4990, 'sterlitamak', 'Отличное', '12 В · 1 аккумулятор', { 'Напряжение': '12 В', 'Аккумуляторы': '1 шт.', 'Комплект': 'Зарядное устройство', 'Режимы': 'Сверление, шуруповёрт' }],
  ['s01', 'Браслет из аметиста', 'stones', 'stones.svg', 2490, 3200, 'ufa-center', 'Новое', 'Аметист · гладкий · бусина 8 мм', { 'Камень': 'Аметист', 'Обработка': 'Гладкий', 'Бусина': '8 мм', 'Длина': '18 см', 'Основа': 'Резинка' }],
  ['s02', 'Браслет из розового кварца', 'stones', 'stones.svg', 1890, 2400, 'sterlitamak', 'Новое', 'Розовый кварц · гладкий · 6 мм', { 'Камень': 'Розовый кварц', 'Обработка': 'Гладкий', 'Бусина': '6 мм', 'Длина': '17 см', 'Основа': 'Резинка' }],
  ['p03', 'Apple iPhone 13, 128 ГБ', 'phones', 'phone.png', 25900, 34900, 'ufa-center', 'Хорошее', '128 ГБ · синий · АКБ 84%', { 'Память': '128 ГБ', 'Аккумулятор': '84%', 'Комплект': 'Кабель', 'Цвет': 'Синий' }],
  ['p04', 'Apple iPhone 13, 128 ГБ', 'phones', 'phone.png', 38900, 45900, 'ufa-north', 'Новое', '128 ГБ · синий · АКБ 100%', { 'Память': '128 ГБ', 'Аккумулятор': '100%', 'Комплект': 'Коробка, кабель', 'Цвет': 'Синий' }],
  ['g07', 'Кольцо «Первая история»', 'gold', 'ring.png', 23900, 27900, 'ufa-center', 'Новое', 'Золото 585 · 3,1 г · размер 17', { 'Проба': '585', 'Вес': '3,1 г', 'Размер': '17', 'Вставка': 'Фианит' }],
  ['g08', 'Кольцо «Первая история»', 'gold', 'ring.png', 24900, 28900, 'ufa-north', 'Новое', 'Золото 585 · 3,3 г · размер 18', { 'Проба': '585', 'Вес': '3,3 г', 'Размер': '18', 'Вставка': 'Фианит' }],
  ['k01', 'Кофемашина Compact', 'kitchen', 'appliance.svg', 14900, 19900, 'ufa-north', 'Отличное', 'Капсульная · 1200 Вт', { 'Тип': 'Капсульная', 'Мощность': '1200 Вт', 'Объём': '0,8 л', 'Комплект': 'Полный' }],
  ['c01', 'Геймпад Wireless', 'games', 'gamepad.svg', 3490, 4900, 'ufa-center', 'Отличное', 'Беспроводной · USB-C', { 'Подключение': 'Bluetooth', 'Комплект': 'Кабель USB-C' }],
  ['g09', 'Колье «Большая история»', 'gold', 'necklace.png', 420000, 465000, 'ufa-center', 'Отличное', 'Золото 585 · 58 г · демо-экземпляр', { 'Проба': '585', 'Вес': '58 г', 'Длина': '50 см', 'Вставка': 'Без вставок' }]
];

export const products = records.map(([id, name, category, image, price, oldPrice, branchId, condition, summary, specs], index) => ({
  id, name, category, image: `assets/${image}`, price, oldPrice, branchId, condition, summary, specs,
  warehouseId: `${branchId}-${category === 'gold' ? 'gold' : 'tech'}`,
  warehouseType: category === 'gold' ? 'Золото' : 'Техника',
  city: branches.find(branch => branch.id === branchId).city,
  stock: 1,
  addedAt: 100 - index,
  description: category === 'gold' ? 'Демонстрационный экземпляр украшения. Перед публикацией реального товара здесь появятся фотографии изделия, подтверждённые характеристики и результаты проверки.' : 'Демонстрационный экземпляр техники. В рабочем магазине здесь будут результаты диагностики, фотографии следов использования и подробный состав комплекта.',
  defects: condition === 'Хорошее' ? 'Заметные следы использования на корпусе.' : condition === 'Отличное' ? 'Небольшие следы использования.' : 'В демонстрационном описании дефекты отсутствуют.'
})).filter(product => product.category !== 'tools').map(product => {
  const storefront = ['gold', 'stones', 'watches'].includes(product.category) ? 'gold' : 'tech';
  const leafCategory = product.id === 'g09' ? 'sets' : product.category === 'gold' ? (['g01', 'g04', 'g07', 'g08'].includes(product.id) ? 'rings' : ['g03', 'g06'].includes(product.id) ? 'earrings' : 'bracelets') : product.category;
  const isNew = product.condition === 'Новое';
  const weight = product.specs['Вес'] ? parseFloat(product.specs['Вес'].replace(',', '.')) : null;
  return {
    ...product, image: product.image, storefront, leafCategory,
    identificationCategory: product.category === 'gold' ? 'precious_jewelry' : 'none',
    sellerId: storefront === 'gold' ? 'karat' : 'smart',
    warehouseId: `${product.branchId}-${storefront}`,
    warehouseType: storefront === 'gold' ? 'Золото' : 'Техника',
    itemState: isNew ? 'new' : 'used',
    grade: storefront === 'tech' ? ({ 'Новое': 'N', 'Как новый': 'A+', 'Отличное': 'A', 'Хорошее': 'B' }[product.condition]) : null,
    origin: isNew ? 'От производителя' : product.id === 'g01' || product.id === 'g04' ? 'Из ломбарда' : product.id === 'p01' ? 'Комиссия' : 'Скупка',
    modelId: product.category === 'phones' ? `iphone-13-${product.specs['Память'].split(' ')[0]}` : product.category === 'laptops' ? `macbook-pro-14-${product.id === 'l01' ? '512' : '1024'}` : null,
    articleId: ['g07', 'g08'].includes(product.id) ? 'first-story' : product.id,
    metal: product.category === 'gold' ? 'Золото' : null,
    weight,
    pricePerGram: weight ? Math.round(product.price / weight) : null,
    battery: parseInt(product.specs['Аккумулятор']) || null,
    inspection: storefront === 'tech' ? ['Функциональная диагностика по чек-листу', 'Комплектация и следы использования описаны', 'Для смартфонов: проверка аккаунтов, связи и АКБ'] : product.category === 'stones' ? ['Внешний осмотр бусин и креплений', 'Сверка состава и размера с биркой поставщика'] : product.category === 'watches' ? ['Проверка хода и механизма', 'Осмотр корпуса и ремешка'] : ['Проверка пробы и вставок', 'Осмотр замков и креплений', 'Чистка и предпродажная подготовка']
  };
});

export function selectProducts(filters, favorites = [], reserved = []) {
  const query = (filters.query || '').trim().toLocaleLowerCase('ru');
  const selected = products.filter(product =>
    (filters.city === 'all' || !filters.city || product.city === filters.city) &&
    (!filters.storefront || filters.storefront === 'all' || product.storefront === filters.storefront) &&
    (filters.category === 'all' || !filters.category || (['gold', 'tech'].includes(filters.category) ? product.storefront === filters.category : product.leafCategory === filters.category)) &&
    (!filters.model || product.modelId === filters.model) &&
    (!filters.itemState || filters.itemState === 'all' || product.itemState === filters.itemState) &&
    (!filters.grade || filters.grade === 'all' || product.grade === filters.grade) &&
    (!filters.origin || filters.origin === 'all' || product.origin === filters.origin) &&
    (!filters.stone || filters.stone === 'all' || product.specs['Камень'] === filters.stone) &&
    (!filters.metal || filters.metal === 'all' || product.metal === filters.metal) &&
    (!filters.battery || product.battery >= Number(filters.battery)) &&
    (!filters.favorites || favorites.includes(product.id)) &&
    (!filters.sale || product.oldPrice > product.price) &&
    (!filters.branch || filters.branch === 'all' || filters.branch === product.branchId) &&
    (!filters.condition || filters.condition === 'all' || filters.condition === product.condition) &&
    (!filters.min || product.price >= Number(filters.min)) &&
    (!filters.max || product.price <= Number(filters.max)) &&
    (!query || `${product.id} ${product.name} ${product.summary} ${product.warehouseType}`.toLocaleLowerCase('ru').includes(query))
  );
  const sorting = { cheap: (first, second) => first.price - second.price, expensive: (first, second) => second.price - first.price, new: (first, second) => second.addedAt - first.addedAt, gram: (first, second) => (first.pricePerGram ?? Infinity) - (second.pricePerGram ?? Infinity), discount: (first, second) => (1 - second.price / second.oldPrice) - (1 - first.price / first.oldPrice) };
  return selected.sort(sorting[filters.sort] || ((first, second) => Number(reserved.includes(first.id)) - Number(reserved.includes(second.id))));
}

export function getCartGroups(cart) {
  return cart.reduce((groups, id) => {
    const product = products.find(item => item.id === id);
    if (product && !Object.values(groups).flat().some(item => item.id === id)) (groups[`${product.sellerId}:${product.warehouseId}`] ||= []).push(product);
    return groups;
  }, {});
}

export function createOrder(cart, reserved, delivery) {
  const ids = [...new Set(cart)];
  if (!ids.length) throw new Error('Корзина пуста');
  const items = ids.map(id => products.find(product => product.id === id));
  if (items.some(item => !item || reserved.includes(item.id))) throw new Error('Один из товаров уже зарезервирован. Обновите корзину.');
  if (!['pickup', 'delivery'].includes(delivery)) throw new Error('Выберите способ получения');
  const shipping = delivery === 'delivery' ? Object.keys(getCartGroups(ids)).length * 350 : 0;
  const shipments = Object.values(getCartGroups(ids)).map(group => ({ sellerId: group[0].sellerId, branchId: group[0].branchId, warehouseId: group[0].warehouseId, items: group.map(item => item.id) }));
  return { id: `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`, items: ids, shipments, delivery, shipping, total: items.reduce((total, item) => total + item.price, 0) + shipping, createdAt: new Date().toISOString() };
}
