INSERT INTO public.user_roles (user_id, role)
VALUES ('e2af1e10-5061-40b0-96a4-d41011fa3518', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;