const BINARY_ROWS = [
  '00111000 00110111 00111000 00110111 00111000 00110111',
  'REBOOT 08 // FRAME LOSS // EXTERNAL HANDSHAKE PRESENT',
  '01001100 01001001 01010110 01000101 00101101 00110000 00110111',
  'CACHE 0001 // LAST STABLE FRAME // READ ONLY',
  '00111000 00111000 00110111 00110111 00111000 00110111',
  'PHASE INDEX 08 > 07-DAMAGED // CRC MISMATCH',
];

export function RebootFallbackOverlay() {
  return (
    <div className="reboot-fallback-overlay" role="status" aria-live="assertive">
      <div className="reboot-fallback-binary" aria-hidden="true">
        {BINARY_ROWS.map((row, index) => (
          <span key={row} style={{ '--fallback-row': index } as CSSProperties}>{row}</span>
        ))}
      </div>
      <div className="reboot-fallback-scan" aria-hidden="true" />
      <section className="reboot-fallback-core">
        <span className="reboot-fallback-kicker">AURORA / EXTERNAL CACHE RECOVERY</span>
        <div className="reboot-fallback-index" aria-label="Reboot 08 fallback to damaged Reboot 07">
          <strong>08</strong>
          <i aria-hidden="true" />
          <strong>07</strong>
        </div>
        <p>正在回读最后一个可用稳定记录</p>
        <div className="reboot-fallback-progress" aria-hidden="true"><span /></div>
        <small>ONE-TIME HANDSHAKE CACHE / CONSUMING</small>
      </section>
      <div className="reboot-fallback-fragments" aria-hidden="true">
        <span>LIVE-07</span>
        <span>NOVA / FRAME 071</span>
        <span>RECORD DAMAGED</span>
        <span>AUTH 06 / INVALID</span>
      </div>
    </div>
  );
}
import type { CSSProperties } from 'react';
