export default function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-[28px] border border-ink/10 bg-white/80 p-5 shadow-card backdrop-blur">
      <p className="text-xs uppercase tracking-[0.28em] text-moss">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
      <p className="mt-2 text-sm text-ink/65">{hint}</p>
    </div>
  );
}

