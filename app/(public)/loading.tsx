export default function PublicLoading() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-8">
      <div className="h-10 w-64 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded bg-muted h-64 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
