
-- ১. এনাম ও প্রোফাইল অলরেডি থাকলে তা ঠিক রাখা
-- (আগের পার্টের কোড এখানে ধরে নেওয়া হয়েছে)

-- ২. পুকুর টেবিল (Ponds)
CREATE TABLE IF NOT EXISTS public.ponds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    area DECIMAL NOT NULL,
    fish_type TEXT NOT NULL,
    stock_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৩. খরচের টেবিল (Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT,
    amount DECIMAL NOT NULL,
    weight DECIMAL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. বিক্রির টেবিল (Sales)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds ON DELETE CASCADE,
    item_name TEXT,
    amount DECIMAL NOT NULL,
    weight DECIMAL NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৫. পানির লগ (Water Logs)
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds ON DELETE CASCADE,
    oxygen DECIMAL,
    ph DECIMAL,
    temp DECIMAL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ৬. খাবার প্রয়োগ লগ (Feed Logs)
CREATE TABLE IF NOT EXISTS public.feed_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds ON DELETE CASCADE,
    feed_item TEXT,
    amount DECIMAL NOT NULL,
    time TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৭. ইনভেন্টরি (Inventory)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    quantity DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    type TEXT NOT NULL,
    low_stock_threshold DECIMAL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৮. গ্রোথ রেকর্ড (Growth Records)
CREATE TABLE IF NOT EXISTS public.growth_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds ON DELETE CASCADE,
    avg_weight_gm DECIMAL NOT NULL,
    sample_count INTEGER,
    date DATE DEFAULT CURRENT_DATE
);

-- ৯. পেমেন্ট টেবিল (Payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    plan_id INTEGER,
    amount DECIMAL NOT NULL,
    trx_id TEXT UNIQUE NOT NULL,
    months INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- সকল টেবিলে RLS এনাবল করা
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- প্রত্যেক ইউজার শুধুমাত্র নিজের ডাটা দেখতে/মুছতে পারবে (সহজ পলিসি)
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('ponds', 'expenses', 'sales', 'water_logs', 'feed_logs', 'inventory', 'growth_records', 'payments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Owner access %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Owner access %I" ON public.%I FOR ALL USING (auth.uid() = user_id)', t, t);
    END LOOP;
END $$;
