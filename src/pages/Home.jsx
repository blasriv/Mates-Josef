import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { fetchProducts } from '../lib/store';
import Hero from '../components/Hero';
import Reveal from '../components/Reveal';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';

export default function Home({ setCurrentPage }) {
  const { cart, addToCart, removeOne } = useCart();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (err) {
      console.warn('Catálogo local o base no conectada todavía:', err.message || err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadProducts();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const showToast = (name) => {
    setToastMsg(`¡${name} agregado al carrito! 🧉`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    addToCart(product);
    showToast(product.name);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const goToCheckout = () => {
    setIsSidebarOpen(false);
    setSelectedProductModal(null);
    setCurrentPage('checkout');
  };

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C241E]">
      
      {/* Toast flotante al agregar al carrito */}
      {toastMsg && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 bg-[#16202A] text-[#FAF7F2] border border-[#8B5E3C] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="text-xl">🧉</span>
          <span className="text-xs font-bold tracking-wide">{toastMsg}</span>
        </div>
      )}

      {/* Portada Hero Mates Josef */}
      <Hero cartCount={cartCount} onCartClick={() => setIsSidebarOpen(true)} />

      {/* Sección Catálogo */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        
        {/* Encabezado del catálogo */}
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C]">
              Colección Seleccionada
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#16202A] mt-2">
              Nuestro Catálogo
            </h2>
            <p className="text-sm text-[#6B5E51] mt-2">
              Explorá nuestros mates artesanales, equipos materos y accesorios de primera línea.
            </p>
          </div>
        </Reveal>

        {/* Filtros de Categorías */}
        <Reveal delay={80}>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {['Todos', ...DEFAULT_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#8B5E3C] text-white shadow-md scale-105'
                    : 'bg-white text-[#5C5042] border border-[#E5DCCD] hover:bg-[#F2ECE1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Grilla de productos con carga suave / Skeleton para evitar saltos bruscos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl border border-[#E5DCCD] p-4 shadow-sm animate-pulse space-y-4"
              >
                <div className="h-56 bg-[#F2ECE1] rounded-xl flex items-center justify-center text-3xl opacity-50">
                  🧉
                </div>
                <div className="h-4 bg-[#F2ECE1] rounded w-3/4"></div>
                <div className="h-3 bg-[#F2ECE1] rounded w-1/2"></div>
                <div className="pt-3 border-t border-[#F2ECE1] flex justify-between items-center">
                  <div className="h-6 bg-[#F2ECE1] rounded w-20"></div>
                  <div className="h-8 bg-[#F2ECE1] rounded-xl w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <Reveal 
                key={product.id || index} 
                delay={(index % 4) * 80} 
                className="h-full"
              >
                {/* 
                  Tarjeta con efecto flotante y expansivo:
                  - En PC: al pasar el cursor flota, se eleva suavemente y se expande.
                  - En Celular: al cliquear/tocar se expande con feedback táctil inmediato.
                */}
                <div 
                  onClick={() => setSelectedProductModal(product)}
                  className="product-card bg-white rounded-2xl shadow-sm border border-[#E5DCCD] overflow-hidden flex flex-col h-full cursor-pointer group select-none relative"
                >
                  <div className="relative h-56 bg-[#F2ECE1] overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-4xl text-[#B8AF9F]">🧉</span>
                    )}

                    {product.category && (
                      <span className="absolute top-3 left-3 bg-[#16202A]/85 text-[#FDFBF7] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-xs">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-[#16202A] line-clamp-2 leading-snug group-hover:text-[#8B5E3C] transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-[#6B5E51] mt-1.5 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#F2ECE1] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C7E6E] block">Precio</span>
                        <span className="text-lg font-black text-[#8B5E3C]">
                          ${Number(product.price).toLocaleString('es-AR')}
                        </span>
                      </div>

                      {product.stock > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(product, e)}
                          className="bg-[#16202A] hover:bg-[#8B5E3C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <span>+</span> Añadir
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-[#A89C8F] bg-[#F2ECE1] px-3 py-1.5 rounded-lg">
                          Sin Stock
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          /* Estado sin productos ficticios */
          <Reveal delay={100}>
            <div className="max-w-xl mx-auto my-8 bg-white border border-[#E5DCCD] rounded-3xl p-8 sm:p-12 text-center shadow-sm product-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F4EBE1] flex items-center justify-center text-3xl">
                🧉
              </div>
              <h3 className="font-serif font-black text-2xl text-[#16202A] mb-2">
                Próximamente Nuevo Catálogo
              </h3>
              <p className="text-sm text-[#6B5E51] leading-relaxed mb-6">
                Estamos preparando las fotografías y el inventario oficial de mates, termos, bombillas y combos.
                Podés hacernos tu consulta de modelos disponibles y stock directamente por WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <a
                  href="https://wa.link/tbfplb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#9C6D47] text-white font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <span>💬</span> Consultar Disponibilidad
                </a>
                <a
                  href="https://www.instagram.com/mates_josef/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F2ECE1] hover:bg-[#E8DFD1] text-[#2C241E] font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                >
                  <span>📸</span> Ver Novedades en Instagram
                </a>
              </div>
            </div>
          </Reveal>
        )}
      </section>

      {/* Modal expansivo de detalle de producto al clickear */}
      {selectedProductModal && (
        <div 
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E5DCCD] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300"
          >
            <div className="relative h-64 bg-[#F2ECE1] flex items-center justify-center overflow-hidden">
              {selectedProductModal.image ? (
                <img 
                  src={selectedProductModal.image} 
                  alt={selectedProductModal.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">🧉</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-3 right-3 bg-[#16202A]/80 hover:bg-[#16202A] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                aria-label="Cerrar vista previa"
              >
                ✕
              </button>

              {selectedProductModal.category && (
                <span className="absolute bottom-3 left-3 bg-[#16202A]/90 text-[#FDFBF7] text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                  {selectedProductModal.category}
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-serif font-black text-2xl text-[#16202A]">
                  {selectedProductModal.name}
                </h3>
                <span className="text-2xl font-black text-[#8B5E3C] block mt-1">
                  ${Number(selectedProductModal.price).toLocaleString('es-AR')}
                </span>
              </div>

              {selectedProductModal.description && (
                <p className="text-xs text-[#6B5E51] leading-relaxed">
                  {selectedProductModal.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {selectedProductModal.stock > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleAddToCart(selectedProductModal, e);
                      setSelectedProductModal(null);
                    }}
                    className="w-full py-3 bg-[#8B5E3C] hover:bg-[#9C6D47] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🛒</span> Añadir al Carrito
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 bg-[#F2ECE1] text-[#A89C8F] rounded-xl font-bold text-xs uppercase cursor-not-allowed"
                  >
                    Sin Stock
                  </button>
                )}

                <a
                  href={`https://wa.me/5492975084543?text=${encodeURIComponent(`¡Hola Mates Josef! 🧉 Me interesa consultar sobre: ${selectedProductModal.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#16202A] hover:bg-[#243342] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 text-center"
                >
                  <span>💬</span> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Lateral del Carrito */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        />

        <div
          className={`absolute top-0 right-0 w-full sm:w-96 bg-[#FAF7F2] h-full shadow-2xl z-10 transform transition-transform duration-300 flex flex-col border-l border-[#E5DCCD] ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6 border-b border-[#E5DCCD] flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧉</span>
              <h3 className="font-serif font-bold text-xl text-[#16202A]">Tu Carrito</h3>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-[#8C7E6E] hover:text-[#16202A] p-2 text-xl leading-none transition-colors cursor-pointer"
              aria-label="Cerrar carrito"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-2 opacity-60">🛒</span>
                <p className="text-sm font-semibold text-[#16202A]">El carrito está vacío</p>
                <p className="text-xs text-[#8C7E6E] mt-1">Sumá productos del catálogo para armar tu pedido.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E5DCCD] shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-[#F2ECE1] overflow-hidden shrink-0 flex items-center justify-center text-xl">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        '🧉'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#16202A] truncate">{item.name}</p>
                      <p className="text-xs font-semibold text-[#8B5E3C] mt-0.5">
                        ${Number(item.price).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => removeOne(item.id)}
                      className="w-7 h-7 rounded-lg bg-[#F2ECE1] hover:bg-[#E5DCCD] text-[#2C241E] font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 rounded-lg bg-[#F2ECE1] hover:bg-[#E5DCCD] text-[#2C241E] font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t border-[#E5DCCD] bg-white space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold text-[#6B5E51]">Total productos</span>
                <span className="font-serif font-black text-2xl text-[#8B5E3C]">
                  ${cartTotal.toLocaleString('es-AR')}
                </span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] leading-snug">
                * Costo de envío aparte, coordinado directamente por WhatsApp.
              </p>
              <button
                type="button"
                onClick={goToCheckout}
                className="w-full bg-[#8B5E3C] hover:bg-[#9C6D47] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Iniciar Pedido</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
