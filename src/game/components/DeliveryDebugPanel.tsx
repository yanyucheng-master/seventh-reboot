import { RadioTower, X } from 'lucide-react';
import { useState } from 'react';
import type {
  ChatDeliveryRuntime,
  CommunicationLinkState,
  DisplayMessage,
} from '../types';

const LINK_STATES: CommunicationLinkState[] = [
  'stable',
  'degraded',
  'unstable',
  'interrupted',
  'restoring',
];

export function DeliveryDebugPanel({
  runtime,
  messages,
  onSetLinkState,
}: {
  runtime: ChatDeliveryRuntime;
  messages: DisplayMessage[];
  onSetLinkState: (state: CommunicationLinkState) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeMessage = runtime.activeMessageId
    ? messages.find(message => message.id === runtime.activeMessageId)
    : undefined;

  if (!open) {
    return (
      <button
        type="button"
        className="delivery-debug-trigger"
        onClick={() => setOpen(true)}
        title="Delivery Debug"
        aria-label="Open delivery debug panel"
      >
        <RadioTower size={15} aria-hidden="true" />
      </button>
    );
  }

  return (
    <aside className="delivery-debug-panel" aria-label="Delivery Debug">
      <header>
        <span>DELIVERY DEBUG / DEV ONLY</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close delivery debug panel">
          <X size={13} aria-hidden="true" />
        </button>
      </header>
      <label>
        LINK STATE
        <select
          value={runtime.linkState}
          onChange={event => onSetLinkState(event.target.value as CommunicationLinkState)}
        >
          {LINK_STATES.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
      </label>
      <section className="delivery-debug-current">
        <strong>ACTIVE OUTGOING</strong>
        <code>{activeMessage?.id ?? 'none'}</code>
        {activeMessage && (
          <dl>
            <dt>state</dt><dd>{activeMessage.deliveryState ?? 'unset'}</dd>
            <dt>event</dt><dd>{activeMessage.scriptedDeliveryEvent ?? 'normal'}</dd>
            <dt>retry</dt><dd>{activeMessage.retryCount ?? 0}</dd>
            <dt>branch</dt><dd>{activeMessage.branchTargetNodeId ?? 'unset'}</dd>
          </dl>
        )}
      </section>
      <details open>
        <summary>EVENT RECEIPTS</summary>
        <pre>{JSON.stringify(runtime.receipts, null, 2)}</pre>
      </details>
    </aside>
  );
}
