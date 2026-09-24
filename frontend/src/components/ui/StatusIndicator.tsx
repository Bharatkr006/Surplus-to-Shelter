type Status = "active" | "pending" | "completed" | "expired" | "cancelled";

const statusConfig: Record<Status, { color: string; label: string }> = {
  active: { color: "bg-primary-500", label: "Active" },
  pending: { color: "bg-urgent-400", label: "Pending" },
  completed: { color: "bg-blue-500", label: "Completed" },
  expired: { color: "bg-danger-500", label: "Expired" },
  cancelled: { color: "bg-gray-400", label: "Cancelled" },
};

interface StatusIndicatorProps {
  status: Status;
  className?: string;
}

export function StatusIndicator({ status, className = "" }: StatusIndicatorProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}
