import { products, branches } from './data.js';

export const storageKey = 'sks-market-demo-v1';
export function readSaved() {
  const fallback = { cart: [], favorites: [], orders: [], appointments: [], city: 'Уфа', storefront: 'gold' };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (!saved || typeof saved !== 'object') return fallback;
    const validIds = value => Array.isArray(value) ? [...new Set(value.filter(id => products.some(product => product.id === id)))] : [];
    const orders = Array.isArray(saved.orders) ? saved.orders.filter(order => order && typeof order.id === 'string' && Array.isArray(order.items) && order.items.length && order.items.every(id => products.some(product => product.id === id)) && Number.isFinite(order.total) && !Number.isNaN(Date.parse(order.createdAt))).map(order => ({ ...order, items: validIds(order.items) })) : [];
    const appointments = Array.isArray(saved.appointments) ? saved.appointments.filter(item => item && typeof item.id === 'string' && typeof item.summary === 'string' && branches.some(branch => branch.id === item.branchId)).slice(0, 100) : [];
    return { ...fallback, cart: validIds(saved.cart).filter(id => !orders.some(order => order.items.includes(id))), favorites: validIds(saved.favorites), orders, appointments, city: ['all', ...branches.map(branch => branch.city)].includes(saved.city) ? saved.city : 'Уфа', storefront: saved.storefront === 'tech' ? 'tech' : 'gold' };
  } catch { return fallback; }
}
