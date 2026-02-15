
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
    <div className="min-h-screen bg-white font-['Hind_Siliguri'] overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">🐟</div>
            <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">মৎস্য খামার</span>
          </Link>
          
          <div className="hidden md:flex gap-10 text-slate-600 font-black text-xs uppercase tracking-widest">
            <a href="#features" className="hover:text-blue-600 transition-colors">বৈশিষ্ট্য</a>
            <Link to="/founder" className="hover:text-blue-600 transition-colors">প্রতিষ্ঠাতা</Link>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">মূল্যতালিকা</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-slate-600 font-black text-sm hover:text-blue-600 transition-colors">লগইন</Link>
            <Link to="/register" className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">শুরু করুন</Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center text-2xl text-slate-800 bg-slate-100 rounded-xl">
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 space-y-6 animate-in slide-in-from-top-4 duration-300 z-50">
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block font-black text-slate-800 text-lg">বৈশিষ্ট্যসমূহ</a>
            <Link to="/founder" onClick={() => setIsMenuOpen(false)} className="block font-black text-slate-800 text-lg">প্রতিষ্ঠাতা সম্পর্কে</Link>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block font-black text-slate-800 text-lg">সাবস্ক্রিপশন প্ল্যান</a>
            <div className="h-[1px] bg-slate-100 w-full"></div>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block font-black text-blue-600 text-lg">সরাসরি লগইন</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-40 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-400/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-400/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-8 border border-blue-100">
           <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
           স্মার্ট মাছ চাষের ডিজিটাল যুগ
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[1.1] tracking-tighter">
          পুকুরের হিসাব রাখুন <br className="hidden md:block" />
          <span className="text-blue-600">উন্নত প্রযুক্তিতে</span>
        </h1>
        
        <p className="mt-8 text-base md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium px-4">
          খাবার প্রয়োগ থেকে শুরু করে পানির গুণমান পর্যবেক্ষণ—সবকিছুই এখন এক ক্লিকে। বাংলাদেশের খামারিদের জন্য বিশেষভাবে তৈরি স্মার্ট ম্যানেজমেন্ট সফটওয়্যার।
        </p>
        
        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4">
          <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] md:rounded-[2rem] text-lg font-black shadow-2xl shadow-blue-400/30 hover:bg-blue-700 hover:translate-y-[-4px] active:translate-y-0 transition-all">রেজিস্ট্রেশন করুন</Link>
          <Link to="/founder" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-800 border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2rem] text-lg font-black hover:bg-slate-50 hover:border-slate-200 transition-all">মালিকের সাথে কথা বলুন</Link>
        </div>

        <div className="mt-20 md:mt-32 w-full max-w-5xl mx-auto relative px-2 group">
           <div className="absolute inset-0 bg-blue-600/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="bg-slate-900 p-2 md:p-4 rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(37,99,235,0.2)] overflow-hidden">
             <img src="https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=1200" alt="Dashboard Preview" className="w-full h-auto rounded-[1.5rem] md:rounded-[2.5rem] object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
           </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-40 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">সব ফিচার এক ড্যাশবোর্ডে</h2>
            <p className="text-slate-500 font-bold text-sm md:text-lg max-w-xl mx-auto">আমরা খামারিদের কথা চিন্তা করে ইন্টারফেসটি একদম সহজ কিন্তু শক্তিশালী করেছি।</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            <FeatureCard title="পুকুর ব্যবস্থাপনা" description="প্রত্যেকটি পুকুরের জন্য আলাদা হিসাব এবং পোনা মজুদের বিস্তারিত ট্র্যাকিং সিস্টেম।" icon="🌊" />
            <FeatureCard title="গ্রোথ অ্যানালাইসিস" description="মাছের সাপ্তাহিক ও মাসিক ওজন বৃদ্ধির গ্রাফিক্যাল চার্ট যা সিদ্ধান্ত নিতে সাহায্য করবে।" icon="📈" />
            <div className="p-8 md:p-12 bg-blue-600 rounded-[2.5rem] md:rounded-[3rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl group-hover:rotate-12 transition-transform duration-700">🧪</div>
               <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mb-10">🧪</div>
               <h3 className="text-2xl font-black mb-4">পানির গুণমান</h3>
               <p className="text-blue-100 leading-relaxed font-bold">অক্সিজেন, পিএইচ এবং তাপমাত্রা নিয়মিত লগ করে বড় বিপদ থেকে আপনার খামার রক্ষা করুন।</p>
            </div>
            <FeatureCard title="আর্থিক হিসাব" description="দৈনিক খাবার ও ঔষধের খরচ থেকে শুরু করে মাছ বিক্রির প্রফিট মার্জিন দেখুন সহজেই।" icon="💰" />
            <FeatureCard title="স্টক ইনভেন্টরি" description="খাবার বা ঔষধ শেষ হয়ে আসার আগেই স্বয়ংক্রিয় এলার্ট পাবেন আপনার ফোনে।" icon="📦" />
            <FeatureCard title="স্মার্ট রিপোর্ট" description="ব্যাংক লোন বা নিজের বিশ্লেষণের জন্য এক ক্লিকে পিডিএফ রিপোর্ট তৈরি করুন।" icon="📜" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">আপনার পছন্দমতো প্ল্যান</h2>
            <p className="text-slate-500 font-bold text-sm md:text-lg">সব প্ল্যানেই আমাদের সকল প্রিমিয়াম ফিচার অন্তর্ভুক্ত থাকবে।</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {SUBSCRIPTION_PLANS.slice(0, 3).map(plan => (
              <PriceCard key={plan.id} plan={plan} />
            ))}
          </div>
          <div className="mt-16 text-center">
             <Link to="/register" className="text-blue-600 font-black flex items-center justify-center gap-2 group text-lg">
                সবগুলো প্যাকেজ দেখুন 
                <span className="group-hover:translate-x-2 transition-transform">→</span>
             </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-24 mb-24">
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg shadow-blue-500/20">🐟</div>
               <span className="text-3xl font-black tracking-tighter">মৎস্য খামার</span>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm font-medium">
              আমরা তৈরি করছি স্মার্ট ফিশ ফার্মিং ইকোসিস্টেম। বাংলাদেশের খামারিদের ডিজিটালাইজেশন করাই আমাদের মূল লক্ষ্য।
            </p>
          </div>
          <div>
            <h4 className="font-black text-slate-500 text-xs uppercase tracking-[0.2em] mb-10">কোম্পানি</h4>
            <ul className="space-y-6 text-slate-300 font-black text-sm">
              <li><Link to="/founder" className="hover:text-blue-400 transition-colors">প্রতিষ্ঠাতা প্রোফাইল</Link></li>
              <li><a href="#pricing" className="hover:text-blue-400 transition-colors">প্যাকেজসমূহ</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">সহযোগিতা</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-slate-500 text-xs uppercase tracking-[0.2em] mb-10">যোগাযোগ</h4>
            <div className="space-y-6">
               <p className="text-slate-300 font-black text-sm">
                  ইমেইল: <br />
                  <span className="text-white text-lg lowercase">contact@fishfarm.bd</span>
               </p>
               <p className="text-slate-300 font-black text-sm">
                  ফোন: <br />
                  <span className="text-white text-lg">০১৩০৩-৫৯৫০৬২</span>
               </p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-12 text-center text-slate-500 text-xs font-bold">
          &copy; ২০২৪ মৎস্য খামার টেকনোলজি। মুুকিতুল ইসলাম নিশাত কর্তৃক প্রস্তুতকৃত।
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => (
  <div className="p-10 md:p-12 bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:translate-y-[-10px] transition-all duration-500 group text-left">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-500">{icon}</div>
    <h3 className="text-2xl font-black mb-4 text-slate-800 tracking-tight">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-bold text-sm md:text-base">{description}</p>
  </div>
);

const PriceCard: React.FC<{ plan: any }> = ({ plan }) => (
  <div className="p-10 md:p-12 bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-500 flex flex-col text-center">
    <p className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6">{plan.label}</p>
    <div className="mb-10">
      <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">৳{plan.price}</span>
      <span className="text-slate-400 font-bold text-sm ml-1">/মাস</span>
    </div>
    <ul className="text-left space-y-6 mb-12 flex-1">
      <li className="flex items-center gap-4 text-slate-600 font-bold text-sm"><span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">✓</span> {plan.ponds}টি পুকুর ব্যবস্থাপনা</li>
      <li className="flex items-center gap-4 text-slate-600 font-bold text-sm"><span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">✓</span> রিয়েল-টাইম ডাটা ট্র্যাকিং</li>
      <li className="flex items-center gap-4 text-slate-600 font-bold text-sm"><span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">✓</span> মোবাইল অ্যাপ এক্সেস</li>
    </ul>
    <Link to="/register" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2rem] text-lg font-black hover:bg-blue-600 transition-colors shadow-xl">প্ল্যানটি নিন</Link>
  </div>
);

export default Landing;
