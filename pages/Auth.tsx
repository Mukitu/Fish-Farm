
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole, SubscriptionStatus } from '../types';

interface AuthProps {
  type: 'login' | 'register';
  onLogin: (user: UserProfile) => void;
  enterGuestMode: () => void;
}

const AuthPage: React.FC<AuthProps> = ({ type, onLogin, enterGuestMode }) => {
  const [view, setView] = useState<'auth' | 'forgot'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemo = () => {
    enterGuestMode();
    navigate('/dashboard');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (type === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        
        if (data.user) {
          // রেজিস্ট্রেশনের সময় প্রোফাইল আপডেট
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ farm_name: farmName, phone: phone })
            .eq('id', data.user.id);
          
          if (updateError) console.error("Profile update failed:", updateError);
          
          setSuccess("অ্যাকাউন্ট তৈরি হয়েছে! আপনি এখন লগইন করতে পারেন।");
          setView('auth');
        }
      } else {
        // লগইন করার চেষ্টা
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
          } else {
            throw signInError;
          }
        }

        if (data.user) {
          // প্রোফাইল চেক করার আগে ১ সেকেন্ড অপেক্ষা করা (সেশন সিঙ্ক হওয়ার জন্য)
          await new Promise(resolve => setTimeout(resolve, 1000));

          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          // যদি প্রোফাইল না থাকে, ম্যানুয়ালি তৈরি করার চেষ্টা
          if (!profile || profileError) {
            console.log("প্রোফাইল পাওয়া যায়নি, ম্যানুয়ালি তৈরি করা হচ্ছে...");
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: data.user.id, 
                email: data.user.email,
                subscription_status: SubscriptionStatus.EXPIRED,
                max_ponds: 0,
                role: UserRole.FARMER 
              }])
              .select()
              .single();
            
            if (createError) {
               console.error("Critical Profile Error:", createError);
               throw new Error("আপনার প্রোফাইল ডাটাবেজে তৈরি করা যাচ্ছে না। অনুগ্রহ করে নিশ্চিত করুন যে আপনি Supabase SQL Editor এ schema.sql রান করেছেন।");
            }
            profile = newProfile;
          }

          if (profile) {
            onLogin(profile as UserProfile);
            if (profile.role === UserRole.ADMIN) {
              navigate('/admin');
            } else if (profile.subscription_status === SubscriptionStatus.ACTIVE) {
              navigate('/dashboard');
            } else {
              navigate('/subscription');
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Auth Error Detail:", err);
      setError(err.message || "একটি অজানা সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#/reset-password', 
    });

    if (error) {
      setError("রিসেট লিঙ্ক পাঠাতে সমস্যা হয়েছে। ইমেইলটি সঠিক কিনা যাচাই করুন।");
    } else {
      setSuccess("পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে। ইনবক্স চেক করুন।");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white max-w-md w-full rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="p-10">
          <div className="text-center mb-10">
            <Link to="/" className="inline-block">
               <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl mx-auto mb-6 hover:rotate-12 transition-transform">🐟</div>
            </Link>
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
              {view === 'forgot' ? 'পাসওয়ার্ড উদ্ধার' : (type === 'login' ? 'স্বাগতম!' : 'রেজিস্ট্রেশন করুন')}
            </h1>
            <p className="text-slate-500 font-bold">
              {view === 'forgot' ? 'আপনার রেজিস্টার্ড ইমেইল দিন' : (type === 'login' ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'মৎস্য চাষের নতুন ডিজিটাল যাত্রা শুরু করুন')}
            </p>
          </div>

          {(error || success) && (
            <div className={`p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 animate-in shake duration-300 ${error ? 'bg-rose-50 border border-rose-100 text-rose-600' : 'bg-green-50 border border-green-100 text-green-600'}`}>
              <span>{error ? '⚠️' : '✅'}</span> {error || success}
            </div>
          )}

          {view === 'auth' ? (
            <form onSubmit={handleAuth} className="space-y-5">
              {type === 'register' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খামারের নাম</label>
                    <input type="text" required value={farmName} onChange={e => setFarmName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="উদা: নিশান ফিশ ফার্ম" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">মোবাইল নম্বর</label>
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="০১৭XXXXXXXX" />
                  </div>
                </>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ইমেইল ঠিকানা</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="example@mail.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পাসওয়ার্ড</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="********" />
              </div>

              {type === 'login' && (
                <div className="text-right">
                  <button type="button" onClick={() => setView('forgot')} className="text-xs font-bold text-blue-600 hover:underline">পাসওয়ার্ড ভুলে গেছেন?</button>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4">
                {loading ? 'অপেক্ষা করুন...' : (type === 'login' ? 'লগইন' : 'অ্যাকাউন্ট তৈরি করুন')}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-black">অথবা</span></div>
              </div>

              <button type="button" onClick={handleDemo} className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black text-lg border-2 border-emerald-100 hover:bg-emerald-100 transition-all active:scale-[0.98]">
                ডেমো দেখুন (Guest)
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ইমেইল ঠিকানা</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="আপনার রেজিস্টার্ড ইমেইল দিন" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4">
                {loading ? 'অপেক্ষা করুন...' : 'রিসেট লিঙ্ক পাঠান'}
              </button>
              
              <button type="button" onClick={() => setView('auth')} className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">ফিরে যান</button>
            </form>
          )}

          <div className="mt-8 text-center text-slate-400 font-bold text-sm">
            {type === 'login' ? (
              <p>নতুন খামারি? <Link to="/register" className="text-blue-600 hover:underline">রেজিস্ট্রেশন করুন</Link></p>
            ) : (
              <p>আগে থেকেই একউন্ট আছে? <Link to="/login" className="text-blue-600 hover:underline">লগইন করুন</Link></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
