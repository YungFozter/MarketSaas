import React, { useId } from 'react';
import {
  BookOpen,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  Lock,
  Plus,
  Banknote
} from 'lucide-react';
import { CreditModal } from './CreditModal';

export const HistoryModal = ({
  customer,
  onClose,
  onOpenCharge,
  onOpenPayment,
  isReadOnlyCredits,
  formatBoliviaDateTime,
  currency
}) => {
  const titleId = useId();
  const isOpen = Boolean(customer);

  return (
    <CreditModal
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      lightDismiss={true}
      maxWidthClass="max-w-2xl"
    >
      {customer && (
        <>
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80 shrink-0 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 id={titleId} className="font-black text-base text-slate-900 truncate">
                  Libreta de Cuentas: {customer.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {customer.apartment || 'Vecino'} {customer.phone && `• Tel: ${customer.phone}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Actual</span>
                <span className={`text-base font-black ${customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {currency} {Number(customer.balance || 0).toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar libreta"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 overscroll-contain">
            {!customer.transactions || customer.transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-xs">No hay movimientos registrados en la libreta todavía.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customer.transactions.map((tx, idx) => {
                  const isCharge = tx.type === 'charge';

                  return (
                    <div
                      key={tx.id || idx}
                      className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                        isCharge ? 'bg-rose-50/40 border-rose-100' : 'bg-emerald-50/40 border-emerald-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isCharge ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isCharge ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <p className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight break-words">
                            {tx.concept}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium flex-wrap">
                            <span>{formatBoliviaDateTime(tx.date)}</span>
                            {!isCharge && (
                              <span className="px-1.5 py-0.5 bg-white rounded border text-[10px] font-bold text-slate-600">
                                {tx.paymentMethod === 'qr' ? 'QR' : 'Efectivo'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-black text-sm sm:text-base block ${isCharge ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {isCharge
                            ? `+${currency} ${Number(tx.amount || 0).toFixed(2)}`
                            : `-${currency} ${Number(tx.amount || 0).toFixed(2)}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Saldo: {currency} {Number(tx.balanceAfter || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="credit-modal-footer px-4 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenCharge(customer)}
              className={`px-3.5 py-2 rounded-xl border font-extrabold text-xs flex items-center gap-1.5 cursor-pointer ${
                isReadOnlyCredits
                  ? 'bg-slate-100 border-slate-200 text-slate-400'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {isReadOnlyCredits ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>+ Anotar Compra</span>
            </button>

            <div className="flex items-center gap-2">
              {customer.balance > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenPayment(customer)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Abonar Dinero</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </CreditModal>
  );
};
