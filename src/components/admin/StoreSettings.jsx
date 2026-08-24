import React, { useState } from 'react';
import { 
  Settings, 
  Truck, 
  Building2, 
  Phone, 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  QrCode, 
  DollarSign,
  Power,
  Image as ImageIcon,
  Lock,
  Upload,
  Palette,
  Tag,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { presetBanners } from '../../data/initialData';

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

  const [form, setForm] = useState({ 
    currencySymbol: 'Bs.',
    adminPassword: 'admin',
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
    ...storeConfig 
  });

  const [confirmPassword, setConfirmPassword] = useState(storeConfig.adminPassword || 'admin');
  const [passwordError, setPasswordError] = useState('');

  const [newCondoName, setNewCondoName] = useState('');
  const [newCondoFee, setNewCondoFee] = useState('5.00');
  const [newCondoTime, setNewCondoTime] = useState('10-15 min');

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10.00');

  const [newCategoryName, setNewCategoryName] = useState('');

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
    if (form.adminPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden. Verifica antes de guardar.');
      showToast('⚠️ Las contraseñas no coinciden.', 'error');
      return;
    }
    setPasswordError('');
    setStoreConfig(form);
    showToast('Configuración del negocio guardada exitosamente.', 'success');
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

  const handleAddCondo = () => {
    if (!newCondoName.trim()) return;
    const newCondo = {
      id: `c-${Date.now()}`,
      name: newCondoName,
      towers: ['Torre A', 'Torre B', 'Casas'],
      deliveryFee: parseFloat(newCondoFee) || 5.00,
      estTime: newCondoTime || '15 min'
    };
    setForm(prev => ({
      ...prev,
      condominiums: [...prev.condominiums, newCondo]
    }));
    setNewCondoName('');
    showToast(`Condominio "${newCondoName}" agregado.`);
  };

  const handleRemoveCondo = (id) => {
    setForm(prev => ({
      ...prev,
      condominiums: prev.condominiums.filter(c => c.id !== id)
    }));
  };

  const handleAddCoupon = () => {
    if (!newCouponCode.trim()) return;
    const newCoupon = {
      id: `coup-${Date.now()}`,
      code: newCouponCode.toUpperCase().trim(),
      discount: parseFloat(newCouponDiscount) || 10.00,
      description: `Cupón de descuento por Bs. ${parseFloat(newCouponDiscount).toFixed(2)}`
    };
    setForm(prev => ({
      ...prev,
      coupons: [...(prev.coupons || []), newCoupon]
    }));
    setNewCouponCode('');
    showToast(`Cupón "${newCoupon.code}" creado.`);
  };

  const handleRemoveCoupon = (id) => {
    setForm(prev => ({
      ...prev,
      coupons: (prev.coupons || []).filter(c => c.id !== id)
    }));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const cleanCat = newCategoryName.trim();
    if (form.categories.includes(cleanCat)) {
      showToast('Esta categoría ya existe.', 'error');
      return;
    }
    setForm(prev => ({
      ...prev,
      categories: [...prev.categories, cleanCat]
    }));
    setNewCategoryName('');
    showToast(`Categoría "${cleanCat}" agregada.`);
  };

  const handleRemoveCategory = (catName) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== catName)
    }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* Identidad Visual & Portadas */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
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

      {/* Estado del Local & Datos Generales */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
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

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña de Seguridad (Acceso Dueño)</label>
            <input
              type="password"
              value={form.adminPassword || 'admin'}
              onChange={(e) => {
                setForm(prev => ({ ...prev, adminPassword: e.target.value }));
                if (passwordError) setPasswordError('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Confirmar Contraseña de Seguridad</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold bg-white ${
                passwordError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
              }`}
            />
            {passwordError && (
              <span className="text-[11px] font-bold text-rose-600 mt-1 block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {passwordError}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Gestor de Categorías de Productos de la Tienda */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-600" />
          <span>Gestión de Categorías de Productos</span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {form.categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">
              <span>{cat}</span>
              {form.categories.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="p-0.5 hover:text-rose-600 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nueva Categoría (ej. Mascotas, Panadería...)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Categoría</span>
          </button>
        </div>
      </div>

      {/* Datos Bancarios y Carga de Imagen del QR de Cobro */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>Datos Bancarios & Imagen del Código QR de Cobro</span>
        </h3>

        {/* Cargar Foto de QR con Compresión */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
          <label className="text-xs font-bold text-amber-950 block">Imagen del Código QR de Cobro (Se mostrará al cliente al pagar)</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-amber-300 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {form.qrImageUrl ? (
                <img src={form.qrImageUrl} alt="QR Cobro" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-[10px] text-amber-600 font-bold text-center px-1">Sin Foto QR</span>
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
                className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-xs bg-white font-medium"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Banco o Billetera Digital</label>
            <input
              type="text"
              value={form.bankDetails.bank}
              onChange={(e) => setForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, bank: e.target.value } }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Número de Cuenta</label>
            <input
              type="text"
              value={form.bankDetails.accountNumber}
              onChange={(e) => setForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountNumber: e.target.value } }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Titular de la Cuenta</label>
            <input
              type="text"
              value={form.bankDetails.holder}
              onChange={(e) => setForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, holder: e.target.value } }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Alias QR / Glosa</label>
            <input
              type="text"
              value={form.bankDetails.aliasQR}
              onChange={(e) => setForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, aliasQR: e.target.value } }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tarifas de Delivery por Condominio */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Condominios Atendidos & Cobro de Delivery</span>
          </h3>
        </div>

        {/* Parámetros Generales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Monto Mínimo para Delivery Gratis (Bs.)</label>
            <input
              type="number"
              step="1"
              value={form.freeDeliveryThreshold}
              onChange={(e) => setForm(prev => ({ ...prev, freeDeliveryThreshold: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Incentiva a los clientes a pedir canastas más grandes.</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Tarifa de Delivery Base por Defecto (Bs.)</label>
            <input
              type="number"
              step="0.50"
              value={form.defaultDeliveryFee}
              onChange={(e) => setForm(prev => ({ ...prev, defaultDeliveryFee: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Se aplica a zonas sin tarifa específica.</span>
          </div>
        </div>

        {/* Lista de Condominios */}
        <div className="space-y-2">
          {form.condominiums.map((condo) => (
            <div key={condo.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 text-xs">
              <div>
                <span className="font-extrabold text-slate-900 text-sm">{condo.name}</span>
                <p className="text-[11px] text-slate-500">Tiempo: {condo.estTime} • Torres: {condo.towers.join(', ')}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Bs. {condo.deliveryFee.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCondo(condo.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Agregar Nuevo Condominio */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700">Agregar Nuevo Condominio / Zona:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nombre Condominio / Calle"
              value={newCondoName}
              onChange={(e) => setNewCondoName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
            <input
              type="number"
              step="0.50"
              placeholder="Costo Delivery (Bs.)"
              value={newCondoFee}
              onChange={(e) => setNewCondoFee(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
            <input
              type="text"
              placeholder="Tiempo Estimado (ej. 15 min)"
              value={newCondoTime}
              onChange={(e) => setNewCondoTime(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCondo}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Condominio</span>
          </button>
        </div>
      </div>

      {/* Cupones de Descuento de la Tienda */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Gestión de Cupones de Descuento</span>
        </h3>

        {/* Lista de Cupones */}
        <div className="space-y-2">
          {(form.coupons || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No hay cupones activos creados.</p>
          ) : (
            (form.coupons || []).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs">
                <div>
                  <span className="font-black text-amber-950 font-mono tracking-wider text-sm">{c.code}</span>
                  <p className="text-[11px] text-slate-500">{c.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    -Bs. {c.discount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCoupon(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Agregar Nuevo Cupón */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700">Crear Nuevo Código Promocional:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Código (ej. VECINO10)"
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase bg-white"
            />
            <input
              type="number"
              step="0.50"
              placeholder="Monto Descuento (Bs.)"
              value={newCouponDiscount}
              onChange={(e) => setNewCouponDiscount(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCoupon}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Cupón</span>
          </button>
        </div>
      </div>
    </form>
  );
};
