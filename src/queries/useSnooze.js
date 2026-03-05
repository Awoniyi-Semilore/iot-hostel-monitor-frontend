import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { SnoozeResponseSchema } from '../schemas/readings';

async function startSnooze(deviceId) {
  const json = await apiFetch(`/devices/${deviceId}/snooze`, { method: 'POST' });
  return SnoozeResponseSchema.parse(json);
}

async function cancelSnooze(deviceId) {
  const json = await apiFetch(`/devices/${deviceId}/snooze`, { method: 'DELETE' });
  return SnoozeResponseSchema.parse(json);
}

export function useSnooze() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['readings'] });

  const start = useMutation({ mutationFn: startSnooze, onSuccess: invalidate });
  const cancel = useMutation({ mutationFn: cancelSnooze, onSuccess: invalidate });

  return { start, cancel };
}
