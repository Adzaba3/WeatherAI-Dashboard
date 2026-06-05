import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/app.store';

export const treeKeys = {
  all: ['trees'] as const,
  history: () => [...treeKeys.all, 'history'] as const,
  quota: () => [...treeKeys.all, 'quota'] as const,
};

export function useTreeAnalysis() {
  const { apiClient } = useAppStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      if (!apiClient) throw new Error('No API client configured');
      return apiClient.analyzeTrees(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeKeys.history() });
      queryClient.invalidateQueries({ queryKey: treeKeys.quota() });
    },
  });
}

export function useTreeQuota() {
  const { apiClient } = useAppStore();

  return useQuery({
    queryKey: treeKeys.quota(),
    queryFn: async () => {
      if (!apiClient) throw new Error('No client');
      return apiClient.getTreeQuota();
    },
    enabled: !!apiClient,
    staleTime: 1000 * 60 * 5,
  });
}
