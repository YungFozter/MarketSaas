import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  PiggyBank, 
  MessageSquare, 
  Sparkles, 
  Layers, 
  PlusCircle, 
  Building2, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import './SpectatorCarousel.css';

const SYSTEM_FEATURES = [
  {
    id: 'delivery',
    icon: Zap,
    color: 'emerald',
    badge: 'HIPERLOCAL',
    title: 'Entregas en 15 a 30 min',
    subtitle: 'Directo a tu torre o puerta',
    description: 'Olvídate de esperas interminables. Tus compras cotidianas van desde el minimarket del vecindario directo a conserjería o ascensor en tiempo récord.',
    stat: '⚡ 15 min tiempo estimado'
  },
  {
    id: 'margin',
    icon: PiggyBank,
    color: 'amber',
    badge: 'TRATO DIRECTO',
    title: 'Comercio Justo y Cercano',
    subtitle: 'Relación directa sin intermediarios',
    description: 'Conectamos a los vecinos directamente con sus tiendas de confianza. Los pedidos apoyan la economía del barrio con total transparencia y cercanía.',
    stat: '🤝 Trato directo y transparente'
  },
  {
    id: 'whatsapp',
    icon: MessageSquare,
    color: 'emerald',
    badge: 'CONVERSIÓN',
    title: 'Compras por WhatsApp',
    subtitle: 'Confirmación en un toque',
    description: 'El carrito de compras genera un mensaje estructurado con emojis, torre, depto y desglose de productos para pedir al instante sin descargar apps.',
    stat: '📱 Directo al chat del comerciante'
  },
  {
    id: 'points',
    icon: Sparkles,
    color: 'amber',
    badge: 'LEALTAD',
    title: 'Club de VeciPuntos',
    subtitle: 'Recompensas comunitarias',
    description: 'Cada compra barrial suma puntos que los residentes pueden acumular y canjear por descuentos automáticos y beneficios exclusivos.',
    stat: '★ +5% retorno en cada compra'
  },
  {
    id: 'kanban',
    icon: Layers,
    color: 'blue',
    badge: 'OPERACIONES',
    title: 'Tablero Kanban en Vivo',
    subtitle: 'Alertas sonoras en tiempo real',
    description: 'El comerciante gestiona pedidos en 3 columnas ágiles (Pendiente, En Empaque, En Camino) con notificaciones acústicas automáticas.',
    stat: '🔔 Cero órdenes traspapeladas'
  },
  {
    id: 'requests',
    icon: PlusCircle,
    color: 'teal',
    badge: 'INVENTARIO',
    title: 'Botón "Pídelo si no está"',
    subtitle: 'Catálogo colaborativo',
    description: '¿Falta algún producto o marca especial? Los residentes lo solicitan con un toque y la tienda lo suma al catálogo de la semana.',
    stat: '🛒 Surtido según demanda vecinal'
  },
  {
    id: 'multitenant',
    icon: Building2,
    color: 'indigo',
    badge: 'MULTI-TENANT',
    title: 'Tienda Propia e Independiente',
    subtitle: 'Subdominio y catálogo aislado',
    description: 'Cada almacén cuenta con su enlace web dedicado, base de datos privada, personalización de colores corporativos y panel de gestión.',
    stat: '🏢 Datos y marcas 100% aislados'
  },
  {
    id: 'security',
    icon: ShieldCheck,
    color: 'teal',
    badge: 'SEGURIDAD',
    title: 'Tranquilidad en el Edificio',
    subtitle: 'Menos tránsito foráneo',
    description: 'Reduce el ingreso de repartidores desconocidos en los pasillos mediante entregas coordinadas por personal conocido de la zona o conserjería.',
    stat: '🛡️ -68% tránsito vehicular foráneo'
  }
];

export const SpectatorCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);

  // Ajustar tarjetas visibles según el ancho de pantalla
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCardsPerView(1);
      } else if (width < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, SYSTEM_FEATURES.length - cardsPerView);

  // Asegurar que el índice actual no sobrepase el máximo al cambiar de resolución
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  // Auto-play suave cada 5 segundos (se pausa al pasar el mouse)
  useEffect(() => {
    if (isPaused) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(autoPlayRef.current);
  }, [isPaused, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Cálculo de porcentaje de desplazamiento del track
  const itemWidthPercent = 100 / cardsPerView;
  const translateX = -(currentIndex * itemWidthPercent);

  return (
    <div 
      className="spectator-carousel-container w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Controles de Navegación Superiores */}
      <div className="flex items-center justify-between mb-2 sm:mb-2.5 px-1">
        <div className="text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
            Ecosistema MarketSaaS
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
            Ventajas y Capacidades del Sistema
          </h3>
        </div>

        {/* Flechas Anterior / Siguiente */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handlePrev}
            className="spectator-carousel-nav-btn"
            aria-label="Ver característica anterior"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            className="spectator-carousel-nav-btn"
            aria-label="Ver siguiente característica"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewport del Carrusel */}
      <div className="spectator-carousel-viewport">
        <div 
          className="spectator-carousel-track"
          style={{ transform: `translateX(${translateX}%)` }}
        >
          {SYSTEM_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                style={{ flex: `0 0 ${itemWidthPercent}%`, maxWidth: `${itemWidthPercent}%` }}
                className="px-1.5 sm:px-2"
              >
                <div className="spectator-carousel-card p-3.5 sm:p-4 text-left">
                  
                  {/* Card Header: Icono y Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        feature.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                        feature.color === 'amber' ? 'bg-amber-50 text-amber-700' :
                        feature.color === 'blue' ? 'bg-blue-50 text-blue-700' :
                        feature.color === 'indigo' ? 'bg-indigo-50 text-indigo-700' :
                        'bg-teal-50 text-teal-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                        feature.color === 'amber' ? 'bg-amber-100 text-amber-800' :
                        feature.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        feature.color === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-teal-100 text-teal-800'
                      }`}>
                        {feature.badge}
                      </span>
                    </div>

                    {/* Títulos */}
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug mb-0.5">
                      {feature.title}
                    </h4>
                    <div className="text-[11px] font-bold text-emerald-700 mb-1.5">
                      {feature.subtitle}
                    </div>

                    {/* Descripción */}
                    <p className="text-xs text-slate-500 leading-snug line-clamp-2 sm:line-clamp-3">
                      {feature.description}
                    </p>
                  </div>

                  {/* Card Footer: Métrica / Highlight */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100">
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <span>{feature.stat}</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicadores de Puntos (Dots / Pagination) */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => setCurrentIndex(dotIdx)}
            className={`spectator-carousel-dot ${currentIndex === dotIdx ? 'active' : ''}`}
            aria-label={`Ir a la diapositiva ${dotIdx + 1}`}
          />
        ))}
      </div>

    </div>
  );
};
