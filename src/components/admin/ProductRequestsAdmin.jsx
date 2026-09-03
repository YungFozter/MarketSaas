import React from 'react';
import { Sparkles, ThumbsUp, CheckCircle, Clock, Trash2, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './ProductRequestsAdmin.css';

export const ProductRequestsAdmin = ({ onAddNewProductWithData }) => {
  const { productRequests, updateRequestStatus } = useStore();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Sugerencias & Peticiones de Vecinos ("Pídelo si no está")</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Conoce exactamente qué productos están buscando tus clientes de los condominios para aumentar tus ventas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productRequests.map((req) => (
          <div
            key={req.id}
            className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                  {req.date}
                </span>
                <span className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {req.votes} votos de vecinos
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900">{req.productName}</h3>
              {req.notes && (
                <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  "{req.notes}"
                </p>
              )}
              <p className="text-[11px] text-slate-400 font-medium mt-2">
                Solicitado por: <strong>{req.customerName}</strong>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg ${
                req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {req.status === 'approved' ? 'Aprobado para Comprar' : 'Pendiente de Evaluación'}
              </span>

              <div className="flex items-center gap-1.5">
                {req.status === 'pending' && (
                  <button
                    onClick={() => updateRequestStatus(req.id, 'approved')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Aprobar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
