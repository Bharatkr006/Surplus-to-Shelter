import type { ReactNode } from "react";

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="border-b border-border bg-surface-alt">{children}</thead>;
}

export function TableRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`border-b border-border last:border-0 ${className}`}>{children}</tr>;
}

export function TableHead({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium text-text-secondary ${className}`}>{children}</th>;
}

export function TableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-text ${className}`}>{children}</td>;
}
