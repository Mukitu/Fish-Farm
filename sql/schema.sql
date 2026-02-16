
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

-- ৩. গুদাম (Inventory) টেবিল
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    quantity DECIMAL DEFAULT 0,
    unit TEXT DEFAULT 'কেজি',
    type TEXT DEFAULT 'খাবার',
    low_stock_threshold DECIMAL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. খাবারের ক্রয় ইতিহাস
CREATE TABLE IF NOT EXISTS public.feed_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE SET NULL,
    feed_name TEXT NOT NULL,
    bags INTEGER NOT NULL,
    kg_per_bag DECIMAL NOT NULL,
    price_per_bag DECIMAL NOT NULL,
    total_weight DECIMAL NOT NULL,
    total_price DECIMAL NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৫. খাবারের লগ টেবিল (খাবার প্রয়োগ)
CREATE TABLE IF NOT EXISTS public.feed_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
    amount DECIMAL NOT NULL,
    time TEXT DEFAULT 'সকাল',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৬. পানির মান লগ টেবিল
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE NOT NULL,
    oxygen DECIMAL DEFAULT 0,
    ph DECIMAL DEFAULT 0,
    temp DECIMAL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৭. মাছের বৃদ্ধি রেকর্ড টেবিল
CREATE TABLE IF NOT EXISTS public.growth_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE NOT NULL,
    avg_weight_gm DECIMAL NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৮. খরচের টেবিল
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    item_name TEXT,
    amount DECIMAL NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৯. বিক্রির টেবিল
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE SET NULL,
    item_name TEXT,
    amount DECIMAL NOT NULL,
    weight DECIMAL NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ১০. পোনা মজুদ টেবিল
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

-- RLS পলিসি প্রয়োগ
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "User Access Policy" ON public.%I', tbl);
        
        IF tbl = 'profiles' THEN
             EXECUTE format('CREATE POLICY "User Access Policy" ON public.%I FOR ALL USING (auth.uid() = id)', tbl);
        ELSE
             EXECUTE format('CREATE POLICY "User Access Policy" ON public.%I FOR ALL USING (auth.uid() = user_id)', tbl);
        END IF;
    END LOOP;
END $$;
