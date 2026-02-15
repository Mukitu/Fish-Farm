
-- ১. এনাম টাইপ তৈরি
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'FARMER');
    CREATE TYPE sub_status AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ২. প্রোফাইল টেবিল
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'FARMER',
    subscription_status sub_status DEFAULT 'EXPIRED',
    expiry_date TIMESTAMPTZ,
    max_ponds INTEGER DEFAULT 0,
    farm_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৩. পেমেন্ট টেবিল
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL,
    amount DECIMAL NOT NULL,
    trx_id TEXT UNIQUE NOT NULL,
    months INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. পুকুর টেবিল
CREATE TABLE IF NOT EXISTS public.ponds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    area DECIMAL NOT NULL,
    fish_type TEXT,
    stock_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৫. খরচ টেবিল
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT,
    amount DECIMAL NOT NULL,
    weight DECIMAL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৬. বিক্রি টেবিল
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    item_name TEXT,
    amount DECIMAL NOT NULL,
    weight DECIMAL NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৭. ইনভেন্টরি টেবিল
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    type TEXT CHECK (type IN ('খাবার', 'ওষুধ', 'অন্যান্য')),
    low_stock_threshold DECIMAL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৮. পানির লগ টেবিল
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    oxygen DECIMAL,
    ph DECIMAL,
    temp DECIMAL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ৯. গ্রোথ রেকর্ড টেবিল
CREATE TABLE IF NOT EXISTS public.growth_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    avg_weight_gm DECIMAL NOT NULL,
    sample_count INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ১০. ফিড লগ টেবিল
CREATE TABLE IF NOT EXISTS public.feed_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    feed_item TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    time TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ১১. আরএলএস পলিসি (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;

-- পলিসি সেটআপ
CREATE POLICY "Profiles self access" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins full access profiles" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Owners access records ponds" ON public.ponds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners access records expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners access records sales" ON public.sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners access records inventory" ON public.inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners access records water_logs" ON public.water_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners access records growth_records" ON public.growth_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners access records feed_logs" ON public.feed_logs FOR ALL USING (auth.uid() = user_id);

-- ১২. অটোমেটিক অ্যাডমিন প্রোমোশন
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF new.email = 'mukituislamnishat@gmail.com' THEN
    INSERT INTO public.profiles (id, email, role, subscription_status, max_ponds, expiry_date)
    VALUES (new.id, new.email, 'ADMIN', 'ACTIVE', 999, '2099-12-31');
  ELSE
    INSERT INTO public.profiles (id, email, role, subscription_status, max_ponds)
    VALUES (new.id, new.email, 'FARMER', 'EXPIRED', 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
