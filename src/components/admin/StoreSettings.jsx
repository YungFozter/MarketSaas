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
  Power
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const StoreSettings = () => {
  const { storeConfig, setStoreConfig, showToast } = useStore();

  const [form, setForm] = useState({ 
    currencySymbol: '$',
    adminPin: '1234',
    themeColor: 'emerald',
    logoUrl: '',
    bannerUrl: '',
    coupons: [],
    categories: [],
    ...storeConfig 
  });
  const [newCondoName, setNewCondoName] = useState('');
  const [newCondoFee, setNewCondoFee] = useState('1.00');
  const [newCondoTime, setNewCondoTime] = useState('10-15 min');

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('1.50');

  const handleSave = (e) => {
    e.preventDefault();
    setStoreConfig(form);
    showToast('Configuración del negocio guardada exitosamente.', 'success');
  };

  const handleAddCondo = () => {
    if (!newCondoName.trim()) return;
    const newCondo = {
      id: `c-${Date.now()}`,
      name: newCondoName,
      towers: ['Torre A', 'Torre B', 'Casas'],
      deliveryFee: parseFloat(newCondoFee) || 1.00,
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
      discount: parseFloat(newCouponDiscount) || 1.00,
      description: `Cupón de descuento por ${form.currencySymbol || '$'}${parseFloat(newCouponDiscount).toFixed(2)}`
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
            Personaliza el nombre, moneda, clave PIN de acceso, cupones y tarifas de delivery.
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

      {/* Estado del Local & Datos Generales */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Power className="w-4 h-4 text-emerald-600" />
          <span>Información Básica & Clave PIN Administrador</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Tienda / Local *</label>
            <input
              type="text"
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
            <label className="text-xs font-bold text-slate-700 block mb-1">Símbolo de Moneda (ej. $, S/, Bs, €)</label>
            <input
              type="text"
              value={form.currencySymbol || '$'}
              onChange={(e) => setForm(prev => ({ ...prev, currencySymbol: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Clave PIN de Acceso Administrador (Dueño)</label>
            <input
              type="text"
              maxLength={8}
              value={form.adminPin || '1234'}
              onChange={(e) => setForm(prev => ({ ...prev, adminPin: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
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
            <label className="text-xs font-bold text-slate-700 block mb-1">Horarios de Atención</label>
            <input
              type="text"
              value={form.schedule}
              onChange={(e) => setForm(prev => ({ ...prev, schedule: e.target.value }))}
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
            <label className="text-xs font-bold text-slate-700 block mb-1">Monto Mínimo para Delivery Gratis ($)</label>
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
            <label className="text-xs font-bold text-slate-700 block mb-1">Tarifa de Delivery Base por Defecto ($)</label>
            <input
              type="number"
              step="0.10"
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
                  ${condo.deliveryFee.toFixed(2)}
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
              step="0.25"
              placeholder="Costo Delivery ($)"
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

      {/* Datos Bancarios y QR para Transferencias */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>Datos Bancarios para Pagos con Transferencia / QR</span>
        </h3>

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
            <label className="text-xs font-bold text-slate-700 block mb-1">Alias QR o Identificador</label>
            <input
              type="text"
              value={form.bankDetails.aliasQR}
              onChange={(e) => setForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, aliasQR: e.target.value } }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>
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
                    -{form.currencySymbol || '$'}{c.discount.toFixed(2)}
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
              placeholder="Monto Descuento"
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
