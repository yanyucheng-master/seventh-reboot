import { storyNodeMap } from '../story';
import type {
  ChatDeliveryRuntime,
  CommunicationLinkState,
  DeliveryEventKey,
  DeliveryEventPhase,
  DeliveryEventReceipts,
  DisplayMessage,
  OutgoingMessageDeliveryState,
} from '../types';

export const DELIVERY_STATE_VERSION = 1 as const;

export const DELIVERY_RECEIPT_KEYS: Record<DeliveryEventKey, keyof DeliveryEventReceipts> = {
  prologue_first_reply: 'prologueFirstReply',
  chapter3_reconnect_reply: 'chapter3ReconnectReply',
  chapter5_explicit_failure: 'chapter5ExplicitFailure',
  finale_last_answer: 'finaleLastAnswer',
};

const DELIVERY_STATES: OutgoingMessageDeliveryState[] = [
  'queued',
  'sending',
  'delayed',
  'failed',
  'delivered',
];

const LINK_STATES: CommunicationLinkState[] = [
  'stable',
  'degraded',
  'unstable',
  'interrupted',
  'restoring',
];

const EVENT_PHASES: DeliveryEventPhase[] = ['not_started', 'in_progress', 'completed'];

export function createDefaultDeliveryReceipts(): DeliveryEventReceipts {
  return {
    prologueFirstReply: 'not_started',
    chapter3ReconnectReply: 'not_started',
    chapter5ExplicitFailure: 'not_started',
    finaleLastAnswer: 'not_started',
    powerEmergencyPacketLoss: 'not_started',
  };
}

export function createDefaultChatDeliveryRuntime(): ChatDeliveryRuntime {
  return {
    deliveryStateVersion: DELIVERY_STATE_VERSION,
    linkState: 'stable',
    pendingAutoRetryIds: [],
    receipts: createDefaultDeliveryReceipts(),
  };
}

function normalizeEventPhase(value: unknown): DeliveryEventPhase {
  return EVENT_PHASES.includes(value as DeliveryEventPhase)
    ? value as DeliveryEventPhase
    : 'not_started';
}

export function normalizeChatDeliveryRuntime(value: unknown): ChatDeliveryRuntime {
  const raw = value && typeof value === 'object'
    ? value as Partial<ChatDeliveryRuntime>
    : {};
  const rawReceipts = raw.receipts && typeof raw.receipts === 'object'
    ? raw.receipts as Partial<DeliveryEventReceipts>
    : {};
  const pendingAutoRetryIds = Array.isArray(raw.pendingAutoRetryIds)
    ? [...new Set(raw.pendingAutoRetryIds.filter((id): id is string => typeof id === 'string'))]
    : [];
  return {
    deliveryStateVersion: DELIVERY_STATE_VERSION,
    linkState: LINK_STATES.includes(raw.linkState as CommunicationLinkState)
      ? raw.linkState as CommunicationLinkState
      : 'stable',
    ...(typeof raw.activeMessageId === 'string' ? { activeMessageId: raw.activeMessageId } : {}),
    pendingAutoRetryIds,
    receipts: {
      prologueFirstReply: normalizeEventPhase(rawReceipts.prologueFirstReply),
      chapter3ReconnectReply: normalizeEventPhase(rawReceipts.chapter3ReconnectReply),
      chapter5ExplicitFailure: normalizeEventPhase(rawReceipts.chapter5ExplicitFailure),
      finaleLastAnswer: normalizeEventPhase(rawReceipts.finaleLastAnswer),
      powerEmergencyPacketLoss: normalizeEventPhase(rawReceipts.powerEmergencyPacketLoss),
    },
  };
}

export function setDeliveryReceipt(
  runtime: ChatDeliveryRuntime,
  eventKey: DeliveryEventKey,
  phase: DeliveryEventPhase,
): ChatDeliveryRuntime {
  const key = DELIVERY_RECEIPT_KEYS[eventKey];
  if (runtime.receipts[key] === phase) return runtime;
  return {
    ...runtime,
    receipts: { ...runtime.receipts, [key]: phase },
  };
}

function inferChoiceId(message: DisplayMessage): string | undefined {
  if (message.choiceId) return message.choiceId;
  if (message.sourceNodeId != null && message.sourceChoiceIndex != null) {
    return `${message.sourceNodeId}__${message.sourceChoiceIndex}`;
  }
  return undefined;
}

function inferBranchTarget(message: DisplayMessage): string | undefined {
  if (message.branchTargetNodeId) return message.branchTargetNodeId;
  if (message.sourceNodeId == null || message.sourceChoiceIndex == null) return undefined;
  return storyNodeMap.get(message.sourceNodeId)?.choices?.[message.sourceChoiceIndex]?.nextId;
}

function inferEventKey(message: DisplayMessage): DeliveryEventKey | undefined {
  if (message.scriptedDeliveryEvent) return message.scriptedDeliveryEvent;
  if (!message.sourceNodeId) return undefined;
  return storyNodeMap.get(message.sourceNodeId)?.deliveryEvent;
}

function normalizePlayerDeliveryMessage(
  message: DisplayMessage,
  committedOrder: number,
  fallbackTimestamp: number,
): DisplayMessage {
  if (message.speaker !== 'player' || message.type !== 'text') return message;
  const isChoiceMessage = message.sourceChoiceIndex != null
    || message.choiceId != null
    || message.deliveryState != null
    || message.branchTargetNodeId != null;
  if (!isChoiceMessage) return message;
  const scriptedDeliveryEvent = inferEventKey(message);
  const rawState = DELIVERY_STATES.includes(message.deliveryState as OutgoingMessageDeliveryState)
    ? message.deliveryState as OutgoingMessageDeliveryState
    : 'delivered';
  const allowFail = scriptedDeliveryEvent === 'chapter5_explicit_failure';
  const deliveryState = rawState === 'failed' && !allowFail ? 'delivered' : rawState;
  const committedAt = typeof message.committedAt === 'number' && Number.isFinite(message.committedAt)
    ? message.committedAt
    : fallbackTimestamp + committedOrder;
  return {
    ...message,
    choiceId: inferChoiceId(message),
    committedAt,
    ...(deliveryState === 'delivered'
      ? {
          deliveredAt: typeof message.deliveredAt === 'number' && Number.isFinite(message.deliveredAt)
            ? message.deliveredAt
            : committedAt,
        }
      : {}),
    committedOrder: typeof message.committedOrder === 'number'
      ? message.committedOrder
      : committedOrder,
    deliverySequence: typeof message.deliverySequence === 'number'
      ? message.deliverySequence
      : committedOrder,
    deliveryState,
    ...(scriptedDeliveryEvent ? { scriptedDeliveryEvent } : {}),
    retryCount: typeof message.retryCount === 'number' && message.retryCount >= 0
      ? Math.floor(message.retryCount)
      : 0,
    autoRetry: message.autoRetry === true || allowFail,
    allowFail,
    branchCommitted: message.branchCommitted !== false,
    branchTargetNodeId: inferBranchTarget(message),
    deliveryLabelVisible: message.deliveryLabelVisible === true,
  };
}

export type MigratedDeliveryState = {
  messages: DisplayMessage[];
  runtime: ChatDeliveryRuntime;
  pendingNodeId: string;
};

export function migrateDeliveryState(
  messages: DisplayMessage[],
  runtimeValue: unknown,
  pendingNodeId: string,
  fallbackTimestamp = Date.now(),
): MigratedDeliveryState {
  let playerOrder = 0;
  let normalizedMessages = messages.map(message => {
    if (
      message.speaker !== 'player'
      || message.type !== 'text'
      || (
        message.sourceChoiceIndex == null
        && message.choiceId == null
        && message.deliveryState == null
        && message.branchTargetNodeId == null
      )
    ) return message;
    const normalized = normalizePlayerDeliveryMessage(message, playerOrder, fallbackTimestamp);
    playerOrder += 1;
    return normalized;
  });
  let runtime = normalizeChatDeliveryRuntime(runtimeValue);

  for (const message of normalizedMessages) {
    if (message.deliveryState !== 'delivered' || !message.scriptedDeliveryEvent) continue;
    runtime = setDeliveryReceipt(runtime, message.scriptedDeliveryEvent, 'completed');
  }

  let activeMessageId = runtime.activeMessageId;
  if (!activeMessageId) {
    const restorableFailure = [...normalizedMessages].reverse().find(message =>
      message.speaker === 'player'
      && message.deliveryState === 'failed'
      && message.scriptedDeliveryEvent === 'chapter5_explicit_failure');
    activeMessageId = restorableFailure?.id;
  }

  const activeIndex = activeMessageId
    ? normalizedMessages.findIndex(message => message.id === activeMessageId)
    : -1;
  if (activeIndex < 0) {
    return {
      messages: normalizedMessages.map(message =>
        message.speaker === 'player'
        && message.deliveryState != null
        && message.deliveryState !== 'delivered'
          ? {
              ...message,
              deliveryState: 'delivered' as const,
              deliveredAt: message.deliveredAt ?? fallbackTimestamp,
              deliveryLabelVisible: false,
            }
          : message),
      runtime: { ...runtime, activeMessageId: undefined, pendingAutoRetryIds: [] },
      pendingNodeId,
    };
  }

  const activeMessage = normalizedMessages[activeIndex];
  const targetNodeId = activeMessage.branchTargetNodeId ?? pendingNodeId;
  if (activeMessage.scriptedDeliveryEvent === 'chapter5_explicit_failure') {
    normalizedMessages = normalizedMessages.map((message, index) => index === activeIndex
      ? {
          ...message,
          deliveryState: 'failed' as const,
          deliveryLabelVisible: true,
          autoRetry: true,
          allowFail: true,
        }
      : message);
    runtime = setDeliveryReceipt(runtime, 'chapter5_explicit_failure', 'in_progress');
    return {
      messages: normalizedMessages,
      runtime: {
        ...runtime,
        linkState: 'interrupted',
        activeMessageId: activeMessage.id,
        pendingAutoRetryIds: [activeMessage.id],
      },
      pendingNodeId: targetNodeId,
    };
  }

  normalizedMessages = normalizedMessages.map((message, index) => index === activeIndex
    ? {
        ...message,
        deliveryState: 'delivered' as const,
        deliveredAt: message.deliveredAt ?? fallbackTimestamp,
        deliveryLabelVisible: false,
      }
    : message);
  if (activeMessage.scriptedDeliveryEvent) {
    runtime = setDeliveryReceipt(runtime, activeMessage.scriptedDeliveryEvent, 'completed');
  }
  return {
    messages: normalizedMessages,
    runtime: {
      ...runtime,
      activeMessageId: undefined,
      pendingAutoRetryIds: [],
    },
    pendingNodeId: targetNodeId,
  };
}
