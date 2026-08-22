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

export const DELIVERY_STATE_VERSION = 2 as const;

export const DELIVERY_RECEIPT_KEYS: Record<DeliveryEventKey, keyof DeliveryEventReceipts> = {
  prologue_first_reply: 'prologueFirstReply',
  chapter3_reconnect_reply: 'chapter3ReconnectReply',
  final_protocol_choice: 'finalProtocolChoice',
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
    finalProtocolChoice: 'not_started',
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
      finalProtocolChoice: normalizeEventPhase(rawReceipts.finalProtocolChoice),
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
  if (
    message.branchTargetNodeId
    && (message.branchTargetNodeId === 'MENU' || storyNodeMap.has(message.branchTargetNodeId))
  ) return message.branchTargetNodeId;
  if (message.sourceNodeId == null || message.sourceChoiceIndex == null) return undefined;
  return storyNodeMap.get(message.sourceNodeId)?.choices?.[message.sourceChoiceIndex]?.nextId;
}

function isCurrentDeliveryEventKey(value: unknown): value is DeliveryEventKey {
  return typeof value === 'string' && value in DELIVERY_RECEIPT_KEYS;
}

function inferEventKey(message: DisplayMessage): DisplayMessage['scriptedDeliveryEvent'] {
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
  const deliveryState = rawState === 'failed' ? 'delivered' : rawState;
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
    autoRetry: false,
    allowFail: false,
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
    if (
      message.deliveryState !== 'delivered'
      || !isCurrentDeliveryEventKey(message.scriptedDeliveryEvent)
    ) continue;
    runtime = setDeliveryReceipt(runtime, message.scriptedDeliveryEvent, 'completed');
  }

  const activeMessageId = runtime.activeMessageId;
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
  normalizedMessages = normalizedMessages.map((message, index) => index === activeIndex
    ? {
        ...message,
        deliveryState: 'delivered' as const,
        deliveredAt: message.deliveredAt ?? fallbackTimestamp,
        deliveryLabelVisible: false,
      }
    : message);
  if (isCurrentDeliveryEventKey(activeMessage.scriptedDeliveryEvent)) {
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
