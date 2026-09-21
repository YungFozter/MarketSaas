import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  X, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  Sparkles, 
  Maximize2,
  Upload
} from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';

export const ProductCameraModal = ({ isOpen, onClose, onPhotoSelected }) => {
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (trasera) o 'user' (frontal)
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Estado de vista previa tras tomar la foto (tamaño original)
  const [capturedPhoto, setCapturedPhoto] = useState(null); // { dataUrl, width, height, blob }
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const fileFallbackRef = useRef(null);

  // Iniciar flujo de cámara
  const startCamera = useCallback(async (mode = facingMode) => {
    setCameraError(null);
    try {
      // Detener stream previo si existía
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a la cámara.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn('Error accediendo a cámara web/móvil:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Por favor habilita el acceso a la cámara en tu navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No se detectó ninguna cámara disponible en este dispositivo.');
      } else {
        setCameraError(err.message || 'No se pudo iniciar la cámara.');
      }
    }
  }, [facingMode]);

  // Detener flujo de cámara
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [stream]);

  // Manejar apertura/cierre del modal
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCameraError(null);
      startCamera('environment');
    } else {
      stopCamera();
      setCapturedPhoto(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Alternar entre cámara trasera y frontal
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capturar fotograma en tamaño original desde el video en vivo
  const handleCaptureShot = () => {
    if (!videoRef.current || !stream) return;
    const video = videoRef.current;
    
    // Validar dimensiones reales del sensor
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Si es cámara frontal, espejar la imagen horizontalmente para que se vea natural
    if (facingMode === 'user') {
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Detener cámara mientras el usuario evalúa la vista previa en tamaño original
      stopCamera();

      setCapturedPhoto({
        dataUrl,
        blob,
        width: videoWidth,
        height: videoHeight
      });
    }, 'image/jpeg', 0.95);
  };

  // Reintentar / Tomar otra foto
  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  // Continuar: Optimizar foto y confirmarla en el formulario de producto
  const handleContinueWithPhoto = async () => {
    if (!capturedPhoto) return;
    setIsProcessing(true);
    try {
      // Comprimir a dimensiones y peso óptimos para base de datos (800x800 max, ~50KB)
      const compressed = await compressImage(capturedPhoto.blob, 800, 800, 0.84);
      onPhotoSelected(compressed);
      onClose();
    } catch (err) {
      console.error('Error al optimizar foto capturada:', err);
      // Fallback con el dataURL original si la compresión fallase
      onPhotoSelected(capturedPhoto.dataUrl);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback con el input nativo de cámara del sistema operativo
  const handleNativeCameraFallback = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const originalUrl = URL.createObjectURL(file);
      
      // Obtener dimensiones originales para la vista previa
      const img = new Image();
      img.onload = () => {
        setCapturedPhoto({
          dataUrl: originalUrl,
          blob: file,
          width: img.naturalWidth || 1200,
          height: img.naturalHeight || 900
        });
        stopCamera();
        setIsProcessing(false);
      };
      img.onerror = () => {
        setCapturedPhoto({
          dataUrl: originalUrl,
          blob: file,
          width: 800,
          height: 800
        });
        stopCamera();
        setIsProcessing(false);
      };
      img.src = originalUrl;
    } catch (err) {
      console.error('Error procesando archivo nativo:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {capturedPhoto ? 'Vista Previa de la Foto (Tamaño Original)' : 'Cámara para Foto de Producto'}
              </h3>
              <p className="text-xs text-slate-300">
                {capturedPhoto 
                  ? 'Revisa la nitidez antes de continuar' 
                  : 'Apunta al producto y captura una imagen clara'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar cámara"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo: Vista de Cámara en Vivo O Vista Previa en Tamaño Original */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[320px]">
          {/* CASO A: VISTA PREVIA EN TAMAÑO ORIGINAL */}
          {capturedPhoto ? (
            <div className="w-full flex flex-col items-center justify-center space-y-3">
              <div className="relative w-full max-h-[58vh] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-2xl">
                <img 
                  src={capturedPhoto.dataUrl} 
                  alt="Foto tomada en tamaño original"
                  className="max-h-[56vh] w-auto max-w-full object-contain rounded-xl"
                />

                {/* Badge con dimensiones reales */}
                <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-slate-200 border border-slate-700 px-3 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{capturedPhoto.width} &times; {capturedPhoto.height} px (Original)</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-emerald-600/90 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md">
                  ✨ Foto Lista
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                ¿La foto se ve clara y bien enfocada? Presiona <strong>Continuar</strong> para asociarla al producto.
              </p>
            </div>
          ) : (
            /* CASO B: CÁMARA EN VIVO */
            <div className="relative w-full max-h-[58vh] aspect-4/3 sm:aspect-16/9 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
              {cameraError ? (
                <div className="p-6 text-center text-rose-300 max-w-md space-y-3">
                  <AlertCircle className="w-12 h-12 mx-auto text-rose-500" />
                  <h4 className="font-bold text-sm text-white">No se pudo activar el visor de cámara</h4>
                  <p className="text-xs text-slate-400">{cameraError}</p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => fileFallbackRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Abrir Cámara del Dispositivo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Guías de encuadre en pantalla */}
                  <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    </div>
                    <div className="text-center">
                      <span className="bg-black/60 backdrop-blur-xs text-white/85 text-[11px] px-3 py-1 rounded-full font-medium">
                        Centra el producto aquí
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>

                  {/* Botón Cambiar Cámara (Trasera / Frontal) */}
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/60 hover:bg-black/85 text-white border border-white/20 transition-all cursor-pointer shadow-md"
                    title="Alternar entre cámara trasera y delantera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Input oculto para fallback de cámara nativa del móvil */}
        <input
          ref={fileFallbackRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeCameraFallback}
        />

        {/* Footer con Botones de Acción */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {capturedPhoto ? (
            <>
              {/* Acciones para la Foto Tomada */}
              <button
                type="button"
                onClick={handleRetake}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver a Tomar</span>
              </button>

              <button
                type="button"
                onClick={handleContinueWithPhoto}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'Optimizando...' : 'Continuar y Usar Foto'}</span>
              </button>
            </>
          ) : (
            <>
              {/* Acciones durante la Cámara en Vivo */}
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer px-2 py-1"
                title="Cargar foto existente o usar app de cámara externa"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Usar archivo o galería</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleCaptureShot}
                  disabled={!stream || !!cameraError}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar Foto</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
