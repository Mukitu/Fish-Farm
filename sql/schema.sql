
-- ১. এনাম টাইপ তৈরি (আগে থেকে থাকলে এরর এড়িয়ে যাবে)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'FARMER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_status') THEN
        CREATE TYPE sub_status AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED');
    END IF;
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

-- আরএলএস এনাবল করা
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- পুরাতন পলিসি পরিষ্কার করা
DROP POLICY IF EXISTS "Profiles self access" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access profiles" ON public.profiles;

-- ১. যে কেউ নিজের প্রোফাইল দেখতে পারবে
CREATE POLICY "Profiles self access" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- ২. যে কেউ নিজের প্রোফাইল ইনসার্ট/তৈরি করতে পারবে (সবচেয়ে গুরুত্বপূর্ণ)
CREATE POLICY "Users can insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- ৩. যে কেউ নিজের প্রোফাইল আপডেট করতে পারবে
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- ৪. অ্যাডমিন এক্সেস (রিকার্সন ছাড়া)
CREATE POLICY "Admins full access profiles" ON public.profiles 
FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' );

-- অন্যান্য টেবিলের আরএলএস (সংক্ষিপ্ত)
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners access records ponds" ON public.ponds;
CREATE POLICY "Owners access records ponds" ON public.ponds FOR ALL USING (auth.uid() = user_id);

-- ৫. অটোমেটিক প্রোফাইল হ্যান্ডলার ফাংশন
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF new.email = 'mukituislamnishat@gmail.com' THEN
    INSERT INTO public.profiles (id, email, role, subscription_status, max_ponds, expiry_date)
    VALUES (new.id, new.email, 'ADMIN', 'ACTIVE', 999, '2099-12-31')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  ELSE
    INSERT INTO public.profiles (id, email, role, subscription_status, max_ponds)
    VALUES (new.id, new.email, 'FARMER', 'EXPIRED', 0)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ৬. ট্রিগার সেটআপ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
