import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 w-${i === 1 ? "32" : i === 3 ? "16" : "24"}`} />
        </td>
      ))}
    </tr>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
      </div>
      <div className="card">
        <Skeleton className="h-5 w-36 mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 py-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
