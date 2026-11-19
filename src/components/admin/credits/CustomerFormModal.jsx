import React, { useId } from 'react';
import {
  UserCheck,
  X,
  DollarSign,
  ShoppingCart,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { roundMoney } from '../../../utils/paymentUtils';
import { CreditModal } from './CreditModal';

export const CustomerFormModal = ({
  isOpen,
  onClose,
  editingCustomer,
  customerForm,
  setCustomerForm,
  handleQuickAddInitialBalance,
  onSubmit,
  isSubmitting,
  currency
}) => {
  const titleId = useId();

  return (
    <CreditModal
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      lightDismiss={false}
      maxWidthClass="max-w-lg"
    >
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shadow-2xs shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 id={titleId} className="font-black text-base text-slate-900 leading-tight truncate">
              {editingCustomer ? 'Editar Datos del Deudor' : 'Registrar Nuevo Deudor'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {editingCustomer
                ? 'Modifica los datos personales y límites'
                : 'Crea su cuenta y anota si te pide fiado en este momento'}
            </p>
          </div>
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
            <label htmlFor={`${titleId}-name`} className="text-xs font-bold text-slate-700 block mb-1">
              Nombre Completo *
            </label>
            <input
              id={`${titleId}-name`}
              type="text"
              required
              autoFocus
              value={customerForm.name}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej. Don Carlos Mendoza, Lic. Carla Ortiz..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${titleId}-phone`} className="text-xs font-bold text-slate-700 block mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                id={`${titleId}-phone`}
                type="tel"
                inputMode="tel"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Ej. 77123456"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor={`${titleId}-apt`} className="text-xs font-bold text-slate-700 block mb-1">
                Torre / Depto / Casa
              </label>
              <input
                id={`${titleId}-apt`}
                type="text"
                value={customerForm.apartment}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, apartment: e.target.value }))}
                placeholder="Ej. Torre B - 402"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${titleId}-limit`} className="text-xs font-bold text-slate-700 block mb-1">
              ¿Hasta cuánto le permites fiar? (Límite máximo en {currency} - Opcional)
            </label>
            <input
              id={`${titleId}-limit`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={customerForm.creditLimit}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, creditLimit: e.target.value }))}
              placeholder="Ej. 300 (déjalo vacío o en 0 si no tiene tope)"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              💡 El sistema te avisará automáticamente cuando sus compras fiadas alcancen este monto.
            </span>
          </div>

          {!editingCustomer && (
            <div className="p-3.5 sm:p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  ¿Deseas registrar una deuda ahora mismo?
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCustomerForm(prev => ({ ...prev, debtMode: 'counter' }))}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    customerForm.debtMode === 'counter'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Fiar compra ahora</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerForm(prev => ({ ...prev, debtMode: 'previous' }))}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    customerForm.debtMode === 'previous'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Deuda de libreta</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCustomerForm(prev => ({ ...prev, debtMode: 'none', initialBalance: '', initialConcept: '' }))
                  }
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    customerForm.debtMode === 'none'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Sin deuda</span>
                </button>
              </div>

              {customerForm.debtMode === 'counter' && (
                <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-xl p-3.5 space-y-3">
                  <div>
                    <span className="text-xs font-extrabold text-indigo-950 block">
                      🛒 Compra fiada en este momento (Mostrador)
                    </span>
                    <p className="text-[11px] text-indigo-800 leading-tight mt-0.5">
                      Si el vecino está en la tienda pidiendo fiado ahorita, anota aquí el total y los productos.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor={`${titleId}-init-counter`} className="text-[11px] font-extrabold text-indigo-950">
                        Monto de la compra a fiar ({currency}) *
                      </label>
                      {customerForm.initialBalance && (
                        <button
                          type="button"
                          onClick={() => setCustomerForm(prev => ({ ...prev, initialBalance: '' }))}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                        >
                          Borrar monto
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500 font-extrabold text-sm">
                        {currency}
                      </div>
                      <input
                        id={`${titleId}-init-counter`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={customerForm.initialBalance}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, initialBalance: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-11 pr-3 py-2 text-base font-black rounded-xl bg-white border border-indigo-300 text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] font-bold text-indigo-800">Suma rápida:</span>
                      {[5, 10, 20, 50, 100].map((quickAmt) => (
                        <button
                          key={quickAmt}
                          type="button"
                          onClick={() => handleQuickAddInitialBalance(quickAmt)}
                          className="px-2 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-black text-[11px] rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          +{quickAmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${titleId}-concept-counter`} className="text-[11px] font-bold text-indigo-950 block mb-1">
                      ¿Qué productos se lleva? (Opcional)
                    </label>
                    <input
                      id={`${titleId}-concept-counter`}
                      type="text"
                      value={customerForm.initialConcept}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, initialConcept: e.target.value }))}
                      placeholder="Ej. 2 leches Pil, 1 aceite, 10 panes..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-indigo-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-800 font-medium bg-white/80 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                    <span>💡</span>
                    <span>Se creará el deudor y quedará registrada esta compra a cuenta en su libreta con fecha y hora actual.</span>
                  </div>
                </div>
              )}

              {customerForm.debtMode === 'previous' && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      📒 Saldo acumulado anterior (Libreta de papel)
                    </span>
                    <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                      Si viene de tu cuaderno anterior o días pasados, anota aquí con cuánto empieza su saldo.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor={`${titleId}-init-prev`} className="text-[11px] font-bold text-amber-950 block mb-1">
                        Monto que ya debe ({currency})
                      </label>
                      <input
                        id={`${titleId}-init-prev`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={customerForm.initialBalance}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, initialBalance: e.target.value }))}
                        placeholder="Ej. 120.00"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 focus:outline-none focus:border-amber-500 font-bold text-amber-950"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${titleId}-concept-prev`} className="text-[11px] font-bold text-amber-950 block mb-1">
                        Motivo o detalle (Opcional)
                      </label>
                      <input
                        id={`${titleId}-concept-prev`}
                        type="text"
                        value={customerForm.initialConcept}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, initialConcept: e.target.value }))}
                        placeholder="Ej. Libreta vieja, víveres..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 focus:outline-none focus:border-amber-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {customerForm.debtMode === 'none' && (
                <div className="p-3 bg-slate-100/90 border border-slate-200 text-slate-600 rounded-xl text-xs flex items-center gap-2">
                  <span className="text-base">ℹ️</span>
                  <span>
                    El vecino se registrará con saldo en <strong>0.00 {currency}</strong>. Podrás anotarle compras fiadas más adelante desde el botón &ldquo;Anotar Fiao&rdquo;.
                  </span>
                </div>
              )}

              {customerForm.debtMode !== 'none' &&
                roundMoney(parseFloat(customerForm.creditLimit) || 0) > 0 &&
                roundMoney(parseFloat(customerForm.initialBalance) || 0) >=
                  roundMoney(parseFloat(customerForm.creditLimit) || 0) && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Aviso:</strong> El saldo inicial ({currency}{' '}
                      {roundMoney(parseFloat(customerForm.initialBalance) || 0).toFixed(2)}) alcanza o supera el límite de crédito configurado ({currency}{' '}
                      {roundMoney(parseFloat(customerForm.creditLimit) || 0).toFixed(2)}).
                    </span>
                  </div>
                )}
            </div>
          )}

          <div>
            <label htmlFor={`${titleId}-notes`} className="text-xs font-bold text-slate-700 block mb-1">
              Notas Especiales
            </label>
            <textarea
              id={`${titleId}-notes`}
              rows="2"
              value={customerForm.notes}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ej. Paga cada quincena, cobra el sueldo los días 30..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
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
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2 transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              'Guardando...'
            ) : editingCustomer ? (
              'Guardar Cambios'
            ) : customerForm.debtMode !== 'none' && (parseFloat(customerForm.initialBalance) || 0) > 0 ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Registrar y Fiar {currency} {(parseFloat(customerForm.initialBalance) || 0).toFixed(2)}</span>
              </>
            ) : (
              <span>Registrar Deudor</span>
            )}
          </button>
        </div>
      </form>
    </CreditModal>
  );
};
