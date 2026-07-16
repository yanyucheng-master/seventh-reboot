import { useI18n } from '../../i18n';
import type { DisplayMessage } from '../types';

export function MessageDeliveryStatus({
  message,
  isCurrent,
}: {
  message: DisplayMessage;
  isCurrent: boolean;
}) {
  const { t } = useI18n();
  const state = message.deliveryState;
  if (!state) return null;

  const isRetrying = state === 'sending' && (message.retryCount ?? 0) > 0;
  const labelKey = isRetrying ? 'delivery.retrying' : `delivery.${state}`;
  const showLabel = state === 'failed'
    || isRetrying
    || (message.deliveryLabelVisible === true && state !== 'queued' && state !== 'delivered');
  const latency = message.deliveredAt != null && message.committedAt != null
    ? Math.max(0, message.deliveredAt - message.committedAt)
    : message.deliveryLatencyMs;
  const title = latency != null && state === 'delivered'
    ? t('delivery.deliveredWithLatency', { latency })
    : t(labelKey);

  return (
    <span
      className={`message-delivery-status message-delivery-${state} ${isCurrent ? 'message-delivery-current' : ''}`}
      title={title}
      aria-label={title}
      aria-live={isCurrent ? 'polite' : 'off'}
    >
      <span className="message-delivery-glyph" aria-hidden="true">
        <i />
        <b />
      </span>
      {showLabel && <span className="message-delivery-label">{t(labelKey)}</span>}
    </span>
  );
}
