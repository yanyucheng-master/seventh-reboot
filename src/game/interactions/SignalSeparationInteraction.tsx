import { useState, type CSSProperties } from 'react';
import type { SignalSeparationResult, SpecialInteractionCompletion } from '../types';
import type { SpecialInteractionCopy } from './copy';
import { isSignalAligned } from './logic';
import { SignalWaveform } from './SignalWaveform';

type SignalSeparationInteractionProps = {
  copy: SpecialInteractionCopy;
  assistMode: boolean;
  reducedMotion: boolean;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const STAGES = [
  { target: 62, tolerance: 8, unit: 'kHz', layer: 0 },
  { target: 34, tolerance: 10, unit: 'deg', layer: 1 },
  { target: 71, tolerance: 10, unit: '%', layer: 2 },
  { target: 58, tolerance: 8, unit: 'T+', layer: 3 },
] as const;

export function SignalSeparationInteraction({
  copy,
  assistMode,
  reducedMotion,
  onComplete,
}: SignalSeparationInteractionProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [values, setValues] = useState([18, 82, 25, 14]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [assistedUsed, setAssistedUsed] = useState(false);
  const [result, setResult] = useState<SignalSeparationResult | null>(null);
  const stage = STAGES[stageIndex];
  const effectiveTolerance = stage.tolerance * (assistMode ? 1.5 : 1);
  const aligned = isSignalAligned(values[stageIndex], stage.target, effectiveTolerance);

  function setCurrentValue(nextValue: number) {
    setValues(current => current.map((value, index) => (index === stageIndex ? nextValue : value)));
    setFeedback('');
  }

  function finishStage() {
    if (!aligned) {
      setAttempts(current => current + 1);
      setFeedback(copy.signal.outsideBand);
      return;
    }

    setFeedback(copy.signal.locked);
    if (stageIndex === STAGES.length - 1) {
      setResult(assistedUsed || assistMode ? 'assisted' : 'clean');
      return;
    }
    window.setTimeout(() => {
      setStageIndex(index => index + 1);
      setAttempts(0);
      setFeedback('');
    }, reducedMotion ? 0 : 420);
  }

  function calibrate() {
    setAssistedUsed(true);
    setCurrentValue(stage.target);
    setFeedback(copy.signal.locked);
  }

  if (result) {
    const assisted = result === 'assisted';
    return (
      <section className="interaction-result" aria-live="polite" data-testid="signal-result">
        <div className="interaction-result-mark" aria-hidden>3 / 3</div>
        <p className="interaction-kicker">{copy.signal.kicker}</p>
        <h2>{assisted ? copy.signal.assistedTitle : copy.signal.cleanTitle}</h2>
        <p>{assisted ? copy.signal.assistedDetail : copy.signal.cleanDetail}</p>
        <div className="signal-result-ledger">
          {copy.signal.layers.map(layer => (
            <span key={layer.name}><b>LOCKED</b>{layer.name}</span>
          ))}
          <span><b>ALIGNED</b>{copy.signal.stageTitles[3]}</span>
        </div>
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete({ kind: 'signal-separation', routeKey: result })}
        >
          {copy.signal.returnToChannel}
        </button>
      </section>
    );
  }

  const targetStart = Math.max(0, stage.target - effectiveTolerance);
  const targetEnd = Math.min(100, stage.target + effectiveTolerance);

  return (
    <section className="signal-separator" aria-labelledby="signal-interaction-title">
      <p className="interaction-kicker">{copy.signal.kicker}</p>
      <h2 id="signal-interaction-title">{copy.signal.title}</h2>
      <p className="interaction-mission">{copy.signal.mission}</p>

      <div className="signal-layer-list">
        {copy.signal.layers.map((layer, index) => {
          const recovered = stageIndex > index;
          const active = stageIndex === index || stageIndex === 3;
          const stateText = recovered || stageIndex === 3 ? 'LOCKED' : active ? 'ACTIVE' : 'QUEUED';
          return (
            <div className="signal-layer-row" key={layer.name} data-state={stateText.toLowerCase()}>
              <div className="signal-layer-meta">
                <div>
                  <strong>{layer.name}</strong>
                  <span>{layer.detail}</span>
                </div>
                <b>{stateText}</b>
              </div>
              <SignalWaveform
                value={values[index]}
                seed={index + 1}
                active={active}
                recovered={recovered || stageIndex === 3}
                reducedMotion={reducedMotion}
                label={`${layer.name}: ${stateText}`}
              />
            </div>
          );
        })}
      </div>

      <div className="signal-control-deck">
        <div className="interaction-stage-heading">
          <span>{copy.common.phase} {stageIndex + 1} / {STAGES.length}</span>
          <h3>{copy.signal.stageTitles[stageIndex]}</h3>
          <p>{copy.signal.stageOrders[stageIndex]}</p>
        </div>

        <div className="signal-reading-grid">
          <span>{copy.signal.targetBand}<b>{Math.round(targetStart)}–{Math.round(targetEnd)} {stage.unit}</b></span>
          <span>{copy.signal.currentReading}<b>{values[stageIndex]} {stage.unit}</b></span>
        </div>

        <input
          data-testid={`signal-slider-${stageIndex}`}
          className="interaction-range signal-range"
          style={{ '--target-start': `${targetStart}%`, '--target-end': `${targetEnd}%` } as CSSProperties}
          type="range"
          min="0"
          max="100"
          step="1"
          value={values[stageIndex]}
          onChange={event => setCurrentValue(Number(event.target.value))}
          aria-label={copy.signal.stageTitles[stageIndex]}
          aria-valuetext={`${values[stageIndex]} ${stage.unit}`}
        />

        <div className="signal-control-actions">
          <button type="button" className="interaction-secondary-btn" onClick={calibrate}>
            {copy.signal.calibrate}
          </button>
          <button type="button" className="interaction-primary-btn" onClick={finishStage}>
            {copy.signal.lock}
          </button>
        </div>
        <p className="interaction-feedback" aria-live="polite">
          {feedback || (attempts > 0 ? copy.signal.outsideBand : '\u00a0')}
        </p>
      </div>
    </section>
  );
}
