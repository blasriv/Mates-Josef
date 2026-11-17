import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import { CartProvider } from './context/CartContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Detecta si el administrador escribe /admin o toca un acceso directo
  // (también reacciona si escribís #admin con la página ya abierta)
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

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        {/* Navbar Premium Ocultando el botón público */}
        <nav className="bg-gradient-to-r from-green-800 to-emerald-900 text-white p-4 shadow-lg flex justify-between items-center px-6">
          <span className="font-black text-2xl tracking-tight cursor-pointer" onClick={() => { window.location.hash = ''; setCurrentPage('home'); }}>
            Regener<span className="text-emerald-400">AR</span>
          </span>
          <div className="space-x-4">
            <button onClick={() => { window.location.hash = ''; setCurrentPage('home'); }} className="text-sm font-semibold hover:text-emerald-300 transition-colors">Inicio</button>
          </div>
        </nav>
        
        <main>
          {renderPage()}
        </main>
      </div>
    </CartProvider>
  );
}
