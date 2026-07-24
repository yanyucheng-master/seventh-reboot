import { useState } from 'react';
import type {
  SealableMemoryAnchor,
  SpecialInteractionCompletion,
} from '../types';
import type { SpecialInteractionCopy } from './copy';
import { InteractionTitle } from './InteractionTitle';

type MemoryCapacityInteractionProps = {
  mode: 'seal' | 'restore';
  copy: SpecialInteractionCopy;
  sealedAnchor?: SealableMemoryAnchor;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const MEMORY_IDS: SealableMemoryAnchor[] = ['maintenance_board', 'white_flower', 'goodnight'];

export function MemoryCapacityInteraction({
  mode,
  copy,
  sealedAnchor,
  onComplete,
}: MemoryCapacityInteractionProps) {
  return mode === 'restore'
    ? <MemoryRestore copy={copy} sealedAnchor={sealedAnchor} onComplete={onComplete} />
    : <MemorySeal copy={copy} onComplete={onComplete} />;
}

function MemorySeal({
  copy,
  onComplete,
}: Pick<MemoryCapacityInteractionProps, 'copy' | 'onComplete'>) {
  const [selected, setSelected] = useState<SealableMemoryAnchor | null>(null);
  const [previewed, setPreviewed] = useState<SealableMemoryAnchor>('maintenance_board');
  const [confirming, setConfirming] = useState(false);
  const preview = copy.memory.memories[previewed];

  return (
    <section className="memory-capacity" aria-labelledby="memory-seal-title">
      <p className="interaction-kicker">{copy.memory.sealKicker}</p>
      <InteractionTitle id="memory-seal-title">{copy.memory.sealTitle}</InteractionTitle>
      <p className="interaction-mission">{copy.memory.sealMission}</p>

      <div className="memory-index-readout">
        <span>INDEX CAPACITY<b>99.97%</b></span>
        <span>TEMPORARY SLOT<b>1 REQUIRED</b></span>
        <span>ENDING FLAGS<b>UNCHANGED</b></span>
      </div>

      <div className="memory-candidate-list">
        {MEMORY_IDS.map((memoryId, index) => {
          const memory = copy.memory.memories[memoryId];
          const isSelected = selected === memoryId;
          return (
            <article className="memory-candidate" key={memoryId} data-selected={isSelected || undefined}>
              <div className="memory-candidate-index">0{index + 1}</div>
              <div className="memory-candidate-copy">
                <span>{memory.source}</span>
                <h3>{memory.title}</h3>
                <div className="memory-candidate-facts">
                  <span>{memory.emotion}</span>
                  <b>18%</b>
                </div>
                <p>{memory.summary}</p>
              </div>
              <div className="memory-candidate-actions">
                <button
                  type="button"
                  className="interaction-text-btn"
                  onClick={() => setPreviewed(memoryId)}
                  aria-pressed={previewed === memoryId}
                >
                  {copy.memory.preview}
                </button>
                <button
                  type="button"
                  className={isSelected ? 'interaction-primary-btn' : 'interaction-secondary-btn'}
                  data-testid={`memory-seal-${memoryId}`}
                  onClick={() => {
                    setSelected(memoryId);
                    setPreviewed(memoryId);
                    setConfirming(false);
                  }}
                  aria-pressed={isSelected}
                >
                  {isSelected ? copy.memory.selected : copy.memory.select}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="memory-preview" aria-live="polite">
        <span>{copy.memory.preview} / {preview.source}</span>
        <blockquote>{preview.preview}</blockquote>
      </div>

      {!confirming ? (
        <button
          type="button"
          className="interaction-primary-btn memory-confirm-open"
          disabled={!selected}
          onClick={() => setConfirming(true)}
        >
          {copy.common.confirm}
        </button>
      ) : selected ? (
        <div className="memory-confirmation" role="alertdialog" aria-labelledby="memory-confirm-title">
          <p className="interaction-kicker">TEMPORARY SEAL / {selected}</p>
          <h3 id="memory-confirm-title">{copy.memory.confirmTitle}</h3>
          <p>{copy.memory.confirmDetail}</p>
          <strong>{copy.memory.memories[selected].warning}</strong>
          <div>
            <button type="button" className="interaction-secondary-btn" onClick={() => setConfirming(false)}>
              {copy.common.cancel}
            </button>
            <button
              type="button"
              className="interaction-primary-btn"
              data-testid="memory-seal-confirm"
              onClick={() => onComplete({ kind: 'memory-seal', routeKey: selected, anchor: selected })}
            >
              {copy.memory.sealAction}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MemoryRestore({
  copy,
  sealedAnchor,
  onComplete,
}: Pick<MemoryCapacityInteractionProps, 'copy' | 'sealedAnchor' | 'onComplete'>) {
  const [restoredAnchor, setRestoredAnchor] = useState<SealableMemoryAnchor | null>(null);
  const [mismatchAnchor, setMismatchAnchor] = useState<SealableMemoryAnchor | null>(null);

  if (!sealedAnchor) {
    return (
      <section className="interaction-result" aria-live="polite">
        <div className="interaction-result-mark" aria-hidden>0 / 0</div>
        <p className="interaction-kicker">{copy.memory.restoreKicker}</p>
        <InteractionTitle state="resolved">{copy.memory.restoreTitle}</InteractionTitle>
        <p>{copy.memory.noAnchor}</p>
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete({ kind: 'memory-restore', routeKey: 'none' })}
        >
          {copy.common.continue}
        </button>
      </section>
    );
  }

  const restoredMemory = restoredAnchor ? copy.memory.memories[restoredAnchor] : null;

  return (
    <section className="memory-restore" aria-labelledby="memory-restore-title">
      <p className="interaction-kicker">{copy.memory.restoreKicker}</p>
      <InteractionTitle id="memory-restore-title" state={restoredAnchor ? 'resolved' : 'active'}>
        {copy.memory.restoreTitle}
      </InteractionTitle>
      <p className="interaction-mission">{copy.memory.restoreMission}</p>

      <div className="memory-fragment-groups">
        {MEMORY_IDS.map((memoryId, groupIndex) => {
          const memory = copy.memory.memories[memoryId];
          const restored = restoredAnchor === memoryId;
          const mismatch = mismatchAnchor === memoryId;
          return (
            <article
              className="memory-fragment-group"
              key={memoryId}
              data-restored={restored || undefined}
              data-mismatch={mismatch || undefined}
            >
              <header>
                <span>FRAGMENT GROUP / 0{groupIndex + 1}</span>
                <strong>{restored ? 'INDEX MATCH' : mismatch ? 'NO MATCH' : 'UNVERIFIED'}</strong>
              </header>
              <div>
                {memory.fragments.map((fragment, fragmentIndex) => (
                  <p key={fragment}>
                    <span>0{fragmentIndex + 1}</span>
                    {fragment}
                  </p>
                ))}
              </div>
              <button
                type="button"
                className="interaction-secondary-btn"
                data-testid={`memory-restore-${memoryId}`}
                disabled={Boolean(restoredAnchor)}
                onClick={() => {
                  if (memoryId === sealedAnchor) {
                    setRestoredAnchor(memoryId);
                    setMismatchAnchor(null);
                  } else {
                    setMismatchAnchor(memoryId);
                  }
                }}
              >
                {copy.memory.restoreSelect}
              </button>
              {mismatch && <p className="memory-restore-mismatch" role="alert">{copy.memory.restoreMismatch}</p>}
            </article>
          );
        })}
      </div>

      <div className="memory-restored-copy" aria-live="polite">
        {restoredMemory ? (
          <>
            <strong>{restoredMemory.title}</strong>
            <p>{restoredMemory.restored}</p>
          </>
        ) : '\u00a0'}
      </div>

      <button
        type="button"
        className="interaction-primary-btn"
        data-testid="memory-restore-confirm"
        disabled={!restoredAnchor}
        onClick={() => {
          if (!restoredAnchor) return;
          onComplete({ kind: 'memory-restore', routeKey: restoredAnchor, anchor: restoredAnchor });
        }}
      >
        {copy.memory.restoreAction}
      </button>
    </section>
  );
}
