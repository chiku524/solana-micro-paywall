import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  ...props
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-neutral-800';
  
  const variantClasses = {
    default: 'rounded',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      {...props}
    />
  );
}

// Pre-built skeleton components
export function ContentCardSkeleton() {
  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden">
      <Skeleton className="w-full aspect-video" variant="rectangular" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="80px" />
        </div>
      </div>
    </div>
  );
}

export function DashboardCardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('glass-strong p-6 rounded-xl', className)} {...props}>
      <Skeleton variant="text" width="120px" className="mb-4" />
      <Skeleton variant="text" width="200px" height={32} className="mb-2" />
      <Skeleton variant="text" width="150px" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-neutral-800">
      <td className="py-4 px-6">
        <Skeleton variant="text" width="60%" />
      </td>
      <td className="py-4 px-6">
        <Skeleton variant="text" width="80px" />
      </td>
      <td className="py-4 px-6">
        <Skeleton variant="text" width="120px" />
      </td>
      <td className="py-4 px-6">
        <Skeleton variant="text" width="100px" />
      </td>
    </tr>
  );
}


