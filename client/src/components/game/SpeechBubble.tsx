export function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border-2 border-mint-3 bg-white px-4 py-2.5 text-base font-extrabold text-deep shadow-press-soft sm:text-lg">
      {/* tail pointing at the mascot */}
      <span
        aria-hidden="true"
        className="absolute -left-[7px] top-1/2 size-3 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-mint-3 bg-white"
      />
      {children}
    </div>
  );
}
