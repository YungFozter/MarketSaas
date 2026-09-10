import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  ThumbsUp, 
  Sparkles, 
  MessageSquarePlus, 
  CheckCircle, 
  Clock, 
  Store, 
  CheckCircle2, 
  Send, 
  Loader2 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './RequestProductModal.css';

export const RequestProductModal = ({ isOpen, onClose, initialProductName = '' }) => {
  const { 
    productRequests, 
    submitProductRequest, 
    voteProductRequest, 
    storeConfig, 
    tenantSlug,
    customerSubView 
  } = useStore();

  const [productName, setProductName] = useState(initialProductName);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedMap, setVotedMap] = useState(() => {
    try {
      const saved = localStorage.getItem('marketsaas_voted_requests');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const isOfficialStore = Boolean(tenantSlug && tenantSlug !== 'default');
  const storeName = storeConfig?.name || (isOfficialStore ? 'Minimarket' : 'la tienda');

  useEffect(() => {
    if (isOpen) {
      setProductName(initialProductName || '');
    }
  }, [isOpen, initialProductName]);

  if (!isOpen || customerSubView !== 'storefront') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitProductRequest('Vecino', productName.trim(), notes.trim(), '');
      setProductName('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Error al enviar petición:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = (requestId) => {
    if (votedMap[requestId]) return; // Evitar votos duplicados del mismo cliente

    voteProductRequest(requestId);
    const nextMap = { ...votedMap, [requestId]: true };
    setVotedMap(nextMap);
    try {
      localStorage.setItem('marketsaas_voted_requests', JSON.stringify(nextMap));
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Oficial / Dinámico según la Tienda */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isOfficialStore ? 'Buzón Oficial' : 'Buzón Comunitario'}</span>
              </div>
              
              {isOfficialStore ? (
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wide bg-emerald-950/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <Store className="w-3 h-3 text-emerald-300" />
                  <span className="truncate max-w-[180px]">{storeName}</span>
                </span>
              ) : (
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wide bg-emerald-950/60 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Modo Demostración
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              ¿Falta algún producto en {isOfficialStore ? storeName : 'la tienda'}?
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 leading-relaxed">
              {isOfficialStore ? (
                <>Envía tu petición directamente a la administración de <strong>{storeName}</strong>. El dueño evaluará añadirlo al catálogo.</>
              ) : (
                <>Espacio interactivo: los vecinos sugieren productos directamente al dueño del minimarket.</>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 ml-2"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Formulario Oficial para sugerir producto */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5 shadow-xs">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
              <span>Hacer una nueva sugerencia al dueño:</span>
            </h4>

            <div>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={isOfficialStore ? `¿Qué producto o marca te gustaría ver en ${storeName}?` : "¿Qué producto o marca te gustaría ver? (ej. Leche de almendras, Pañales Talla G...)"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalle o marca preferida (opcional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm bg-white focus:border-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !productName.trim()}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando al dueño...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Petición a {isOfficialStore ? storeName : 'al Dueño'}</span>
                </>
              )}
            </button>
          </form>

          {/* Lista de Peticiones de los Vecinos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Peticiones de los vecinos {isOfficialStore && `en ${storeName}`}
              </h4>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {productRequests.length} {productRequests.length === 1 ? 'petición' : 'peticiones'}
              </span>
            </div>

            {productRequests.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                <Sparkles className="w-7 h-7 text-emerald-500 mx-auto opacity-70" />
                <p className="text-xs font-bold text-slate-700">Aún no hay peticiones registradas para {storeName}</p>
                <p className="text-[11px] text-slate-400">¡Sé el primer vecino en sugerir un producto para que el dueño lo traiga a la tienda!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {productRequests.map((req) => {
                  const hasVoted = Boolean(votedMap[req.id]);

                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {req.productName}
                          </span>

                          {req.status === 'approved' && (
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Aprobado / Por llegar
                            </span>
                          )}

                          {req.status === 'stocked' && (
                            <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-sky-200">
                              <CheckCircle2 className="w-3 h-3 text-sky-600" /> ¡Ya en Tienda!
                            </span>
                          )}

                          {(!req.status || req.status === 'pending') && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> En evaluación
                            </span>
                          )}
                        </div>

                        {req.notes && (
                          <p className="text-[11px] text-slate-600 mt-0.5 italic">
                            "{req.notes}"
                          </p>
                        )}

                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          Por: <span className="text-slate-600 font-semibold">{req.customerName}</span> • {req.date}
                        </p>
                      </div>

                      <button
                        onClick={() => handleVote(req.id)}
                        disabled={hasVoted}
                        title={hasVoted ? "Ya has apoyado esta sugerencia" : "Apoyar esta sugerencia"}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                          hasVoted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black shadow-2xs'
                            : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                        <span>{req.votes}</span>
                        {hasVoted && <span className="text-[9px] uppercase tracking-wider text-emerald-600 hidden sm:inline font-black">Apoyado</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
