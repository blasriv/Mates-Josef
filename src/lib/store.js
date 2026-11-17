// Capa de datos: todo lo que antes vivía en localStorage ahora vive en Supabase,
// así lo que carga el admin lo ve cualquier visitante desde cualquier dispositivo.
import { createClient } from '@supabase/supabase-js';

// La "publishable key" es pública por diseño: la seguridad la dan las reglas (RLS) de la base.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const check = ({ error }) => {
  if (error) throw error;
};

// ---------- Sesión del administrador ----------
export async function checkAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  return data === true;
}

// Devuelve 'out' (sin sesión), 'in' (admin) o 'denied' (sesión de alguien que no es admin)
export async function getAuthState() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return 'out';
  return (await checkAdmin()) ? 'in' : 'denied';
}

export async function signIn(email, password) {
  check(await supabase.auth.signInWithPassword({ email, password }));
  return getAuthState();
}

export const signOut = () => supabase.auth.signOut();

// ---------- Productos ----------
const toProduct = (r) => ({ ...r, price: Number(r.price), stock: Number(r.stock) });

export async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
  if (error) throw error;
  return data.map(toProduct);
}

export async function saveProduct(p) {
  const row = {
    name: p.name,
    category: p.category || '',
    description: p.description || '',
    price: Number(p.price),
    stock: Number(p.stock),
    image: p.image || '',
  };
  const q = p.id
    ? supabase.from('products').update(row).eq('id', p.id)
    : supabase.from('products').insert(row);
  check(await q);
}

export async function setProductStock(id, stock) {
  check(await supabase.from('products').update({ stock }).eq('id', id));
}

export async function deleteProduct(id) {
  check(await supabase.from('products').delete().eq('id', id));
}

export async function uploadProductImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  check(
    await supabase.storage
      .from('product-images')
      .upload(path, file, { cacheControl: '31536000', contentType: file.type })
  );
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

// ---------- Categorías ----------
export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('name').order('created_at');
  if (error) throw error;
  return data.map((r) => r.name);
}

export async function addCategory(name) {
  check(await supabase.from('categories').insert({ name }));
}

export async function deleteCategory(name) {
  check(await supabase.from('products').update({ category: '' }).eq('category', name));
  check(await supabase.from('categories').delete().eq('name', name));
}

// ---------- Órdenes ----------
const toOrder = (r) => ({ ...r.data, id: r.id });

export async function fetchOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(toOrder);
}

// La usa el cliente al confirmar la compra (no necesita ser admin)
export async function createOrder(order) {
  check(await supabase.from('orders').insert({ id: order.id, data: order }));
}

export async function updateOrder(order) {
  check(await supabase.from('orders').update({ data: order }).eq('id', order.id));
}

export async function deleteOrder(id) {
  check(await supabase.from('orders').delete().eq('id', id));
}

// ---------- Importar lo que ya habías cargado en este navegador ----------
export function browserProductsCount() {
  try {
    return JSON.parse(localStorage.getItem('products') || '[]').length;
  } catch {
    return 0;
  }
}

export async function importFromBrowser() {
  const prods = JSON.parse(localStorage.getItem('products') || '[]');
  const cats = JSON.parse(localStorage.getItem('custom_categories') || '[]');
  const allCats = [...new Set([...cats, ...prods.map((p) => p.category).filter(Boolean)])];
  if (allCats.length) {
    check(
      await supabase
        .from('categories')
        .upsert(allCats.map((name) => ({ name })), { onConflict: 'name', ignoreDuplicates: true })
    );
  }
  if (prods.length) {
    check(
      await supabase.from('products').insert(
        prods.map((p) => ({
          name: p.name,
          category: p.category || '',
          description: p.description || '',
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          image: p.image || '',
        }))
      )
    );
  }
  return prods.length;
}
