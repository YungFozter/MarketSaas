import React, { useState } from 'react';
import { 
  Store, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Clock, 
  Award, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  LogIn, 
  UserPlus, 
  Eye, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './SpectatorHome.css';

export const SpectatorHome = ({ onExploreStore, onOpenAuthModal }) => {
  const { 
    currentUser, 
    merchantStore, 
    signInMerchant, 
    signUpMerchant, 
    createMerchantStore, 
    showToast, 
    triggerConfetti,
    setViewMode,
    storeConfig
  } = useStore();

  // Estado para la demostración interactiva
  const [activeTab, setActiveTab] = useState('shopper'); // 'shopper' | 'merchant' | 'condo'

  // Estado para el panel de acceso integrado
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [regStep, setRegStep] = useState(1);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Campos de formulario Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Campos de formulario Registro
  const [ownerName, setOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);

  // Registro Paso 2
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreSlug, setNewStoreSlug] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');

  // Manejar Login Directo
  const handleDirectLogin = async (e) => {
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

    showToast('¡Bienvenido de vuelta a tu tienda!', 'success');
    triggerConfetti();
    setViewMode('admin');
  };

  // Manejar Registro Paso 1
  const handleRegisterStep1 = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!ownerName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setAuthError('Por favor completa todos los campos requeridos.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('La contraseña debe tener un mínimo de 6 caracteres.');
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

    if (data?.user) {
      setRegisteredUser(data.user);
    }
    setNewStoreName(`Minimarket ${ownerName.split(' ')[0]}`);
    setNewStoreSlug(`tienda-${ownerName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
    setRegStep(2);
  };

  // Manejar Registro Paso 2
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

    showToast('¡Felicitaciones! Tu tienda ha sido creada exitosamente.', 'success');
    triggerConfetti();
    setViewMode('admin');
  };

  const scrollToAuth = () => {
    const el = document.getElementById('panel-acceso');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="spectator-hero-bg min-h-screen text-slate-800 pb-16">
      
      {/* 1. SECCIÓN HERO DE BIENVENIDA */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Badge de Plataforma */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-2xs spectator-badge-glow animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Plataforma SaaS Hiperlocal para Barrios y Condominios</span>
            </div>
          </div>

          {/* Título Principal y Propuesta de Valor */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              El comercio de cercanía, <br className="hidden sm:inline" />
              <span className="spectator-gradient-text">digitalizado y a tu puerta.</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              MarketSaaS conecta a tiendas de barrio y minimarkets con sus residentes y vecinos: compras directas por WhatsApp, catálogo en vivo y panel de administración en tiempo real.
            </p>

            {/* Doble Call To Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={onExploreStore}
                className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Eye className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>Explorar Tienda Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={scrollToAuth}
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-2xl font-bold text-sm sm:text-base shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-600" />
                <span>Panel de Acceso / Iniciar Sesión</span>
              </button>
            </div>

            {/* Quick Metrics Ticker */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 block">15 min</span>
                <span className="text-xs text-slate-500 font-medium">Entrega hiperlocal a tu torre</span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                <span className="text-xl sm:text-2xl font-black text-teal-600 block">0%</span>
                <span className="text-xs text-slate-500 font-medium">Comisiones abusivas a terceros</span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                <span className="text-xl sm:text-2xl font-black text-amber-500 block">100%</span>
                <span className="text-xs text-slate-500 font-medium">Sincronización en tiempo real</span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                <span className="text-xl sm:text-2xl font-black text-indigo-600 block">Multi-Tenant</span>
                <span className="text-xs text-slate-500 font-medium">Cada dueño con su tienda propia</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. DEMOSTRADOR INTERACTIVO DE PERSPECTIVAS */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Descubre las 3 dimensiones del sistema
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Diseñado para brindar fluidez al comprador, control total al comerciante y seguridad a la comunidad.
          </p>

          {/* Selector de Pestañas Interactivas */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/80 mt-4 max-w-md w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('shopper')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'shopper' ? 'spectator-pill-active' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Para Residentes</span>
            </button>
            <button
              onClick={() => setActiveTab('merchant')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'merchant' ? 'spectator-pill-active' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Para Comerciantes</span>
            </button>
            <button
              onClick={() => setActiveTab('condo')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'condo' ? 'spectator-pill-active' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Para Condominios</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Demostración Dinámica */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'shopper' && (
            <div className="spectator-glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <ShoppingBag className="w-3.5 h-3.5" /> Experiencia del Comprador
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Pide sin salir de tu departamento
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Catálogo visual:</strong> Productos frescos, abarrotes y bebidas con precios actualizados.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Pedido por WhatsApp:</strong> Envía tu carrito formateado con tu torre y depto en 1 clic.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>VeciPuntos:</strong> Acumula puntos de lealtad en cada compra y canjea descuentos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Pídelo si no está:</strong> Solicita productos que la tienda no tenga actualmente en catálogo.</span>
                    </li>
                  </ul>
                  <button
                    onClick={onExploreStore}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <span>Abrir catálogo de demostración</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-emerald-400">📱 Vista Móvil del Cliente</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Entrega Inmediata</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 flex items-center justify-between">
                      <span>Ubicación: <strong>Torre A - Depto 402</strong></span>
                      <span className="text-emerald-400 font-bold">✓ Verificado</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/80 flex items-center justify-between">
                      <span>Saldo VeciPuntos: <strong>340 pts</strong></span>
                      <span className="text-amber-400 font-bold">Nivel Plata</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-200">
                      <span>🚀 Pedido enviado por WhatsApp al dueño del Minimarket</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'merchant' && (
            <div className="spectator-glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                    <Store className="w-3.5 h-3.5" /> Experiencia del Comerciante
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Control absoluto de ventas y stock
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Tablero Kanban en vivo:</strong> Gestiona pedidos en estado pendiente, preparación y entregado.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Alertas Sonoras y Notificaciones:</strong> Entérate al instante de nuevos pedidos sin recargar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Exportación a CSV:</strong> Descarga tus reportes contables con fechas, clientes y montos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Personalización total:</strong> Modifica nombre de tienda, logo, colores y mensajes de WhatsApp.</span>
                    </li>
                  </ul>
                  <button
                    onClick={scrollToAuth}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-4 py-2.5 rounded-xl border border-amber-300 transition-colors cursor-pointer"
                  >
                    <span>Crear o acceder a mi panel</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-950 rounded-2xl p-5 text-white shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-amber-400">📊 Panel de Control en Vivo</span>
                    <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded">En tiempo real</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Ventas Hoy</span>
                      <span className="font-extrabold text-sm text-emerald-400">{storeConfig.currencySymbol || 'Bs.'} 420.50</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Pedidos Activos</span>
                      <span className="font-extrabold text-sm text-amber-400">3 en preparación</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 text-xs border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Último Pedido Recibido</span>
                    <p className="font-bold truncate text-slate-200">#ORD-9421 • Ana Ruiz (Torre B - 501)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'condo' && (
            <div className="spectator-glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900">
                    <Building2 className="w-3.5 h-3.5" /> Comunidades y Urbanizaciones
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Comercio seguro y privado en tu comunidad
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Entregas seguras:</strong> El repartidor de la tienda ya conoce las torres y conserjería.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Sin intermediarios desconocidos:</strong> Fomenta la economía local y la confianza entre vecinos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Avisos directos:</strong> Promociones exclusivas para residentes y horarios especiales.</span>
                    </li>
                  </ul>
                  <button
                    onClick={onExploreStore}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-900 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <span>Ver cómo funciona la entrega</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-indigo-400">🏢 Red Hiperlocal Activa</span>
                    <span className="text-[10px] bg-indigo-950 text-indigo-200 px-2 py-0.5 rounded">Comunidad Privada</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-800/90">
                      <span className="text-[10px] text-slate-400 block uppercase">Condominio Piloto:</span>
                      <span className="font-bold text-slate-100">Torres del Valle • 4 Torres • 160 Deptos</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/90 text-emerald-300 font-medium">
                      ✓ Retiro rápido en puerta de tienda o delivery directo a ascensor
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. PANEL DE ACCESO Y LOGIN PROFESIONAL INTEGRADO */}
      <section id="panel-acceso" className="py-12 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
        <div className="spectator-auth-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl relative overflow-hidden">
          
          {/* Header del Panel */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Portal de Comerciantes
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Inicia sesión con tu tienda o regístrate en solo 2 pasos
            </p>
          </div>

          {/* Switch de Modo: Iniciar Sesión vs Crear Tienda */}
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

          {/* Mensaje de Error */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-fade-in-up">
              <span className="shrink-0 text-rose-500 font-bold">⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          {/* FORMULARIO: INICIAR SESIÓN */}
          {authMode === 'login' && (
            <form onSubmit={handleDirectLogin} className="space-y-4 animate-fade-in-up">
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

          {/* FORMULARIO: CREAR TIENDA (2 PASOS) */}
          {authMode === 'register' && (
            <div className="animate-fade-in-up">
              {/* Indicador de pasos */}
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

          {/* Enlace alternativo para explorar como espectador */}
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

    </div>
  );
};
