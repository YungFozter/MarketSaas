import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Plus, 
  Trash2, 
  Edit3,
  QrCode, 
  DollarSign,
  Power,
  Image as ImageIcon,
  Palette,
  AlertTriangle,
  Lock,
  ShieldCheck,
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  Crosshair,
  CheckCircle2,
  Map,
  Sparkles,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { presetBanners } from '../../data/initialData';
import './StoreSettings.css';

// Helper de compresión de imágenes con Canvas para prevenir desbordamientos de localStorage y Supabase
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.75) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
  });
};

export const StoreSettings = () => {
  const { storeConfig, setStoreConfig, showToast } = useStore();

  const cleanInitialAddress = (storeConfig?.address && storeConfig.address !== 'Direccion según cada Tienda')
    ? storeConfig.address
    : '';

  const [form, setForm] = useState({ 
    currencySymbol: 'Bs.',
    themeColor: 'emerald',
    logoUrl: '',
    bannerUrl: presetBanners[0].url,
    qrImageUrl: '',
    coupons: [],
    categories: [
      'Lácteos & Huevos',
      'Panadería & Desayuno',
      'Abarrotes',
      'Frutas & Verduras',
      'Bebidas & Licores',
      'Snacks & Golosinas',
      'Limpieza & Hogar'
    ],
    zone: storeConfig?.zone || storeConfig?.condominium || '',
    reference: storeConfig?.reference || '',
    latitude: storeConfig?.googleMapsCoordinates?.lat ?? storeConfig?.latitude ?? -17.78335,
    longitude: storeConfig?.googleMapsCoordinates?.lng ?? storeConfig?.longitude ?? -63.18214,
    ...storeConfig,
    coupons: Array.isArray(storeConfig?.coupons)
      ? storeConfig.coupons.filter(c => c.code !== 'VECINO10')
      : [],
    address: cleanInitialAddress
  });

  // Sincronizar formulario reactivamente cuando storeConfig se cargue desde Supabase o localStorage
  useEffect(() => {
    if (storeConfig) {
      setForm(prev => ({
        ...prev,
        ...storeConfig,
        coupons: Array.isArray(storeConfig.coupons)
          ? storeConfig.coupons.filter(c => c.code !== 'VECINO10')
          : [],
        address: (storeConfig.address && storeConfig.address !== 'Direccion según cada Tienda')
          ? storeConfig.address
          : prev.address
      }));
    }
  }, [storeConfig]);

  const headerCardRef = useRef(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (headerCardRef.current) {
      observer.observe(headerCardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const [detectingGps, setDetectingGps] = useState(false);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no admite geolocalización GPS.', 'error');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingGps(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          googleMapsCoordinates: { lat, lng }
        }));
        showToast(`¡Ubicación GPS detectada con éxito! (${lat}, ${lng})`, 'success');
      },
      (err) => {
        setDetectingGps(false);
        console.warn('Geolocation error:', err);
        showToast('No se pudo obtener la ubicación GPS. Verifica los permisos de tu navegador o ingresa las coordenadas manualmente.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10.00');
  const [editingCoupon, setEditingCoupon] = useState(null);

  const handleGenerateCouponCode = () => {
    const prefixes = ['PROMO', 'VECI', 'DESC', 'SUPER', 'OFERTA'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setNewCouponCode(`${prefix}-${randomNum}`);
  };

  const colorThemes = [
    { id: 'emerald', name: 'Verde Esmeralda', bg: 'bg-emerald-600', ring: 'ring-emerald-500' },
    { id: 'teal', name: 'Azul Turquesa', bg: 'bg-teal-600', ring: 'ring-teal-500' },
    { id: 'indigo', name: 'Índigo Marino', bg: 'bg-indigo-600', ring: 'ring-indigo-500' },
    { id: 'rose', name: 'Rosa Pasión', bg: 'bg-rose-600', ring: 'ring-rose-500' },
    { id: 'amber', name: 'Dorado Ámbar', bg: 'bg-amber-500', ring: 'ring-amber-500' },
    { id: 'purple', name: 'Púrpura Real', bg: 'bg-purple-600', ring: 'ring-purple-500' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    const { adminPassword, admin_pin, ...safeConfig } = form;
    const lat = parseFloat(form.latitude) || -17.78335;
    const lng = parseFloat(form.longitude) || -63.18214;
    const cleanCoupons = (form.coupons || []).filter(c => c.code !== 'VECINO10');
    const configToSave = {
      ...safeConfig,
      coupons: cleanCoupons,
      address: form.address || '',
      zone: form.zone || '',
      reference: form.reference || '',
      googleMapsCoordinates: { lat, lng },
      latitude: lat,
      longitude: lng,
      isRegisteredStore: true
    };
    setStoreConfig(configToSave);
    showToast('¡Configuración y ubicación de tu tienda guardadas exitosamente!', 'success');
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setForm(prev => ({ ...prev, [field]: compressedBase64 }));
        showToast('Imagen cargada y optimizada.');
      } catch (err) {
        showToast('Error al procesar la imagen.', 'error');
      }
    }
  };

  const handleAddCoupon = () => {
    if (!newCouponCode.trim()) {
      showToast('Ingresa o genera un código para el cupón.', 'warning');
      return;
    }
    const discountVal = parseFloat(newCouponDiscount);
    if (isNaN(discountVal) || discountVal <= 0) {
      showToast('Ingresa un monto de descuento válido mayor a 0.', 'warning');
      return;
    }
    const cleanCode = newCouponCode.toUpperCase().trim();
    if ((form.coupons || []).some(c => c.code === cleanCode)) {
      showToast('Ya existe un cupón con este código.', 'error');
      return;
    }
    const newCoupon = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      discount: discountVal,
      description: `Cupón de descuento por Bs. ${discountVal.toFixed(2)}`,
      isUsed: false,
      usedCount: 0,
      maxUses: 1, // REGLA: Cada cupón es de 1 solo uso
      createdAt: new Date().toISOString()
    };
    const updatedCoupons = [...(form.coupons || []).filter(c => c.code !== 'VECINO10'), newCoupon];
    setForm(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setStoreConfig(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setNewCouponCode('');
    setNewCouponDiscount('10.00');
    showToast(`Cupón "${newCoupon.code}" creado y guardado (Válido para 1 solo uso).`, 'success');
  };

  const handleStartEditCoupon = (coupon) => {
    setEditingCoupon({
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
      isUsed: !!coupon.isUsed,
      usedInOrder: coupon.usedInOrder || null
    });
  };

  const handleSaveEditCoupon = () => {
    if (!editingCoupon) return;
    const discountVal = parseFloat(editingCoupon.discount);
    if (isNaN(discountVal) || discountVal <= 0) {
      showToast('El monto de descuento debe ser mayor a 0.', 'warning');
      return;
    }
    const cleanCode = editingCoupon.code.toUpperCase().trim();
    const updatedCoupons = (form.coupons || []).map(c => 
      c.id === editingCoupon.id 
        ? { 
            ...c, 
            code: cleanCode, 
            discount: discountVal, 
            description: `Cupón de descuento por Bs. ${discountVal.toFixed(2)}`,
            isUsed: editingCoupon.isUsed,
            usedCount: editingCoupon.isUsed ? (c.usedCount || 1) : 0,
            usedInOrder: editingCoupon.isUsed ? c.usedInOrder : null
          }
        : c
    );
    setForm(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setStoreConfig(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setEditingCoupon(null);
    showToast('Cupón actualizado y guardado correctamente.', 'success');
  };

  const handleToggleCouponUsed = (couponId) => {
    const target = (form.coupons || []).find(c => c.id === couponId);
    if (!target) return;
    const willBeUsed = !target.isUsed;
    const updatedCoupons = (form.coupons || []).map(c => 
      c.id === couponId 
        ? { 
            ...c, 
            isUsed: willBeUsed, 
            usedCount: willBeUsed ? 1 : 0, 
            usedInOrder: willBeUsed ? (c.usedInOrder || 'MANUAL') : null,
            usedAt: willBeUsed ? (c.usedAt || new Date().toISOString()) : null
          }
        : c
    );
    setForm(prev => ({ ...prev, coupons: updatedCoupons }));
    setStoreConfig(prev => ({ ...prev, coupons: updatedCoupons }));
    showToast(willBeUsed ? `Cupón "${target.code}" marcado como CANJEADO/USADO.` : `Cupón "${target.code}" reactivado para 1 nuevo uso.`, 'info');
  };

  const handleRemoveCoupon = (id) => {
    const updatedCoupons = (form.coupons || []).filter(c => c.id !== id && c.code !== 'VECINO10');
    setForm(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setStoreConfig(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    showToast('Cupón eliminado correctamente.', 'info');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn relative pb-24">
      {/* Floating Save Button on Scroll (Esquina inferior derecha para no solapar el menú superior) */}
      {!isHeaderVisible && (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 animate-fadeIn">
          <button
            type="submit"
            className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-2xl shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border border-emerald-400/40 ring-4 ring-emerald-500/20"
            title="Guardar Cambios de Configuración"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div 
        ref={headerCardRef}
        className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Configuración de la Tienda & Marca Blanca</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza el logo, portada, color del tema, contraseña de dueño, QR de cobro y cupones.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* FILA 1: Personalización Visual & Información Básica (Lado a lado en PC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Identidad Visual & Portadas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Personalización Visual (Logo & Imagen de Portada)</span>
            </h3>

        {/* Cargar Logotipo */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <label className="text-xs font-bold text-slate-800 block">Logotipo de la Tienda</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-slate-400 font-bold text-center px-1">Sin Logo</span>
              )}
            </div>
            <div className="flex-1 space-y-2 w-full">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'logoUrl')}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />
              <input
                type="url"
                placeholder="O pega el enlace de tu logo..."
                value={form.logoUrl || ''}
                onChange={(e) => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Selector de Tema de Color */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <label className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span>Color de Tema del Negocio</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {colorThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, themeColor: t.id }))}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  form.themeColor === t.id
                    ? 'border-slate-800 bg-white ring-2 ring-slate-800/20 shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${t.bg} shrink-0`} />
                <span className="truncate text-[11px] text-slate-800">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Galería de Portadas Predeterminadas */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-800 block">
            Imagen de Portada / Banner (Elige una opción predeterminada o sube la tuya)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {presetBanners.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, bannerUrl: b.url }))}
                className={`group relative rounded-2xl overflow-hidden border-2 transition-all text-left h-24 ${
                  form.bannerUrl === b.url ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-md' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img src={b.url} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-slate-900/40 p-2 flex items-end">
                  <span className="text-[10px] font-bold text-white leading-tight drop-shadow-md">{b.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'bannerUrl')}
              className="block w-full sm:w-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-900 cursor-pointer shrink-0"
            />
            <input
              type="url"
              placeholder="O escribe una URL personalizada para la portada..."
              value={form.bannerUrl || ''}
              onChange={(e) => setForm(prev => ({ ...prev, bannerUrl: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            />
          </div>
        </div>
      </div>
    </div>

        {/* Card 2: Estado del Local & Datos Generales */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Power className="w-4 h-4 text-emerald-600" />
              <span>Información Básica & Autenticación de Dueño</span>
            </h3>

        {/* Switch Abierto / Cerrado */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-bold text-xs sm:text-sm text-slate-900">Estado de Recepción de Pedidos</p>
            <p className="text-[11px] text-slate-500">
              {form.isOpen ? 'Tu catálogo está abierto y recibiendo pedidos de clientes.' : 'Tu tienda figura cerrada temporalmente.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, isOpen: !prev.isOpen }))}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              form.isOpen ? 'bg-emerald-600 text-white shadow-md' : 'bg-rose-600 text-white'
            }`}
          >
            {form.isOpen ? '● ABIERTO' : '○ CERRADO'}
          </button>
        </div>

        {/* Switch Servicio de Delivery a Domicilio */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-bold text-xs sm:text-sm text-slate-900">Servicio de Envíos a Domicilio (Delivery)</p>
            <p className="text-[11px] text-slate-500">
              {form.enableDelivery !== false ? 'Tu tienda ofrece envíos a domicilio y muestra el banner promocional a los clientes.' : 'Tu tienda atiende únicamente para Retiro en Tienda (Delivery desactivado).' }
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, enableDelivery: prev.enableDelivery === false ? true : false }))}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              form.enableDelivery !== false ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-300 text-slate-700'
            }`}
          >
            {form.enableDelivery !== false ? '🛵 ACTIVADO' : '🛍️ DESACTIVADO'}
          </button>
        </div>

        {/* Switch Programa de Puntos de Fidelidad */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-bold text-xs sm:text-sm text-slate-900">Programa de VeciPuntos (Fidelidad)</p>
            <p className="text-[11px] text-slate-500">
              {form.enablePoints !== false ? 'Tus clientes acumularán puntos en sus compras para canjear descuentos.' : 'Programa de puntos desactivado para los clientes de tu tienda.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, enablePoints: prev.enablePoints === false ? true : false }))}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              form.enablePoints !== false ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-300 text-slate-700'
            }`}
          >
            {form.enablePoints !== false ? '★ ACTIVADO' : '☆ DESACTIVADO'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Tienda / Local *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Eslogan / Subtítulo</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm(prev => ({ ...prev, tagline: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Moneda del Sistema</label>
            <input
              type="text"
              disabled
              value="Bolivianos (Bs.)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-100 text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono / WhatsApp de Pedidos</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value, whatsapp: e.target.value.replace(/[^0-9]/g, '') }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Acceso y Credenciales Protegidas</h4>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                El acceso a tu panel de comerciante está blindado mediante <strong>Supabase Auth</strong> con encriptación de grado bancario. Para cambiar tu contraseña de acceso, utiliza el enlace seguro desde la pantalla de inicio de sesión.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

      {/* FILA 2: Ubicación Física & Geolocalización en el Mapa (Ancho Completo) */}
      <div className="w-full">
        {/* Card 3: Ubicación Física & Mapa */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Ubicación Física & Geolocalización en el Mapa</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Esta ubicación posicionará tu tienda en el mapa interactivo de la Vista Vecino.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detectingGps}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-xs font-extrabold border border-emerald-200 transition-all cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
            title="Usar el GPS de tu dispositivo para fijar las coordenadas exactas de la tienda"
          >
            <Crosshair className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
            <span>{detectingGps ? 'Detectando GPS...' : 'Detectar mi ubicación GPS'}</span>
          </button>
        </div>

        {/* Campos de Dirección */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Dirección exacta de la Tienda (Calle, Avenida y Número) *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Av. San Martín #450, entre 3er y 4to anillo"
              value={form.address || ''}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Zona, Barrio o Condominio *
            </label>
            <input
              type="text"
              placeholder="Ej. Barrio Las Palmas / Equipetrol / Condominio Vista Sol"
              value={form.zone || ''}
              onChange={(e) => setForm(prev => ({ ...prev, zone: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Punto de Referencia para el Vecino
            </label>
            <input
              type="text"
              placeholder="Ej. Frente a la plaza principal, portón verde al lado de la farmacia"
              value={form.reference || ''}
              onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Coordenadas GPS & Mini Mapa */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Coordenadas Geográficas (Latitud & Longitud)</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Puedes ajustarlas manualmente o usar el botón de GPS para precisión satelital.
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <span>Abrir en Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Latitud GPS</label>
              <input
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setForm(prev => ({
                    ...prev,
                    latitude: val,
                    googleMapsCoordinates: { lat: val, lng: parseFloat(prev.longitude) || -63.18214 }
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Longitud GPS</label>
              <input
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setForm(prev => ({
                    ...prev,
                    longitude: val,
                    googleMapsCoordinates: { lat: parseFloat(prev.latitude) || -17.78335, lng: val }
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>
          </div>

          {/* Previsualización en Vivo de Google Maps */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vista Previa del Pin en Google Maps:</span>
              </span>
              <span>{form.latitude}, {form.longitude}</span>
            </div>

            <div className="relative w-full h-80 sm:h-96 md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
              <iframe
                key={`${form.latitude}-${form.longitude}`}
                title="Vista previa del mapa de la tienda"
                src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}+(${encodeURIComponent(form.name || 'Mi Tienda')})&z=16&hl=es&ie=UTF8&output=embed`}
                className="w-full h-full border-0 pointer-events-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* FILA 3: Código QR de Cobro & Cupones de Descuento (Lado a lado en PC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 4: Imagen del Código QR de Cobro */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Imagen del Código QR de Cobro</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sube la imagen de tu código QR (Simple QR o entidad bancaria). Tus clientes podrán escanearlo y transferir directamente al pagar su pedido.
            </p>
          </div>

          {/* Cargar Foto de QR con Compresión */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 rounded-2xl bg-white border-2 border-amber-300 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {form.qrImageUrl ? (
                  <img src={form.qrImageUrl} alt="QR Cobro" className="w-full h-full object-contain p-1.5" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <QrCode className="w-8 h-8 text-amber-400 mb-1" />
                    <span className="text-[10px] text-amber-700 font-bold">Sin Foto QR</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'qrImageUrl')}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                />
                <input
                  type="url"
                  placeholder="O pega una URL directa de la imagen del QR..."
                  value={form.qrImageUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, qrImageUrl: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-xs bg-white font-medium focus:border-amber-400 focus:outline-hidden"
                />
                {form.qrImageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, qrImageUrl: '' }))}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Quitar imagen de QR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Cupones de Descuento de la Tienda */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Gestión de Cupones de Descuento</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crea códigos de descuento automáticos o personalizados para incentivar pedidos en tu tienda.
            </p>
          </div>

        {/* Modal / Panel de Edición de Cupón (cuando se edita uno existente) */}
        {editingCoupon && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Editar Cupón: <code className="text-emerald-700 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200">{editingCoupon.code}</code></span>
              </span>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title="Cerrar edición"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Código del Cupón</label>
                <input
                  type="text"
                  value={editingCoupon.code}
                  onChange={(e) => setEditingCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-mono font-black uppercase bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Monto de Descuento (Bs.)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0.50"
                  value={editingCoupon.discount}
                  onChange={(e) => setEditingCoupon(prev => ({ ...prev, discount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-bold bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Disponibilidad del Cupón (1 solo uso):</span>
                  <span className="text-[10px] text-slate-500">
                    {editingCoupon.isUsed ? 'Figura como ya utilizado/canjeado por un cliente.' : 'Listo y disponible para ser canjeado 1 sola vez.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCoupon(prev => ({ ...prev, isUsed: !prev.isUsed }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    editingCoupon.isUsed ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {editingCoupon.isUsed ? '✓ CANJEADO / USADO' : '● DISPONIBLE (1 USO)'}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditCoupon}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Cambios de Cupón</span>
              </button>
            </div>
          </div>
        )}

        {/* Lista de Cupones */}
        <div className="space-y-2">
          {(form.coupons || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium">
              No tienes cupones de descuento activos actualmente.
            </p>
          ) : (
            (form.coupons || []).map((c) => {
              const isUsed = !!c.isUsed || (c.usedCount && c.usedCount >= (c.maxUses || 1));
              return (
                <div 
                  key={c.id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border text-xs transition-all gap-3 ${
                    isUsed 
                      ? 'bg-slate-100/80 border-slate-200/90 text-slate-500' 
                      : 'bg-amber-50/50 border-amber-200/80 text-slate-800 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-black font-mono tracking-wider text-sm px-3 py-1 rounded-xl border shadow-2xs ${
                      isUsed 
                        ? 'bg-slate-200/90 text-slate-500 border-slate-300 line-through' 
                        : 'bg-white text-amber-950 border-amber-200'
                    }`}>
                      {c.code}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-xs ${isUsed ? 'text-slate-600 line-through' : 'text-slate-800'}`}>
                          {c.description || `Descuento directo de Bs. ${parseFloat(c.discount || 0).toFixed(2)}`}
                        </span>
                        {isUsed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px]">
                            ✓ CANJEADO / USADO {c.usedInOrder ? `(${c.usedInOrder})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            ● DISPONIBLE (1 solo uso)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] mt-0.5">
                        <span className={isUsed ? 'text-slate-400 font-medium' : 'font-black text-emerald-700'}>
                          Ahorro al cliente: -Bs. {parseFloat(c.discount || 0).toFixed(2)}
                        </span>
                        {c.usedAt && (
                          <span className="text-slate-400 text-[10px]">
                            • Usado el: {new Date(c.usedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {/* Botón para Reactivar o Marcar Usado */}
                    <button
                      type="button"
                      onClick={() => handleToggleCouponUsed(c.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 ${
                        isUsed 
                          ? 'text-emerald-700 hover:bg-emerald-100 bg-emerald-50' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isUsed ? 'Reactivar cupón para 1 nuevo uso' : 'Marcar manualmente como usado'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{isUsed ? 'Reactivar' : 'Marcar usado'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditCoupon(c)}
                      className="p-2 text-slate-500 hover:text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Editar código y monto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoupon(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar cupón"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Formulario para Crear Nuevo Cupón */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Crear Nuevo Cupón de Descuento:</p>
              <p className="text-[11px] text-slate-500">Por seguridad cada cupón es de <strong>1 solo uso</strong>. Al completarse un pedido se marcará automáticamente como CANJEADO.</p>
            </div>
            <button
              type="button"
              onClick={handleGenerateCouponCode}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300/80 transition-colors cursor-pointer shrink-0"
              title="Generar automáticamente un código al azar"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>⚡ Autogenerar Código</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Código del Cupón</label>
              <input
                type="text"
                placeholder="Ej. PROMO-742 o VECINO10"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Monto de Descuento en Bs.</label>
              <input
                type="number"
                step="0.50"
                min="0.50"
                placeholder="Ej. 10.00"
                value={newCouponDiscount}
                onChange={(e) => setNewCouponDiscount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCoupon}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Cupón</span>
          </button>
        </div>
      </div>
    </div>
</form>
  );
};
