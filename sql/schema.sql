
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
    sample_count INTEGER DEFAULT 0,
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
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE CASCADE,
    species TEXT,
    count INTEGER DEFAULT 0,
    total_weight_kg DECIMAL DEFAULT 0,
    avg_weight_gm DECIMAL DEFAULT 0,
    avg_size_inch DECIMAL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ১১. চাষ গাইড টেবিল (Static Data for Advisory)
CREATE TABLE IF NOT EXISTS public.farming_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    species_name TEXT UNIQUE NOT NULL,
    keywords TEXT, -- For better matching
    stocking_density_per_decimal INTEGER NOT NULL,
    expected_yield_kg_per_decimal DECIMAL NOT NULL,
    feed_ratio_percentage DECIMAL NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ১২. চাষ টাইমলাইন টেবিল
CREATE TABLE IF NOT EXISTS public.farming_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guide_id UUID REFERENCES public.farming_guides(id) ON DELETE CASCADE,
    month_number INTEGER NOT NULL,
    task_title TEXT NOT NULL,
    task_description TEXT NOT NULL,
    medicine_suggestions TEXT,
    min_size_inch DECIMAL DEFAULT 0,
    max_size_inch DECIMAL DEFAULT 99,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ১৩. গাইড ডাটা ইনসার্ট (Bangladeshi Context)
INSERT INTO public.farming_guides (species_name, keywords, stocking_density_per_decimal, expected_yield_kg_per_decimal, feed_ratio_percentage, description)
VALUES 
('কার্প মিশ্র চাষ (রুই, কাতলা, মৃগেল)', 'carp,rui,katla,mrigel,mixed,মিশ্র,রুই,কাতলা', 40, 15, 3.0, 'বাংলাদেশের সবচেয়ে জনপ্রিয় চাষ পদ্ধতি। এতে পুকুরের বিভিন্ন স্তরের খাবার ব্যবহৃত হয়।'),
('মনোসেক্স তেলাপিয়া', 'tilapia,monosex,তেলাপিয়া,তেলাপিয়া', 250, 25, 5.0, 'অল্প সময়ে অধিক মুনাফার জন্য তেলাপিয়া চাষ সেরা। ৪-৫ মাসেই বাজারজাত করা যায়।'),
('পাঙ্গাস', 'pangas,pangasius,পাঙ্গাস,পাঙ্গাস', 200, 40, 4.0, 'বাণিজ্যিক ভাবে লাভজনক এবং উচ্চ ফলনশীল মাছ।'),
('শিং ও মাগুর', 'shing,magur,catfish,শিং,মাগুর', 500, 12, 6.0, 'অল্প জায়গায় অধিক ঘনত্বে চাষ করা যায়। বাজার মূল্য অনেক বেশি।'),
('গুলশা ও পাবদা', 'gulsha,pabda,গুলশা,পাবদা', 400, 10, 5.0, 'অভিজাত মাছ হিসেবে পরিচিত, সঠিক ব্যবস্থাপনায় প্রচুর লাভ সম্ভব।'),
('ভিয়েতনামি কৈ', 'koi,vietnam,কৈ,কৈ', 300, 20, 5.5, 'খুব দ্রুত বর্ধনশীল এবং লাভজনক মাছ।'),
('কার্প ফ্যাটেনিং', 'fattening,carp,বড় মাছ', 20, 12, 2.5, 'বড় সাইজের কার্প মাছ তৈরির বিশেষ পদ্ধতি।')
ON CONFLICT (species_name) DO UPDATE SET keywords = EXCLUDED.keywords;

-- টাইমলাইন ডাটা ইনসার্ট (Example for Carp Poly-culture)
DO $$ 
DECLARE 
    carp_id UUID;
    tilapia_id UUID;
    pangas_id UUID;
    koi_id UUID;
BEGIN
    SELECT id INTO carp_id FROM public.farming_guides WHERE species_name = 'কার্প মিশ্র চাষ (রুই, কাতলা, মৃগেল)';
    SELECT id INTO tilapia_id FROM public.farming_guides WHERE species_name = 'মনোসেক্স তেলাপিয়া';
    SELECT id INTO pangas_id FROM public.farming_guides WHERE species_name = 'পাঙ্গাস';
    SELECT id INTO koi_id FROM public.farming_guides WHERE species_name = 'ভিয়েতনামি কৈ';

    -- Clear old timeline to avoid duplicates if re-running
    DELETE FROM public.farming_timeline;

    IF carp_id IS NOT NULL THEN
        INSERT INTO public.farming_timeline (guide_id, month_number, task_title, task_description, medicine_suggestions, min_size_inch, max_size_inch) VALUES
        (carp_id, 1, 'পুকুর প্রস্তুতি ও চুন প্রয়োগ', 'পুকুর শুকানো, তলার কাদা অপসারণ। শতাংশে ১ কেজি চুন ও ৫০০ গ্রাম লবণ প্রয়োগ।', 'চুন, লবণ, ব্লিচিং', 0, 1),
        (carp_id, 2, 'পোনা মজুদ ও প্রাথমিক যত্ন', 'সকালে পোনা অবমুক্ত করা। শতাংশে ৪০টি পোনা (৫-৬ ইঞ্চি)। পোনা ছাড়ার পর ভিটামিন সি প্রয়োগ।', 'পটাশ, ভিটামিন সি', 1, 3),
        (carp_id, 3, 'প্রাকৃতিক খাদ্য উৎপাদন', 'ইউরিয়া ১০০ গ্রাম ও টিএসপি ৫০ গ্রাম শতাংশ প্রতি প্রয়োগ করে পানি সবুজ করা।', 'ইউরিয়া, টিএসপি', 3, 5),
        (carp_id, 4, 'সম্পূরক খাদ্য শুরু', 'মাছের ওজনের ৩% হারে ভাসমান বা ডুবন্ত খাবার প্রদান।', 'এনজাইম', 5, 8),
        (carp_id, 5, 'পানির মান ও অক্সিজেন', 'পানির pH ৭.৫-৮.৫ এর মধ্যে রাখা। ভোরে অক্সিজেন স্বল্পতা হলে এরটর চালানো।', 'অক্সিজেন ট্যাবলেট, জিওলাইট', 8, 10),
        (carp_id, 6, 'মাছের বৃদ্ধি পরীক্ষা', 'নমুনা সংগ্রহ করে ওজন চেক করা। বৃদ্ধি কম হলে খাবারের মান বাড়ানো।', 'গ্রোথ প্রোমোটার', 10, 12),
        (carp_id, 7, 'পরজীবী নিয়ন্ত্রণ', 'মাছের গায়ে উকুন বা লাল দাগ চেক করা। প্রয়োজনে ওষুধ ব্যবহার।', 'ডিপটারেক্স, লবন', 12, 14),
        (carp_id, 8, 'তলার গ্যাস নিয়ন্ত্রণ', 'পুকুরের তলায় গ্যাস জমলে হররা টানা বা গ্যাস ট্র্যাপ ব্যবহার।', 'গ্যাস ট্র্যাপ', 14, 16),
        (carp_id, 9, 'শীতকালীন প্রস্তুতি', 'শীতের আগে পানির গভীরতা বাড়ানো এবং চুন প্রয়োগ করা।', 'চুন, পটাশ', 16, 18),
        (carp_id, 10, 'আংশিক আহরণ', 'বড় মাছগুলো (৮০০ গ্রাম+) বাজারজাত করা।', 'N/A', 18, 20),
        (carp_id, 11, 'বাজারজাতকরণ', 'মাছের সঠিক দাম যাচাই করে পাইকারি বাজারে যোগাযোগ।', 'N/A', 20, 22),
        (carp_id, 12, 'চূড়ান্ত আহরণ ও শুকানো', 'সব মাছ ধরে পুকুর শুকিয়ে পরবর্তী চাষের জন্য প্রস্তুত করা।', 'N/A', 22, 25);
    END IF;

    IF tilapia_id IS NOT NULL THEN
        INSERT INTO public.farming_timeline (guide_id, month_number, task_title, task_description, medicine_suggestions, min_size_inch, max_size_inch) VALUES
        (tilapia_id, 1, 'পুকুর প্রস্তুতি ও পোনা', 'পুকুর শুকানো, চুন প্রয়োগ (১ কেজি/শতাংশ) এবং শতাংশে ২৫০টি মনোসেক্স পোনা মজুদ।', 'চুন, পটাশ', 0, 2),
        (tilapia_id, 2, 'উচ্চ প্রোটিন খাদ্য', '৩০-৩৫% প্রোটিন সমৃদ্ধ ভাসমান খাবার। দিনে ২ বার। মোট ওজনের ৫% খাবার।', 'এনজাইম, ভিটামিন সি', 2, 4),
        (tilapia_id, 3, 'পানির স্বচ্ছতা ও গ্যাস', 'পানির রঙ গাঢ় সবুজ হলে খাবার কমিয়ে দেয়া। তলার গ্যাস চেক করা।', 'জিওলাইট, গ্যাস ট্র্যাপ', 4, 6),
        (tilapia_id, 4, 'আংশিক আহরণ', 'মাছ ২০০-২৫০ গ্রাম হলে বড়গুলো বিক্রি শুরু করা।', 'N/A', 6, 8),
        (tilapia_id, 5, 'চূড়ান্ত আহরণ', '৫ মাস পূর্ণ হলে সব মাছ ধরে ফেলা এবং নতুন চাষের প্রস্তুতি।', 'N/A', 8, 12);
    END IF;

    IF pangas_id IS NOT NULL THEN
        INSERT INTO public.farming_timeline (guide_id, month_number, task_title, task_description, medicine_suggestions) VALUES
        (pangas_id, 1, 'পুকুর প্রস্তুতি', 'গভীর পুকুর নির্বাচন (৫-৬ ফুট পানি)। শতাংশে ২০০টি পোনা মজুদ।', 'চুন, লবন'),
        (pangas_id, 2, 'খাদ্য ব্যবস্থাপনা', 'মাছের ওজনের ৫% হারে খাবার প্রদান। প্রোটিন ২৫-২৮%।', 'ভিটামিন এডি৩ই'),
        (pangas_id, 3, 'পানির মান', 'অ্যামোনিয়া গ্যাস নিয়ন্ত্রণে রাখা। নিয়মিত পানি পরিবর্তন।', 'অ্যামোনিয়াম ট্র্যাপ, জিওলাইট'),
        (pangas_id, 4, 'বৃদ্ধি পর্যবেক্ষণ', 'মাছ দ্রুত বাড়ে, তাই নিয়মিত নমুনা সংগ্রহ করা।', 'এনজাইম'),
        (pangas_id, 5, 'রোগ প্রতিরোধ', 'পাঙ্গাসের লেজ পচা রোগ প্রতিরোধে সতর্ক থাকা।', 'বিকেসি (BKC)'),
        (pangas_id, 6, 'আহরণ শুরু', 'মাছ ৫০০-৬০০ গ্রাম হলে বাজারজাত শুরু করা যায়।', 'N/A');
    END IF;

    IF koi_id IS NOT NULL THEN
        INSERT INTO public.farming_timeline (guide_id, month_number, task_title, task_description, medicine_suggestions) VALUES
        (koi_id, 1, 'পোনা মজুদ', 'শতাংশে ৩০০-৪০০টি ভিয়েতনামি কৈ পোনা মজুদ।', 'পটাশ শোধন'),
        (koi_id, 2, 'খাদ্য ও পানি', 'উচ্চ প্রোটিন খাবার এবং নিয়মিত পানি পরিবর্তন।', 'প্রোবায়োটিক'),
        (koi_id, 3, 'রোগ ও প্রতিকার', 'ক্ষত রোগ এড়াতে চুন ও লবন প্রয়োগ।', 'সিআই (CI), লবন'),
        (koi_id, 4, 'আহরণ', '৩-৪ মাসেই মাছ ১০০-১৫০ গ্রাম হলে বিক্রি করা।', 'N/A');
    END IF;
END $$;

-- RLS পলিসি প্রয়োগ (গাইড টেবিল সবার জন্য রিড-অনলি)
ALTER TABLE public.farming_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farming_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.farming_guides;
CREATE POLICY "Public Read Access" ON public.farming_guides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.farming_timeline;
CREATE POLICY "Public Read Access" ON public.farming_timeline FOR SELECT USING (true);

-- RLS পলিসি প্রয়োগ (অন্যান্য টেবিল)
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
             IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'user_id') THEN
                EXECUTE format('CREATE POLICY "User Access Policy" ON public.%I FOR ALL USING (auth.uid() = user_id)', tbl);
             END IF;
        END IF;
    END LOOP;
END $$;
