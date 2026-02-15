
-- ১. প্রোফাইল টেবিল আপডেট
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_payment_months INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- ২. ইনভেন্টরি ও লেনেদেনে কাস্টম ডাটা ফিল্ড
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS weight DECIMAL DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS item_name TEXT;

-- ৩. পেমেন্ট টেবিলে মাসের সংখ্যা যোগ
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS months INTEGER DEFAULT 1;

-- ৪. ইনডেক্সিং এবং পারফরম্যান্স
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
