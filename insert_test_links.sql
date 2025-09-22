-- Insert test user links for debugging
-- Replace '83c16c96-6fd4-4d24-a1c4-ba2183f6af28' with the actual user ID from your logs
INSERT INTO public.user_links (user_id, title, url, display_order) VALUES
('83c16c96-6fd4-4d24-a1c4-ba2183f6af28', 'Website', 'https://example.com', 1),
('83c16c96-6fd4-4d24-a1c4-ba2183f6af28', 'Twitter', 'https://twitter.com/example', 2),
('83c16c96-6fd4-4d24-a1c4-ba2183f6af28', 'Instagram', 'https://instagram.com/example', 3),
('83c16c96-6fd4-4d24-a1c4-ba2183f6af28', 'LinkedIn', 'https://linkedin.com/in/example', 4),
('83c16c96-6fd4-4d24-a1c4-ba2183f6af28', 'YouTube', 'https://youtube.com/@example', 5)
ON CONFLICT (user_id, url) DO NOTHING;
