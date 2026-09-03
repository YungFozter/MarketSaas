import React, { useState } from 'react';
import { 
  Store, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Banknote, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  Barcode 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './PosTerminal.css';

export const PosTerminal = () => {
  const { products, categories, completePosSale, showToast, storeConfig } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';

  const [posCart, setPosCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [paymentType, setPaymentType] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === 'all' || p.category === selectedCat;
    const matchSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToPosCart = (product) => {
    if (product.stock <= 0) {
      showToast(`¡Sin stock de ${product.name}!`, 'warning');
      return;
    }

    setPosCart((prev) => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`No hay más stock disponible de ${product.name}`, 'warning');
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }];
    });
  };

  const updatePosQuantity = (id, newQty) => {
    if (newQty <= 0) {
      setPosCart(prev => prev.filter(i => i.id !== id));
      return;
    }
    const product = products.find(p => p.id === id);
    if (product && newQty > product.stock) {
      showToast('Stock máximo alcanzado', 'warning');
      return;
    }
    setPosCart(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const clearPosCart = () => setPosCart([]);

  const subtotal = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const changeToReturn = parseFloat(cashReceived) > subtotal ? (parseFloat(cashReceived) - subtotal).toFixed(2) : '0.00';

  const handleFinishSale = () => {
    if (posCart.length === 0) {
      showToast('Agrega productos al ticket de venta', 'warning');
      return;
    }

    completePosSale(posCart, paymentType);
    setPosCart([]);
    setCashReceived('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn items-start">
      
      {/* Panel Izquierdo: Catálogo y Búsqueda de Productos (8 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Barra Superior */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar o escanear código de barra..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCat === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {categories.filter(c => c.id !== 'all').map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCat === cat.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Productos para POS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[68vh] overflow-y-auto pr-1">
          {filteredProducts.map((p) => {
            const inCart = posCart.find(i => i.id === p.id);
            return (
              <div
                key={p.id}
                onClick={() => addToPosCart(p)}
                className="group relative bg-white p-3 rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-slate-100">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  {inCart && (
                    <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                      {inCart.quantity}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight mb-1">{p.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-700">{currency} {p.price.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{p.stock} u.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel Derecho: Ticket de Cobro de Mostrador (4 cols) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 sticky top-24">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>Ticket de Mostrador</span>
            </h3>
            <p className="text-[11px] text-slate-400">Venta rápida en local físico</p>
          </div>
          {posCart.length > 0 && (
            <button
              onClick={clearPosCart}
              className="text-xs text-rose-600 hover:underline font-bold"
            >
              Vaciar
            </button>
          )}
        </div>

        {/* Lista de Ítems en el POS */}
        <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100">
          {posCart.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Haz clic en cualquier producto para agregarlo al ticket.
            </div>
          ) : (
            posCart.map((item) => (
              <div key={item.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-400">{currency} {item.price.toFixed(2)} c/u</p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => updatePosQuantity(item.id, item.quantity - 1)}
                    className="w-5 h-5 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-xs px-1 min-w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updatePosQuantity(item.id, item.quantity + 1)}
                    className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-black text-slate-900 min-w-12 text-right">
                  {currency} {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Método de Pago y Vuelto */}
        {posCart.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Método de Pago:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                    paymentType === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                    paymentType === 'card' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Tarjeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('qr')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                    paymentType === 'qr' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>QR</span>
                </button>
              </div>
            </div>

            {paymentType === 'cash' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="font-bold text-slate-700">Paga con ({currency}):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="1"
                    placeholder="Monto"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 font-black text-right text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {paymentType === 'cash' && parseFloat(cashReceived) > subtotal && (
              <div className="flex justify-between text-xs font-bold bg-amber-50 p-2 rounded-lg text-amber-900 border border-amber-200">
                <span>Vuelto a entregar:</span>
                <span className="font-black">{currency} {changeToReturn}</span>
              </div>
            )}

            {/* Total y Botón Cobrar */}
            <div className="pt-2">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm font-extrabold text-slate-700">Total a Cobrar:</span>
                <span className="text-2xl font-black text-emerald-700">{currency} {subtotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleFinishSale}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Cobrar y Descontar Stock</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
