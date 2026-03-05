import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { HistoryResponseSchema } from '../schemas/readings';

async function fetchHistory(deviceId, limit) {
  const json = await apiFetch(`/readings/${deviceId}/history?limit=${limit}`);
  return HistoryResponseSchema.parse(json);
}

export function useHistory(deviceId, limit = 50) {
  return useQuery({
    queryKey: ['history', deviceId, limit],
    queryFn: () => fetchHistory(deviceId, limit),
    enabled: !!deviceId,
  });
}
