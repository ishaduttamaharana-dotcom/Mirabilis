import { useQuery } from "@tanstack/react-query";
import { api, Paginated } from "@/lib/api-client";

export function usePublicCollection<T>(
  collectionName: string,
  fallbackData: T[] = [],
  pageSize = 50,
) {
  const { data, isLoading, error } = useQuery<Paginated<T>>({
    queryKey: ["public-collection", collectionName, pageSize],
    queryFn: () => api.get<Paginated<T>>(`/public/${collectionName}?page_size=${pageSize}`),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const items = data?.items && data.items.length > 0 ? data.items : fallbackData;
  return { items, isLoading, error, isLive: Boolean(data?.items && data.items.length > 0) };
}

export function usePublicItemBySlug<T>(collectionName: string, slug: string, fallbackItem?: T) {
  const { data, isLoading, error } = useQuery<T>({
    queryKey: ["public-item", collectionName, slug],
    queryFn: () => api.get<T>(`/public/${collectionName}/${slug}`),
    staleTime: 60 * 1000,
    enabled: Boolean(slug),
    retry: 1,
  });

  const item = data ?? fallbackItem;
  return { item, isLoading, error, isLive: Boolean(data) };
}
