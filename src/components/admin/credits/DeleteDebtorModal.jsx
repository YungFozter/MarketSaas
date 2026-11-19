import React, { useId } from 'react';
import { Trash2, Phone, AlertCircle } from 'lucide-react';
import { CreditModal } from './CreditModal';

export const DeleteDebtorModal = ({
  customer,
  onClose,
  onConfirmDelete,
  isSubmitting,
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
      darkBackdrop={true}
      maxWidthClass="max-w-sm sm:max-w-md"
    >
      {customer && (
        <div className="p-5 sm:p-6 text-center space-y-4 overflow-y-auto overscroll-contain">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center mx-auto shadow-xs">
            <Trash2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 id={titleId} className="text-lg font-black text-slate-900 tracking-tight">
              ¿Eliminar cuenta de deudor?
            </h3>
            <p className="text-xs text-slate-500">
              Esta acción no se puede deshacer y removerá la ficha del cliente de la libreta.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-left space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">
                  {customer.name}
                </p>
                {customer.phone && (
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{customer.phone}</span>
                  </p>
                )}
              </div>
              {customer.apartment && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 shrink-0">
                  {customer.apartment}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Saldo en cuenta:</span>
              <span className={`font-black ${customer.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {currency} {Number(customer.balance || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {customer.balance > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-900 font-medium leading-tight">
                <strong>Atención:</strong> Este deudor tiene una deuda acumulada de{' '}
                <strong>{currency} {Number(customer.balance || 0).toFixed(2)}</strong>. Si eliminas su cuenta, perderás el registro de cobro y sus movimientos.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onConfirmDelete(customer.id)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Eliminando...' : 'Sí, Eliminar'}</span>
            </button>
          </div>
        </div>
      )}
    </CreditModal>
  );
};
