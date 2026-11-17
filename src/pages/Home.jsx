import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { fetchProducts } from '../lib/store';
import Hero from '../components/Hero';
import Reveal from '../components/Reveal';
 
export default function Home({ setCurrentPage }) {
  const { cart, addToCart, removeOne } = useCart();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
 
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Los productos vienen de la base de datos (los mismos para todos los visitantes)
  const loadProducts = async () => {
    try {
      setProducts(await fetchProducts());
      setLoadError(false);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // Si el admin cambió algo mientras la pestaña estaba en segundo plano, se actualiza al volver.
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadProducts();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    setIsSidebarOpen(true);
  };
 
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
 
  const goToCheckout = () => {
    setIsSidebarOpen(false);
    setCurrentPage('checkout');
  };
 
  return (
    <div className="min-h-screen bg-stone-950 text-amber-50">
      {/* --- HERO: campo de Buenos Aires con tractor animado --- */}
      <Hero cartCount={cartCount} onCartClick={() => setIsSidebarOpen(true)} />
 
      {/* --- CATÁLOGO --- */}
      <main id="catalogo" className="container mx-auto px-4 py-14 scroll-mt-4">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-amber-200 mb-10 text-center">
            Nuestro Catálogo
          </h2>
        </Reveal>
 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {loading && (
            <p className="col-span-full text-center text-stone-500 py-12 animate-pulse">Cargando catálogo…</p>
          )}

          {products.map((product, index) => (
            <Reveal key={product.id} delay={(index % 4) * 90} className="h-full">
            <div className="relative h-full bg-stone-900 rounded-2xl shadow-xl overflow-hidden border border-stone-800 group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-2 left-2 bg-stone-950/80 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                  {product.category}
                </span>
              </div>
 
              <div className="relative p-5 pt-4">
                <h3 className="text-base font-bold text-amber-100 mb-1 leading-snug min-h-[2.5rem]">
                  {product.name}
                </h3>
                <p className="text-emerald-400 text-lg font-black mb-3">
                  ${Number(product.price).toLocaleString('es-AR')}
                </p>
 
                {/* Descripción técnica: oculta por defecto, se despliega al hacer hover */}
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 ease-out">
                  <p className="overflow-hidden text-stone-400 text-xs leading-relaxed">
                    {product.description}
                  </p>
                </div>
 
                <div className="mt-3">
                  {product.stock > 0 ? (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <span>➕</span> Añadir
                    </button>
                  ) : (
                    <p className="w-full bg-stone-800 text-stone-500 font-bold py-2.5 px-4 rounded-xl text-center text-sm">
                      Sin Stock
                    </p>
                  )}
                </div>
              </div>
            </div>
            </Reveal>
          ))}
 
          {!loading && products.length === 0 && (
            <p className="col-span-full text-center text-stone-500 italic py-12">
              {loadError ? 'No pudimos cargar el catálogo. Probá recargar la página.' : 'Todavía no hay productos cargados.'}
            </p>
          )}
        </div>
      </main>
 
      {/* --- SIDEBAR DEL CARRITO --- */}
      <div
        className={`fixed top-0 right-0 w-full md:w-96 bg-stone-900 h-full shadow-2xl z-50 transform transition-transform duration-300 border-l border-stone-800
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center border-b border-stone-800 pb-4 mb-4">
            <h3 className="text-xl font-serif font-black text-amber-200">Tu Carrito</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="text-stone-400 hover:text-amber-500 transition-colors text-xl leading-none">
              ✕
            </button>
          </div>
 
          <div className="flex-1 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-stone-500 text-center mt-8 text-sm">El carrito está vacío.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-800">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                      <div>
                        <p className="text-amber-100 font-semibold text-sm leading-tight">{item.name}</p>
                        <p className="text-stone-400 text-xs">${Number(item.price).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeOne(item.id)} className="bg-stone-800 text-white w-7 h-7 rounded-md hover:bg-stone-700 text-sm">−</button>
                      <span className="text-white font-medium text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="bg-stone-800 text-white w-7 h-7 rounded-md hover:bg-stone-700 text-sm">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          <div className="border-t border-stone-800 pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg font-bold text-amber-100">Total:</p>
              <p className="text-lg font-black text-emerald-400">${cartTotal.toLocaleString('es-AR')}</p>
            </div>
            <button
              onClick={goToCheckout}
              disabled={cart.length === 0}
              className={`w-full text-center py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-colors
                ${cart.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}
            >
              Iniciar Compra Segura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 