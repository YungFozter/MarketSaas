import React from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  TrendingUp, 
  Receipt,
  Calendar,
  Sparkles,
  Printer
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { 
  exportSalesToPDF, 
  exportSalesToStyledExcel, 
  exportSalesToCSV,
  prepareSalesData 
} from '../../utils/salesExportUtils';

export const ExportSalesReportModal = ({ isOpen, onClose }) => {
  const { orders = [], storeConfig, formatBoliviaDateTime, showToast } = useStore();

  if (!isOpen) return null;

  const { rows, summary } = prepareSalesData(orders, formatBoliviaDateTime);
  const storeName = storeConfig?.name || 'Mi Tienda';
  const currency = storeConfig?.currencySymbol || 'Bs.';

  const handleExportPDF = () => {
    if (orders.length === 0) {
      showToast('No hay pedidos registrados para exportar.', 'warning');
      return;
    }
    exportSalesToPDF(orders, storeConfig, formatBoliviaDateTime);
    showToast('Generando vista de reporte PDF...', 'success');
  };

  const handleExportExcel = () => {
    if (orders.length === 0) {
      showToast('No hay pedidos registrados para exportar.', 'warning');
      return;
    }
    exportSalesToStyledExcel(orders, storeConfig, formatBoliviaDateTime);
    showToast('Planilla Excel con celdas estilizadas descargada con éxito.', 'success');
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast('No hay pedidos registrados para exportar.', 'warning');
      return;
    }
    exportSalesToCSV(orders, storeConfig, formatBoliviaDateTime);
    showToast('Archivo CSV separado por columnas descargado con éxito.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-900 animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Exportar Reporte de Ventas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Descarga tu historial contable para <strong className="text-slate-800 font-bold">{storeName}</strong>
            </p>
          </div>
        </div>

        {/* Resumen KPI */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl mb-6">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Órdenes</span>
            <span className="text-base sm:text-lg font-black text-slate-900">{summary.totalCount}</span>
          </div>
          <div className="text-center border-x border-slate-200 px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recaudación</span>
            <span className="text-base sm:text-lg font-black text-emerald-600">{currency} {summary.totalAmountFormatted}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ticket Promedio</span>
            <span className="text-base sm:text-lg font-black text-slate-800">{currency} {summary.avgTicket}</span>
          </div>
        </div>

        {/* Opciones de Exportación */}
        <div className="space-y-3 mb-6">
          {/* Opción 1: PDF */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/60 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Documento PDF Oficial</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Imprimible</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reporte formal con membrete, KPIs contables y tabla formateada listo para imprimir o guardar en PDF.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Generar PDF</span>
            </button>
          </div>

          {/* Opción 2: Excel con Diseño */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/60 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Planilla Excel con Diseño (.XLS)</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Recomendado</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Celdas divididas por columnas, encabezados en color esmeralda, bordes y formatos de moneda.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Descargar Excel</span>
            </button>
          </div>

          {/* Opción 3: CSV Separado por Columnas */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Archivo CSV Delimitado (.CSV)</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Punto y Coma</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Separado por punto y coma (;) con UTF-8 BOM para abrirse automáticamente en columnas en Excel en español.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar CSV</span>
            </button>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Compatible con Excel, Google Sheets y PDF
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
