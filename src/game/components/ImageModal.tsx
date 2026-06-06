import { useEffect } from 'react';

export function ImageModal({
  image,
  caption,
  onClose,
}: {
  image: string;
  caption: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="max-w-3xl max-h-[85vh] flex flex-col items-center gap-3 px-4"
        onClick={e => e.stopPropagation()}
      >
        <img src={image} alt="" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" />
        {caption && <p className="text-sm text-[#94A3B8] text-center font-light">{caption}</p>}
      </div>
    </div>
  );
}
