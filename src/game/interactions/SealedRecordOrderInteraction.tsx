import { ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '../../i18n';
import type { SpecialInteractionCompletion } from '../types';
import { InteractionTitle } from './InteractionTitle';

type RecordId = '06' | '07';

type Props = {
  locale: Locale;
  onResultLocked: (result: SpecialInteractionCompletion) => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const COPY = {
  'zh-CN': {
    kicker: 'NOVA / SEALED RECORD',
    title: '密封记录顺序校验',
    mission: '按“写入者 → 读取者”的顺序提交两枚导航签名。',
    writer: '写入者',
    reader: '读取者',
    reset: '重置顺序',
    submit: '提交校验',
    success: '顺序确认 / 只读记录已开放',
    retry: '顺序不符 / 密封层保持关闭',
    continue: '继续通讯',
    retryAction: '返回记录提示',
  },
  'en-US': {
    kicker: 'NOVA / SEALED RECORD',
    title: 'Sealed-record order check',
    mission: 'Submit both navigation signatures in writer → reader order.',
    writer: 'WRITER',
    reader: 'READER',
    reset: 'Reset order',
    submit: 'Submit sequence',
    success: 'Order confirmed / read-only record open',
    retry: 'Order mismatch / sealed layer unchanged',
    continue: 'Continue transmission',
    retryAction: 'Return to record hint',
  },
} as const;

export function SealedRecordOrderInteraction({ locale, onResultLocked, onComplete }: Props) {
  const copy = COPY[locale];
  const [order, setOrder] = useState<RecordId[]>([]);
  const [result, setResult] = useState<Extract<SpecialInteractionCompletion, { kind: 'sealed-record-order' }> | null>(null);

  function choose(id: RecordId) {
    if (result || order.includes(id)) return;
    setOrder(current => [...current, id]);
  }

  function submit() {
    if (order.length !== 2 || result) return;
    const completion = {
      kind: 'sealed-record-order' as const,
      routeKey: order[0] === '06' && order[1] === '07' ? 'success' as const : 'retry' as const,
    };
    setResult(completion);
    onResultLocked(completion);
  }

  if (result) {
    const success = result.routeKey === 'success';
    return (
      <section className="interaction-result sealed-order-result" aria-live="assertive">
        <ShieldCheck className="sealed-order-result-icon" aria-hidden />
        <p className="interaction-kicker">{copy.kicker}</p>
        <InteractionTitle state={success ? 'resolved' : 'warning'}>
          {success ? copy.success : copy.retry}
        </InteractionTitle>
        <button type="button" className="interaction-primary-btn" onClick={() => onComplete(result)}>
          {success ? copy.continue : copy.retryAction}
        </button>
      </section>
    );
  }

  return (
    <section className="sealed-record-order" aria-labelledby="sealed-record-order-title">
      <p className="interaction-kicker">{copy.kicker}</p>
      <InteractionTitle id="sealed-record-order-title">{copy.title}</InteractionTitle>
      <p className="interaction-mission">{copy.mission}</p>

      <div className="sealed-order-track" aria-label={copy.mission}>
        {[0, 1].map(index => (
          <div className="sealed-order-slot" key={index} data-filled={Boolean(order[index]) || undefined}>
            <span>{index === 0 ? copy.writer : copy.reader}</span>
            <strong>{order[index] ? `NOVA-${order[index]}` : '--'}</strong>
            {index === 0 && <ArrowRight aria-hidden />}
          </div>
        ))}
      </div>

      <div className="sealed-order-signatures">
        {(['06', '07'] as const).map(id => (
          <button
            type="button"
            key={id}
            disabled={order.includes(id)}
            onClick={() => choose(id)}
            data-testid={`sealed-order-${id}`}
          >
            <span>NAV SIGNATURE</span>
            <strong>NOVA-{id}</strong>
          </button>
        ))}
      </div>

      <div className="interaction-action-row">
        <button type="button" className="interaction-secondary-btn" onClick={() => setOrder([])} disabled={!order.length}>
          <RotateCcw aria-hidden />
          {copy.reset}
        </button>
        <button type="button" className="interaction-primary-btn" onClick={submit} disabled={order.length !== 2}>
          {copy.submit}
        </button>
      </div>
    </section>
  );
}
