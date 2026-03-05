import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { ContactsResponseSchema, CreateContactResponseSchema, DeleteContactResponseSchema } from '../schemas/readings';

async function fetchContacts(location) {
  const json = await apiFetch(`/contacts?location=${encodeURIComponent(location)}`);
  return ContactsResponseSchema.parse(json);
}

async function createContact(body) {
  const json = await apiFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return CreateContactResponseSchema.parse(json);
}

export function useContacts(location) {
  return useQuery({
    queryKey: ['contacts', location],
    queryFn: () => fetchContacts(location),
    enabled: !!location,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContact,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.location] });
    },
  });
}

async function deleteContact(id) {
  const json = await apiFetch(`/contacts/${id}`, { method: 'DELETE' });
  return DeleteContactResponseSchema.parse(json);
}

export function useDeleteContact(location) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', location] });
    },
  });
}
