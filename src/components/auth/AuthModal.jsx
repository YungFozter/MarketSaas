import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  X,
  Sparkles,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../services/supabaseClient';
import './AuthModal.css';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { 
    signInMerchant, 
    signUpMerchant, 
    createMerchantStore, 
    currentUser,
    setViewMode,
    showToast 
  } = useStore();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const [registerStep, setRegisterStep] = useState(1); // 1: Datos Dueño, 2: Datos Tienda
  const [registeredUser, setRegisteredUser] = useState(null);
  
  // Campos de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Campos de Recuperación de Contraseña
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Campos para Establecer Nueva Contraseña (Recovery final)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Campos de Registro (Paso 1)
  const [ownerName, setOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Campos de Registro (Paso 2 - Tienda)
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Estados de proceso y feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generar slug a partir del nombre de tienda si no se ha editado manualmente
  useEffect(() => {
    if (!isSlugManual && storeName) {
      const generated = storeName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setStoreSlug(generated);
    }
  }, [storeName, isSlugManual]);

  const prevIsOpenRef = React.useRef(false);

  // Reset al abrir: únicamente cuando el modal pasa de cerrado (false) a abierto (true)
  useEffect(() => {
    if (isOpen) {
      if (!prevIsOpenRef.current || initialMode === 'update-password') {
        setErrorMsg('');
        setLoading(false);
        setMode(initialMode || 'login');
        if (initialMode !== 'update-password') {
          if (currentUser) {
            setRegisteredUser(currentUser);
            setRegisterStep(2);
          } else {
            setRegisteredUser(null);
            setRegisterStep(1);
          }
        }
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialMode, currentUser]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Manejador de Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    const { error, store } = await signInMerchant(loginEmail.trim(), loginPassword);
    setLoading(false);

    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        setErrorMsg('Correo o contraseña incorrectos. Verifica tus datos.');
      } else if (error.message?.includes('Email not confirmed')) {
        setErrorMsg('Por favor revisa tu bandeja de correo para confirmar tu cuenta.');
      } else {
        setErrorMsg(error.message || 'Error al iniciar sesión.');
      }
      return;
    }

    if (!store) {
      // Si el usuario existe pero no tiene tienda, guiarlo al paso 2 de inmediato sin cerrar el modal
      setMode('register');
      setRegisterStep(2);
      showToast('Sesión verificada. Completa los datos de tu tienda para comenzar.', 'info');
      return;
    }

    onClose();
  };

  // Manejador de Recuperación de Contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!supabase) {
      setErrorMsg('El servicio de autenticación no está disponible.');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: redirectUrl
      });
      setLoading(false);

      if (error) {
        setErrorMsg(error.message || 'Error al solicitar el enlace de restablecimiento.');
      } else {
        setForgotSuccess(true);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Error de red al procesar la solicitud.');
    }
  };

  // Manejador para Guardar la Nueva Contraseña (flujo final de recuperación)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Verifica que ambas sean iguales.');
      return;
    }

    if (!supabase) {
      setErrorMsg('El servicio de autenticación no está disponible.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      setLoading(false);

      if (error) {
        setErrorMsg(error.message || 'Error al actualizar la contraseña.');
        return;
      }

      showToast('¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.', 'success');

      // Limpiar hash de recuperación de la URL
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      setNewPassword('');
      setConfirmPassword('');
      if (data?.user?.email) {
        setLoginEmail(data.user.email);
      }
      setMode('login');
    } catch (err) {
      setLoading(false);
      setErrorMsg('Error de conexión al actualizar la contraseña.');
    }
  };

  // Manejador de Registro - Paso 1: Usuario
  const handleRegisterStep1 = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!ownerName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Por favor completa todos tus datos personales.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { data, error } = await signUpMerchant(regEmail.trim(), regPassword, ownerName.trim());
    setLoading(false);

    if (error) {
      if (error.message?.includes('already registered')) {
        setErrorMsg('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
      } else if (error.message?.includes('invalid')) {
        setErrorMsg('El formato del correo es inválido. Utiliza un correo real (ej. @gmail.com).');
      } else {
        setErrorMsg(error.message || 'Error al registrar la cuenta.');
      }
      return;
    }

    if (data?.user) {
      setRegisteredUser(data.user);
    }

    // Pasamos a crear tienda
    setRegisterStep(2);
    if (!storeName) {
      setStoreName(`Minimarket ${ownerName.split(' ')[0]}`);
    }
  };

  // Manejador de Registro - Paso 2: Tienda (Tenant)
  const handleRegisterStep2 = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!storeName.trim() || !storeSlug.trim()) {
      setErrorMsg('El nombre de la tienda y el enlace son requeridos.');
      return;
    }

    const RESERVED_SLUGS = [
      'admin', 'api', 'auth', 'login', 'register', 'default', 'null',
      'undefined', 'dashboard', 'settings', 'store', 'public', 'system', 'root'
    ];
    if (RESERVED_SLUGS.includes(storeSlug.trim().toLowerCase())) {
      setErrorMsg(`"${storeSlug}" es una palabra reservada del sistema. Por favor elige otro enlace.`);
      return;
    }

    setLoading(true);
    const resolvedOwnerId = registeredUser?.id || currentUser?.id || (await supabase?.auth?.getUser())?.data?.user?.id;
    const { data, error } = await createMerchantStore({
      storeName: storeName.trim(),
      slug: storeSlug.trim(),
      phone: phone.trim(),
      whatsapp: phone.trim().replace(/[^0-9]/g, ''),
      ownerId: resolvedOwnerId
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Error al configurar la tienda.');
      return;
    }

    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera con Gradiente de Marca */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 sm:p-6 text-white text-center relative shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md mb-2 shadow-inner border border-white/20">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Portal de Comerciantes
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            Gestiona tu minimarket, inventario en vivo y pedidos de vecinos.
          </p>

          {/* Selector de Pestañas (Tabs) o Badge de Restablecimiento */}
          {mode !== 'update-password' ? (
            <div className="flex bg-black/20 p-1 rounded-2xl mt-4 border border-white/10 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Crear Tienda
              </button>
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
              <KeyRound className="w-4 h-4" />
              <span>Restablecer Contraseña</span>
            </div>
          )}
        </div>

        {/* Contenedor del Formulario con scroll independiente */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* ========================================================
              MODO 1: INICIAR SESIÓN
             ======================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@mitienda.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(''); setForgotSuccess(false); setForgotEmail(loginEmail); }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar a mi Panel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(''); }}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  ¿No tienes una tienda aún? Crea una gratis aquí
                </button>
              </div>
            </form>
          )}

          {/* ========================================================
              MODO 3: RECUPERAR CONTRASEÑA
             ======================================================== */}
          {mode === 'forgot' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Recupera el Acceso a tu Tienda</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingresa tu correo registrado y te enviaremos un enlace seguro para restablecer tu contraseña.
                </p>
              </div>

              {forgotSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-bold">¡Enlace de recuperación enviado!</p>
                  <p className="text-emerald-800 text-[11px]">
                    Revisa tu bandeja de entrada en <strong>{forgotEmail}</strong> (y la carpeta de spam o promociones) para crear tu nueva contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setForgotSuccess(false); }}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Correo Electrónico Registrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="ejemplo@mitienda.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando enlace...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Enlace de Recuperación</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrorMsg(''); }}
                      className="text-xs font-semibold text-slate-600 hover:text-emerald-700 cursor-pointer"
                    >
                      ← Volver a Iniciar Sesión
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================
              MODO 4: ACTUALIZAR CONTRASEÑA (RECOVERY)
             ======================================================== */}
          {mode === 'update-password' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Ingresa tu Nueva Contraseña</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escribe una nueva clave segura para recuperar el acceso a tu cuenta.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Repite tu nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando contraseña...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Nueva Contraseña</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 cursor-pointer"
                  >
                    ← Volver a Iniciar Sesión
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              MODO 2: REGISTRO Y ONBOARDING EN 2 PASOS
             ======================================================== */}
          {mode === 'register' && (
            <div>
              {/* Indicador de Pasos */}
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    registerStep === 1 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {registerStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  <span className={`text-xs font-semibold ${registerStep === 1 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                    Tu Cuenta
                  </span>
                </div>

                <div className="w-8 h-0.5 bg-slate-200"></div>

                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    registerStep === 2 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    2
                  </div>
                  <span className={`text-xs font-semibold ${registerStep === 2 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                    Tu Tienda
                  </span>
                </div>
              </div>

              {/* PASO 1: Datos del Dueño */}
              {registerStep === 1 && (
                <form onSubmit={handleRegisterStep1} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. José Don Pepe"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="jose@almacen.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contraseña (mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creando tu cuenta...</span>
                      </>
                    ) : (
                      <>
                        <span>Continuar a Datos de la Tienda</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* PASO 2: Datos de la Tienda */}
              {registerStep === 2 && (
                <form onSubmit={handleRegisterStep2} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre del Minimarket / Tienda
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Minimarket Don Pepe"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Identificador / Enlace Público (Slug)
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Único e intransferible
                      </span>
                    </div>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="donpepe"
                        value={storeSlug}
                        onChange={(e) => {
                          setIsSlugManual(true);
                          setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''));
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 outline-none bg-slate-50/50 font-mono"
                      />
                    </div>
                    {/* Vista previa del link */}
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono truncate">
                      <span>Tu enlace será:</span>
                      <strong className="text-emerald-700">?store={storeSlug || 'tu-tienda'}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teléfono / WhatsApp de Pedidos
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="Ej. +591 72125280"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">¡Inicialización Inmediata!</span>
                      <span>Tu tienda se creará lista para subir tus propios productos o importar tu inventario desde Excel.</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser) {
                          onClose();
                        } else {
                          setRegisterStep(1);
                        }
                      }}
                      className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {currentUser ? 'Cancelar' : 'Atrás'}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando tu tienda...</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-4 h-4" />
                          <span>Finalizar y Abrir mi Tienda</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Enlace para Salir y Volver al Catálogo */}
        <div className="py-2.5 bg-slate-50/50 border-t border-slate-100 text-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>← Salir y volver a la tienda o catálogo</span>
          </button>
        </div>

        {/* Footer Informativo */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acceso encriptado y protegido con Supabase Auth</span>
        </div>

      </div>
    </div>
  );
};
