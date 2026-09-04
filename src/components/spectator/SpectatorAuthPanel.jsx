import React, { useState } from 'react';
import { Store, LogIn, UserPlus, Mail, Lock, User, Phone, ArrowRight, Eye } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './SpectatorAuthPanel.css';

export const SpectatorAuthPanel = ({ onExploreStore }) => {
  const { 
    currentUser, 
    signInMerchant, 
    signUpMerchant, 
    createMerchantStore, 
    showToast, 
    triggerConfetti, 
    setViewMode 
  } = useStore();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [regStep, setRegStep] = useState(1);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register
  const [ownerName, setOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);

  // Register Step 2
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreSlug, setNewStoreSlug] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setAuthLoading(true);
    const { data, error } = await signInMerchant(loginEmail.trim(), loginPassword.trim());
    setAuthLoading(false);

    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        setAuthError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else {
        setAuthError(error.message || 'Error al iniciar sesión.');
      }
      return;
    }

    showToast('¡Bienvenido a tu panel de tienda!', 'success');
    triggerConfetti();
    setViewMode('admin');
  };

  const handleRegisterStep1 = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!ownerName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setAuthError('Por favor completa todos los campos requeridos.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setAuthLoading(true);
    const { data, error } = await signUpMerchant(regEmail.trim(), regPassword, ownerName.trim());
    setAuthLoading(false);

    if (error) {
      if (error.message?.includes('already registered')) {
        setAuthError('Este correo ya está registrado. Por favor inicia sesión.');
      } else {
        setAuthError(error.message || 'Error en el registro.');
      }
      return;
    }

    if (data?.user) setRegisteredUser(data.user);
    setNewStoreName(`Minimarket ${ownerName.split(' ')[0]}`);
    setNewStoreSlug(`tienda-${ownerName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
    setRegStep(2);
  };

  const handleRegisterStep2 = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!newStoreName.trim() || !newStoreSlug.trim()) {
      setAuthError('El nombre y enlace de la tienda son obligatorios.');
      return;
    }

    setAuthLoading(true);
    const { data, error } = await createMerchantStore({
      storeName: newStoreName.trim(),
      slug: newStoreSlug.trim(),
      phone: newStorePhone.trim(),
      whatsapp: newStorePhone.trim().replace(/[^0-9]/g, ''),
      ownerId: registeredUser?.id || currentUser?.id
    });
    setAuthLoading(false);

    if (error) {
      setAuthError(error.message || 'Error al crear la tienda.');
      return;
    }

    showToast('¡Tu tienda ha sido creada exitosamente!', 'success');
    triggerConfetti();
    setViewMode('admin');
  };

  return (
    <section id="panel-acceso" className="spectator-auth-wrapper max-w-xl mx-auto px-4 sm:px-6 pb-16 w-full">
      <div className="spectator-auth-card rounded-3xl p-6 sm:p-8 relative overflow-hidden text-left">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Portal de Acceso Comerciantes
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Inicia sesión con tu tienda o regístrate en solo 2 pasos
          </p>
        </div>

        {/* Switcher Modo */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
          <button
            onClick={() => { setAuthMode('login'); setAuthError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            onClick={() => { setAuthMode('register'); setAuthError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Crear mi Tienda</span>
          </button>
        </div>

        {/* Alerta de Error */}
        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-fade-in-up">
            <span className="shrink-0 text-rose-500 font-bold">⚠️</span>
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="dueño@minimarket.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <span>Ingresando al sistema...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar a mi Panel</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Register Form (2 Steps) */}
        {authMode === 'register' && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className={`text-[11px] font-bold ${regStep === 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
                1. Tus Credenciales {regStep > 1 && '✓'}
              </span>
              <span className={`text-[11px] font-bold ${regStep === 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                2. Datos de la Tienda
              </span>
            </div>

            {regStep === 1 ? (
              <form onSubmit={handleRegisterStep1} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Completo del Dueño
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico (Tu acceso)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="juanperez@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contraseña (Mínimo 6 caracteres)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {authLoading ? (
                    <span>Validando datos...</span>
                  ) : (
                    <>
                      <span>Continuar a Datos de la Tienda</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterStep2} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre de tu Tienda / Negocio
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      placeholder="Minimarket El Trébol"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enlace único de tu tienda
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-400 text-xs px-2.5 py-2.5 rounded-l-xl select-none font-medium">
                      market/
                    </span>
                    <input
                      type="text"
                      required
                      value={newStoreSlug}
                      onChange={(e) => setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                      placeholder="minimarket-trebol"
                      className="w-full pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs sm:text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de WhatsApp de Pedidos
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={newStorePhone}
                      onChange={(e) => setNewStorePhone(e.target.value)}
                      placeholder="+591 70000000"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {authLoading ? <span>Creando tu tienda...</span> : <span>¡Lanzar mi Tienda!</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Continuar como espectador */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <button
            onClick={onExploreStore}
            className="text-xs font-semibold text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>O continuar como espectador en la tienda demo</span>
          </button>
        </div>

      </div>
    </section>
  );
};
