import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { ReadingsResponseSchema } from '../schemas/readings';
import { POLL_INTERVAL_MS } from '../constants';

async function fetchReadings() {
  const json = await apiFetch('/readings');
  return ReadingsResponseSchema.parse(json);
}

export function useReadings() {
  return useQuery({
    queryKey: ['readings'],
    queryFn: fetchReadings,
    refetchInterval: POLL_INTERVAL_MS,
    retry: 3,
    retryDelay: (attempt) => Math.pow(2, attempt) * 1000,
  });
}
