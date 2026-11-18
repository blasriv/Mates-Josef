import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import { CartProvider } from './context/CartContext';
import logo from './assets/logo.png';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Detecta si el administrador ingresa vía hash #admin
  useEffect(() => {
    const syncWithHash = () => {
      if (window.location.hash === '#admin') setCurrentPage('admin');
    };
    syncWithHash();
    window.addEventListener('hashchange', syncWithHash);
    return () => window.removeEventListener('hashchange', syncWithHash);
  }, []);

  const renderPage = () => {
    if (currentPage === 'checkout') return <Checkout setCurrentPage={setCurrentPage} />;
    if (currentPage === 'admin') return <Admin setCurrentPage={setCurrentPage} />;
    return <Home setCurrentPage={setCurrentPage} />;
  };

  const navigateToHome = () => {
    window.location.hash = '';
    setCurrentPage('home');
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#FAF7F2] text-[#2C241E] flex flex-col font-sans selection:bg-[#8B5E3C] selection:text-white">
        
        {/* Barra superior de navegación en azul noche oficial */}
        <header className="sticky top-0 z-40 bg-[#16202A]/95 backdrop-blur-md text-[#FDFBF7] border-b border-[#36495A]/80 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
            
            {/* Logo y Nombre de Marca */}
            <div 
              onClick={navigateToHome}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {/* Contenedor claro para que el logo azul marino se vea nítido */}
              <div className="bg-[#FAF7F2] p-1.5 rounded-xl shadow-sm border border-[#E5DCCD] flex items-center justify-center transition-transform group-hover:scale-105">
                <img src={logo} alt="Mates Josef Logo" className="h-10 w-auto object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-black text-2xl tracking-tight text-[#FAF7F2] group-hover:text-[#E5C39E] transition-colors leading-none">
                  Mates Josef
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#B8AF9F] font-semibold mt-1">
                  Tienda Online
                </span>
              </div>
            </div>

            {/* Accesos rápidos y redes */}
            <nav className="flex items-center gap-3 sm:gap-6 text-sm font-semibold">
              <button 
                onClick={navigateToHome} 
                className="text-[#D0C7B8] hover:text-[#FAF7F2] transition-colors hidden sm:inline-block cursor-pointer"
              >
                Inicio
              </button>
              
              <button 
                onClick={() => {
                  if (currentPage !== 'home') {
                    navigateToHome();
                    setTimeout(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  } else {
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }} 
                className="text-[#D0C7B8] hover:text-[#FAF7F2] transition-colors cursor-pointer"
              >
                Catálogo
              </button>

              <a
                href="https://www.instagram.com/mates_josef/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E5C39E] hover:text-white transition-colors flex items-center gap-1.5"
                title="Instagram Mates Josef"
              >
                <span className="text-base">📸</span>
                <span className="hidden md:inline">Instagram</span>
              </a>

              <a
                href="https://wa.link/tbfplb"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#8B5E3C] hover:bg-[#9C6D47] text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
            </nav>
          </div>
        </header>
        
        {/* Contenido principal */}
        <main className="flex-1">
          {renderPage()}
        </main>

        {/* Footer elegante para Mates Josef */}
        <footer className="bg-[#16202A] text-[#B8AF9F] border-t border-[#36495A] py-12 px-4 sm:px-6 lg:px-8 mt-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-[#36495A]/60">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#FAF7F2] p-1.5 rounded-xl shadow-sm border border-[#E5DCCD] inline-flex items-center justify-center">
                  <img src={logo} alt="Mates Josef Logo" className="h-10 w-auto object-contain" />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#FAF7F2]">Mates Josef</h3>
              </div>
              <p className="text-xs text-[#8F9AA6] leading-relaxed max-w-sm">
                Pasión por la tradición y calidad en cada pieza. Mates, termos, bombillas y accesorios pensados para durar.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2] mb-3">Contacto Directo</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="https://wa.link/tbfplb" target="_blank" rel="noopener noreferrer" className="hover:text-[#FAF7F2] transition-colors flex items-center gap-2">
                    <span>💬</span> WhatsApp: 9 2975 08-4543
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/mates_josef/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FAF7F2] transition-colors flex items-center gap-2">
                    <span>📸</span> Instagram: @mates_josef
                  </a>
                </li>
                <li className="text-[#8F9AA6]">
                  <span>📦</span> Envíos y entregas: Consultar por WhatsApp
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2] mb-3">Administración</h4>
              <p className="text-xs text-[#8F9AA6] mb-3">
                Panel exclusivo para gestión de pedidos, stock y catálogo.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#admin';
                  setCurrentPage('admin');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#E5C39E] hover:underline cursor-pointer"
              >
                <span>⚙️</span> Ingresar al Panel
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#6B7885] gap-2">
            <p>© {new Date().getFullYear()} Mates Josef. Todos los derechos reservados.</p>
            <p className="flex items-center gap-1">
              <span>Hecho con dedicación matera</span> <span>🧉</span>
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
