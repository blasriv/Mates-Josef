import React, { useState, useEffect } from 'react';
import { createOrder } from '../lib/store';
import { useCart } from '../context/CartContext';
 
const WHATSAPP_NUMBER = '5492236922547';
 
export default function Checkout({ setCurrentPage }) {
  const { cart, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState('');
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', telefono: '', dni: '',
    entrega: 'retiro',
    provincia: '', localidad: '', cp: '', calle: '', numero: '', piso: '', referencia: ''
  });
 
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
 
  const getCartTotal = () => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };
 
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
 
  // Editar la dirección a mano después de verificarla por GPS invalida esa verificación
  const handleAddressChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setGpsVerified(false);
  };
 
  const handleVerifyGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalización. Cargá la dirección manualmente.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          setFormData((prev) => ({
            ...prev,
            calle: addr.road || prev.calle,
            numero: addr.house_number || prev.numero,
            localidad: addr.city || addr.town || addr.village || addr.municipality || prev.localidad,
            provincia: addr.state || prev.provincia,
            cp: addr.postcode || prev.cp,
          }));
          setGpsCoords({ lat: latitude, lng: longitude });
          setGpsVerified(true);
        } catch (err) {
          setGpsError('No pudimos verificar la dirección automáticamente. Revisá los datos cargados a mano.');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsError('No pudimos acceder a tu ubicación. Revisá los permisos de geolocalización del navegador.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
 
  const buildDireccionTexto = () => {
    if (formData.entrega === 'retiro') {
      return 'Retiro en Local (Calle 17 783, entre 22 y 24, Balcarce, Buenos Aires)';
    }
    const piso = formData.piso ? `, Piso/Depto ${formData.piso}` : '';
    const ref = formData.referencia ? ` — Ref: ${formData.referencia}` : '';
    return `Envío a Domicilio (Andreani): ${formData.calle} ${formData.numero}${piso}, ${formData.localidad} (CP ${formData.cp}), ${formData.provincia}${ref}`;
  };
 
  const buildMensaje = (id) => {
    const detalleText = cart.map(i => `- ${i.name} (x${i.quantity}) — $${(i.price * i.quantity).toLocaleString('es-AR')}`).join('\n');
    const gpsLinea = formData.entrega === 'envio'
      ? `\nUbicación GPS: ${gpsVerified && gpsCoords ? `verificada ✅ (${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)})` : 'no verificada (dirección cargada manualmente)'}`
      : '';
    return `¡Hola RegenerAR! 🌾\nPedido: ${id}\nCliente: ${formData.nombre} ${formData.apellido} (DNI: ${formData.dni})\nTeléfono: ${formData.telefono}\nEntrega: ${buildDireccionTexto()}${gpsLinea}\n\nDetalle del pedido:\n${detalleText}\n\nTotal productos: $${getCartTotal().toLocaleString('es-AR')}\n(El costo de envío se cotiza por WhatsApp con las tarifas vigentes de Andreani.)`;
  };
 
  const isStep2Valid = () => {
    if (!formData.nombre || !formData.apellido || !formData.telefono || !formData.dni) return false;
    if (formData.entrega === 'envio') {
      return formData.provincia && formData.localidad && formData.cp && formData.calle && formData.numero;
    }
    return true;
  };
 
  const handleNext = (e) => {
    e.preventDefault();
    if (step === 2 && !isStep2Valid()) return;
    if (step === 2 && !orderId) {
      setOrderId('REGEN-' + Math.floor(100000 + Math.random() * 900000));
    }
    setStep(step + 1);
  };
 
  const handleConfirm = async () => {
    const id = orderId || ('REGEN-' + Math.floor(100000 + Math.random() * 900000));
    const orderData = {
      id,
      ...formData,
      items: cart,
      total: getCartTotal(),
      fecha: new Date().toLocaleDateString('es-AR'),
      estado: 'Pendiente',
      tracking: '',
      gps: formData.entrega === 'envio' && gpsVerified ? gpsCoords : null
    };
 
    // Se guarda en la base para que llegue al panel admin; si falla, igual sigue por WhatsApp.
    try {
      await createOrder(orderData);
    } catch (err) {
      console.error('No se pudo guardar la orden en la base:', err);
    }
 
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMensaje(id))}`, '_blank');
    clearCart();
    setCurrentPage('home');
  };
 
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-950 text-stone-100">
        <div className="p-12 text-center max-w-md mx-auto">
          <p className="text-stone-400 mb-4">El carrito está vacío</p>
          <button onClick={() => setCurrentPage('home')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl transition-all">Volver a la Tienda</button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-12 px-4">
      <div className="max-w-xl mx-auto bg-stone-900/60 rounded-2xl shadow-2xl border border-stone-800 p-8">
        <div className="flex justify-between mb-8 text-xs font-black tracking-widest uppercase text-stone-600">
          <span className={step >= 1 ? "text-amber-500" : ""}>1. Entrega</span>
          <span className={step >= 2 ? "text-amber-500" : ""}>2. Tus Datos</span>
          <span className={step >= 3 ? "text-amber-500" : ""}>3. Confirmar</span>
        </div>
 
        {/* PASO 1: MÉTODO DE ENTREGA */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-serif font-black text-xl text-white mb-2">¿Cómo querés recibir tu pedido?</h3>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, entrega: 'retiro' })}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${formData.entrega === 'retiro' ? 'border-amber-600 bg-amber-950/30' : 'border-stone-800 bg-stone-950 hover:border-stone-700'}`}
            >
              <p className="font-bold text-white">🏬 Retiro en el Local</p>
              <p className="text-xs text-stone-400 mt-1">Calle 17 783, Balcarce — Sin costo adicional</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, entrega: 'envio' })}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${formData.entrega === 'envio' ? 'border-amber-600 bg-amber-950/30' : 'border-stone-800 bg-stone-950 hover:border-stone-700'}`}
            >
              <p className="font-bold text-white">🚚 Envío a Domicilio (Andreani)</p>
              <p className="text-xs text-stone-400 mt-1">A todo el país, donde llegue Andreani</p>
            </button>
            <button onClick={handleNext} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-xl transition-all uppercase tracking-widest text-sm mt-4">
              Continuar
            </button>
          </div>
        )}
 
        {/* PASO 2: DATOS */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-5">
            <div className="space-y-3">
              <h3 className="font-serif font-black text-lg text-white">Tus datos de contacto</h3>
              <input type="text" name="nombre" value={formData.nombre} placeholder="Nombre" required onChange={handleChange} className="w-full p-3 bg-stone-950 border border-stone-800 text-stone-100 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none transition-all placeholder:text-stone-600"/>
              <input type="text" name="apellido" value={formData.apellido} placeholder="Apellido" required onChange={handleChange} className="w-full p-3 bg-stone-950 border border-stone-800 text-stone-100 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none transition-all placeholder:text-stone-600"/>
              <input type="text" name="telefono" value={formData.telefono} placeholder="Teléfono" required onChange={handleChange} className="w-full p-3 bg-stone-950 border border-stone-800 text-stone-100 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none transition-all placeholder:text-stone-600"/>
              <input type="text" name="dni" value={formData.dni} placeholder="DNI / CUIL (Requerido para Envío)" required onChange={handleChange} className="w-full p-3 bg-stone-950 border border-stone-800 text-stone-100 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none transition-all placeholder:text-stone-600"/>
            </div>
 
            {formData.entrega === 'retiro' ? (
              <p className="text-sm bg-stone-950 p-3 rounded-xl border border-stone-800 text-stone-400">📍 Dirección de retiro: <strong className="text-stone-200">Calle 17 783, entre 22 y 24, Balcarce, Buenos Aires.</strong></p>
            ) : (
              <div className="space-y-3 p-4 bg-stone-950 rounded-2xl border border-stone-800">
                <p className="text-xs text-amber-400 bg-amber-950/30 p-2.5 rounded-lg font-semibold border border-amber-900/50">⚠️ El costo de envío se cotizará por WhatsApp con las tarifas vigentes de Andreani.</p>
 
                <button
                  type="button"
                  onClick={handleVerifyGPS}
                  disabled={gpsLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    gpsVerified ? 'bg-emerald-700 text-white' : 'bg-stone-800 hover:bg-amber-700 text-stone-200 hover:text-white'
                  } disabled:opacity-60`}
                >
                  {gpsLoading ? 'Buscando ubicación…' : gpsVerified ? '✅ Dirección verificada por GPS' : '📍 Verificar dirección con GPS'}
                </button>
                {gpsError && <p className="text-xs text-red-400">{gpsError}</p>}
                <p className="text-[11px] text-stone-500">Usá el GPS para autocompletar y verificar tu dirección con precisión, o cargá los datos manualmente abajo.</p>
 
                <input type="text" name="provincia" value={formData.provincia} placeholder="Provincia" required onChange={handleAddressChange} className="w-full p-2.5 bg-stone-900 border border-stone-800 text-stone-100 rounded-xl outline-none placeholder:text-stone-600"/>
                <input type="text" name="localidad" value={formData.localidad} placeholder="Localidad" required onChange={handleAddressChange} className="w-full p-2.5 bg-stone-900 border border-stone-800 text-stone-100 rounded-xl outline-none placeholder:text-stone-600"/>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" name="cp" value={formData.cp} placeholder="Código Postal" required onChange={handleAddressChange} className="w-full p-2.5 bg-stone-900 border border-stone-800 text-stone-100 rounded-xl outline-none placeholder:text-stone-600"/>
                  <input type="text" name="numero" value={formData.numero} placeholder="Número" required onChange={handleAddressChange} className="w-full p-2.5 bg-stone-900 border border-stone-800 text-stone-100 rounded-xl outline-none placeholder:text-stone-600"/>
                </div>
                <input type="text" name="calle" value={formData.calle} placeholder="Calle" required onChange={handleAddressChange} className="w-full p-2.5 bg-stone-900 border border-stone-800 text-stone-100 rounded-xl outline-none placeholder:text-stone-600"/>
                <input type="text" name="piso" value={formData.piso} placeholder="Piso / Depto (opcional)" onChange={handleAddressChange} className="w-full p-2.5 bg-stone-900 border border-stone-800 text-stone-100 rounded-xl outline-none placeholder:text-stone-600"/>
                <input type="text" name="referencia" value={formData.referencia} placeholder="Referencia (opcional)" onChange={handleAddressChange} className="w-full p-2.5 bg-stone-900 border border-stone-800 text-stone-100 rounded-xl outline-none placeholder:text-stone-600"/>
              </div>
            )}
 
            <div className="flex justify-between pt-4 border-t border-stone-800">
              <button type="button" onClick={() => setStep(1)} className="bg-stone-800 text-stone-300 px-5 py-2.5 rounded-xl font-medium hover:bg-stone-700 transition-colors">Atrás</button>
              <button type="submit" disabled={!isStep2Valid()} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black px-6 py-2.5 rounded-xl shadow-xl transition-all uppercase tracking-widest text-xs">Continuar</button>
            </div>
          </form>
        )}
 
        {/* PASO 3: CONFIRMACIÓN — resumen bloqueado, no editable */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-5 bg-amber-950/20 border border-amber-900/40 rounded-2xl space-y-3">
              <h3 className="font-bold text-lg text-amber-400 border-b border-amber-900/40 pb-2">Resumen de tu Pedido</h3>
              <div className="flex justify-between items-center text-base">
                <span className="text-stone-400">Total de productos:</span>
                <span className="font-black text-2xl text-white">${getCartTotal().toLocaleString('es-AR')}</span>
              </div>
              <p className="text-xs text-stone-500 pt-2 border-t border-amber-900/30">El costo de envío (si corresponde) y el medio de pago se coordinan directamente por WhatsApp con el vendedor.</p>
            </div>
 
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-2">Mensaje que se enviará por WhatsApp (no editable)</p>
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 text-xs text-stone-300 whitespace-pre-wrap select-none max-h-64 overflow-y-auto font-mono">
                {buildMensaje(orderId)}
              </div>
              <p className="text-[11px] text-stone-600 mt-2">* Una vez que confirmes, WhatsApp se abre con este texto precargado. Por favor no lo modifiques antes de enviarlo — es lo que le permite al vendedor procesar tu pedido correctamente.</p>
            </div>
 
            <div className="flex justify-between pt-4 border-t border-stone-800">
              <button type="button" onClick={() => setStep(2)} className="bg-stone-800 text-stone-300 px-5 py-2.5 rounded-xl font-medium hover:bg-stone-700 transition-colors">Atrás</button>
              <button type="button" onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl shadow-xl transition-all uppercase tracking-widest text-xs">
                ✅ Confirmar y Enviar por WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔔 TOAST NOTIFICATIONS RÚSTICAS */}
      {toast.show && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl border-2 transition-all duration-500 ${
          toast.type === 'success' ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 border-emerald-500/50 text-white' :
          toast.type === 'warning' ? 'bg-gradient-to-r from-amber-800 to-amber-700 border-amber-500/50 text-white' :
          'bg-gradient-to-r from-stone-800 to-stone-700 border-stone-500/50 text-amber-200'
        } animate-in slide-in-from-top fade-in`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
 