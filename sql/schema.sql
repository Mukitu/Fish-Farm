
-- ১. এনাম ও প্রোফাইল টেবিল সেটআপ
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'FARMER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_status') THEN
        CREATE TYPE sub_status AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'FARMER',
    subscription_status sub_status DEFAULT 'EXPIRED',
    expiry_date TIMESTAMPTZ,
    max_ponds INTEGER DEFAULT 0,
    farm_name TEXT,
    phone TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ২. পুকুর টেবিল
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

-- ৩. পোনা মজুদ টেবিল
CREATE TABLE IF NOT EXISTS public.stocking_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    species TEXT,
    count INTEGER DEFAULT 0,
    total_weight_kg DECIMAL DEFAULT 0,
    avg_weight_gm DECIMAL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. খাবারের লগ টেবিল
CREATE TABLE IF NOT EXISTS public.feed_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    feed_item TEXT DEFAULT 'সাধারণ খাবার',
    amount DECIMAL NOT NULL,
    time TEXT DEFAULT 'সকাল',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৫. খরচের টেবিল
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT,
    amount DECIMAL NOT NULL,
    weight DECIMAL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৬. বিক্রির টেবিল
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    item_name TEXT,
    amount DECIMAL NOT NULL,
    weight DECIMAL NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS পলিসিগুলো প্রয়োগ (DROP then CREATE to avoid already exists error)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocking_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own Profile Access" ON public.profiles;
CREATE POLICY "Own Profile Access" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Own Ponds Access" ON public.ponds;
CREATE POLICY "Own Ponds Access" ON public.ponds FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own Stocking Access" ON public.stocking_records;
CREATE POLICY "Own Stocking Access" ON public.stocking_records FOR ALL USING (EXISTS (SELECT 1 FROM ponds WHERE id = stocking_records.pond_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Own Feeds Access" ON public.feed_logs;
CREATE POLICY "Own Feeds Access" ON public.feed_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own Expenses Access" ON public.expenses;
CREATE POLICY "Own Expenses Access" ON public.expenses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own Sales Access" ON public.sales;
CREATE POLICY "Own Sales Access" ON public.sales FOR ALL USING (auth.uid() = user_id);
