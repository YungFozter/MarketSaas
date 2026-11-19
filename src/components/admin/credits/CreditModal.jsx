import React, { useEffect, useRef } from 'react';

/**
 * Contenedor modal nativo basado en <dialog>.showModal().
 * Aprovecha capa superior nativa, manejo de foco, inert en el fondo,
 * cierre con Esc / gesto Atrás móvil y contención de scroll sin mutar body.
 */
export const CreditModal = ({
  isOpen,
  onClose,
  titleId,
  lightDismiss = false,
  maxWidthClass = 'max-w-md',
  darkBackdrop = false,
  children
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = '';
      onClose?.();
    };

    dialog.addEventListener('close', handleNativeClose);
    return () => {
      dialog.removeEventListener('close', handleNativeClose);
    };
  }, [onClose]);

  // Fallback obligatorio de light-dismiss para navegadores sin HTMLDialogElement.prototype.closedBy (p. ej. Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen || !lightDismiss) return;
    if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) {
      return;
    }

    const isOutsideDialog = (e) => {
      const rect = dialog.getBoundingClientRect();
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
    };

    let pressedOutside = false;
    const handlePointerDown = (e) => {
      pressedOutside = isOutsideDialog(e);
    };
    const handlePointerUp = (e) => {
      if (pressedOutside && isOutsideDialog(e) && dialog.open) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isOpen, lightDismiss]);

  return (
    <dialog
      ref={dialogRef}
      closedby={lightDismiss ? 'any' : 'closerequest'}
      aria-labelledby={titleId}
      className={`credit-dialog ${darkBackdrop ? 'credit-dialog--dark' : ''} bg-white rounded-3xl w-[calc(100%-1.5rem)] sm:w-full ${maxWidthClass} max-h-[90dvh] shadow-2xl border border-slate-100 p-0 text-slate-900 overflow-hidden`}
    >
      {isOpen && (
        <div className="credit-dialog-surface flex flex-col max-h-[90dvh] overflow-hidden">
          {children}
        </div>
      )}
    </dialog>
  );
};
