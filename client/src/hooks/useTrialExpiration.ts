import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface TrialStatus {
  isExpired: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to check trial expiration status
 * Returns expiration status and days remaining
 */
export function useTrialExpiration(schoolCode?: string): TrialStatus {
  const [status, setStatus] = useState<TrialStatus>({
    isExpired: false,
    daysRemaining: 0,
    trialEndDate: null,
    isLoading: true,
    error: null,
  });

  const { data, isLoading, error } = trpc.trial.checkExpiration.useQuery(
    { schoolCode: schoolCode || '' },
    {
      enabled: !!schoolCode,
      refetchInterval: 60 * 60 * 1000, // Refetch every hour
    }
  );

  useEffect(() => {
    if (isLoading) {
      setStatus((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    if (error) {
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: new Error((error as any).message || 'Unknown error'),
      }));
      return;
    }

    if (data) {
      setStatus({
        isExpired: data.isExpired,
        daysRemaining: data.daysRemaining,
        trialEndDate: data.trialEndDate ? new Date(data.trialEndDate) : null,
        isLoading: false,
        error: null,
      });
    }
  }, [data, isLoading, error]);

  return status;
}
