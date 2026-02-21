-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create site_settings table for dynamic pricing
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initialize site_settings with default plans (all 6)
INSERT INTO site_settings (id, value)
VALUES ('subscription_plans', '[
    {"id": 1, "label": "১টি পুকুর", "price": 150, "ponds": 1},
    {"id": 2, "label": "২টি পুকুর", "price": 300, "ponds": 2},
    {"id": 3, "label": "৩টি পুকুর", "price": 400, "ponds": 3},
    {"id": 4, "label": "৪টি পুকুর", "price": 500, "ponds": 4},
    {"id": 5, "label": "৫টি পুকুর", "price": 550, "ponds": 5},
    {"id": 6, "label": "আনলিমিটেড পুকুর", "price": 800, "ponds": 999}
]')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- Create analytics table for visitor tracking
CREATE TABLE IF NOT EXISTS site_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path TEXT NOT NULL,
    visitor_id TEXT, -- Can be a session ID or hashed IP
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for new tables
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for coupons (Admin only for write, all for read)
CREATE POLICY "Admin can manage coupons" ON coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "All can read active coupons" ON coupons FOR SELECT USING (is_active = true);

-- Policies for site_settings (Admin only for write, all for read)
CREATE POLICY "Admin can manage site_settings" ON site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "All can read site_settings" ON site_settings FOR SELECT USING (true);

-- Policies for site_analytics (All can insert, Admin only for select)
CREATE POLICY "All can insert analytics" ON site_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read analytics" ON site_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
