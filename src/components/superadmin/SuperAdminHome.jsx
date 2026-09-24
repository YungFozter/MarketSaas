import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Search, 
  Store, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  ArrowLeft, 
  RefreshCw, 
  Calendar, 
  Mail, 
  FileSpreadsheet, 
  Sparkles,
  Zap,
  Filter,
  LogOut,
  Megaphone,
  ExternalLink,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Ban,
  X,
  Send,
  Eye,
  CalendarClock,
  Power,
  CheckCircle2
} from 'lucide-react';

export const SuperAdminHome = () => {
  const { 
    subscriptionCodes, 
    generateSubscriptionCodes, 
    deleteSubscriptionCode, 
    addStoreSubscriptionTime,
    suspendStoreSubscription,
    impersonateStore,
    systemBroadcast,
    saveSystemBroadcast,
    stores, 
    formatBoliviaDateTime, 
    setViewMode, 
    signOutMerchant,
    showToast,
    isSuperAdmin,
    isAuthLoading,
    TRIAL_DURATION_MINUTES 
  } = useStore();

  // Estados de generación
  const [generateCount, setGenerateCount] = useState(1);
  const [durationPreset, setDurationPreset] = useState('30days'); // '30days' | '5min' | '90days' | '180days' | '365days'
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestGenerated, setLatestGenerated] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  // Estados de filtrado y búsqueda
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'history' | 'stores' | 'broadcast'
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');

  // Filtros comerciales y paginación de tiendas
  const [storeStatusFilter, setStoreStatusFilter] = useState('all'); // 'all' | 'active' | 'expiring_soon' | 'expired'
  const [storesPage, setStoresPage] = useState(1);
  const STORES_PER_PAGE = 10;

  // Modal de gestión de suscripción
  const [selectedStoreForSub, setSelectedStoreForSub] = useState(null);
  const [customDaysInput, setCustomDaysInput] = useState('');

  // Borrador de Aviso Global del Sistema
  const [broadcastDraft, setBroadcastDraft] = useState({
    active: false,
    message: '',
    type: 'info',
    link: '',
    linkText: ''
  });

  useEffect(() => {
    if (systemBroadcast) {
      setBroadcastDraft({
        active: Boolean(systemBroadcast.active),
        message: systemBroadcast.message || '',
        type: systemBroadcast.type || 'info',
        link: systemBroadcast.link || '',
        linkText: systemBroadcast.linkText || ''
      });
    }
  }, [systemBroadcast]);

  // Separar códigos disponibles de canjeados
  const availableCodes = useMemo(() => {
    return (subscriptionCodes || []).filter(c => c.status === 'available');
  }, [subscriptionCodes]);

  const redeemedCodes = useMemo(() => {
    return (subscriptionCodes || []).filter(c => c.status === 'redeemed');
  }, [subscriptionCodes]);

  // Estadísticas comerciales de tiendas
  const storeStats = useMemo(() => {
    const all = stores || [];
    const now = Date.now();
    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    all.forEach(st => {
      const sub = st.subscription || {};
      const expIso = sub.subscriptionExpiresAt || sub.trialEndsAt;
      const expTime = expIso ? new Date(expIso).getTime() : 0;
      const isExpired = expTime <= now;
      const daysRemaining = isExpired ? 0 : Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

      if (isExpired) {
        expiredCount++;
      } else {
        activeCount++;
        if (daysRemaining <= 5) {
          expiringSoonCount++;
        }
      }
    });

    return {
      total: all.length,
      active: activeCount,
      expiringSoon: expiringSoonCount,
      expired: expiredCount
    };
  }, [stores]);

  // Filtrado de códigos disponibles
  const filteredAvailableCodes = useMemo(() => {
    if (!searchTerm.trim()) return availableCodes;
    const q = searchTerm.toLowerCase();
    return availableCodes.filter(c => 
      c.code?.toLowerCase().includes(q) || 
      c.notes?.toLowerCase().includes(q) ||
      c.plan_name?.toLowerCase().includes(q)
    );
  }, [availableCodes, searchTerm]);

  // Filtrado de historial de canjes
  const filteredRedeemedCodes = useMemo(() => {
    if (!historySearchTerm.trim()) return redeemedCodes;
    const q = historySearchTerm.toLowerCase();
    return redeemedCodes.filter(c => 
      c.code?.toLowerCase().includes(q) ||
      c.redeemed_by_email?.toLowerCase().includes(q) ||
      c.redeemed_by_store_id?.toLowerCase().includes(q) ||
      c.redeemed_by_store_name?.toLowerCase().includes(q)
    );
  }, [redeemedCodes, historySearchTerm]);

  // Filtrado de tiendas combinado (búsqueda y estado de suscripción)
  const filteredStores = useMemo(() => {
    let list = stores || [];
    const now = Date.now();

    if (storeSearchTerm.trim()) {
      const q = storeSearchTerm.toLowerCase();
      list = list.filter(s => 
        s.name?.toLowerCase().includes(q) ||
        s.slug?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        (s.phone && String(s.phone).toLowerCase().includes(q)) ||
        (s.whatsapp && String(s.whatsapp).toLowerCase().includes(q))
      );
    }

    if (storeStatusFilter !== 'all') {
      list = list.filter(s => {
        const sub = s.subscription || {};
        const expIso = sub.subscriptionExpiresAt || sub.trialEndsAt;
        const expTime = expIso ? new Date(expIso).getTime() : 0;
        const isExpired = expTime <= now;
        const daysRemaining = isExpired ? 0 : Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

        if (storeStatusFilter === 'active') return !isExpired;
        if (storeStatusFilter === 'expiring_soon') return !isExpired && daysRemaining > 0 && daysRemaining <= 5;
        if (storeStatusFilter === 'expired') return isExpired;
        return true;
      });
    }

    return list;
  }, [stores, storeSearchTerm, storeStatusFilter]);

  // Paginación de tiendas
  const totalStorePages = Math.max(1, Math.ceil(filteredStores.length / STORES_PER_PAGE));
  const currentStoresPage = Math.min(storesPage, totalStorePages);

  const paginatedStores = useMemo(() => {
    const start = (currentStoresPage - 1) * STORES_PER_PAGE;
    return filteredStores.slice(start, start + STORES_PER_PAGE);
  }, [filteredStores, currentStoresPage]);

  // Exportar directorio de tiendas a CSV
  const handleExportStoresCSV = () => {
    if (!stores || stores.length === 0) {
      showToast('No hay tiendas para exportar.', 'error');
      return;
    }

    const headers = ['ID', 'Nombre', 'Slug', 'Telefono', 'Email', 'Direccion', 'Estado_Suscripcion', 'Dias_Restantes', 'Vence_UTC_4'];
    const now = Date.now();
    const rows = stores.map(st => {
      const sub = st.subscription || {};
      const expIso = sub.subscriptionExpiresAt || sub.trialEndsAt;
      const expTime = expIso ? new Date(expIso).getTime() : 0;
      const isExpired = expTime <= now;
      const daysRemaining = isExpired ? 0 : Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
      const statusText = isExpired ? 'VENCIDA' : (daysRemaining <= 5 ? 'POR_VENCER' : 'ACTIVA');

      return [
        `"${st.id || ''}"`,
        `"${(st.name || '').replace(/"/g, '""')}"`,
        `"${st.slug || ''}"`,
        `"${st.phone || st.whatsapp || ''}"`,
        `"${st.email || ''}"`,
        `"${(st.address || '').replace(/"/g, '""')}"`,
        `"${statusText}"`,
        daysRemaining,
        `"${formatBoliviaDateTime(expIso)}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `directorio_tiendas_marketsaas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Directorio de tiendas exportado en CSV.', 'success');
  };

  // WhatsApp helper
  const getWhatsAppLink = (st, isExpired, isExpiringSoon, daysRemaining) => {
    const raw = st.phone || st.whatsapp || '';
    const digits = String(raw).replace(/[^0-9]/g, '');
    if (!digits) return null;
    const finalPhone = digits.startsWith('591') ? digits : (digits.length === 8 ? `591${digits}` : digits);

    let text = `Hola *${st.name || 'comerciante'}*, te saludamos de MarketSaaS. `;
    if (isExpired) {
      text += `Tu suscripción al sistema ha vencido. ¿Deseas renovar tu plan para seguir vendiendo con normalidad?`;
    } else if (isExpiringSoon) {
      text += `Tu suscripción al sistema vencerá en ${daysRemaining} día(s). ¿Deseas renovar tu plan con anticipación?`;
    } else {
      text += `Te escribimos para saber cómo va la experiencia en tu tienda y si requieres alguna asistencia.`;
    }

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
  };

  // Handlers para el modal de suscripción
  const handleAddTimeToSelectedStore = async (minutes) => {
    if (!selectedStoreForSub) return;
    const targetSlug = selectedStoreForSub.slug || selectedStoreForSub.id;
    await addStoreSubscriptionTime(targetSlug, minutes);
    const updated = (stores || []).find(s => (s.slug || s.id) === targetSlug);
    if (updated) setSelectedStoreForSub(updated);
  };

  const handleCustomDaysSubmit = async (e) => {
    e.preventDefault();
    const days = parseInt(customDaysInput, 10);
    if (isNaN(days) || days <= 0) {
      showToast('Ingresa un número válido de días.', 'error');
      return;
    }
    await handleAddTimeToSelectedStore(days * 1440);
    setCustomDaysInput('');
  };

  const handleSuspendSelectedStore = async () => {
    if (!selectedStoreForSub) return;
    const confirmName = selectedStoreForSub.name || selectedStoreForSub.slug;
    if (window.confirm(`¿Estás seguro de suspender inmediatamente la suscripción de "${confirmName}"? La tienda quedará con acceso bloqueado hasta reactivarse.`)) {
      const targetSlug = selectedStoreForSub.slug || selectedStoreForSub.id;
      await suspendStoreSubscription(targetSlug);
      const updated = (stores || []).find(s => (s.slug || s.id) === targetSlug);
      if (updated) setSelectedStoreForSub(updated);
    }
  };

  // Manejar generación de códigos
  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    let days = 0;
    let mins = 0;
    let planName = 'Premium';

    if (durationPreset === '5min') {
      mins = 5;
      planName = 'Prueba Rápida 5 min';
    } else if (durationPreset === '30days') {
      days = 30;
      planName = 'Plan Mensual (30 Días)';
    } else if (durationPreset === '90days') {
      days = 90;
      planName = 'Plan Trimestral (3 Meses)';
    } else if (durationPreset === '180days') {
      days = 180;
      planName = 'Plan Semestral (6 Meses)';
    } else if (durationPreset === '365days') {
      days = 365;
      planName = 'Plan Anual (1 Año)';
    }

    try {
      const generated = await generateSubscriptionCodes({
        count: Number(generateCount) || 1,
        durationDays: days,
        durationMinutes: mins,
        planName,
        notes: notes.trim()
      });

      setLatestGenerated(generated);
      setNotes('');
    } catch (err) {
      showToast('Error al generar códigos de suscripción.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar código al portapapeles
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Código ${code} copiado al portapapeles`, 'success');
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  // Copiar todos los recién generados
  const handleCopyAllLatest = () => {
    if (!latestGenerated.length) return;
    const allText = latestGenerated.map(c => c.code).join('\n');
    navigator.clipboard.writeText(allText);
    showToast('¡Todos los códigos generados fueron copiados!', 'success');
  };

  // Exportar auditoría de canjes a CSV
  const handleExportCSV = () => {
    if (redeemedCodes.length === 0) {
      showToast('No hay registros de canjes para exportar.', 'error');
      return;
    }

    const headers = ['Codigo', 'Plan', 'Duracion', 'Canjeado_Por_Email', 'Tienda_ID', 'Tienda_Nombre', 'Fecha_Canje_UTC_4'];
    const rows = redeemedCodes.map(c => [
      `"${c.code || ''}"`,
      `"${c.plan_name || 'Premium'}"`,
      `"${c.duration_days > 0 ? `${c.duration_days} dias` : `${c.duration_minutes} min`}"`,
      `"${c.redeemed_by_email || 'dueño'}"`,
      `"${c.redeemed_by_store_id || ''}"`,
      `"${c.redeemed_by_store_name || ''}"`,
      `"${formatBoliviaDateTime(c.redeemed_at)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_canjes_marketsaas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Auditoría exportada exitosamente a CSV.', 'success');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Acceso Restringido</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Esta sección es de acceso exclusivo para el Super Administrador del sistema. Inicia sesión con tus credenciales autorizadas para ingresar.
        </p>
        <button
          onClick={() => setViewMode('spectator')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        
        {/* BARRA SUPERIOR DE NAVEGACIÓN Y TÍTULO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Volver a la tienda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Panel Maestro
                </span>
                <span className="text-xs font-mono text-slate-400">
                  UTC -04:00 (Bolivia)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                SuperAdmin: Licencias & Suscripciones
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('admin')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Ir a Administración de Tienda
            </button>
            <button
              onClick={() => setViewMode('customer')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              Ver Directorio Vecinos
            </button>
            <button
              onClick={signOutMerchant}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer"
              title="Cerrar sesión de SuperAdmin"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* 1. KPIs GLOBALES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Códigos</span>
              <KeyRound className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">
              {(subscriptionCodes || []).length}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Disponibles</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {availableCodes.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Canjeados</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
              {redeemedCodes.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Tiendas Registradas</span>
              <Store className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {(stores || []).length}
            </p>
          </div>
        </div>

        {/* 2. GENERADOR AVANZADO DE CÓDIGOS */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Generador de Códigos de Activación
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Genera códigos individuales o por lotes con duraciones predefinidas.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              Formato: MS-XXXX-XXXX
            </span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Selector de Duración */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Duración de Licencia
                </label>
                <select
                  value={durationPreset}
                  onChange={(e) => setDurationPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-400 outline-none transition-colors"
                >
                  <option value="5min">⚡ 5 Minutos (Prueba Inmediata)</option>
                  <option value="30days">🗓️ 1 Mes (30 Días)</option>
                  <option value="90days">🗓️ 3 Meses (90 Días)</option>
                  <option value="180days">🗓️ 6 Meses (180 Días)</option>
                  <option value="365days">👑 1 Año (365 Días)</option>
                </select>
              </div>

              {/* Selector de Cantidad */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Cantidad a Generar
                </label>
                <select
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-400 outline-none transition-colors"
                >
                  <option value={1}>1 Código</option>
                  <option value={5}>5 Códigos en lote</option>
                  <option value={10}>10 Códigos en lote</option>
                </select>
              </div>

              {/* Notas Opcionales */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Etiqueta / Nota (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Promo apertura Don Pepe"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:border-amber-400 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-98 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Generar {generateCount === 1 ? 'Código' : `${generateCount} Códigos`}</span>
                </>
              )}
            </button>
          </form>

          {/* Resultado de la última generación */}
          {latestGenerated.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 animate-scale-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Códigos recién creados ({latestGenerated.length}):
                </span>
                {latestGenerated.length > 1 && (
                  <button
                    onClick={handleCopyAllLatest}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Copiar todos
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {latestGenerated.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800"
                  >
                    <span className="font-mono font-bold text-emerald-400 text-sm tracking-wider">
                      {item.code}
                    </span>
                    <button
                      onClick={() => handleCopy(item.code)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedCode === item.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. SECCIONES: DISPONIBLES, AUDITORÍA HISTORIAL Y MONITOREO DE TIENDAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Navegación por pestañas */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'available'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Códigos Disponibles ({availableCodes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Historial de Canjes ({redeemedCodes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stores')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'stores'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Monitoreo de Tiendas ({(stores || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'broadcast'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Megaphone className="w-4 h-4 text-rose-400" />
              <span className="flex items-center gap-1.5">
                Avisos Globales
                {systemBroadcast?.active && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Aviso actualmente activo en tiendas" />
                )}
              </span>
            </button>
          </div>

          {/* CONTENIDO DE TAB 1: CÓDIGOS DISPONIBLES */}
          {activeTab === 'available' && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar código o nota..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-slate-600 outline-none"
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Mostrando {filteredAvailableCodes.length} código(s) listos para entrega
                </span>
              </div>

              {filteredAvailableCodes.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 text-xs">
                  No hay códigos disponibles que coincidan con la búsqueda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/70 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Duración</th>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Nota / Referencia</th>
                        <th className="p-3">Creado el (UTC-4)</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredAvailableCodes.map((codeItem) => (
                        <tr key={codeItem.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-emerald-400 text-sm">
                            {codeItem.code}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                              {codeItem.duration_days > 0 ? `${codeItem.duration_days} días` : `${codeItem.duration_minutes} min`}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">
                            {codeItem.plan_name || 'Premium'}
                          </td>
                          <td className="p-3 text-slate-400 italic">
                            {codeItem.notes || '—'}
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {formatBoliviaDateTime(codeItem.created_at)}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCopy(codeItem.code)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Copiar código"
                              >
                                {copiedCode === codeItem.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Estás seguro de eliminar el código ${codeItem.code}?`)) {
                                    deleteSubscriptionCode(codeItem.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Eliminar código accidental"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO DE TAB 2: HISTORIAL Y AUDITORÍA DE CANJES */}
          {activeTab === 'history' && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    placeholder="Buscar por correo, código o tienda..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-slate-600 outline-none"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Exportar Auditoría (.CSV)</span>
                </button>
              </div>

              {filteredRedeemedCodes.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 text-xs">
                  Aún no se han registrado canjes de códigos.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/70 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Correo Usuario</th>
                        <th className="p-3">Tienda Asignada</th>
                        <th className="p-3">Duración Otorgada</th>
                        <th className="p-3">Fecha y Hora Canje (UTC-4)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredRedeemedCodes.map((rc) => (
                        <tr key={rc.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-400 text-sm">
                            {rc.code}
                          </td>
                          <td className="p-3 font-medium text-slate-200">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              {rc.redeemed_by_email || 'dueño@marketsaas.com'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-white">
                              {rc.redeemed_by_store_name || rc.redeemed_by_store_id || 'Mi Tienda'}
                            </span>
                            <span className="block text-[10px] font-mono text-slate-500">
                              ID: {rc.redeemed_by_store_id}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                              {rc.duration_days > 0 ? `+${rc.duration_days} días` : `+${rc.duration_minutes} min`}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            {formatBoliviaDateTime(rc.redeemed_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO DE TAB 3: MONITOREO DE TIENDAS Y GESTIÓN COMERCIAL */}
          {activeTab === 'stores' && (
            <div className="p-4 sm:p-6 space-y-5">
              {/* Filtros comerciales chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => { setStoreStatusFilter('all'); setStoresPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    storeStatusFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Todas ({storeStats.total})</span>
                </button>

                <button
                  onClick={() => { setStoreStatusFilter('active'); setStoresPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    storeStatusFilter === 'active'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Activas ({storeStats.active})</span>
                </button>

                <button
                  onClick={() => { setStoreStatusFilter('expiring_soon'); setStoresPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    storeStatusFilter === 'expiring_soon'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Próximas a Vencer ≤ 5 días ({storeStats.expiringSoon})</span>
                </button>

                <button
                  onClick={() => { setStoreStatusFilter('expired'); setStoresPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    storeStatusFilter === 'expired'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Vencidas / Pausadas ({storeStats.expired})</span>
                </button>
              </div>

              {/* Barra de Búsqueda y Exportación */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={storeSearchTerm}
                    onChange={(e) => { setStoreSearchTerm(e.target.value); setStoresPage(1); }}
                    placeholder="Buscar por nombre, slug o teléfono..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-slate-600 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportStoresCSV}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Exportar directorio completo a CSV"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Exportar Tiendas (.CSV)</span>
                  </button>
                </div>
              </div>

              {filteredStores.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 text-xs">
                  No se encontraron tiendas que coincidan con los filtros seleccionados.
                </div>
              ) : (
                <>
                  {/* Vista de Tabla para Escritorio */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/70 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Tienda</th>
                          <th className="p-3">Slug</th>
                          <th className="p-3">Estado Suscripción</th>
                          <th className="p-3">Vence el (UTC-4)</th>
                          <th className="p-3">Contacto Directo</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {paginatedStores.map((st) => {
                          const sub = st.subscription || {};
                          const expIso = sub.subscriptionExpiresAt || sub.trialEndsAt;
                          const expTime = expIso ? new Date(expIso).getTime() : 0;
                          const isExpired = expTime <= Date.now();
                          const daysRemaining = isExpired ? 0 : Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
                          const isExpiringSoon = !isExpired && daysRemaining > 0 && daysRemaining <= 5;
                          const waUrl = getWhatsAppLink(st, isExpired, isExpiringSoon, daysRemaining);

                          return (
                            <tr key={st.id || st.slug} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3">
                                <span className="font-bold text-white block">
                                  {st.name || 'Minimarket'}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                  {st.address || st.tagline || 'Sin dirección registrada'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-400">
                                {st.slug || st.id}
                              </td>
                              <td className="p-3">
                                {isExpired ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-rose-500/10 text-rose-400 border-rose-500/20 inline-flex items-center gap-1">
                                    <Ban className="w-3 h-3" />
                                    Expirada
                                  </span>
                                ) : isExpiringSoon ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20 inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Por vencer ({daysRemaining}d)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Activa ({daysRemaining}d)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-slate-400">
                                {formatBoliviaDateTime(expIso)}
                              </td>
                              <td className="p-3">
                                {waUrl ? (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] transition-colors"
                                    title="Escribir por WhatsApp al dueño"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-600 italic">Sin teléfono</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => impersonateStore(st.slug || st.id)}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 hover:text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                    title="Ingresar al panel administrativo de esta tienda (Modo Soporte)"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Acceder</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedStoreForSub(st)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                    title="Modificar tiempo o suspender suscripción"
                                  >
                                    <CalendarClock className="w-3 h-3" />
                                    <span>Licencia</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de Tarjetas para Móviles */}
                  <div className="md:hidden space-y-3">
                    {paginatedStores.map((st) => {
                      const sub = st.subscription || {};
                      const expIso = sub.subscriptionExpiresAt || sub.trialEndsAt;
                      const expTime = expIso ? new Date(expIso).getTime() : 0;
                      const isExpired = expTime <= Date.now();
                      const daysRemaining = isExpired ? 0 : Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpiringSoon = !isExpired && daysRemaining > 0 && daysRemaining <= 5;
                      const waUrl = getWhatsAppLink(st, isExpired, isExpiringSoon, daysRemaining);

                      return (
                        <div
                          key={st.id || st.slug}
                          className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-white text-sm">
                                {st.name || 'Minimarket'}
                              </h3>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                /{st.slug || st.id}
                              </p>
                            </div>
                            <div>
                              {isExpired ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1">
                                  <Ban className="w-3 h-3" />
                                  Expirada
                                </span>
                              ) : isExpiringSoon ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Vence en {daysRemaining}d
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Activa ({daysRemaining}d)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-900">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Vencimiento:</span>
                              <span className="font-mono text-slate-300">{formatBoliviaDateTime(expIso)}</span>
                            </div>
                            {st.phone && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Teléfono:</span>
                                <span className="font-mono text-slate-300">{st.phone}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1">
                            {waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center justify-center gap-1 text-center"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            ) : (
                              <button
                                disabled
                                className="px-2 py-2 rounded-xl bg-slate-900 text-slate-600 font-bold text-[11px] flex items-center justify-center gap-1 cursor-not-allowed"
                              >
                                <span>Sin Wpp</span>
                              </button>
                            )}

                            <button
                              onClick={() => impersonateStore(st.slug || st.id)}
                              className="px-2 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] flex items-center justify-center gap-1 text-center cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Acceder</span>
                            </button>

                            <button
                              onClick={() => setSelectedStoreForSub(st)}
                              className="px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 text-center cursor-pointer"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              <span>Licencia</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barra de Paginación */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                    <div>
                      Mostrando{' '}
                      <span className="font-bold text-white">
                        {(currentStoresPage - 1) * STORES_PER_PAGE + 1}
                      </span>{' '}
                      a{' '}
                      <span className="font-bold text-white">
                        {Math.min(currentStoresPage * STORES_PER_PAGE, filteredStores.length)}
                      </span>{' '}
                      de{' '}
                      <span className="font-bold text-white">{filteredStores.length}</span> tiendas
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStoresPage(p => Math.max(1, p - 1))}
                        disabled={currentStoresPage <= 1}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer transition-colors"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white text-xs">
                        {currentStoresPage} / {totalStorePages}
                      </span>
                      <button
                        onClick={() => setStoresPage(p => Math.min(totalStorePages, p + 1))}
                        disabled={currentStoresPage >= totalStorePages}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer transition-colors"
                        title="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CONTENIDO DE TAB 4: AVISOS GLOBALES DEL SISTEMA */}
          {activeTab === 'broadcast' && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-rose-400" />
                    Difusión de Avisos Globales a Comerciantes
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configura un banner que se desplegará en la parte superior del panel de control de todas las tiendas.
                  </p>
                </div>
                {broadcastDraft.active && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 inline-flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Aviso en Vivo
                  </span>
                )}
              </div>

              {/* Vista previa en tiempo real */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Vista Previa en Tiendas:
                </span>
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-md transition-all ${
                  broadcastDraft.type === 'alert'
                    ? 'bg-rose-950/80 border-rose-500/40 text-rose-100'
                    : broadcastDraft.type === 'warning'
                    ? 'bg-amber-950/80 border-amber-500/40 text-amber-100'
                    : broadcastDraft.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100'
                    : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-100'
                }`}>
                  <div className="flex items-center gap-2.5 text-xs font-medium">
                    <Megaphone className={`w-4 h-4 shrink-0 ${
                      broadcastDraft.type === 'alert' ? 'text-rose-400' :
                      broadcastDraft.type === 'warning' ? 'text-amber-400' :
                      broadcastDraft.type === 'success' ? 'text-emerald-400' : 'text-indigo-400'
                    }`} />
                    <span>{broadcastDraft.message || 'Escribe un mensaje abajo para previsualizar aquí...'}</span>
                  </div>
                  {broadcastDraft.link && (
                    <span className="text-xs font-bold underline shrink-0 cursor-pointer">
                      {broadcastDraft.linkText || 'Ver más'} &rarr;
                    </span>
                  )}
                </div>
              </div>

              {/* Formulario de configuración */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSystemBroadcast(broadcastDraft);
                }}
                className="space-y-4 pt-2"
              >
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    id="broadcastActive"
                    checked={broadcastDraft.active}
                    onChange={(e) => setBroadcastDraft(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="broadcastActive" className="text-xs font-bold text-white cursor-pointer select-none">
                    Activar y mostrar este aviso inmediatamente en todas las tiendas
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tipo de Notificación
                    </label>
                    <select
                      value={broadcastDraft.type}
                      onChange={(e) => setBroadcastDraft(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-400 outline-none transition-colors"
                    >
                      <option value="info">ℹ️ Información General (Azul)</option>
                      <option value="warning">⚠️ Advertencia / Vencimientos (Ámbar)</option>
                      <option value="success">🎉 Novedad / Éxito (Verde)</option>
                      <option value="alert">🚨 Urgente / Mantenimiento (Rojo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Enlace Opcional (URL)
                    </label>
                    <input
                      type="url"
                      value={broadcastDraft.link}
                      onChange={(e) => setBroadcastDraft(prev => ({ ...prev, link: e.target.value }))}
                      placeholder="https://ejemplo.com o #actualizaciones"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:border-amber-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Mensaje del Aviso
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastDraft.message}
                      onChange={(e) => setBroadcastDraft(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Ej: Estimados comerciantes, realizaremos una actualización de servidores hoy a las 23:00 UTC-4 durante 15 minutos."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:border-amber-400 outline-none transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Texto del Botón (Opcional)
                    </label>
                    <input
                      type="text"
                      value={broadcastDraft.linkText}
                      onChange={(e) => setBroadcastDraft(prev => ({ ...prev, linkText: e.target.value }))}
                      placeholder="Ej. Conocer más"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:border-amber-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Guardar y Publicar Aviso</span>
                  </button>

                  {broadcastDraft.active && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...broadcastDraft, active: false };
                        setBroadcastDraft(updated);
                        saveSystemBroadcast(updated);
                      }}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Desactivar Aviso Actual
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE GESTIÓN AVANZADA DE SUSCRIPCIÓN PARA UNA TIENDA */}
      {selectedStoreForSub && (() => {
        const sub = selectedStoreForSub.subscription || {};
        const expIso = sub.subscriptionExpiresAt || sub.trialEndsAt;
        const expTime = expIso ? new Date(expIso).getTime() : 0;
        const isExpired = expTime <= Date.now();
        const daysRemaining = isExpired ? 0 : Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-6 shadow-2xl relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-amber-400" />
                    Gestionar Suscripción de Tienda
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {selectedStoreForSub.name} ({selectedStoreForSub.slug || selectedStoreForSub.id})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStoreForSub(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Estado actual */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estado de Operación:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    isExpired
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isExpired ? 'Licencia Pausada / Expirada' : `Licencia Activa (${daysRemaining} días)`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Fecha de Vencimiento:</span>
                  <span className="text-slate-300">{formatBoliviaDateTime(expIso)}</span>
                </div>
              </div>

              {/* Botones de extensión rápida */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Inyección Directa de Tiempo:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAddTimeToSelectedStore(5)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    ⚡ +5 Minutos (Test)
                  </button>
                  <button
                    onClick={() => handleAddTimeToSelectedStore(21600)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    🗓️ +15 Días
                  </button>
                  <button
                    onClick={() => handleAddTimeToSelectedStore(43200)}
                    className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    💎 +30 Días (1 Mes)
                  </button>
                  <button
                    onClick={() => handleAddTimeToSelectedStore(129600)}
                    className="p-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    🚀 +90 Días (3 Meses)
                  </button>
                  <button
                    onClick={() => handleAddTimeToSelectedStore(525600)}
                    className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/30 text-amber-400 font-bold text-xs transition-colors cursor-pointer text-center col-span-2 sm:col-span-2"
                  >
                    👑 +365 Días (1 Año Completo)
                  </button>
                </div>
              </div>

              {/* Extensión personalizada en días */}
              <form onSubmit={handleCustomDaysSubmit} className="space-y-2 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Días Personalizados:
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={customDaysInput}
                    onChange={(e) => setCustomDaysInput(e.target.value)}
                    placeholder="Ej. 45"
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Aplicar Días
                  </button>
                </div>
              </form>

              {/* Zona de peligro / Suspensión inmediata */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Zona Administrativa de Control:
                </span>
                <button
                  type="button"
                  onClick={handleSuspendSelectedStore}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  <span>Suspender / Pausar Licencia Inmediatamente</span>
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setSelectedStoreForSub(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

