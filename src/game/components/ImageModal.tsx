import { useEffect } from 'react';
import { useI18n } from '../../i18n';
import { getResponsiveImageAttributes } from '../mediaAssets';

export function ImageModal({
  image,
  caption,
  onClose,
}: {
  image: string;
  caption: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const responsiveImage = getResponsiveImageAttributes(image);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in cursor-pointer p-4"
      style={{ paddingTop: 'max(1rem, var(--safe-top))', paddingBottom: 'max(1rem, var(--safe-bottom))' }}
      onClick={onClose}
    >
      <div
        className="max-w-3xl max-h-[85dvh] flex flex-col items-center gap-3 w-full"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={responsiveImage.src}
          srcSet={responsiveImage.srcSet}
          sizes="min(100vw - 2rem, 768px)"
          alt=""
          decoding="async"
          className="max-w-full max-h-[65dvh] object-contain rounded-lg shadow-2xl"
        />
        {caption && <p className="text-sm text-[#94A3B8] text-center font-light px-2">{caption}</p>}
        <p className="text-xs text-[#4A5568] mt-1">{t('chat.tapToClose')}</p>
      </div>
    </div>
  );
}
