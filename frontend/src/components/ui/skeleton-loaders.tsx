/**
 * Skeleton loaders for data-fetching pages.
 * Provides smooth loading states that match the actual layout.
 */

export const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

export const QueueSkeleton = () => (
  <div className="space-y-6 portal-page">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      <SkeletonBlock className="h-9 w-28 rounded-full" />
    </div>

    {/* Table card */}
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
      <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}>
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-4 w-40" />
      </div>
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <SkeletonBlock className="h-6 w-24 rounded" />
            <SkeletonBlock className="h-5 w-56 flex-1" />
            <SkeletonBlock className="h-5 w-24 rounded-full" />
            <SkeletonBlock className="h-5 w-16 rounded" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const EvidenceCardSkeleton = () => (
  <div className="space-y-5 portal-page">
    {/* Header */}
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-9 w-9 rounded-lg" />
      <SkeletonBlock className="h-6 w-56" />
      <SkeletonBlock className="h-5 w-12 rounded" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left panel */}
      <div className="lg:col-span-7 space-y-4">
        <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-20 w-full" />
        </div>
        <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="h-16 w-full" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <SkeletonBlock className="h-4 w-36" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
                <SkeletonBlock className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-5">
        <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="h-36 w-full" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
          <SkeletonBlock className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

export const MetricsSkeleton = () => (
  <div className="space-y-6 portal-page pb-10">
    {/* Header */}
    <div className="space-y-2">
      <SkeletonBlock className="h-7 w-48" />
      <SkeletonBlock className="h-4 w-80" />
    </div>

    {/* KPI Row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-9 w-9 rounded-lg" />
          </div>
          <SkeletonBlock className="h-8 w-20" />
          <SkeletonBlock className="h-3 w-40" />
        </div>
      ))}
    </div>

    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-xl border p-5" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
          <SkeletonBlock className="h-5 w-36 mb-4" />
          <SkeletonBlock className="h-52 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export const AuditSkeleton = () => (
  <div className="space-y-6 portal-page pb-10">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-52" />
        <SkeletonBlock className="h-4 w-80" />
      </div>
      <SkeletonBlock className="h-8 w-32 rounded-full" />
    </div>

    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
      <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}>
        <SkeletonBlock className="h-5 w-28" />
        <SkeletonBlock className="h-8 w-64 rounded-lg" />
      </div>
      <div className="p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-6 w-24 rounded" />
            <SkeletonBlock className="h-5 w-20 rounded-full" />
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-36 flex-1" />
            <SkeletonBlock className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const TicketStatusSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-5 portal-page">
    <SkeletonBlock className="h-9 w-44 rounded-lg" />
    {/* Status banner */}
    <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-14 w-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
      </div>
      <div className="flex items-center gap-4 pt-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center flex-1 gap-2">
            <SkeletonBlock className="h-8 w-8 rounded-full" />
            {i < 2 && <SkeletonBlock className="h-1 flex-1" />}
          </div>
        ))}
      </div>
    </div>
    {/* Detail card */}
    <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
      <SkeletonBlock className="h-5 w-40" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-16 w-full" />
        <SkeletonBlock className="h-16 w-full" />
      </div>
      <SkeletonBlock className="h-24 w-full" />
    </div>
  </div>
);
