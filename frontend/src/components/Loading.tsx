type Props = {
  label?: string;
};

export function Loading({ label = "Caricamento…" }: Props) {
  return (
    <p role="status" className="loading">
      {label}
    </p>
  );
}
