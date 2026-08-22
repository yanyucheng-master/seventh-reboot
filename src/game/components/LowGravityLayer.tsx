const FLOATING_FRAGMENTS = [
  { x: '12%', y: '72%', delay: '-2.4s', duration: '10.5s' },
  { x: '24%', y: '84%', delay: '-6.1s', duration: '12.8s' },
  { x: '43%', y: '77%', delay: '-3.2s', duration: '11.6s' },
  { x: '61%', y: '88%', delay: '-8.4s', duration: '14.2s' },
  { x: '76%', y: '70%', delay: '-4.9s', duration: '10.8s' },
  { x: '89%', y: '82%', delay: '-1.8s', duration: '13.4s' },
];

export function LowGravityLayer() {
  return (
    <div className="low-gravity-layer" aria-hidden="true">
      <span className="low-gravity-deck-line" />
      {FLOATING_FRAGMENTS.map((fragment, index) => (
        <i
          key={index}
          style={{
            left: fragment.x,
            top: fragment.y,
            animationDelay: fragment.delay,
            animationDuration: fragment.duration,
          }}
        />
      ))}
      <span className="low-gravity-vector low-gravity-vector-a" />
      <span className="low-gravity-vector low-gravity-vector-b" />
    </div>
  );
}
