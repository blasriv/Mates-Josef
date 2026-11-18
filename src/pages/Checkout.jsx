import React, { useState } from 'react';
import { createOrder } from '../lib/store';
import { useCart } from '../context/CartContext';

// WhatsApp oficial de Mates Josef (9 2975 08-4543 -> 5492975084543)
const WHATSAPP_NUMBER = '5492975084543';

export default function Checkout({ setCurrentPage }) {
  const COORDINADA_LOCALIDADES = ['comodoro rivadavia', 'rada tilly'];

  const { cart, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    dni: '',
    entrega: '', // 'coordinar' o 'envio'
    provincia: '',
    localidad: '',
    cp: '',
    calle: '',
    numero: '',
    piso: '',
    referencia: '',
  });

  const [provinciaInput, setProvinciaInput] = useState('');
  const [localidadInput, setLocalidadInput] = useState('');
  const [errors, setErrors] = useState({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);

  const getCartTotal = () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // ---------- Validaciones ----------
  const validateDNI = (dni) => {
    const cleaned = (dni || '').toString().replace(/[ .]/g, '');
    return /^[0-9]{7,8}$/.test(cleaned);
  };

  const validatePhone = (tel) => {
    const cleaned = (tel || '').toString().replace(/[\s()+-]/g, '');
    return /^(?:54)?\d{10,11}$/.test(cleaned);
  };

  const isCoordinadaFull = (prov, loc) => {
    const provNorm = (prov || '').trim().toLowerCase();
    const locNorm = (loc || '').trim().toLowerCase();
    return provNorm === 'chubut' && COORDINADA_LOCALIDADES.includes(locNorm);
  };

  // ---------- Manejo Paso 1 ----------
  const handleStep1Submit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!provinciaInput.trim()) {
      newErrors.provinciaStep1 = 'Ingresá tu provincia (ej: Chubut, Buenos Aires, Santa Cruz, etc.).';
    }
    if (!localidadInput.trim()) {
      newErrors.localidadStep1 = 'Ingresá tu localidad o ciudad (ej: Comodoro Rivadavia, Rada Tilly, etc.).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const entregaTipo = isCoordinadaFull(provinciaInput, localidadInput) ? 'coordinar' : 'envio';

    setFormData((prev) => ({
      ...prev,
      provincia: provinciaInput.trim(),
      localidad: localidadInput.trim(),
      entrega: entregaTipo,
    }));
    setErrors({});
    setStep(2);
  };

  // ---------- Manejo Paso 2 ----------
  const validateStep2Fields = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
    }
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio.';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio.';
    } else if (!validatePhone(formData.telefono)) {
      newErrors.telefono = 'Teléfono inválido. Ingresá 10 u 11 dígitos con código de área (ej: 2975084543).';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI o CUIL es obligatorio.';
    } else if (!validateDNI(formData.dni)) {
      newErrors.dni = 'DNI inválido. Debe contener 7 u 8 dígitos numéricos sin puntos ni espacios (ej: 38123456).';
    }

    if (formData.entrega === 'envio') {
      if (!formData.provincia.trim()) {
        newErrors.provincia = 'La provincia es obligatoria para el envío.';
      }
      if (!formData.localidad.trim()) {
        newErrors.localidad = 'La localidad es obligatoria.';
      }
      if (!formData.calle.trim()) {
        newErrors.calle = 'La calle es obligatoria.';
      }
      if (!formData.numero.trim()) {
        newErrors.numero = 'La altura/número es obligatoria.';
      }
      if (!formData.cp.trim()) {
        newErrors.cp = 'El código postal es obligatorio.';
      }
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error del campo modificado en tiempo real
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGpsVerified(false);

    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    const newErrors = validateStep2Fields();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!orderId) {
      setOrderId('JOSEF-' + Math.floor(100000 + Math.random() * 900000));
    }
    setErrors({});
    setStep(3);
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
        } catch {
          setGpsError('No pudimos verificar la dirección automáticamente. Completá los campos a mano.');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsError('No pudimos acceder a tu ubicación. Verificá los permisos de ubicación de tu navegador.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const buildDireccionTexto = () => {
    if (formData.entrega === 'coordinar') {
      return `Entrega a coordinar en ${formData.localidad}, ${formData.provincia} (Punto a convenir por WhatsApp)`;
    }
    const piso = formData.piso ? `, Piso/Depto: ${formData.piso}` : '';
    const ref = formData.referencia ? ` (Ref: ${formData.referencia})` : '';
    return `Envío a Domicilio: ${formData.calle} ${formData.numero}${piso}, ${formData.localidad} (CP ${formData.cp}), ${formData.provincia}${ref} (Costo de envío aparte a coordinar)`;
  };

  const buildMensaje = (id) => {
    const detalleText = cart
      .map((i) => `• ${i.name} (x${i.quantity}) — $${(i.price * i.quantity).toLocaleString('es-AR')}`)
      .join('\n');
    const gpsLinea =
      formData.entrega === 'envio' && gpsVerified && gpsCoords
        ? `\n📍 GPS: (${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)})`
        : '';
    return `¡Hola Mates Josef! 🧉\nPedido: ${id}\nCliente: ${formData.nombre} ${formData.apellido} (DNI: ${formData.dni})\nTeléfono: ${formData.telefono}\nModalidad: ${formData.entrega === 'coordinar' ? 'Entrega Coordinada' : 'Envío a Domicilio'}\nDirección: ${buildDireccionTexto()}${gpsLinea}\n\nDetalle del pedido:\n${detalleText}\n\nTotal productos: $${getCartTotal().toLocaleString('es-AR')}\n\n⚠️ NOTA: El costo del envío es aparte y se coordina directamente por este chat según la empresa de transporte o mensajería seleccionada.`;
  };

  const handleConfirm = async () => {
    const id = orderId || 'JOSEF-' + Math.floor(100000 + Math.random() * 900000);
    const orderData = {
      id,
      ...formData,
      items: cart,
      total: getCartTotal(),
      fecha: new Date().toLocaleDateString('es-AR'),
      estado: 'Pendiente',
      tracking: '',
      gps: formData.entrega === 'envio' && gpsVerified ? gpsCoords : null,
    };
    try {
      await createOrder(orderData);
    } catch (err) {
      console.warn('Error al crear la orden en Supabase:', err.message || err);
    }
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMensaje(id))}`, '_blank');
    clearCart();
    setCurrentPage('home');
  };

  // ---------- Render Carrito Vacío ----------
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF5EB] text-[#2D1E14] px-4">
        <div className="p-8 sm:p-12 text-center max-w-md mx-auto bg-white rounded-3xl border border-[#E3DAC9] shadow-sm">
          <span className="text-4xl block mb-3">🛒</span>
          <h2 className="text-xl font-serif font-black text-[#24140B] mb-2">El carrito está vacío</h2>
          <p className="text-xs text-[#6B513E] mb-6 leading-relaxed">
            Agregá productos desde nuestro catálogo para iniciar el proceso de compra.
          </p>
          <button
            onClick={() => setCurrentPage('home')}
            className="w-full bg-[#7A4522] hover:bg-[#8F532B] text-white py-3 px-6 rounded-xl font-serif font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Volver a la Tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#2D1E14] py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-[#E3DAC9] p-6 sm:p-10">
        
        {/* Indicador de Pasos */}
        <div className="flex justify-between items-center mb-6 border-b border-[#F2ECE1] pb-4 text-xs font-bold tracking-wider uppercase">
          <span className={step === 1 ? 'text-[#8B5E3C]' : step > 1 ? 'text-[#16202A]' : 'text-[#A89C8F]'}>
            1. Destino
          </span>
          <span className="text-[#D0C7B8]">→</span>
          <span className={step === 2 ? 'text-[#8B5E3C]' : step > 2 ? 'text-[#16202A]' : 'text-[#A89C8F]'}>
            2. Tus Datos
          </span>
          <span className="text-[#D0C7B8]">→</span>
          <span className={step === 3 ? 'text-[#8B5E3C]' : 'text-[#A89C8F]'}>
            3. Confirmación
          </span>
        </div>

        {/* ==================== PASO 1: Destino y Modalidad ==================== */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-5">
            <div>
              <h3 className="font-serif font-black text-2xl text-[#16202A]">¿Dónde querés recibir tu pedido?</h3>
              <p className="text-xs text-[#6B5E51] mt-1">
                Ingresá tu provincia y localidad para asignarte la mejor opción de entrega.
              </p>
            </div>

            {/* Aviso Destacado: Costo de envío aparte */}
            <div className="p-3.5 bg-[#FBF3E8] border border-[#E5C39E] rounded-2xl flex items-start gap-3 text-xs text-[#6B4E31]">
              <span className="text-lg leading-none shrink-0">🚚</span>
              <div>
                <strong className="font-bold text-[#8B5E3C] block mb-0.5">El costo de envío es aparte</strong>
                <span>
                  El total del carrito incluye exclusivamente los productos. Para envíos nacionales o encomiendas, el costo de flete se abona aparte y se coordina de manera transparente por WhatsApp.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Campo Provincia */}
              <div>
                <label className="block text-xs font-bold text-[#16202A] uppercase tracking-wider mb-1">
                  Provincia <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Chubut, Santa Cruz, Río Negro, etc."
                  value={provinciaInput}
                  onChange={(e) => {
                    setProvinciaInput(e.target.value);
                    if (errors.provinciaStep1) {
                      setErrors((prev) => ({ ...prev, provinciaStep1: '' }));
                    }
                  }}
                  className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm transition-all ${
                    errors.provinciaStep1 
                      ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400' 
                      : 'border-[#E5DCCD] focus:border-[#8B5E3C]'
                  }`}
                />
                {errors.provinciaStep1 && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <span>⚠️</span> {errors.provinciaStep1}
                  </p>
                )}
              </div>

              {/* Campo Localidad */}
              <div>
                <label className="block text-xs font-bold text-[#16202A] uppercase tracking-wider mb-1">
                  Localidad / Ciudad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Comodoro Rivadavia, Rada Tilly, etc."
                  value={localidadInput}
                  onChange={(e) => {
                    setLocalidadInput(e.target.value);
                    if (errors.localidadStep1) {
                      setErrors((prev) => ({ ...prev, localidadStep1: '' }));
                    }
                  }}
                  className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm transition-all ${
                    errors.localidadStep1 
                      ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400' 
                      : 'border-[#E5DCCD] focus:border-[#8B5E3C]'
                  }`}
                />
                {errors.localidadStep1 && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <span>⚠️</span> {errors.localidadStep1}
                  </p>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#8B5E3C] hover:bg-[#9C6D47] text-white py-3 rounded-xl font-bold shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>Continuar</span>
              <span>→</span>
            </button>
          </form>
        )}

        {/* ==================== PASO 2: Datos de Contacto y Envío ==================== */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4EBE1] rounded-lg text-xs font-bold text-[#8B5E3C] mb-2">
                <span>{formData.entrega === 'coordinar' ? '🤝 Entrega Coordinada' : '📦 Envío a Domicilio'}</span>
                <span>·</span>
                <span>{formData.localidad}, {formData.provincia}</span>
              </div>
              <h3 className="font-serif font-black text-2xl text-[#16202A]">Tus datos de contacto</h3>
              <p className="text-xs text-[#6B5E51] mt-1">
                Completá los datos requeridos. En caso de error, se indicará el motivo específico debajo del campo.
              </p>
            </div>

            {/* AVISO CLARO: Costo de envío aparte */}
            <div className="p-3 bg-[#FBF3E8] border border-[#E5C39E] rounded-xl text-xs text-[#6B4E31] flex items-start gap-2.5">
              <span className="text-base shrink-0">ℹ️</span>
              <div>
                <strong>Aclaración sobre el costo de entrega:</strong> El costo de envío no está incluido en este pedido; se cotiza y coordina directamente por WhatsApp de forma transparente según el destino.
              </div>
            </div>

            <div className="space-y-3">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#16202A] uppercase tracking-wider mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    placeholder="Ej: Juan"
                    onChange={handleChange}
                    className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                      errors.nombre ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400' : 'border-[#E5DCCD] focus:border-[#8B5E3C]'
                    }`}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-600 mt-1 font-medium">⚠️ {errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#16202A] uppercase tracking-wider mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    placeholder="Ej: Pérez"
                    onChange={handleChange}
                    className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                      errors.apellido ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400' : 'border-[#E5DCCD] focus:border-[#8B5E3C]'
                    }`}
                  />
                  {errors.apellido && (
                    <p className="text-xs text-red-600 mt-1 font-medium">⚠️ {errors.apellido}</p>
                  )}
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-[11px] font-bold text-[#16202A] uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  placeholder="Ej: 2975084543 (con código de área, sin 0 ni 15)"
                  onChange={handleChange}
                  className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                    errors.telefono ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400' : 'border-[#E5DCCD] focus:border-[#8B5E3C]'
                  }`}
                />
                {errors.telefono ? (
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠️ {errors.telefono}</p>
                ) : (
                  <p className="text-[11px] text-[#8C7E6E] mt-1">10 u 11 dígitos, sin 0 ni 15.</p>
                )}
              </div>

              {/* DNI */}
              <div>
                <label className="block text-[11px] font-bold text-[#16202A] uppercase tracking-wider mb-1">
                  DNI / CUIL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  placeholder="Ej: 38123456 (7 u 8 números sin puntos)"
                  onChange={handleChange}
                  className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                    errors.dni ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400' : 'border-[#E5DCCD] focus:border-[#8B5E3C]'
                  }`}
                />
                {errors.dni ? (
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠️ {errors.dni}</p>
                ) : (
                  <p className="text-[11px] text-[#8C7E6E] mt-1">Solo números, entre 7 y 8 dígitos.</p>
                )}
              </div>
            </div>

            {/* Campos de Domicilio para Envíos */}
            {formData.entrega === 'envio' && (
              <div className="space-y-3 pt-3 border-t border-[#F2ECE1]">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#16202A]">Dirección de Destino</h4>
                  <span className="text-[11px] text-[#8B5E3C] font-semibold">Envío a domicilio</span>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyGPS}
                  disabled={gpsLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    gpsVerified 
                      ? 'bg-[#16202A] text-white' 
                      : 'bg-[#F2ECE1] hover:bg-[#E5DCCD] text-[#2C241E]'
                  }`}
                >
                  {gpsLoading ? 'Obteniendo ubicación…' : gpsVerified ? '✅ Dirección completada por GPS' : '📍 Autocompletar con GPS (Opcional)'}
                </button>
                {gpsError && <p className="text-xs text-red-600 font-medium">{gpsError}</p>}

                {/* Provincia y Localidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#16202A] uppercase mb-1">Provincia *</label>
                    <input
                      type="text"
                      name="provincia"
                      value={formData.provincia}
                      placeholder="Provincia"
                      onChange={handleAddressChange}
                      className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                        errors.provincia ? 'border-red-500 ring-1 ring-red-400' : 'border-[#E5DCCD]'
                      }`}
                    />
                    {errors.provincia && <p className="text-xs text-red-600 mt-1">⚠️ {errors.provincia}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#16202A] uppercase mb-1">Localidad *</label>
                    <input
                      type="text"
                      name="localidad"
                      value={formData.localidad}
                      placeholder="Localidad"
                      onChange={handleAddressChange}
                      className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                        errors.localidad ? 'border-red-500 ring-1 ring-red-400' : 'border-[#E5DCCD]'
                      }`}
                    />
                    {errors.localidad && <p className="text-xs text-red-600 mt-1">⚠️ {errors.localidad}</p>}
                  </div>
                </div>

                {/* Calle y Número */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-[#16202A] uppercase mb-1">Calle *</label>
                    <input
                      type="text"
                      name="calle"
                      value={formData.calle}
                      placeholder="Ej: Av. San Martín"
                      onChange={handleAddressChange}
                      className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                        errors.calle ? 'border-red-500 ring-1 ring-red-400' : 'border-[#E5DCCD]'
                      }`}
                    />
                    {errors.calle && <p className="text-xs text-red-600 mt-1">⚠️ {errors.calle}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#16202A] uppercase mb-1">Número *</label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      placeholder="Ej: 1234"
                      onChange={handleAddressChange}
                      className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                        errors.numero ? 'border-red-500 ring-1 ring-red-400' : 'border-[#E5DCCD]'
                      }`}
                    />
                    {errors.numero && <p className="text-xs text-red-600 mt-1">⚠️ {errors.numero}</p>}
                  </div>
                </div>

                {/* Piso/Depto y CP */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#16202A] uppercase mb-1">Piso / Depto</label>
                    <input
                      type="text"
                      name="piso"
                      value={formData.piso}
                      placeholder="Opcional (ej: 2 B)"
                      onChange={handleAddressChange}
                      className="w-full p-3 bg-[#FAF7F2] border border-[#E5DCCD] rounded-xl outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#16202A] uppercase mb-1">Código Postal *</label>
                    <input
                      type="text"
                      name="cp"
                      value={formData.cp}
                      placeholder="Ej: 9000"
                      onChange={handleAddressChange}
                      className={`w-full p-3 bg-[#FAF7F2] border rounded-xl outline-none text-sm ${
                        errors.cp ? 'border-red-500 ring-1 ring-red-400' : 'border-[#E5DCCD]'
                      }`}
                    />
                    {errors.cp && <p className="text-xs text-red-600 mt-1">⚠️ {errors.cp}</p>}
                  </div>
                </div>

                {/* Referencia */}
                <div>
                  <label className="block text-[11px] font-bold text-[#16202A] uppercase mb-1">Indicaciones / Referencia</label>
                  <input
                    type="text"
                    name="referencia"
                    value={formData.referencia}
                    placeholder="Ej: Portón verde, entre calle A y B"
                    onChange={handleAddressChange}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E5DCCD] rounded-xl outline-none text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[#F2ECE1]">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#6B5E51] hover:text-[#16202A] transition-colors"
              >
                ← Modificar Destino
              </button>
              <button 
                type="submit" 
                className="bg-[#8B5E3C] hover:bg-[#9C6D47] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>Continuar al Resumen</span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}

        {/* ==================== PASO 3: Resumen y Confirmación ==================== */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-serif font-black text-2xl text-[#16202A]">Resumen del Pedido</h3>
              <p className="text-xs text-[#6B5E51] mt-1">Revisá tu compra antes de confirmar por WhatsApp.</p>
            </div>

            {/* Desglose de Totales y Aclaración de Envío */}
            <div className="p-5 bg-[#FAF7F2] border border-[#E5DCCD] rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B5E51]">Subtotal productos:</span>
                <span className="font-bold text-[#16202A]">${getCartTotal().toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center text-sm py-2 border-y border-[#E5DCCD]">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📦</span>
                  <span className="text-[#6B5E51]">Costo de envío:</span>
                </div>
                <span className="font-bold text-[#8B5E3C] text-xs bg-[#FBF3E8] px-2.5 py-1 rounded-md border border-[#E5C39E]">
                  Aparte (a coordinar por WhatsApp)
                </span>
              </div>

              <div className="flex justify-between items-center text-sm pt-1">
                <span className="font-bold text-base text-[#16202A]">Total productos:</span>
                <span className="font-black text-2xl text-[#8B5E3C]">${getCartTotal().toLocaleString('es-AR')}</span>
              </div>

              <p className="text-[11px] text-[#8C7E6E] pt-2 border-t border-[#E5DCCD] leading-relaxed">
                ℹ️ <strong>Importante:</strong> El costo de transporte no se incluye en el monto anterior. Se cotizará y coordinará directamente por WhatsApp de acuerdo a la empresa de encomiendas o cadetería seleccionada.
              </p>
            </div>

            {/* Datos del Cliente y Destino */}
            <div className="p-4 bg-white border border-[#E5DCCD] rounded-2xl text-xs space-y-1.5 text-[#5C5042]">
              <p><strong>Destinatario:</strong> {formData.nombre} {formData.apellido} (DNI: {formData.dni})</p>
              <p><strong>Teléfono:</strong> {formData.telefono}</p>
              <p><strong>Modalidad:</strong> {formData.entrega === 'coordinar' ? '🤝 Entrega a coordinar en Comodoro/Rada Tilly' : '📦 Envío a domicilio'}</p>
              <p><strong>Ubicación:</strong> {buildDireccionTexto()}</p>
            </div>

            {/* Vista previa del mensaje */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6B5E51] mb-2">Mensaje que se enviará por WhatsApp</p>
              <div className="bg-[#FAF7F2] border border-[#E5DCCD] rounded-2xl p-4 text-xs text-[#2C241E] whitespace-pre-wrap select-none max-h-52 overflow-y-auto font-mono leading-relaxed">
                {buildMensaje(orderId)}
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-2">* Al presionar el botón se abrirá WhatsApp con este texto precargado listo para enviar.</p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#F2ECE1]">
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#6B5E51] hover:text-[#16202A] transition-colors"
              >
                ← Modificar Datos
              </button>
              <button 
                type="button" 
                onClick={handleConfirm} 
                className="bg-[#16202A] hover:bg-[#8B5E3C] text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-xs tracking-wider flex items-center gap-2"
              >
                <span>💬</span>
                <span>Confirmar y Enviar por WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
