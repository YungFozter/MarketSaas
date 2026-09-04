import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Store, ShieldCheck, CheckCircle2, X, MessageCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './SpectatorFooter.css';

const LEGAL_TOPICS = {
  conserjeria: {
    title: 'Canal de Conserjería & Enlace Comunitario',
    desc: 'Protocolo de asistencia y enlace directo para personal de recepción, porterías y conserjerías de condominios conectados a MarketSaaS.',
    points: [
      'Identificación clara de paquetes con Torre, Bloque y Departamento del residente.',
      'Atención y canal directo de enlace para resolver dudas sobre entregas en conserjería.',
      'Avisos de despacho para que el residente retire a tiempo sin desorden en mesón.'
    ]
  },
  comunidad: {
    title: 'Pautas de Comunidad Segura',
    desc: 'Normas y compromisos de convivencia entre vecinos y comercios asociados a la red MarketSaaS.',
    points: [
      'Entregas prioritarias gestionadas por personal de minimarkets conocidos de la zona.',
      'Respeto a los reglamentos internos y horarios de ingreso de cada copropiedad.',
      'Canal abierto y receptivo para sugerencias vecinales y mejoras comunitarias.'
    ]
  },
  privacidad: {
    title: 'Privacidad de Edificios & Protección de Datos',
    desc: 'Compromiso de protección de información personal para residentes y administraciones.',
    points: [
      'Los datos de entrega se utilizan exclusivamente para coordinar el pedido en curso.',
      'Los repartidores nunca tienen acceso a números privados ni códigos de citófono.',
      'Infraestructura protegida con respaldo en bases de datos aisladas.'
    ]
  },
  terminos: {
    title: 'Términos del Servicio Hiperlocal',
    desc: 'Marco de funcionamiento y buenas prácticas de la plataforma tecnológica MarketSaaS.',
    points: [
      'MarketSaaS provee la suite digital e infraestructura de pedidos directos por WhatsApp.',
      'Los precios, stock y preparación son responsabilidad directa de cada tienda de barrio.',
      'Fomento permanente del comercio de proximidad con total transparencia.'
    ]
  }
};

export const SpectatorFooter = ({ onExploreStore, onScrollToAuth }) => {
  const { storeConfig } = useStore();
  const [activeTopic, setActiveTopic] = useState(null);

  const whatsappNumber = storeConfig?.whatsapp ? storeConfig.whatsapp.replace(/[^0-9]/g, '') : '59172125280';
  const supportWaUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola MarketSaaS! 💬 Tengo una consulta sobre soporte, conserjería o términos de la plataforma.')}`;

  const handleScrollToKanban = () => {
    const el = document.getElementById('section-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeTopic) {
        setActiveTopic(null);
      }
    };
    if (activeTopic) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTopic]);

  const selectedTopicData = activeTopic ? LEGAL_TOPICS[activeTopic] : null;

  return (
    <footer className="spectator-footer-container w-full text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-slate-800/80">
          
          {/* Columna 1: Identidad, Misión y Garantías */}
          <div className="space-y-4 md:col-span-5 pr-0 lg:pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  MarketSaaS
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              La plataforma moderna que impulsa el comercio de cercanía y empodera a los minimarkets de barrio. Unimos tecnología intuitiva, pedidos ágiles y confianza comunitaria para que vecinos y comerciantes disfruten de una experiencia digital rápida, humana y eficiente.
            </p>

            {/* Sello de Confianza Vecinal y Garantía */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 text-emerald-400 text-xs font-bold border border-emerald-800/60 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sello de Confianza Vecinal y Garantía de Entrega</span>
            </div>
          </div>

          {/* Columna 2: Navegación Rápida */}
          <div className="space-y-3.5 md:col-span-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Navegación Rápida
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Sobre la Solución</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onExploreStore}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Catálogo en Vivo</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleScrollToKanban}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Tablero Kanban Despacho</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onScrollToAuth}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Ingreso Locatarios</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Soporte & Comunidad */}
          <div className="space-y-3.5 md:col-span-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Soporte & Legal
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTopic('conserjeria')}
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer text-left w-full group"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Canal de Conserjería & Enlace</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTopic('comunidad')}
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer text-left w-full group"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Pautas de Comunidad Segura</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTopic('privacidad')}
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer text-left w-full group"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Privacidad de Edificios & Datos</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTopic('terminos')}
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer text-left w-full group"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Términos del Servicio Hiperlocal</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Fila Inferior */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
          <p className="text-slate-400">
            © {new Date().getFullYear()} <strong className="text-slate-200 font-semibold">MarketSaaS Inc.</strong> Plataforma SaaS Hiperlocal para Barrios y Condominios.
          </p>
        </div>

      </div>

      {/* Modal Informativo de Soporte & Políticas */}
      {selectedTopicData && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
          onClick={() => setActiveTopic(null)}
        >
          <div 
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[85vh] text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                  {selectedTopicData.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-600 text-xs sm:text-sm">
              <p className="leading-relaxed text-slate-700 font-medium">
                {selectedTopicData.desc}
              </p>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">Puntos Destacados:</span>
                {selectedTopicData.points.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3">
                <div className="text-xs text-emerald-950 font-medium">
                  ¿Necesitas asistencia directa o reportar un caso?
                </div>
                <a
                  href={supportWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </footer>
  );
};
