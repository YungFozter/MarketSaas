import React, { useId } from 'react';
import { X, CheckCircle2, Banknote, QrCode, AlertCircle } from 'lucide-react';
import { roundMoney } from '../../../utils/paymentUtils';
import { CreditModal } from './CreditModal';

export const PaymentModal = ({
  customer,
  onClose,
  paymentForm,
  setPaymentForm,
  onSubmit,
  isSubmitting,
  currency
}) => {
  const titleId = useId();
  const isOpen = Boolean(customer);

  const currentDebt = roundMoney(customer?.balance || 0);
  const rawPaymentAmount = roundMoney(Math.max(0, parseFloat(paymentForm.amount) || 0));
  const appliedPayment = currentDebt > 0 ? Math.min(rawPaymentAmount, currentDebt) : 0;
  const overpaymentChange = currentDebt > 0 && rawPaymentAmount > currentDebt
    ? roundMoney(rawPaymentAmount - currentDebt)
    : 0;
  const remainingBalance = Math.max(0, roundMoney(currentDebt - appliedPayment));

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
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50 shrink-0">
            <div className="min-w-0">
              <h3 id={titleId} className="font-black text-base text-slate-900">
                Registrar Abono de Dinero
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                Vecino: <strong className="text-emerald-700">{customer.name}</strong>
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
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Deuda Pendiente</span>
                  <span className="text-xl font-black text-rose-400">
                    {currency} {currentDebt.toFixed(2)}
                  </span>
                </div>
                {currentDebt > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, amount: String(currentDebt) }))}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] cursor-pointer shadow-xs"
                  >
                    Saldar Total
                  </button>
                )}
              </div>

              {currentDebt <= 0 ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Este vecino ya está al día y no tiene deuda pendiente para abonar.</span>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor={`${titleId}-amount`} className="text-xs font-bold text-slate-700 block mb-1">
                      Monto que está Abonando ({currency}) *
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
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 text-lg font-black rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1.5">
                      ¿Cómo te está pagando el vecino?
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'cash' }))}
                        className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          paymentForm.paymentMethod === 'cash'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>En Efectivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'qr' }))}
                        className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          paymentForm.paymentMethod === 'qr'
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-800 ring-2 ring-cyan-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-cyan-600" />
                        <span>Por QR Digital</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${titleId}-note`} className="text-xs font-bold text-slate-700 block mb-1">
                      Nota / Observación (Opcional)
                    </label>
                    <input
                      id={`${titleId}-note`}
                      type="text"
                      value={paymentForm.note}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Ej. Dejó 50 Bs en billete, transferido por BCP..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {overpaymentChange > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1">
                      <div className="font-black flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Entregado supera la deuda actual</span>
                      </div>
                      <p className="leading-snug">
                        Se aplicarán <strong>{currency} {appliedPayment.toFixed(2)}</strong> para saldar la cuenta y debes devolver{' '}
                        <strong>{currency} {overpaymentChange.toFixed(2)}</strong> de cambio.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Saldo restante tras abono:</span>
                    <span className="font-black text-emerald-700 text-sm">
                      {currency} {remainingBalance.toFixed(2)}
                    </span>
                  </div>
                </>
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
                disabled={currentDebt <= 0 || isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : '✓ Confirmar Abono Recibido'}
              </button>
            </div>
          </form>
        </>
      )}
    </CreditModal>
  );
};
