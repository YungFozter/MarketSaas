import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, X } from 'lucide-react';

export const AdminPinModal = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // PIN por defecto para el demo: 1234
    if (pin === '1234' || pin === 'admin') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Acceso Administrador</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa tu clave de acceso para entrar a la Vista de Dueño/POS. (Clave demo: <span className="font-mono font-bold text-amber-600">1234</span>)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="Ingresa PIN..."
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-center font-mono text-lg tracking-widest outline-none transition-all ${
                  error
                    ? 'border-rose-400 bg-rose-50/50 text-rose-700 ring-2 ring-rose-200'
                    : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                }`}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 text-center">
                ⚠️ PIN incorrecto. Intenta de nuevo (Demo: 1234)
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 text-slate-900 text-sm font-bold hover:bg-amber-400 shadow-md shadow-amber-500/20"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
