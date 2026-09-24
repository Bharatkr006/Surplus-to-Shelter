import type { ReactNode } from "react";
import { Card } from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({ title, value, icon, change, changeType = "neutral", className = "" }: StatCardProps) {
  const changeColor = {
    positive: "text-primary-600",
    negative: "text-danger-600",
    neutral: "text-text-muted",
  };

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="mt-1 text-2xl font-bold text-text">{value}</p>
          {change && <p className={`mt-1 text-xs font-medium ${changeColor[changeType]}`}>{change}</p>}
        </div>
        {icon && <div className="text-primary-600">{icon}</div>}
      </div>
    </Card>
  );
}
