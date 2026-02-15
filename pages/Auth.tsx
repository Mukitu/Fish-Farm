
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole, SubscriptionStatus } from '../types';

interface AuthProps {
  type: 'login' | 'register';
  onLogin: (user: UserProfile) => void;
}

const AuthPage: React.FC<AuthProps> = ({ type, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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
          await supabase
            .from('profiles')
            .update({ farm_name: farmName, phone: phone })
            .eq('id', data.user.id);
          navigate('/subscription');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

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
      setError("ইমেইল বা পাসওয়ার্ড ভুল অথবা সার্ভার সমস্যা।");
    } finally {
      setLoading(false);
    }
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
              {type === 'login' ? 'স্বাগতম!' : 'রেজিস্ট্রেশন করুন'}
            </h1>
            <p className="text-slate-500 font-bold">
              {type === 'login' ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'মৎস্য চাষের নতুন ডিজিটাল যাত্রা শুরু করুন'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 animate-in shake duration-300">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4">
              {loading ? 'অপেক্ষা করুন...' : (type === 'login' ? 'লগইন' : 'অ্যাকাউন্ট তৈরি করুন')}
            </button>
          </form>

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
