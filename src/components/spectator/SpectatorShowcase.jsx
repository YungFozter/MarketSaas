import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Building2, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  PlusCircle, 
  ArrowRight, 
  Search, 
  MapPin, 
  Volume2, 
  FileSpreadsheet, 
  Layers, 
  ShieldCheck, 
  Plus, 
  Minus,
  BatteryCharging,
  Signal,
  Wifi
} from 'lucide-react';
import './SpectatorShowcase.css';

export const SpectatorShowcase = ({ onExploreStore, onGoToMerchant }) => {
  const [activeTab, setActiveTab] = useState('residents'); // 'residents' | 'merchants' | 'condos'

  // Estado interactivo dentro del simulador de smartphone
  const [milkQuantity, setMilkQuantity] = useState(1);
  const [breadQuantity, setBreadQuantity] = useState(0);

  const breadPrice = 1190;
  const milkPrice = 1450;
  const totalCartItems = milkQuantity + breadQuantity;
  const totalCartPrice = (milkQuantity * milkPrice) + (breadQuantity * breadPrice);
  const totalVeciPoints = (milkQuantity * 8) + (breadQuantity * 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
      
      {/* Encabezado de Sección */}
      <div className="text-center mb-8 sm:mb-12">
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3.5 py-1 rounded-full">
          Experiencia Integrada
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-2 tracking-tight">
          Una sola solución para cada participante del barrio
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-slate-600 max-w-xl mx-auto">
          Selecciona una perspectiva para ver cómo simplificamos las compras de última hora en condominios.
        </p>

        {/* Pestañas Segmentadas */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 backdrop-blur-md shadow-2xs gap-1 max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('residents')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'residents' ? 'spectator-tab-active' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛍️</span>
              <span>Para Residentes</span>
            </button>

            <button
              onClick={() => setActiveTab('merchants')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'merchants' ? 'spectator-tab-active' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏪</span>
              <span>Para Comerciantes</span>
            </button>

            <button
              onClick={() => setActiveTab('condos')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'condos' ? 'spectator-tab-active' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏢</span>
              <span>Para Condominios</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. TAB: PARA RESIDENTES */}
      {activeTab === 'residents' && (
        <div className="spectator-showcase-panel flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 rounded-3xl animate-fade-in-up">
          
          {/* Columna Izquierda: Lista de Beneficios */}
          <div className="w-full lg:w-1/2 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Experiencia Móvil de Alta Velocidad</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Pide tus esenciales sin salir de la torre ni pagar de más
            </h3>

            <div className="space-y-4 sm:space-y-5">
              
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-slate-900">Catálogo visual e intuitivo</div>
                  <div className="text-xs sm:text-sm text-slate-500">Bebidas heladas, lácteos, pan recién horneado y abarrotes categorizados para comprar en menos de 60 segundos.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-slate-900">Cierre en 1 toque por WhatsApp</div>
                  <div className="text-xs sm:text-sm text-slate-500">El pedido se pre-formatea con tu torre, departamento, método de pago y el desglose de productos exacto.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 shrink-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-slate-900">Programa VeciPuntos</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">+5% Retorno</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500">Acumula puntos en cada compra para canjear por descuentos automáticos o entregas bonificadas.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 shrink-0 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-slate-900">Botón "Pídelo si no está"</div>
                  <div className="text-xs sm:text-sm text-slate-500">¿Te falta un ingrediente especial? Sugiérelo en un toque y tu almacenero lo añade al inventario vecinal.</div>
                </div>
              </div>

            </div>

            <div className="pt-2">
              <button
                onClick={onExploreStore}
                className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-bold text-xs sm:text-sm hover:gap-3 transition-all cursor-pointer"
              >
                <span>Ver simulación completa de compra</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Columna Derecha: Mockup Interactivo de Smartphone */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="spectator-phone-frame w-full max-w-[330px] p-2.5 rounded-[2.8rem] shadow-2xl">
              
              <div className="spectator-phone-screen w-full rounded-[2.2rem] overflow-hidden text-slate-900 flex flex-col h-[540px] relative">
                
                {/* Status Bar */}
                <div className="h-6 bg-slate-100 flex items-center justify-between px-5 text-[10px] text-slate-500 select-none">
                  <span className="font-bold">09:41</span>
                  <div className="w-12 h-3.5 bg-slate-900 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <BatteryCharging className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Header de la Tienda en Móvil */}
                <div className="p-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      LA
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 leading-tight">Los Andes</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                          Abierto
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                        <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Torre B - Depto 402</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Chips de Categorías en Móvil */}
                <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto text-[10px]">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold whitespace-nowrap shadow-xs">
                    🔥 Rápidos
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold whitespace-nowrap">
                    Bebidas
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold whitespace-nowrap">
                    Lácteos
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold whitespace-nowrap">
                    Snacks
                  </span>
                </div>

                {/* Lista de Productos Interactivos */}
                <div className="p-3 space-y-2 flex-1 overflow-y-auto text-left">
                  
                  {/* Item 1: Marraqueta */}
                  <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-between gap-2 border border-slate-200/60 shadow-2xs">
                    <img 
                      src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80" 
                      alt="Pan fresco" 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Marraqueta Crujiente (1/2 kg)</div>
                      <div className="text-[10px] text-slate-400">Horneado hace 25 min</div>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">$1.190</div>
                    </div>
                    {breadQuantity === 0 ? (
                      <button
                        onClick={() => setBreadQuantity(1)}
                        className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs hover:bg-emerald-700 cursor-pointer active:scale-95 transition-transform"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-slate-200/80 px-1 py-0.5 rounded-lg text-xs font-bold">
                        <button onClick={() => setBreadQuantity(q => Math.max(0, q - 1))} className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center cursor-pointer">
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-3 text-center">{breadQuantity}</span>
                        <button onClick={() => setBreadQuantity(q => q + 1)} className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center cursor-pointer">
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Item 2: Leche Entera */}
                  <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-between gap-2 border border-slate-200/60 shadow-2xs">
                    <img 
                      src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80" 
                      alt="Leche natural" 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">Leche Entera Natural 1L</span>
                        <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[8px] font-black">+8 VP</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Refrigerada a 4°C</div>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">$1.450</div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-200/80 px-1 py-0.5 rounded-lg text-xs font-bold">
                      <button onClick={() => setMilkQuantity(q => Math.max(1, q - 1))} className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center cursor-pointer">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-3 text-center">{milkQuantity}</span>
                      <button onClick={() => setMilkQuantity(q => q + 1)} className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center cursor-pointer">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Aviso de Despacho Vecinal Gratis */}
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="text-[10px]">
                      <span className="font-bold text-amber-900 block uppercase">Despacho Vecinal Gratis</span>
                      <span className="text-slate-600">Tu pedido califica para entrega prioritaria en conserjería.</span>
                    </div>
                  </div>

                </div>

                {/* Floating WhatsApp Checkout Pill inside Phone */}
                <div className="p-2.5 bg-white/95 border-t border-slate-200/80">
                  <div className="spectator-whatsapp-pill w-full px-3 py-2 rounded-xl flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                        {totalCartItems}
                      </span>
                      <div className="text-left">
                        <div className="text-[11px] font-extrabold leading-none">Pedir por WhatsApp</div>
                        <div className="text-[9px] opacity-90">+{totalVeciPoints} VeciPuntos</div>
                      </div>
                    </div>
                    <span className="text-xs font-black">${totalCartPrice.toLocaleString('es-CL')}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. TAB: PARA COMERCIANTES */}
      {activeTab === 'merchants' && (
        <div className="spectator-showcase-panel flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 rounded-3xl animate-fade-in-up">
          
          <div className="w-full lg:w-1/2 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-xs sm:text-sm font-bold">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Tablero de Operación Ágil</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Control total de despachos, stock y caja diaria sin fricción
            </h3>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">
              Diseñado para el comerciante ocupado: actualiza stock desde tu celular, recibe alertas sonoras cuando ingresa una orden y gestiona el flujo de entregas a las torres en segundos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <Volume2 className="w-5 h-5 text-emerald-600 mb-1" />
                <div className="text-sm font-bold text-slate-900">Alerta Sonora</div>
                <div className="text-xs text-slate-500">Aviso instantáneo ante cada compra confirmada por WhatsApp.</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <FileSpreadsheet className="w-5 h-5 text-amber-600 mb-1" />
                <div className="text-sm font-bold text-slate-900">Cierre Contable</div>
                <div className="text-xs text-slate-500">Exporta reportes de ventas y conciliación a Excel con un clic.</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onGoToMerchant}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Ver Tablero de Despachos en Vivo</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Mockup Kanban de Despachos */}
          <div className="w-full lg:w-1/2">
            <div className="spectator-kanban-frame w-full p-4 sm:p-5 rounded-2xl shadow-inner space-y-3 text-left">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">Flujo de Despacho Activo</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  8 Pedidos Hoy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                
                {/* Columna 1: Pendiente */}
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-amber-700 text-[10px] font-bold uppercase">
                    <span>🟡 PENDIENTES (1)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>#1042</span>
                      <span className="text-[9px] text-slate-400">Hace 2 min</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Torre A • Depto 904</div>
                    <div className="text-[11px] font-black text-emerald-700 mt-1">$4.200 (3 items)</div>
                  </div>
                </div>

                {/* Columna 2: En Empaque */}
                <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-blue-700 text-[10px] font-bold uppercase">
                    <span>🔵 EN EMPAQUE (2)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>#1040</span>
                      <span className="text-[9px] text-slate-400">Hace 8 min</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Torre C • Depto 201</div>
                    <div className="text-[11px] font-black text-emerald-700 mt-1">$8.900 (Pan + Leche)</div>
                  </div>
                </div>

                {/* Columna 3: En Camino */}
                <div className="bg-white p-2.5 rounded-xl border border-purple-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-purple-700 text-[10px] font-bold uppercase">
                    <span>🟣 EN CAMINO (1)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>#1038</span>
                      <span className="text-[9px] text-slate-400">A conserjería</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Torre B • Depto 502</div>
                    <div className="text-[11px] font-black text-emerald-700 mt-1">Repartidor asignado</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. TAB: PARA CONDOMINIOS */}
      {activeTab === 'condos' && (
        <div className="spectator-showcase-panel flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 rounded-3xl animate-fade-in-up">
          
          <div className="w-full lg:w-1/2 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-xs sm:text-sm font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Seguridad y Vida Comunitaria</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Menos motos externas, mayor tranquilidad para tu edificio
            </h3>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">
              Reemplaza el flujo constante de repartidores foráneos por entregas consolidadas realizadas por personal verificado del barrio o directo a conserjería con registro digital.
            </p>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Acceso controlado sin códigos de citófono vulnerados.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Promoción de la economía circular entre residentes y comercios vecinos.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Coordinación directa con administración para casilleros y recepción.</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={onExploreStore}
                className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-bold text-xs sm:text-sm hover:underline cursor-pointer"
              >
                <span>Conoce los convenios para comunidades residenciales</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Columna Derecha: Auditoría Comunitaria Mensual */}
          <div className="w-full lg:w-1/2">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-left">
              <div className="text-sm sm:text-base font-extrabold text-slate-900">Auditoría Comunitaria Mensual</div>
              
              <div className="space-y-3">
                
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Reducción de delivery foráneo vehicular</span>
                    <span className="font-extrabold text-emerald-700">-68%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-1000" style={{ width: '68%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Entregas exitosas en conserjería</span>
                    <span className="font-extrabold text-emerald-700">99.4%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full transition-all duration-1000" style={{ width: '99.4%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Satisfacción vecinal registrada</span>
                    <span className="font-extrabold text-amber-600">4.9 / 5.0 ⭐</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: '96%' }}></div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
