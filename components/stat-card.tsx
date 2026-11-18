import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  icon?: React.ElementType;
  color?: "amber" | "blue" | "emerald" | "rose";
};

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = "amber",
}: StatCardProps) {
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:border-amber-900/30",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 dark:border-blue-900/30",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-900/30",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400 dark:border-rose-900/30",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        colorClasses[color],
      )}
    >
      {Icon && (
        <div className="mb-4">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      )}
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          {subtitle}
        </p>
      )}
      {trend && (
        <p className={`mt-2 text-xs font-semibold ${
          trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        }`}>
          {trend.value}
        </p>
      )}
    </div>
  );
}