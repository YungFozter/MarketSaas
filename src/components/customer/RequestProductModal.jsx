import React, { useState } from 'react';
import { X, PlusCircle, ThumbsUp, Sparkles, MessageSquarePlus, CheckCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './RequestProductModal.css';

export const RequestProductModal = ({ isOpen, onClose }) => {
  const { productRequests, submitProductRequest, voteProductRequest, selectedLocation } = useStore();
  const [productName, setProductName] = useState('');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(`${selectedLocation.tower} - ${selectedLocation.apartment}`);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName.trim()) return;

    submitProductRequest(customerName, productName, notes);
    setProductName('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Buzón Comunitario</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              ¿Falta algún producto en la tienda?
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5">
              Pídelo al dueño para que lo traiga en el próximo pedido.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-8 space-y-5 overflow-y-auto flex-1">
          {/* Formulario para pedir */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
              <span>Hacer una nueva sugerencia:</span>
            </h4>

            <div>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="¿Qué producto o marca te gustaría ver? (ej. Leche de almendras, Pañales Talla G...)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalle o marca preferida (opcional)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-xs bg-white"
              />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tu torre/depto"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-xs bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Enviar Petición al Dueño</span>
            </button>
          </form>

          {/* Lista de Peticiones de los Vecinos */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Peticiones populares de los vecinos
            </h4>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {productRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {req.productName}
                      </span>
                      {req.status === 'approved' && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Por llegar
                        </span>
                      )}
                    </div>
                    {req.notes && <p className="text-[11px] text-slate-500 mt-0.5">{req.notes}</p>}
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Por: {req.customerName} • {req.date}
                    </p>
                  </div>

                  <button
                    onClick={() => voteProductRequest(req.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shrink-0"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{req.votes}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
