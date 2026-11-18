import React from 'react';
import logo from '../assets/logo.png';
import Reveal from './Reveal';

export default function Hero({ cartCount = 0, onCartClick }) {
  const goToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#141E28] via-[#1A2634] to-[#16202A] text-[#FDFBF7] py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#36495A]">
      
      {/* Fondo HD elegante en azul noche con resplandor cálido matero */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#D4A373_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-[#8B5E3C]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-7">
        
        {/* Logo oficial Mates Josef en alta resolución con fondo claro para máximo contraste */}
        <Reveal delay={60} className="flex flex-col items-center justify-center">
          <div className="relative group">
            {/* Halo dorado sutil */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#E5C39E] via-[#FAF7F2] to-[#8B5E3C] rounded-3xl blur-sm opacity-40 group-hover:opacity-70 transition duration-300" />
            
            {/* Contenedor claro para que el logo azul marino se vea nítido y perfecto */}
            <div className="relative bg-[#FAF7F2] p-4 sm:p-5 md:p-6 rounded-3xl shadow-xl border border-[#E5DCCD] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <img 
                src={logo} 
                alt="Mates Josef" 
                className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full bg-[#1A2530] border border-[#36495A] text-[#E5C39E] text-xs font-semibold tracking-wide">
            <span>🧉</span>
            <span>Tienda Oficial · Mates Josef</span>
          </div>
        </Reveal>

        {/* Título Principal */}
        <Reveal delay={120} className="space-y-3">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-[#FAF7F2] leading-tight">
            El ritual del mate, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5C39E] via-[#F4E2CD] to-[#D4A373]">
              en su máxima expresión.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#D0C7B8] font-normal leading-relaxed">
            Mates artesanales, termos de alta durabilidad, bombillas de alpaca, yerbas y accesorios seleccionados para acompañar tus mejores momentos.
          </p>
        </Reveal>

        {/* Botones de acción */}
        <Reveal delay={180} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={goToCatalog}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-[#8B5E3C] hover:bg-[#9C6D47] text-[#FAF7F2] transition-all duration-200 shadow-lg shadow-[#8B5E3C]/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            Ver Catálogo <span>↓</span>
          </button>

          <a
            href="https://wa.link/tbfplb"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-[#243342] hover:bg-[#2D4052] text-[#FAF7F2] border border-[#3E5266] transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>💬</span> Consultanos por WhatsApp
          </a>

          <a
            href="https://www.instagram.com/mates_josef/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm tracking-wide bg-transparent hover:bg-white/5 text-[#E5C39E] border border-[#8B5E3C]/40 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>📸</span> @mates_josef
          </a>
        </Reveal>

        {/* Pilares del negocio */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto border-t border-[#36495A]/60">
          <Reveal delay={240} className="h-full">
            <div className="p-4 rounded-xl bg-[#1A2530]/60 border border-[#36495A]/40 text-left h-full transition-all duration-300 hover:border-[#8B5E3C] hover:-translate-y-1">
              <span className="text-xl block mb-1">✨</span>
              <h2 className="text-sm font-bold text-[#FDFBF7]">Calidad Artesanal</h2>
              <p className="text-xs text-[#B8AF9F] mt-0.5">Mates seleccionados uno a uno con terminaciones cuidadas.</p>
            </div>
          </Reveal>

          <Reveal delay={300} className="h-full">
            <div className="p-4 rounded-xl bg-[#1A2530]/60 border border-[#36495A]/40 text-left h-full transition-all duration-300 hover:border-[#8B5E3C] hover:-translate-y-1">
              <span className="text-xl block mb-1">📦</span>
              <h2 className="text-sm font-bold text-[#FDFBF7]">Envíos y Entregas</h2>
              <p className="text-xs text-[#B8AF9F] mt-0.5">Coordinación personalizada por WhatsApp en cada compra.</p>
            </div>
          </Reveal>

          <Reveal delay={360} className="h-full">
            <div className="p-4 rounded-xl bg-[#1A2530]/60 border border-[#36495A]/40 text-left h-full transition-all duration-300 hover:border-[#8B5E3C] hover:-translate-y-1">
              <span className="text-xl block mb-1">🤝</span>
              <h2 className="text-sm font-bold text-[#FDFBF7]">Atención Directa</h2>
              <p className="text-xs text-[#B8AF9F] mt-0.5">Asesoramiento a medida para elegir tu equipo matero ideal.</p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Botón flotante de carrito */}
      <button
        type="button"
        onClick={onCartClick}
        className="fixed right-6 bottom-6 z-40 bg-[#8B5E3C] hover:bg-[#9C6D47] text-[#FAF7F2] p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center border border-[#E5C39E]/40 cursor-pointer"
        aria-label="Ver carrito"
      >
        <span className="text-2xl">🛒</span>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-[#14213D] text-[#FAF7F2] font-black text-xs rounded-full flex items-center justify-center border-2 border-[#FAF7F2] animate-bounce">
            {cartCount}
          </span>
        )}
      </button>
    </section>
  );
}
