
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SUBSCRIPTION_PLANS } from '../types';

const Landing: React.FC<{ enterGuestMode: () => void }> = ({ enterGuestMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState<any[]>(SUBSCRIPTION_PLANS);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    // Fetch dynamic plans
    const fetchPlans = async () => {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'subscription_plans').single();
      if (data && data.value) {
        setPlans(data.value);
      }
    };
    fetchPlans();

    // Visitor tracking
    const trackVisit = async () => {
      try {
        await supabase.from('site_analytics').insert([{ 
          page_path: window.location.pathname,
          visitor_id: localStorage.getItem('visitor_id') || (() => {
            const id = Math.random().toString(36).substring(2);
            localStorage.setItem('visitor_id', id);
            return id;
          })()
        }]);
      } catch (e) {
        console.error('Tracking error:', e);
      }
    };
    trackVisit();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleDemo = () => {
    enterGuestMode();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">🐟</div>
            <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight text-shadow-sm">মৎস্য খামার</span>
          </Link>
          
          <div className="hidden md:flex gap-8 text-slate-600 font-bold text-sm">
            <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 transition-colors">বৈশিষ্ট্যসমূহ</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-blue-600 transition-colors">মূল্যতালিকা</button>
            <Link to="/founder" className="hover:text-blue-600 transition-colors">প্রতিষ্ঠাতা</Link>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleDemo} className="hidden sm:block px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs border border-emerald-100 hover:bg-emerald-100 transition-all">ডেমো</button>
            <Link to="/login" className="hidden sm:block text-slate-600 font-bold text-sm px-4">লগইন</Link>
            <Link to="/register" className="hidden sm:block px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">শুরু করুন</Link>
            <Link to="/login" className="sm:hidden px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">লগইন করুন</Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center text-xl text-slate-800 bg-slate-100 rounded-lg transition-transform active:scale-90">
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 space-y-6 animate-in slide-in-from-top-4 duration-300 z-50">
            <button onClick={handleDemo} className="block w-full text-left font-black text-emerald-600 text-lg">ডেমো দেখুন (Guest)</button>
            <button onClick={() => scrollToSection('features')} className="block w-full text-left font-black text-slate-800 text-lg">বৈশিষ্ট্যসমূহ</button>
            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left font-black text-slate-800 text-lg">মূল্যতালিকা</button>
            <Link to="/founder" onClick={() => setIsMenuOpen(false)} className="block font-black text-slate-800 text-lg">প্রতিষ্ঠাতা</Link>
            <div className="h-px bg-slate-100"></div>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block font-black text-blue-600 text-center text-xl">লগইন করুন</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-52 md:pb-40 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-400/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-400/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-8 border border-blue-100 animate-bounce">
           <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
           স্মার্ট মাছ চাষের ডিজিটাল যুগ
        </div>
        
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
          পুকুরের হিসাব রাখুন <br />
          <span className="text-blue-600">উন্নত প্রযুক্তিতে</span>
        </h1>
        
        <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-bold mb-12">
          খাবার প্রয়োগ থেকে শুরু করে পানির গুণমান পর্যবেক্ষণ—সবকিছুই এখন এক ক্লিকে। বাংলাদেশের খামারিদের জন্য বিশেষভাবে তৈরি স্মার্ট ম্যানেজমেন্ট সফটওয়্যার।
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-5 w-full sm:w-auto">
          <Link to="/register" className="px-12 py-5 bg-blue-600 text-white rounded-2xl text-xl font-black shadow-2xl shadow-blue-400/40 hover:bg-blue-700 transition-all hover:-translate-y-1 text-center">ফ্রি রেজিস্ট্রেশন</Link>
          <button onClick={handleDemo} className="px-12 py-5 bg-emerald-600 text-white rounded-2xl text-xl font-black shadow-2xl shadow-emerald-400/40 hover:bg-emerald-700 transition-all hover:-translate-y-1 text-center">ডেমো দেখুন (Guest)</button>
          <Link to="/founder" className="px-12 py-5 bg-white text-slate-800 border border-slate-200 rounded-2xl text-xl font-black hover:bg-slate-50 transition-all text-center">প্রতিষ্ঠাতার সাথে কথা বলুন</Link>
        </div>
      </header>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান</h2>
             <p className="text-slate-500 font-bold max-w-md mx-auto">আপনার পুকুরের সংখ্যা অনুযায়ী সেরা প্যাকেজটি বেছে নিন। কোনো লুকানো খরচ নেই।</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 flex flex-col items-center text-center hover:border-blue-600 hover:shadow-2xl transition-all group relative overflow-hidden">
                {plan.ponds === 999 && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-8 py-1.5 rotate-45 translate-x-8 translate-y-4 font-black text-[10px] uppercase">Best Value</div>
                )}
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-inner">
                  {plan.ponds === 999 ? '👑' : '💧'}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{plan.label}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black text-blue-600">৳ {plan.price}</span>
                  <span className="text-slate-400 font-bold text-sm">/মাস</span>
                </div>
                <ul className="space-y-4 mb-10 text-slate-500 font-bold text-sm text-left w-full pl-6">
                  <li className="flex items-center gap-3">✅ <span className="text-slate-700">{plan.ponds === 999 ? 'আনলিমিটেড' : plan.ponds + 'টি'} পুকুর যুক্ত করা</span></li>
                  <li className="flex items-center gap-3">✅ <span className="text-slate-700">স্মার্ট ড্যাশবোর্ড এক্সেস</span></li>
                  <li className="flex items-center gap-3">✅ <span className="text-slate-700">ইনভেন্টরি ম্যানেজমেন্ট</span></li>
                  <li className="flex items-center gap-3">✅ <span className="text-slate-700">অটোমেটেড রিপোর্ট</span></li>
                </ul>
                <Link to="/register" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl active:scale-95">প্ল্যানটি কিনুন</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">সব ফিচার এক ড্যাশবোর্ড</h2>
            <p className="text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">আমরা খামারিদের কথা চিন্তা করে ইন্টারফেসটি একদম সহজ কিন্তু শক্তিশালী করেছি।</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard title="পুকুর ব্যবস্থাপনা" description="পোনা মজুদ থেকে শুরু করে প্রতিটি পুকুরের আলাদা হিসাব এবং বিস্তারিত ট্র্যাকিং সিস্টেম।" icon="🌊" />
            <FeatureCard title="গ্রোথ অ্যানালাইসিস" description="মাছের বৃদ্ধির গ্রাফিক্যাল চার্ট দেখে সঠিক সিদ্ধান্ত নিন যা লাভ বাড়াতে সাহায্য করবে।" icon="📈" />
            <div className="p-10 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform">
               <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🧪</div>
               <h3 className="text-2xl font-black mb-4">পানির গুণমান</h3>
               <p className="text-blue-100 font-medium leading-relaxed">অক্সিজেন, পিএইচ এবং তাপমাত্রা নিয়মিত ট্র্যাক করে মড়কের ঝুঁকি কমিয়ে ফেলুন সহজে।</p>
            </div>
            <FeatureCard title="আর্থিক হিসাব" description="খরচ ও বিক্রির স্বচ্ছ হিসাব দেখে আপনার ব্যবসার প্রকৃত লাভ বা ক্ষতির চিত্র পান।" icon="💰" />
            <FeatureCard title="ইনভেন্টরি এলার্ট" description="খাবার বা ওষুধ শেষ হওয়ার আগেই মোবাইলে এলার্ট পাবেন, কাজ থামবে না কখনো।" icon="📦" />
            <FeatureCard title="স্মার্ট রিপোর্ট" description="যেকোনো সময়ের রিপোর্ট এক ক্লিকে তৈরি করুন যা ব্যাংক লোন বা ব্যবসায়িক কাজে লাগবে।" icon="📜" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-2xl">🐟</div>
                <span className="text-3xl font-black tracking-tight">মৎস্য খামার</span>
              </div>
              <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
                উন্নত মৎস্য চাষের মাধ্যমে বাংলাদেশের খামারিদের ডিজিটালাইজেশন করতে আমরা কাজ করে যাচ্ছি।
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-6">
                <div className="flex gap-6 text-sm font-black uppercase tracking-widest text-slate-400">
                    <a href="#features" className="hover:text-white transition-colors">ফিচার</a>
                    <a href="#pricing" className="hover:text-white transition-colors">প্রাইসিং</a>
                    <Link to="/founder" className="hover:text-white transition-colors">প্রতিষ্ঠাতা</Link>
                </div>
                <p className="text-xs text-slate-500 font-bold border-t border-white/5 pt-8">
                    &copy; ২০২৬ মৎস্য খামার। মুকিতু ইসলাম নিশাত কর্তৃক প্রস্তুতকৃত ও সংরক্ষিত।
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => (
  <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:translate-y-[-8px] transition-all group">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">{icon}</div>
    <h3 className="text-2xl font-black mb-3 text-slate-800">{title}</h3>
    <p className="text-slate-500 font-medium text-sm leading-relaxed">{description}</p>
  </div>
);

export default Landing;
