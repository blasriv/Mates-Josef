import React, { useState, useEffect } from 'react';
import {
  getAuthState, signIn, signOut, isSupabaseConfigured,
  fetchProducts, fetchCategories, fetchOrders,
  saveProduct, setProductStock, deleteProduct, uploadProductImage,
  addCategory, deleteCategory,
  updateOrder, deleteOrder,
  browserProductsCount, importFromBrowser,
} from '../lib/store';

const ESTADOS = ['Pendiente', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado'];
const EMPTY_FORM = { id: null, name: '', price: '', category: '', description: '', stock: '', image: '' };
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?fm=jpg&q=80&w=600&auto=format&fit=crop';

export default function Admin({ setCurrentPage }) {
  // 'loading' | 'out' (sin sesión) | 'in' (admin) | 'denied' (sesión sin permisos)
  const [authState, setAuthState] = useState('loading');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics', 'orders', 'products', 'categories'

  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [productForm, setProductForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [browserCount] = useState(() => browserProductsCount());

  const isAuthenticated = authState === 'in';

  // Ejecuta una acción contra la base y avisa si algo falla
  const run = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      console.error(err);
      alert('Algo falló: ' + (err.message || err));
      return undefined;
    }
  };

  const loadAllData = async () => {
    await run(async () => {
      const [cats, prods, ords] = await Promise.all([fetchCategories(), fetchProducts(), fetchOrders()]);
      setCategories(cats);
      setProducts(prods);
      setOrders(ords);
    });
  };

  // --- Sesión ---
  useEffect(() => {
    getAuthState().then(setAuthState).catch(() => setAuthState('out'));
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadAllData();
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const state = await signIn(emailInput.trim(), passwordInput);
      setPasswordInput('');
      setAuthState(state);
    } catch (err) {
      setLoginError('Email o contraseña incorrectos.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setAuthState('out');
  };

  const handleExit = () => {
    window.location.hash = '';
    setCurrentPage('home');
  };

  // --- Categorías ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    await run(() => addCategory(trimmed));
    setNewCategoryName('');
    setCategories(await fetchCategories().catch(() => categories));
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat}"? Los productos quedarán sin categoría.`)) return;
    await run(() => deleteCategory(cat));
    await loadAllData();
  };

  // --- Productos (ABM) ---
  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Elegí un archivo de imagen.');
    if (file.size > 5 * 1024 * 1024) return alert('La imagen pesa más de 5 MB. Probá con una más liviana.');
    setUploading(true);
    const url = await run(() => uploadProductImage(file));
    setUploading(false);
    if (url) setProductForm((prev) => ({ ...prev, image: url }));
  };

  const handleAddOrUpdateProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || productForm.stock === '' || !productForm.category) {
      alert('Por favor, complete todos los campos obligatorios del producto.');
      return;
    }
    setSaving(true);
    const ok = await run(async () => {
      await saveProduct({ ...productForm, image: productForm.image || DEFAULT_IMAGE });
      return true;
    });
    setSaving(false);
    if (!ok) return;
    setProductForm(EMPTY_FORM);
    setProducts(await fetchProducts().catch(() => products));
  };

  const handleEditProduct = (product) => {
    setProductForm({ ...product, price: String(product.price), stock: String(product.stock) });
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) return;
    await run(() => deleteProduct(id));
    setProducts(await fetchProducts().catch(() => products));
  };

  const setLocalStock = (id, stock) =>
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, stock: Math.max(0, Number(stock) || 0) } : p)));

  const persistStock = (id, stock) => run(() => setProductStock(id, Math.max(0, Number(stock) || 0)));

  const handleStockChange = (id, delta) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const next = Math.max(0, current.stock + delta);
    setLocalStock(id, next);
    persistStock(id, next);
  };

  // --- Importar lo que estaba guardado solo en este navegador ---
  const handleImport = async () => {
    if (!window.confirm(`Se van a subir ${browserCount} productos guardados en este navegador a la base online. ¿Seguro? (Hacelo una sola vez.)`)) return;
    const n = await run(() => importFromBrowser());
    if (n !== undefined) {
      alert(`Listo: se importaron ${n} productos.`);
      await loadAllData();
    }
  };

  // --- Órdenes ---
  const patchOrder = async (order, patch) => {
    const updated = { ...order, ...patch };
    setOrders((os) => os.map((o) => (o.id === order.id ? updated : o)));
    await run(() => updateOrder(updated));
  };

  const handleUpdateOrderStatus = (id, estado) => patchOrder(orders.find((o) => o.id === id), { estado });
  const handleUpdateTracking = (id, tracking) => patchOrder(orders.find((o) => o.id === id), { tracking });

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('¿Está seguro de que desea archivar/eliminar esta orden?')) return;
    await run(() => deleteOrder(orderId));
    setOrders((os) => os.filter((o) => o.id !== orderId));
  };

  // --- Estadísticas ---
  const facturacionData = {};
  categories.forEach((cat) => { facturacionData[cat] = 0; });
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const cat = item.category || 'Sin categoría';
      facturacionData[cat] = (facturacionData[cat] || 0) + Number(item.price || 0) * Number(item.quantity || 1);
    });
  });
  const totalFacturado = Object.values(facturacionData).reduce((acc, curr) => acc + curr, 0);
 
  const filteredOrders = orders.slice().reverse();
 
  // --- Login ---
  if (authState === 'loading') {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md">
          <h2 className="text-2xl font-bold text-amber-500 mb-2 text-center">Panel Mates Josef</h2>
          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs text-center leading-relaxed">
              ⚠️ <strong>Supabase no configurado:</strong><br />
              Para iniciar sesión y gestionar el catálogo en la nube, primero debés configurar <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_KEY</code> en tu archivo <code>.env</code>.
            </div>
          )}
          {authState === 'denied' && (
            <p className="text-red-400 text-xs text-center mb-4">
              Esta cuenta no tiene permisos de administrador.{' '}
              <button type="button" onClick={handleLogout} className="underline">Salir</button>
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Email</label>
              <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} autoComplete="username" required className="w-full px-4 py-3 bg-slate-950 text-white border border-slate-700 rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Contraseña</label>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoComplete="current-password" required className="w-full px-4 py-3 bg-slate-950 text-white border border-slate-700 rounded-lg focus:outline-none" />
            </div>
            {loginError && <p className="text-red-400 text-xs">⚠️ {loginError}</p>}
            <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors">Acceder</button>
          </form>
        </div>
      </div>
    );
  }
 
  // --- Panel ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Panel de Control</h1>
          <p className="text-slate-400 text-sm">Gestión integral de Mates Josef</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExit} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg">Salir del Panel</button>
          <button onClick={handleLogout} className="px-4 py-2 bg-slate-800 hover:bg-red-900/40 text-sm font-medium rounded-lg">Cerrar Sesión</button>
        </div>
      </div>
 
      <div className="mb-8">
        <nav className="flex flex-wrap gap-2" role="tablist">
          {[
            { id: 'metrics', label: 'Métricas' },
            { id: 'orders', label: 'Órdenes Entrantes' },
            { id: 'products', label: 'Catálogo y Stock' },
            { id: 'categories', label: 'Configurar Categorías' },
          ].map((t) => (
            <button
              key={t.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              onClick={() => setActiveTab(t.id)}
              role="tab"
              aria-selected={activeTab === t.id}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
 
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-1">Caja Total Acumulada</h3>
              <p className="text-4xl font-black text-emerald-400">${totalFacturado.toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-1">Pedidos Totales</h3>
              <p className="text-4xl font-black text-white">{orders.length}</p>
            </div>
          </div>
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-base font-bold text-white mb-4">📈 Facturación por Categoría</h3>
            <div className="space-y-4">
              {Object.entries(facturacionData).length === 0 && <p className="text-sm text-slate-500 italic">No hay datos de facturación.</p>}
              {Object.entries(facturacionData).sort(([, a], [, b]) => b - a).map(([cat, monto]) => {
                const porc = totalFacturado > 0 ? (monto / totalFacturado) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{cat}</span>
                      <span className="text-slate-400 font-mono">${monto.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${porc}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
 
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-6">📋 Órdenes de Compra Entrantes ({orders.length})</h3>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-3">
            {filteredOrders.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-6">No hay órdenes pendientes. ¡Todo tranquilo!</p>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-md flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-white mb-1">
                      {order.id} <span className="text-slate-500 text-xs">· {order.fecha}</span>
                    </p>
                    <p className="text-sm text-slate-400">
                      Cliente: <span className="font-medium text-white">{order.nombre} {order.apellido}</span> — DNI {order.dni} — Tel: {order.telefono}
                    </p>
                    <p className="text-sm text-slate-400">
                      {order.entrega === 'envio'
                        ? `🚚 Envío: ${order.calle} ${order.numero}${order.piso ? ', ' + order.piso : ''}, ${order.localidad} (CP ${order.cp}), ${order.provincia}${order.gps ? ' — GPS verificado ✅' : ''}`
                        : '🏬 Retiro en el local'}
                    </p>
                    {order.referencia && <p className="text-sm text-slate-400">Referencia: <span className="italic">{order.referencia}</span></p>}
                    <p className="text-sm text-slate-400 mt-2">Total: <span className="font-bold text-emerald-400">${Number(order.total || 0).toLocaleString('es-AR')}</span></p>
                    <ul className="list-disc list-inside text-sm text-slate-500 mt-3 border-t border-slate-800 pt-3">
                      {(order.items || []).map((item, idx) => (
                        <li key={idx}>{item.quantity}x {item.name} — ${(item.price * item.quantity).toLocaleString('es-AR')}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[180px]">
                    <select
                      value={order.estado || 'Pendiente'}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                    >
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="N° de seguimiento / Encomienda"
                      defaultValue={order.tracking || ''}
                      onBlur={(e) => handleUpdateTracking(order.id, e.target.value)}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                    />
                    <button onClick={() => handleDeleteOrder(order.id)} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                      Dar de Baja / Archivar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
 
      {activeTab === 'products' && (
        <div className="space-y-8">
          {browserCount > 0 && (
            <div className="bg-amber-950/40 border border-amber-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <p className="text-sm text-amber-200">
                Hay {browserCount} productos guardados solo en este navegador. Subilos a la base para que los vea todo el mundo.
              </p>
              <button onClick={handleImport} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-lg">📥 Importar productos</button>
            </div>
          )}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-6">{productForm.id ? '✏️ Editar Producto' : '✨ Agregar Nuevo Producto'}</h3>
            <form onSubmit={handleAddOrUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">Nombre del Producto</label>
                <input type="text" id="name" name="name" value={productForm.name} onChange={handleProductFormChange} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white" required />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-400 mb-1">Precio ($)</label>
                <input type="number" id="price" name="price" value={productForm.price} onChange={handleProductFormChange} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white" required step="0.01" />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-1">Categoría</label>
                <select id="category" name="category" value={productForm.category} onChange={handleProductFormChange} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white" required>
                  <option value="">Seleccione una categoría</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-slate-400 mb-1">Stock Inicial</label>
                <input type="number" id="stock" name="stock" value={productForm.stock} onChange={handleProductFormChange} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white" required />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-1">Descripción</label>
                <textarea id="description" name="description" value={productForm.description} onChange={handleProductFormChange} rows="3" className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Foto del producto</label>
                <div className="flex items-center gap-4">
                  {productForm.image && (
                    <img src={productForm.image} alt="Vista previa" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                  )}
                  <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm text-white rounded-lg cursor-pointer">
                    {uploading ? 'Subiendo…' : productForm.image ? 'Cambiar foto' : 'Subir foto'}
                    <input type="file" accept="image/*" onChange={handleImageFile} disabled={uploading} className="hidden" />
                  </label>
                  {productForm.image && (
                    <button type="button" onClick={() => setProductForm((prev) => ({ ...prev, image: '' }))} className="text-xs text-slate-500 hover:text-red-400">Quitar</button>
                  )}
                </div>
                <input type="text" id="image" name="image" placeholder="…o pegá una URL de imagen (https://...)" value={productForm.image} onChange={handleProductFormChange} className="mt-3 w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="submit" disabled={saving || uploading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors">
                  {saving ? 'Guardando…' : productForm.id ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
                {productForm.id && (
                  <button type="button" onClick={() => setProductForm(EMPTY_FORM)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>
 
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-6">📦 Catálogo de Productos ({products.length})</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
              {products.length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-6">No hay productos en el catálogo.</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl shadow-md flex items-center gap-4">
                    <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                    <div className="flex-1 leading-tight">
                      <p className="text-base font-semibold text-white">{product.name}</p>
                      <p className="text-sm text-slate-400">{product.category} - <span className="font-bold text-emerald-400">${Number(product.price).toLocaleString('es-AR')}</span></p>
                      <p className={`text-sm ${product.stock < 5 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>Stock: {product.stock} unidades</p>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                      <button onClick={() => handleStockChange(product.id, -1)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">-</button>
                      <input type="number" value={product.stock} onChange={(e) => setLocalStock(product.id, e.target.value)} onBlur={(e) => persistStock(product.id, e.target.value)} className="w-16 text-center bg-slate-950 border border-slate-700 rounded-lg text-sm text-white" min="0" />
                      <button onClick={() => handleStockChange(product.id, 1)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">+</button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleEditProduct(product)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors">Editar</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">Eliminar</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
 
      {activeTab === 'categories' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-6">⚙️ Configurar Categorías ({categories.length})</h3>
          <form onSubmit={handleAddCategory} className="flex gap-3 mb-6">
            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nombre de la nueva categoría..." className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white" />
            <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors">Agregar Categoría</button>
          </form>
          <div className="flex flex-wrap gap-3">
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay categorías definidas.</p>
            ) : (
              categories.map((cat) => (
                <div key={cat} className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-full text-sm text-slate-300">
                  <span>{cat}</span>
                  <button type="button" onClick={() => handleDeleteCategory(cat)} className="text-slate-500 hover:text-red-400 font-bold text-lg leading-none p-0">×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
 