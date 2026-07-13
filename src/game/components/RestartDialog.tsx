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
    <div className="restart-dialog-overlay fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="restart-dialog-shell max-w-sm w-full mx-4 flex flex-col gap-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restart-dialog-title"
      >
        <p className="restart-dialog-kicker">SEVENTH_PROTOCOL / RESET</p>
        <h3 id="restart-dialog-title" className="text-[#E2E8F0] text-lg font-medium">{t('restartDialog.title')}</h3>
        <p className="text-[#94A3B8] text-sm leading-relaxed">
          {t('restartDialog.body')}
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancel}
            className="restart-dialog-btn restart-dialog-cancel menu-btn flex-1 py-3.5 text-sm"
          >
            {t('restartDialog.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="restart-dialog-btn restart-dialog-confirm menu-btn flex-1 py-3.5 text-sm"
          >
            {t('restartDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
