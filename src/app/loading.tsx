import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <LoadingSpinner
        isLoading={true}
        message="Loading page..."
        showTimeout={true}
        timeoutDuration={10000}
        size="lg"
        className="min-h-screen"
      />
    </div>
  );
} 