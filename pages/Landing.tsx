
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '../types';

const Landing: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">🐟</div>
            <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">মৎস্য খামার</span>
          </Link>
          
          <div className="hidden md:flex gap-8 text-slate-600 font-bold text-sm">
            <a href="#features" className="hover:text-blue-600 transition-colors">বৈশিষ্ট্য</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">মূল্যতালিকা</a>
            <Link to="/founder" className="hover:text-blue-600 transition-colors">প্রতিষ্ঠাতা</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-slate-600 font-bold text-sm px-4">লগইন</Link>
            <Link to="/register" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">শুরু করুন</Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center text-xl text-slate-800 bg-slate-100 rounded-lg">
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4 animate-in slide-in-from-top-2 duration-200 z-50">
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block font-bold text-slate-800">বৈশিষ্ট্যসমূহ</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block font-bold text-slate-800">মূল্যতালিকা</a>
            <Link to="/founder" onClick={() => setIsMenuOpen(false)} className="block font-bold text-slate-800">প্রতিষ্ঠাতা</Link>
            <div className="h-px bg-slate-100"></div>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block font-bold text-blue-600 text-center">লগইন</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-52 md:pb-40 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-400/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-400/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-6 border border-blue-100">
           <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
           স্মার্ট মাছ চাষের ডিজিটাল সমাধান
        </div>
        
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
          পুকুরের হিসাব রাখুন <br />
          <span className="text-blue-600">উন্নত প্রযুক্তিতে</span>
        </h1>
        
        <p className="mt-6 text-base md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
          খাবার প্রয়োগ থেকে শুরু করে পানির গুণমান পর্যবেক্ষণ—সবকিছুই এখন এক ক্লিকে। বাংলাদেশের খামারিদের জন্য বিশেষভাবে তৈরি স্মার্ট ম্যানেজমেন্ট সফটওয়্যার।
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
          <Link to="/register" className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-2xl shadow-blue-400/30 hover:bg-blue-700 transition-all text-center">ফ্রি রেজিস্ট্রেশন</Link>
          <Link to="/founder" className="px-10 py-4 bg-white text-slate-800 border border-slate-200 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all text-center">প্রতিষ্ঠাতার প্রোফাইল</Link>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">সব ফিচার এক ড্যাশবোর্ড</h2>
            <p className="text-slate-500 font-bold max-w-lg mx-auto">আমরা খামারিদের কথা চিন্তা করে ইন্টারফেসটি একদম সহজ কিন্তু শক্তিশালী করেছি।</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard title="পুকুর ব্যবস্থাপনা" description="পোনা মজুদ থেকে শুরু করে প্রতিটি পুকুরের আলাদা হিসাব এবং বিস্তারিত ট্র্যাকিং সিস্টেম।" icon="🌊" />
            <FeatureCard title="গ্রোথ অ্যানালাইসিস" description="মাছের বৃদ্ধির গ্রাফিক্যাল চার্ট দেখে সঠিক সিদ্ধান্ত নিন যা লাভ বাড়াতে সাহায্য করবে।" icon="📈" />
            <div className="p-10 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান</h2>
             <p className="text-slate-500 font-bold">আপনার পুকুরের সংখ্যা অনুযায়ী সেরা প্যাকেজটি বেছে নিন</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div key={plan.id} className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 flex flex-col items-center text-center hover:border-blue-600 hover:shadow-2xl transition-all group">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  {plan.ponds === 999 ? '🌟' : '💧'}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{plan.label}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black text-blue-600">৳ {plan.price}</span>
                  <span className="text-slate-400 font-bold text-sm">/মাস</span>
                </div>
                <ul className="space-y-4 mb-10 text-slate-500 font-bold text-sm">
                  <li>✅ {plan.ponds === 999 ? 'আনলিমিটেড' : plan.ponds + 'টি'} পুকুর যুক্ত করা</li>
                  <li>✅ স্মার্ট ড্যাশবোর্ড এক্সেস</li>
                  <li>✅ সম্পূর্ণ ইনভেন্টরি ম্যানেজমেন্ট</li>
                  <li>✅ অটোমেটেড রিপোর্ট জেনারেশন</li>
                  <li>✅ ২৪/৭ কাস্টমার সাপোর্ট</li>
                </ul>
                <Link to="/register" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-colors">প্ল্যানটি কিনুন</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 mb-24">
        <div className="max-w-6xl mx-auto bg-blue-600 rounded-[4rem] p-12 md:p-20 text-center text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6">আপনার খামারকে আজই ডিজিটাল করুন</h2>
            <p className="text-blue-100 font-bold max-w-xl mx-auto mb-10 text-lg">
              হাজারো সফল খামারিদের সাথে যোগ দিন এবং আপনার মৎস্য চাষ ব্যবসাকে নিয়ে যান এক অনন্য উচ্চতায়।
            </p>
            <Link to="/register" className="px-12 py-5 bg-white text-blue-600 rounded-3xl text-xl font-black hover:scale-105 transition-transform inline-block shadow-2xl">এখনই শুরু করুন</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xl">🐟</div>
                <span className="text-2xl font-black tracking-tight">মৎস্য খামার</span>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed">
                উন্নত মৎস্য চাষের মাধ্যমে বাংলাদেশের অর্থনীতির চাকাকে সচল করতে আমরা কাজ করে যাচ্ছি।
              </p>
            </div>
            <div>
              <h4 className="text-lg font-black mb-6">লিঙ্কসমূহ</h4>
              <ul className="space-y-4 text-slate-400 font-bold text-sm">
                <li><a href="#features" className="hover:text-blue-400">ফিচারসমূহ</a></li>
                <li><a href="#pricing" className="hover:text-blue-400">সাবস্ক্রিপশন প্ল্যান</a></li>
                <li><Link to="/founder" className="hover:text-blue-400">প্রতিষ্ঠাতা</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-black mb-6">যোগাযোগ</h4>
              <ul className="space-y-4 text-slate-400 font-bold text-sm">
                <li>📞 ০১৩০৩-৫৯৫০৬২</li>
                <li>✉️ support@fishfarm.com</li>
                <li>📍 ঢাকা, বাংলাদেশ</li>
              </ul>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-bold border-t border-white/5 pt-8 text-center">
             &copy; ২০২৪ মৎস্য খামার। মুুকিতুল ইসলাম নিশাত কর্তৃক প্রস্তুতকৃত ও সংরক্ষিত।
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => (
  <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:translate-y-[-5px] transition-all group">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">{icon}</div>
    <h3 className="text-2xl font-black mb-3 text-slate-800">{title}</h3>
    <p className="text-slate-500 font-medium text-sm leading-relaxed">{description}</p>
  </div>
);

export default Landing;
