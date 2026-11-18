import { createClient } from '@supabase/supabase-js';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

// Indicador explícito de conexión configurada
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_KEY && 
  SUPABASE_URL.startsWith('http')
);

// Cliente seguro: no inicializa con valores vacíos para evitar excepciones al cargar módulos
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const check = ({ error }) => {
  if (error) throw error;
};

// ---------- Sesión del administrador ----------
export async function checkAdmin() {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

// Devuelve 'out' (sin sesión), 'in' (admin) o 'denied' (sesión sin rol admin)
export async function getAuthState() {
  if (!supabase) return 'out';
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return 'out';
    return (await checkAdmin()) ? 'in' : 'denied';
  } catch {
    return 'out';
  }
}

export async function signIn(email, password) {
  if (!supabase) {
    throw new Error('El servicio de Supabase no está conectado todavía. Por favor configurá las claves en el archivo .env');
  }
  check(await supabase.auth.signInWithPassword({ email, password }));
  return getAuthState();
}

export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

// ---------- Productos ----------
const toProduct = (r) => ({ ...r, price: Number(r.price), stock: Number(r.stock) });

export async function fetchProducts() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map(toProduct);
  } catch (err) {
    console.warn('No se pudieron obtener productos de Supabase:', err.message || err);
    return [];
  }
}

export async function saveProduct(p) {
  if (!supabase) throw new Error('No se puede guardar: Supabase no está configurado.');
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
  if (!supabase) throw new Error('No se puede actualizar stock: Supabase no está configurado.');
  check(await supabase.from('products').update({ stock }).eq('id', id));
}

export async function deleteProduct(id) {
  if (!supabase) throw new Error('No se puede eliminar: Supabase no está configurado.');
  check(await supabase.from('products').delete().eq('id', id));
}

export async function uploadProductImage(file) {
  if (!supabase) throw new Error('No se puede subir imagen: Supabase no está configurado.');
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
  if (!supabase) return DEFAULT_CATEGORIES;
  try {
    const { data, error } = await supabase.from('categories').select('name').order('created_at');
    if (error) return DEFAULT_CATEGORIES;
    return (data || []).map((r) => r.name);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function addCategory(name) {
  if (!supabase) throw new Error('No se puede agregar categoría: Supabase no está configurado.');
  check(await supabase.from('categories').insert({ name }));
}

export async function deleteCategory(name) {
  if (!supabase) throw new Error('No se puede eliminar categoría: Supabase no está configurado.');
  check(await supabase.from('products').update({ category: '' }).eq('category', name));
  check(await supabase.from('categories').delete().eq('name', name));
}

// ---------- Órdenes ----------
const toOrder = (r) => ({ ...r.data, id: r.id });

export async function fetchOrders() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(toOrder);
  } catch {
    return [];
  }
}

// Guarda la orden en Supabase si está disponible; de lo contrario falla para avisar al caller
export async function createOrder(order) {
  if (!supabase) {
    throw new Error('Servidor de base de datos no configurado.');
  }
  check(await supabase.from('orders').insert({ id: order.id, data: order }));
  return true;
}

export async function updateOrder(order) {
  if (!supabase) throw new Error('Base de datos no configurada.');
  check(await supabase.from('orders').update({ data: order }).eq('id', order.id));
}

export async function deleteOrder(id) {
  if (!supabase) throw new Error('Base de datos no configurada.');
  check(await supabase.from('orders').delete().eq('id', id));
}

// Compatibilidad con navegador local
export function browserProductsCount() {
  try {
    return JSON.parse(localStorage.getItem('products') || '[]').length;
  } catch {
    return 0;
  }
}

export async function importFromBrowser() {
  return 0;
}
