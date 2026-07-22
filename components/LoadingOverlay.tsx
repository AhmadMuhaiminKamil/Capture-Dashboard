"use client";

interface Props {
  label?: string;
}

export default function LoadingOverlay({ label = "Memuat data..." }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(8px)" }}>

      {/* Orbital rings */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#3b82f6", animation: "spin 1.2s linear infinite" }} />
        {/* mid ring */}
        <div className="absolute inset-3 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#6366f1", borderRightColor: "#6366f1", animation: "spin 0.9s linear infinite reverse" }} />
        {/* inner ring */}
        <div className="absolute inset-6 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#f59e0b", animation: "spin 0.6s linear infinite" }} />
        {/* center dot */}
        <div className="h-3 w-3 rounded-full bg-blue-400 animate-pulse" />
      </div>

      {/* Label */}
      <p className="mt-6 text-sm font-medium text-white/80 tracking-wide">{label}</p>

      {/* Dots */}
      <div className="mt-3 flex gap-1.5">
        {[0, 150, 300].map(delay => (
          <span key={delay} className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: "0.9s" }} />
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
