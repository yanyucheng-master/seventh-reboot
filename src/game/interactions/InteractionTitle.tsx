type InteractionTitleProps = {
  children: string;
  id?: string;
  state?: 'active' | 'resolved';
};

export function InteractionTitle({
  children,
  id,
  state = 'active',
}: InteractionTitleProps) {
  return (
    <h2
      id={id}
      className="interaction-title"
      data-title-state={state}
    >
      <span className="interaction-title-main">{children}</span>
      <span className="interaction-title-ghost-layer" aria-hidden="true">
        {children}
      </span>
    </h2>
  );
}
