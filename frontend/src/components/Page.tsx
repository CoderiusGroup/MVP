import type { ReactNode } from "react";

type Props = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function Page({ title, onBack, backLabel = "Torna indietro", actions, children }: Props) {
  return (
    <div className="page">
      <header className="page__header">
        {onBack ? (
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            {backLabel}
          </button>
        ) : null}
        <h1 className="page__title">{title}</h1>
        {actions ? <div className="page__actions">{actions}</div> : null}
      </header>
      <div className="page__body">{children}</div>
    </div>
  );
}
