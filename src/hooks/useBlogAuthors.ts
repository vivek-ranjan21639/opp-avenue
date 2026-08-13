import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const blogAuthorsQueryOptions = () => ({
  queryKey: ['blog-authors'] as const,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('b_authors')
      .select('id, name, profile_image, profile_link')
      .order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useBlogAuthors = () => {
  return useQuery(blogAuthorsQueryOptions());
};
