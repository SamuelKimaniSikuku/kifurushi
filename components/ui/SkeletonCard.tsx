export default function SkeletonCard() {
  return (
    <div className="card flex animate-pulse flex-col gap-3 p-5" aria-hidden>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-sand-deep" />
          <div className="h-3 w-24 rounded-full bg-sand-deep" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-16 rounded-full bg-sand-deep" />
          <div className="ml-auto h-3 w-12 rounded-full bg-sand-deep" />
        </div>
      </div>
      <div className="h-4 w-3/4 rounded-full bg-sand-deep" />
      <div className="h-3 w-1/2 rounded-full bg-sand-deep" />
      <div className="flex gap-1.5">
        <div className="h-6 w-20 rounded-full bg-sand-deep" />
        <div className="h-6 w-16 rounded-full bg-sand-deep" />
        <div className="h-6 w-24 rounded-full bg-sand-deep" />
      </div>
      <div className="mt-1 h-10 w-full rounded-xl bg-sand-deep" />
    </div>
  );
}
