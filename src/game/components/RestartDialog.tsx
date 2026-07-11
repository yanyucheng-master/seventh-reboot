import { useI18n } from '../../i18n';

export function RestartDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="bg-[#151A26] border border-[#2A3550] rounded-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <h3 className="text-[#E2E8F0] text-lg font-medium">{t('restartDialog.title')}</h3>
        <p className="text-[#94A3B8] text-sm leading-relaxed">
          {t('restartDialog.body')}
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancel}
            className="menu-btn flex-1 py-3.5 rounded-lg border border-[#2A3550] text-[#94A3B8] text-sm hover:bg-[#1A2236] transition-colors"
          >
            {t('restartDialog.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="menu-btn flex-1 py-3.5 rounded-lg bg-[#F0A030]/20 border border-[#F0A030]/50 text-[#F0A030] text-sm hover:bg-[#F0A030]/30 transition-colors"
          >
            {t('restartDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
