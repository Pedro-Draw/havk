import { cn } from "../../lib/utils";

export default function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          safeValue >= 100 ? "bg-emerald-500" : "bg-zinc-200",
          className
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}