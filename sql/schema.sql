
-- ১. এনাম টাইপ তৈরি (Role and Subscription Status)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'FARMER');
    CREATE TYPE sub_status AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ২. প্রোফাইল টেবিল (Profiles Table)
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

-- ৩. পেমেন্ট টেবিল (Payments Table)
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

-- ৪. পুকুর টেবিল (Ponds Table)
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

-- ৫. খরচ টেবিল (Expenses Table)
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

-- ৬. বিক্রি টেবিল (Sales Table)
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

-- ৭. ইনভেন্টরি টেবিল (Inventory Table)
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

-- ৮. পানির লগ (Water Logs)
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    oxygen DECIMAL,
    ph DECIMAL,
    temp DECIMAL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ৯. রো লেভেল সিকিউরিটি (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- ১০. আরএলএস পলিসি (Policies)
-- Profiles: User can read their own or Admin can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- User data: Only owner can access their own records
CREATE POLICY "Owners can access their records" ON public.ponds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners can access their expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners can access their sales" ON public.sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners can access inventory" ON public.inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owners can access water logs" ON public.water_logs FOR ALL USING (auth.uid() = user_id);

-- ১১. ট্র্রিগার ফাংশন (Auth to Profile Sync)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, subscription_status)
  VALUES (new.id, new.email, 'FARMER', 'EXPIRED');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ১২. অ্যাডমিন সেটআপ (আপনার ইমেইল অ্যাডমিন করার জন্য এই কুয়েরিটি রান করুন)
-- গুরুত্বপূর্ণ: আগে সাইনআপ করুন, তারপর নিচের কুয়েরিটি রান করুন।
-- UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'mukituislamnishat@gmail.com';
