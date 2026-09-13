import React, { useState, useMemo } from 'react';
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
  LogOut
} from 'lucide-react';

export const SuperAdminHome = () => {
  const { 
    subscriptionCodes, 
    generateSubscriptionCodes, 
    deleteSubscriptionCode, 
    addStoreSubscriptionTime,
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
  const [durationPreset, setDurationPreset] = useState('5min'); // '5min' | '30days' | '90days' | '180days' | '365days'
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestGenerated, setLatestGenerated] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  // Estados de filtrado y búsqueda
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'history' | 'stores'
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');

  // Separar códigos disponibles de canjeados
  const availableCodes = useMemo(() => {
    return (subscriptionCodes || []).filter(c => c.status === 'available');
  }, [subscriptionCodes]);

  const redeemedCodes = useMemo(() => {
    return (subscriptionCodes || []).filter(c => c.status === 'redeemed');
  }, [subscriptionCodes]);

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

  // Filtrado de tiendas
  const filteredStores = useMemo(() => {
    if (!storeSearchTerm.trim()) return stores;
    const q = storeSearchTerm.toLowerCase();
    return (stores || []).filter(s => 
      s.name?.toLowerCase().includes(q) ||
      s.slug?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q)
    );
  }, [stores, storeSearchTerm]);

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

          {/* CONTENIDO DE TAB 3: MONITOREO DE TIENDAS Y TIEMPO DIRECTO */}
          {activeTab === 'stores' && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={storeSearchTerm}
                    onChange={(e) => setStoreSearchTerm(e.target.value)}
                    placeholder="Buscar tienda por nombre o slug..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-slate-600 outline-none"
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {filteredStores.length} tienda(s) en la plataforma
                </span>
              </div>

              {filteredStores.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 text-xs">
                  No se encontraron tiendas registradas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/70 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Tienda</th>
                        <th className="p-3">Identificador (Slug)</th>
                        <th className="p-3">Estado Suscripción</th>
                        <th className="p-3">Vence el (UTC-4)</th>
                        <th className="p-3 text-right">Inyección de Tiempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredStores.map((st) => {
                        const sub = st.subscription || {};
                        const expIso = sub.subscriptionExpiresAt || sub.trialEndsAt;
                        const isExpired = expIso ? new Date(expIso).getTime() <= Date.now() : true;

                        return (
                          <tr key={st.id || st.slug} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-white block">
                                {st.name || 'Minimarket'}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                {st.address || st.tagline || 'Sin dirección'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-400">
                              {st.slug || st.id}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isExpired 
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {isExpired ? 'Expirada' : 'Activa'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-400">
                              {formatBoliviaDateTime(expIso)}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => addStoreSubscriptionTime(st.slug || st.id, 5)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] transition-colors cursor-pointer"
                                  title="Añadir 5 minutos para pruebas"
                                >
                                  +5 min
                                </button>
                                <button
                                  onClick={() => addStoreSubscriptionTime(st.slug || st.id, 43200)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] transition-colors cursor-pointer"
                                  title="Extender 30 días directos"
                                >
                                  +30 días
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
