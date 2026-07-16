import {
  projectDeliverySpec,
  type DeliverySpec,
  type DeliveryTimelinePhase,
  type LinkTimelineSpec,
} from './specs';
import type { CommunicationLinkState } from '../types';

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

type DeliveryControllerCallbacks = {
  onDeliveryPhase: (
    messageId: string,
    phase: DeliveryTimelinePhase,
    elapsedMs: number,
  ) => void;
  onDeliveryComplete: (messageId: string, spec: DeliverySpec, elapsedMs: number) => void;
  onLinkStateChange: (state: CommunicationLinkState) => void;
  onLinkTimelineComplete?: (timelineId: string) => void;
};

type DeliveryControllerClock = {
  now: () => number;
  setTimer: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimer: (handle: TimerHandle) => void;
};

const DEFAULT_CLOCK: DeliveryControllerClock = {
  now: () => Date.now(),
  setTimer: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimer: handle => globalThis.clearTimeout(handle),
};

type ActiveDelivery = {
  messageId: string;
  spec: DeliverySpec;
  startedAt: number;
  lastPhaseIndex: number;
};

type ActiveLinkTimeline = {
  id: string;
  spec: LinkTimelineSpec;
  startedAt: number;
  lastPhaseIndex: number;
};

/** Drives every scripted transport transition from absolute target times. */
export class DeliveryController {
  private callbacks: DeliveryControllerCallbacks;
  private readonly clock: DeliveryControllerClock;
  private activeDelivery: ActiveDelivery | null = null;
  private activeLinkTimeline: ActiveLinkTimeline | null = null;
  private deliveryTimer: TimerHandle | null = null;
  private linkTimer: TimerHandle | null = null;
  private readonly handleVisibilityChange = () => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      this.tickDelivery();
      this.tickLinkTimeline();
    }
  };

  constructor(
    callbacks: DeliveryControllerCallbacks,
    clock: DeliveryControllerClock = DEFAULT_CLOCK,
  ) {
    this.callbacks = callbacks;
    this.clock = clock;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  setCallbacks(callbacks: DeliveryControllerCallbacks) {
    this.callbacks = callbacks;
  }

  start(messageId: string, spec: DeliverySpec, startedAt = this.clock.now()) {
    this.cancelDelivery();
    this.cancelLinkTimeline();
    this.activeDelivery = {
      messageId,
      spec,
      startedAt,
      lastPhaseIndex: -1,
    };
    this.tickDelivery();
  }

  playLinkTimeline(id: string, spec: LinkTimelineSpec, startedAt = this.clock.now()) {
    this.cancelLinkTimeline();
    this.activeLinkTimeline = {
      id,
      spec,
      startedAt,
      lastPhaseIndex: -1,
    };
    this.tickLinkTimeline();
  }

  setLinkState(state: CommunicationLinkState) {
    this.cancelLinkTimeline();
    this.callbacks.onLinkStateChange(state);
  }

  hasActiveDelivery(): boolean {
    return this.activeDelivery !== null;
  }

  cancelDelivery() {
    if (this.deliveryTimer !== null) {
      this.clock.clearTimer(this.deliveryTimer);
      this.deliveryTimer = null;
    }
    this.activeDelivery = null;
  }

  cancelLinkTimeline() {
    if (this.linkTimer !== null) {
      this.clock.clearTimer(this.linkTimer);
      this.linkTimer = null;
    }
    this.activeLinkTimeline = null;
  }

  dispose() {
    this.cancelDelivery();
    this.cancelLinkTimeline();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private tickDelivery = () => {
    const active = this.activeDelivery;
    if (!active) return;
    this.deliveryTimer = null;
    const elapsedMs = Math.max(0, this.clock.now() - active.startedAt);
    const projection = projectDeliverySpec(active.spec, elapsedMs);

    if (projection.phaseIndex !== active.lastPhaseIndex) {
      active.lastPhaseIndex = projection.phaseIndex;
      if (projection.phase.linkState) {
        this.callbacks.onLinkStateChange(projection.phase.linkState);
      }
      this.callbacks.onDeliveryPhase(active.messageId, projection.phase, elapsedMs);
    }

    if (projection.complete) {
      this.activeDelivery = null;
      this.callbacks.onLinkStateChange(active.spec.finalLinkState);
      this.callbacks.onDeliveryComplete(active.messageId, active.spec, elapsedMs);
      return;
    }

    const nextAtMs = projection.nextAtMs ?? active.spec.completeAtMs;
    this.deliveryTimer = this.clock.setTimer(
      this.tickDelivery,
      Math.max(0, nextAtMs - elapsedMs),
    );
  };

  private tickLinkTimeline = () => {
    const active = this.activeLinkTimeline;
    if (!active) return;
    this.linkTimer = null;
    const elapsedMs = Math.max(0, this.clock.now() - active.startedAt);
    let phaseIndex = 0;
    for (let index = 1; index < active.spec.phases.length; index += 1) {
      if (active.spec.phases[index].atMs > elapsedMs) break;
      phaseIndex = index;
    }

    if (phaseIndex !== active.lastPhaseIndex) {
      active.lastPhaseIndex = phaseIndex;
      this.callbacks.onLinkStateChange(active.spec.phases[phaseIndex].state);
    }

    if (elapsedMs >= active.spec.completeAtMs) {
      this.activeLinkTimeline = null;
      this.callbacks.onLinkStateChange(active.spec.finalState);
      this.callbacks.onLinkTimelineComplete?.(active.id);
      return;
    }

    const nextPhaseAt = active.spec.phases[phaseIndex + 1]?.atMs;
    this.linkTimer = this.clock.setTimer(
      this.tickLinkTimeline,
      Math.max(0, (nextPhaseAt ?? active.spec.completeAtMs) - elapsedMs),
    );
  };
}
