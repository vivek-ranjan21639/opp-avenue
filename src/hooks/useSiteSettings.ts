import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface SocialLinks {
  linkedin?: string;
  youtube?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
}

export type SocialKey = 'linkedin' | 'youtube' | 'whatsapp' | 'phone' | 'email';

export type SocialVisibility = Partial<Record<SocialKey, boolean>>;

export const fetchSiteSetting = async <T = unknown>(key: string): Promise<T | null> => {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  return (data?.value as T | undefined) ?? null;
};

export const siteSettingQueryOptions = <T = unknown>(key: string) => ({
  queryKey: ["site-setting", key] as const,
  queryFn: () => fetchSiteSetting<T>(key),
});

export function useSiteSetting<T = unknown>(key: string, defaultValue: T): {
  value: T;
  loading: boolean;
} {
  const { data, isLoading } = useQuery(siteSettingQueryOptions<T>(key));
  return { value: data == null ? defaultValue : data, loading: isLoading };
}
