export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-10 text-ink-soft">
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-full border-4 border-mint-3 border-t-primary"
      />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
