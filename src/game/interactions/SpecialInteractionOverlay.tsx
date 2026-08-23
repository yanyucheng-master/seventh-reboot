import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../../i18n';
import { NovaAvatar } from '../components/NovaAvatar';
import type { StoryNode } from '../story';
import type {
  NovaAvatarPresentation,
  PowerFailureReason,
  SealableMemoryAnchor,
  SpecialInteractionCompletion,
  SpecialInteractionKind,
} from '../types';
import { BulkheadIsolationInteraction } from './BulkheadIsolationInteraction';
import { CourseLockInteraction } from './CourseLockInteraction';
import { getSpecialInteractionCopy } from './copy';
import { MemoryCapacityInteraction } from './MemoryCapacityInteraction';
import { PowerRoutingInteraction } from './PowerRoutingInteraction';
import { ProtocolCutInteraction } from './ProtocolCutInteraction';
import { SealedRecordOrderInteraction } from './SealedRecordOrderInteraction';

type SpecialInteractionOverlayProps = {
  node: StoryNode;
  locale: Locale;
  sealedAnchor?: SealableMemoryAnchor;
  powerFirstFailureReason?: PowerFailureReason;
  lowGravity?: boolean;
  deadlineAt?: number;
  avatarPresentation: NovaAvatarPresentation;
  onResultLocked: (result: SpecialInteractionCompletion) => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
  onSaveAndExit: () => void;
  onRestartDeadline: () => void;
};

const REDUCED_MOTION_KEY = 'seventh_reboot_interaction_reduced_motion';
const FORCE_REDUCED_MOTION_FOR_TEST = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('testReducedMotion') === '1';

const INTERACTION_TERMINAL_CODES: Record<SpecialInteractionKind, string> = {
  'bulkhead-isolation': 'PRESSURE CONTROL / LIVE-07',
  'sealed-record-order': 'SEALED RECORD / 06→07',
  'power-routing': 'POWER PROXY / AURORA',
  'memory-seal': 'MEMORY INDEX / SEAL',
  'course-lock': 'NAVIGATION WRITE / S-7',
  'protocol-cut': 'PHASE-CORE / BUS B',
  'memory-restore': 'MEMORY INDEX / RESTORE',
};

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

export function SpecialInteractionOverlay({
  node,
  locale,
  sealedAnchor,
  powerFirstFailureReason,
  lowGravity = false,
  deadlineAt,
  avatarPresentation,
  onResultLocked,
  onComplete,
  onSaveAndExit,
  onRestartDeadline,
}: SpecialInteractionOverlayProps) {
  const copy = useMemo(() => getSpecialInteractionCopy(locale), [locale]);
  const [reducedMotion, setReducedMotion] = useState(() => FORCE_REDUCED_MOTION_FOR_TEST || readStoredBoolean(
    REDUCED_MOTION_KEY,
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  ));
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    overlayRef.current?.focus();
  }, [node.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(REDUCED_MOTION_KEY, String(reducedMotion));
    } catch {
      /* Preference persistence is optional. */
    }
  }, [reducedMotion]);

  const title = node.interactionKind === 'bulkhead-isolation'
    ? copy.bulkhead.title
    : node.interactionKind === 'sealed-record-order'
      ? copy.recordOrder.title
      : node.interactionKind === 'power-routing'
        ? copy.power.title
        : node.interactionKind === 'course-lock'
          ? locale === 'zh-CN' ? '新航线锁定' : 'Lock new course'
          : node.interactionKind === 'protocol-cut'
            ? locale === 'zh-CN' ? '第七协议物理隔离' : 'Physical protocol isolation'
        : node.interactionKind === 'memory-restore'
          ? copy.memory.restoreTitle
          : copy.memory.sealTitle;

  return (
    <div
      ref={overlayRef}
      className={`special-interaction-overlay ${reducedMotion ? 'interaction-reduced-motion' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      data-interaction-kind={node.interactionKind}
      data-gravity-state={lowGravity ? 'degraded' : 'nominal'}
    >
      <div className="interaction-grid-backdrop" aria-hidden />
      <header className="interaction-header">
        <div className="interaction-header-id">
          <span>OBSERVER-01</span>
          <strong>{node.interactionKind ? INTERACTION_TERMINAL_CODES[node.interactionKind] : 'INTERACTION TERMINAL'}</strong>
        </div>
        <div className="interaction-contact-mark">
          <NovaAvatar presentation={avatarPresentation} size={40} reducedMotion={reducedMotion} />
          <span>NOVA / CONTACT</span>
        </div>
        <div className="interaction-header-controls">
          <label className="interaction-switch">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={event => setReducedMotion(event.target.checked)}
            />
            <span aria-hidden />
            {copy.common.reducedMotion}
          </label>
          <button type="button" className="interaction-exit-btn" onClick={onSaveAndExit}>
            {copy.common.saveAndExit}
          </button>
        </div>
      </header>

      <main className="interaction-main">
        {node.interactionKind === 'bulkhead-isolation' && (
          <BulkheadIsolationInteraction
            copy={copy}
            reducedMotion={reducedMotion}
            deadlineAt={deadlineAt!}
            onResultLocked={onResultLocked}
            onComplete={onComplete}
          />
        )}
        {node.interactionKind === 'sealed-record-order' && (
          <SealedRecordOrderInteraction
            locale={locale}
            onResultLocked={onResultLocked}
            onComplete={onComplete}
          />
        )}
        {node.interactionKind === 'power-routing' && (
          <PowerRoutingInteraction
            copy={copy}
            attempt={node.interactionStage === 'first' ? 1 : 2}
            damaged={node.interactionStage === 'damaged_seventh'}
            previousFailure={powerFirstFailureReason}
            lowGravity={lowGravity}
            deadlineAt={deadlineAt!}
            onRestartDeadline={onRestartDeadline}
            onResultLocked={onResultLocked}
            onComplete={onComplete}
          />
        )}
        {node.interactionKind === 'course-lock' && (
          <CourseLockInteraction
            locale={locale}
            reducedMotion={reducedMotion}
            deadlineAt={deadlineAt!}
            onResultLocked={onResultLocked}
            onComplete={onComplete}
          />
        )}
        {node.interactionKind === 'protocol-cut' && (
          <ProtocolCutInteraction
            locale={locale}
            reducedMotion={reducedMotion}
            deadlineAt={deadlineAt!}
            onResultLocked={onResultLocked}
            onComplete={onComplete}
          />
        )}
        {node.interactionKind === 'memory-seal' && (
          <MemoryCapacityInteraction mode="seal" copy={copy} onComplete={onComplete} />
        )}
        {node.interactionKind === 'memory-restore' && (
          <MemoryCapacityInteraction
            mode="restore"
            copy={copy}
            sealedAnchor={sealedAnchor}
            onComplete={onComplete}
          />
        )}
      </main>
    </div>
  );
}
