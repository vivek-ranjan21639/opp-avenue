INSERT INTO public.user_roles (user_id, role)
VALUES ('d9941757-fbe4-4f99-9391-c074a1c3990d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;