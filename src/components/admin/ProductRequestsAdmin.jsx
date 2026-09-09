import React from 'react';
import { Sparkles, ThumbsUp, CheckCircle, Clock, Trash2, Plus, Store, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './ProductRequestsAdmin.css';

export const ProductRequestsAdmin = ({ onAddNewProductWithData }) => {
  const { productRequests, updateRequestStatus, deleteProductRequest, storeConfig } = useStore();

  const pendingCount = productRequests.filter(r => !r.status || r.status === 'pending').length;
  const approvedCount = productRequests.filter(r => r.status === 'approved').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Informativo */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Buzón de Vecinos ("Pídelo si no está")
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sugerencias oficiales enviadas por los vecinos para <strong>{storeConfig?.name || 'tu tienda'}</strong>. Conoce la demanda real de tu comunidad.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 font-extrabold text-xs">
            {pendingCount} por evaluar
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-extrabold text-xs">
            {approvedCount} aprobados
          </span>
        </div>
      </div>

      {/* Listado o Empty State */}
      {productRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/90 shadow-2xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-800">
            Aún no hay peticiones de vecinos registradas
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Cuando tus clientes condóminos hagan clic en el botón <strong>"Pídelo si no está"</strong> desde tu catálogo, verás aquí sus solicitudes y votos en tiempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {productRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                    {req.date}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {req.votes} {req.votes === 1 ? 'voto de vecino' : 'votos de vecinos'}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{req.productName}</h3>
                
                {req.notes && (
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                    "{req.notes}"
                  </p>
                )}

                <div className="mt-2.5 text-[11px] text-slate-500 font-medium">
                  Solicitado por: <strong className="text-slate-800">{req.customerName}</strong>
                  {req.customerLocation && (
                    <span className="text-slate-400 block sm:inline sm:ml-1">({req.customerLocation})</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                  req.status === 'approved' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : req.status === 'stocked'
                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}>
                  {req.status === 'approved' ? (
                    <><CheckCircle className="w-3 h-3 text-emerald-600" /> Aprobado para Comprar</>
                  ) : req.status === 'stocked' ? (
                    <><CheckCircle2 className="w-3 h-3 text-sky-600" /> Disponible en Tienda</>
                  ) : (
                    <><Clock className="w-3 h-3 text-amber-600" /> Pendiente de Evaluación</>
                  )}
                </span>

                <div className="flex items-center gap-1.5 ml-auto">
                  {(!req.status || req.status === 'pending') && (
                    <button
                      onClick={() => updateRequestStatus(req.id, 'approved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Aprobar para comprar e incorporar al catálogo"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Aprobar</span>
                    </button>
                  )}

                  {req.status === 'approved' && (
                    <button
                      onClick={() => updateRequestStatus(req.id, 'stocked')}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Marcar como ya disponible y notificar en el buzón"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ya en Tienda</span>
                    </button>
                  )}

                  <button
                    onClick={() => deleteProductRequest(req.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                    title="Descartar petición"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
