import React, { useId } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { roundMoney } from '../../../utils/paymentUtils';
import { CreditModal } from './CreditModal';

export const ChargeModal = ({
  customer,
  onClose,
  chargeForm,
  setChargeForm,
  onSubmit,
  isSubmitting,
  currency
}) => {
  const titleId = useId();
  const isOpen = Boolean(customer);

  const chargeAmount = roundMoney(Math.max(0, parseFloat(chargeForm.amount) || 0));
  const currentBal = roundMoney(customer?.balance || 0);
  const projectedBalance = roundMoney(currentBal + chargeAmount);
  const creditLimit = roundMoney(customer?.creditLimit || 0);
  const willReachLimit = creditLimit > 0 && projectedBalance >= creditLimit;
  const alreadyOverLimit = creditLimit > 0 && currentBal >= creditLimit;

  return (
    <CreditModal
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      lightDismiss={false}
      maxWidthClass="max-w-md"
    >
      {customer && (
        <>
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50 shrink-0">
            <div className="min-w-0">
              <h3 id={titleId} className="font-black text-base text-slate-900">
                Anotar Compra a Cuenta
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                Vecino: <strong className="text-indigo-700">{customer.name}</strong> (Saldo actual: {currency} {currentBal.toFixed(2)})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/50 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label htmlFor={`${titleId}-amount`} className="text-xs font-bold text-slate-700 block mb-1">
                  Monto a Anotar ({currency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                    {currency}
                  </span>
                  <input
                    id={`${titleId}-amount`}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    value={chargeForm.amount}
                    onChange={(e) => setChargeForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 text-lg font-black rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${titleId}-concept`} className="text-xs font-bold text-slate-700 block mb-1">
                  Detalle de Productos / Concepto *
                </label>
                <input
                  id={`${titleId}-concept`}
                  type="text"
                  required
                  value={chargeForm.concept}
                  onChange={(e) => setChargeForm(prev => ({ ...prev, concept: e.target.value }))}
                  placeholder="Ej. 2 leches Pil, 1 maple de huevos, 5 panes..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Nuevo saldo resultante:</span>
                <span className={`font-black text-sm ${willReachLimit ? 'text-rose-700' : 'text-rose-600'}`}>
                  {currency} {projectedBalance.toFixed(2)}
                </span>
              </div>

              {(willReachLimit || alreadyOverLimit) && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2 text-xs text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="font-black block">
                      {projectedBalance > creditLimit ? 'Límite de crédito superado' : 'Límite de crédito alcanzado'}
                    </strong>
                    <span>
                      Su límite configurado es <strong>{currency} {creditLimit.toFixed(2)}</strong> y quedará con{' '}
                      <strong>{currency} {projectedBalance.toFixed(2)}</strong>.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="credit-modal-footer flex items-center justify-end gap-2 px-4 sm:px-5 pt-3 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md cursor-pointer disabled:opacity-60 ${
                  willReachLimit
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                {isSubmitting
                  ? 'Guardando...'
                  : willReachLimit
                    ? '⚠️ Confirmar Fiao (Sobre Límite)'
                    : '+ Anotar a su Cuenta'}
              </button>
            </div>
          </form>
        </>
      )}
    </CreditModal>
  );
};
