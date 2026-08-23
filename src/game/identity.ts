import type { ChatDeliveryRuntime, RebootNumber } from './types';

export function isObserverIdentityEstablished(
  runtime: Pick<ChatDeliveryRuntime, 'receipts'> | null | undefined,
  reboot08TitleUnlocked = false,
): boolean {
  return reboot08TitleUnlocked || runtime?.receipts.prologueFirstReply === 'completed';
}

export type TitleLinkMeta = {
  contactCode: string;
  observerCode: string;
};

export function resolveTitleLinkMeta(
  rebootNumber: RebootNumber,
  observerEstablished: boolean,
): TitleLinkMeta {
  if (rebootNumber === 8) {
    return {
      contactCode: 'LIVE-07 / NOT FOUND',
      observerCode: observerEstablished ? 'OBSERVER-01' : 'EXTERNAL LINK',
    };
  }
  return {
    contactCode: observerEstablished ? 'LIVE-07' : 'LINK-07',
    observerCode: observerEstablished ? 'OBSERVER-01' : 'UNREGISTERED',
  };
}
