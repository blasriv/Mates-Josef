import { useState } from 'react';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import { CartProvider } from './context/CartContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    if (currentPage === 'checkout') return <Checkout setCurrentPage={setCurrentPage} />;
    if (currentPage === 'admin') return <Admin setCurrentPage={setCurrentPage} />;
    return <Home setCurrentPage={setCurrentPage} />;
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="bg-green-700 text-white p-4 shadow flex justify-between items-center">
          <span className="font-bold text-xl cursor-pointer" onClick={() => setCurrentPage('home')}>Mates Josef</span>
          <button onClick={() => setCurrentPage('admin')} className="hover:underline bg-green-800 px-3 py-1 rounded text-sm">Admin</button>
        </nav>
        <main>{renderPage()}</main>
      </div>
    </CartProvider>
  );
}