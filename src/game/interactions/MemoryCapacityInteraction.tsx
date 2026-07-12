import { useEffect, useState } from 'react';
import type {
  SealableMemoryAnchor,
  SpecialInteractionCompletion,
} from '../types';
import type { SpecialInteractionCopy } from './copy';
import { useInteractionGuidance } from './useInteractionGuidance';
import { InteractionTitle } from './InteractionTitle';
import { NovaTicker } from './NovaTicker';

type MemoryCapacityInteractionProps = {
  mode: 'seal' | 'restore';
  copy: SpecialInteractionCopy;
  sealedAnchor?: SealableMemoryAnchor;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const MEMORY_IDS: SealableMemoryAnchor[] = ['maintenance_board', 'white_flower', 'goodnight'];

const MEMORY_THRESHOLDS = {
  hint1Ms: 35000,
  hint1Invalid: 0,
  hint2Ms: 32000,
  hint2Invalid: 0,
  overrideMs: 90000,
  overrideInvalid: 999,
  overrideMinValid: 2,
  overrideEmergencies: 0,
};

export function MemoryCapacityInteraction({
  mode,
  copy,
  sealedAnchor,
  onComplete,
}: MemoryCapacityInteractionProps) {
  if (mode === 'restore') {
    return (
      <MemoryRestore
        copy={copy}
        sealedAnchor={sealedAnchor}
        onComplete={onComplete}
      />
    );
  }
  return <MemorySeal copy={copy} onComplete={onComplete} />;
}

function MemorySeal({
  copy,
  onComplete,
}: Pick<MemoryCapacityInteractionProps, 'copy' | 'onComplete'>) {
  const [selected, setSelected] = useState<SealableMemoryAnchor | null>(null);
  const [previewed, setPreviewed] = useState<SealableMemoryAnchor>('maintenance_board');
  const [confirming, setConfirming] = useState(false);
  const [nova06NoteShown, setNova06NoteShown] = useState(false);
  const preview = copy.memory.memories[previewed];

  const guidance = useInteractionGuidance({
    thresholds: MEMORY_THRESHOLDS,
    enabled: !confirming,
    maxStage: 3,
  });

  useEffect(() => {
    if (guidance.stage >= 3 && !nova06NoteShown && !selected) {
      setNova06NoteShown(true);
    }
  }, [guidance.stage, nova06NoteShown, selected]);

  const hintText = guidance.stage >= 2
    ? copy.memory.novaUrge.second
    : guidance.stage >= 1
      ? copy.memory.novaUrge.first
      : null;

  function noteInteractionAttempt() {
    guidance.noteValidAttempt();
  }

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
                  onClick={() => {
                    noteInteractionAttempt();
                    setPreviewed(memoryId);
                  }}
                  aria-pressed={previewed === memoryId}
                >
                  {copy.memory.preview}
                </button>
                <button
                  type="button"
                  className={isSelected ? 'interaction-primary-btn' : 'interaction-secondary-btn'}
                  onClick={() => {
                    noteInteractionAttempt();
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
              onClick={() => onComplete({ kind: 'memory-seal', routeKey: selected, anchor: selected })}
            >
              {copy.memory.sealAction}
            </button>
          </div>
        </div>
      ) : null}

      {hintText && (
        <div className="interaction-nova-hint">
          <NovaTicker text={hintText} alert="hint" liveLabel="LIVE" />
        </div>
      )}

      {nova06NoteShown && (
        <div className="memory-nova06-note" role="note" data-testid="memory-nova06-note">
          <span className="nova06-tag" data-reformed>NOVA-06 / RESIDUAL SIGNATURE</span>
          {copy.memory.nova06Note.split('\n').map(line => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function MemoryRestore({
  copy,
  sealedAnchor,
  onComplete,
}: Pick<MemoryCapacityInteractionProps, 'copy' | 'sealedAnchor' | 'onComplete'>) {
  const [restoredFragments, setRestoredFragments] = useState<number[]>([]);

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

  const memory = copy.memory.memories[sealedAnchor];
  const complete = restoredFragments.length === memory.fragments.length;

  function restoreFragment(index: number) {
    setRestoredFragments(current => current.includes(index) ? current : [...current, index]);
  }

  return (
    <section className="memory-restore" aria-labelledby="memory-restore-title">
      <p className="interaction-kicker">{copy.memory.restoreKicker}</p>
      <InteractionTitle id="memory-restore-title">{copy.memory.restoreTitle}</InteractionTitle>
      <p className="interaction-mission">{copy.memory.restoreMission}</p>

      <div className="memory-restore-anchor">
        <span>{memory.source}</span>
        <h3>{memory.title}</h3>
        <p>{memory.summary}</p>
      </div>

      <div className="memory-fragment-progress" aria-live="polite">
        <span>{copy.memory.fragmentStatus}</span>
        <b>{restoredFragments.length} / {memory.fragments.length}</b>
      </div>

      <div className="memory-fragment-field">
        {memory.fragments.map((fragment, index) => {
          const restored = restoredFragments.includes(index);
          return (
            <button
              type="button"
              key={fragment}
              className="memory-fragment"
              data-restored={restored || undefined}
              onClick={() => restoreFragment(index)}
              aria-pressed={restored}
            >
              <span>FRAGMENT 0{index + 1}</span>
              <strong>{restored ? fragment : '████████████'}</strong>
            </button>
          );
        })}
      </div>

      <div className="memory-restored-copy" aria-live="polite">
        {complete ? memory.restored : '\u00a0'}
      </div>

      <button
        type="button"
        className="interaction-primary-btn"
        disabled={!complete}
        onClick={() => onComplete({ kind: 'memory-restore', routeKey: sealedAnchor, anchor: sealedAnchor })}
      >
        {copy.memory.restoreAction}
      </button>
    </section>
  );
}
