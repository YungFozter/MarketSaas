import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  X, 
  Check, 
  RotateCcw, 
  RotateCw,
  AlertCircle, 
  Maximize2,
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  Crop,
  SlidersHorizontal,
  Rotate3d
} from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';

export const ProductCameraModal = ({ isOpen, onClose, onPhotoSelected }) => {
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (trasera) o 'user' (frontal)
  
  // Estado de foto capturada
  const [capturedPhoto, setCapturedPhoto] = useState(null); // { dataUrl, width, height, blob }
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de Edición: Posición, Ángulo y Recorte
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // Rotación en pasos de 90° (0, 90, 180, 270)
  const [fineAngle, setFineAngle] = useState(0); // Ajuste fino (-45° a +45°)
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Desplazamiento X, Y en px
  const [isDragging, setIsDragging] = useState(false);
  const [cropBoxSize, setCropBoxSize] = useState(280);

  const videoRef = useRef(null);
  const fileFallbackRef = useRef(null);
  const cropBoxRef = useRef(null);
  const imageElementRef = useRef(null);
  const dragStartPos = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // Iniciar flujo de cámara
  const startCamera = useCallback(async (mode = facingMode) => {
    setCameraError(null);
    try {
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
      setZoom(1);
      setRotation(0);
      setFineAngle(0);
      setPosition({ x: 0, y: 0 });
      startCamera('environment');
    } else {
      stopCamera();
      setCapturedPhoto(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Resetear transformaciones al cargar nueva foto
  useEffect(() => {
    if (capturedPhoto) {
      setZoom(1);
      setRotation(0);
      setFineAngle(0);
      setPosition({ x: 0, y: 0 });
      if (cropBoxRef.current) {
        setCropBoxSize(cropBoxRef.current.clientWidth || 280);
      }
    }
  }, [capturedPhoto]);

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
    
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
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
    setZoom(1);
    setRotation(0);
    setFineAngle(0);
    setPosition({ x: 0, y: 0 });
    startCamera(facingMode);
  };

  // Controladores de Paneo / Arrastre táctil y ratón
  const handlePointerDown = (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(true);
    dragStartPos.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartPos.current.startX;
    const dy = e.clientY - dragStartPos.current.startY;
    setPosition({
      x: dragStartPos.current.posX + dx,
      y: dragStartPos.current.posY + dy
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Rotaciones
  const handleRotateLeft = () => setRotation(prev => prev - 90);
  const handleRotateRight = () => setRotation(prev => prev + 90);

  // Restablecer encuadre a valores iniciales
  const handleResetAdjustments = () => {
    setZoom(1);
    setRotation(0);
    setFineAngle(0);
    setPosition({ x: 0, y: 0 });
  };

  // Escala base para cubrir el cuadro de recorte (Cover)
  const baseScale = capturedPhoto
    ? Math.max(cropBoxSize / capturedPhoto.width, cropBoxSize / capturedPhoto.height)
    : 1;

  const totalAngle = rotation + fineAngle;

  // Continuar: Generar recorte en alta resolución a partir del encuadre y optimizar
  const handleContinueWithPhoto = async () => {
    if (!capturedPhoto) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = capturedPhoto.dataUrl;
      });

      const OUT_SIZE = 800; // Resolución cuadrada nítida para e-commerce / catálogo
      const canvas = document.createElement('canvas');
      canvas.width = OUT_SIZE;
      canvas.height = OUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('No se pudo inicializar contexto 2D para recorte');

      // Fondo blanco neutro
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);

      const ratio = OUT_SIZE / (cropBoxSize || 280);
      const rad = (totalAngle * Math.PI) / 180;

      // 1. Mover origen al centro del lienzo cuadrado
      ctx.translate(OUT_SIZE / 2, OUT_SIZE / 2);

      // 2. Aplicar traslación proporcional al tamaño del canvas
      ctx.translate(position.x * ratio, position.y * ratio);

      // 3. Aplicar rotación
      ctx.rotate(rad);

      // 4. Aplicar escala total (baseScale * zoom * ratio)
      const renderScale = baseScale * zoom * ratio;
      ctx.scale(renderScale, renderScale);

      // 5. Dibujar imagen centrada en su propio centro
      ctx.drawImage(
        img,
        -capturedPhoto.width / 2,
        -capturedPhoto.height / 2,
        capturedPhoto.width,
        capturedPhoto.height
      );

      // 6. Convertir a Blob y comprimir
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('No se pudo generar el blob recortado');
        const compressed = await compressImage(blob, 800, 800, 0.85);
        onPhotoSelected(compressed);
        onClose();
      }, 'image/jpeg', 0.92);

    } catch (err) {
      console.error('Error procesando recorte de foto:', err);
      // Fallback: Si canvas falla, pasar foto original comprimida
      if (capturedPhoto.blob) {
        const compressed = await compressImage(capturedPhoto.blob, 800, 800, 0.84);
        onPhotoSelected(compressed);
      } else {
        onPhotoSelected(capturedPhoto.dataUrl);
      }
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback con el input nativo de cámara o galería del sistema operativo
  const handleNativeCameraFallback = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const originalUrl = URL.createObjectURL(file);
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              {capturedPhoto ? <Crop className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                {capturedPhoto ? 'Ajustar, Rotar y Recortar Foto' : 'Cámara para Foto de Producto'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {capturedPhoto 
                  ? 'Arrastra para centrar, usa el zoom y ajusta el ángulo' 
                  : 'Apunta al producto y captura una imagen nítida'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo: Vista de Ajuste/Recorte O Cámara en Vivo */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-950 flex flex-col items-center justify-center min-h-[300px] select-none">
          {capturedPhoto ? (
            /* ==========================================================
               CASO A: AJUSTE DE POSICIÓN, ÁNGULO Y RECORTE
               ========================================================== */
            <div className="w-full flex flex-col items-center justify-center space-y-3">
              {/* Marco de Recorte Cuadrado Interactivo */}
              <div 
                ref={cropBoxRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500 shadow-2xl cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
                title="Mantén presionado y arrastra para ajustar la posición"
              >
                {/* Imagen Transformada (Posición + Rotación + Zoom) */}
                <div 
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{
                    width: `${capturedPhoto.width}px`,
                    height: `${capturedPhoto.height}px`,
                    transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${totalAngle}deg) scale(${baseScale * zoom})`,
                    transformOrigin: 'center center',
                    willChange: 'transform'
                  }}
                >
                  <img 
                    ref={imageElementRef}
                    src={capturedPhoto.dataUrl} 
                    alt="Foto del producto para encuadre"
                    className="max-w-none max-h-none block object-contain"
                    draggable={false}
                  />
                </div>

                {/* Guía Visual: Regla de Tercios (Cuadrícula fina) */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div />
                </div>

                {/* Esquinas de Enfoque */}
                <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
                <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

                {/* Indicador de gesto flotante */}
                <div className="absolute bottom-2.5 bg-black/70 backdrop-blur-xs text-white/90 text-[10px] px-2.5 py-0.5 rounded-full font-medium pointer-events-none flex items-center gap-1 shadow-sm">
                  <Move className="w-3 h-3 text-emerald-400" />
                  <span>Arrastra para mover el producto</span>
                </div>
              </div>

              {/* Panel de Controles: Zoom y Ángulo / Rotación */}
              <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 space-y-2.5 text-xs text-slate-300">
                {/* 1. Control de Zoom */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200 text-xs shrink-0">
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zoom:</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoom(prev => Math.max(0.8, Number((prev - 0.15).toFixed(2))))}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Alejar"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <input 
                      type="range"
                      min="0.8"
                      max="3.0"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setZoom(prev => Math.min(3.0, Number((prev + 0.15).toFixed(2))))}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Acercar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 min-w-10 text-right">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                {/* 2. Control de Ángulo / Rotación */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1">
                      <Rotate3d className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ángulo:</span>
                    </span>

                    {/* Botones de Rotación Rápida 90° */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleRotateLeft}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Girar 90° a la izquierda"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-400" />
                        <span>-90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRotateRight}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Girar 90° a la derecha"
                      >
                        <RotateCw className="w-3 h-3 text-emerald-400" />
                        <span>+90°</span>
                      </button>
                    </div>
                  </div>

                  {/* Slider de Inclinación Fina */}
                  <div className="flex items-center gap-1.5 flex-1 max-w-[190px]">
                    <span className="text-[10px] text-slate-400 shrink-0">Fino:</span>
                    <input 
                      type="range"
                      min="-45"
                      max="45"
                      step="1"
                      value={fineAngle}
                      onChange={(e) => setFineAngle(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 min-w-9 text-right">
                      {totalAngle % 360}°
                    </span>
                  </div>

                  {/* Botón Restablecer Enfoque */}
                  <button
                    type="button"
                    onClick={handleResetAdjustments}
                    className="text-[11px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-auto"
                    title="Restablecer posición, zoom y ángulo original"
                  >
                    Restablecer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================================
               CASO B: CÁMARA EN VIVO
               ========================================================== */
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

        {/* Input oculto para fallback de cámara nativa del móvil o galería */}
        <input
          ref={fileFallbackRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeCameraFallback}
        />

        {/* Footer con Botones de Acción */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {capturedPhoto ? (
            <>
              {/* Acciones para la Foto en Ajuste/Recorte */}
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
                <span>{isProcessing ? 'Procesando recorte...' : 'Continuar y Usar Foto'}</span>
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
                <span>Subir archivo o galería</span>
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
