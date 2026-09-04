import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, CheckCircle2, MessageCircle, X } from 'lucide-react';
import './SpectatorLegalModal.css';

export const LEGAL_TOPICS = {
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

export const SpectatorLegalModal = ({ topicKey, onClose, whatsappNumber = '59172125280' }) => {
  const selectedTopicData = topicKey ? LEGAL_TOPICS[topicKey] : null;

  const supportWaUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola MarketSaaS! Consulta sobre: ' + (selectedTopicData?.title || 'Soporte y Políticas')
  )}`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && topicKey) {
        onClose();
      }
    };

    if (topicKey) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [topicKey, onClose]);

  if (!selectedTopicData) return null;

  return createPortal(
    <div 
      className="spectator-legal-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="spectator-legal-modal-card relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[85vh] text-left"
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
            onClick={onClose}
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
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
