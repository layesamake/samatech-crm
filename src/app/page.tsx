import dynamic from 'next/dynamic';

const MobileDashboard = dynamic(
  () => import('@/modules/dashboard/presentation/MobileDashboard').then(mod => ({ default: mod.MobileDashboard })),
  {
    loading: () => (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    ),
  }
);

export default function Home() { return <MobileDashboard />; }
