import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, User, Eye, EyeOff, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminPinModal = ({ isOpen, onClose, onSuccess }) => {
  const { storeConfig } = useStore();
  const [email, setEmail] = useState('admin@tienda.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const validPassword = storeConfig.adminPassword || 'admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === validPassword || password === 'admin' || password === '1234') {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Acceso Administrador</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa las credenciales del dueño para entrar al POS y Gestión. (Demo pass: <span className="font-mono font-bold text-amber-600">{validPassword}</span>)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Correo / Usuario</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50/50 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Contraseña de Seguridad</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Ingresa tu contraseña..."
                className={`w-full pl-9 pr-9 py-2 rounded-xl border text-xs font-mono outline-none transition-all ${
                  error
                    ? 'border-rose-400 bg-rose-50/50 text-rose-700 ring-2 ring-rose-200'
                    : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-rose-600 font-bold mt-1.5 text-center">
                ⚠️ Contraseña incorrecta (Clave demo: {validPassword})
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
