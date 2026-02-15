
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
          // Profile is created via trigger, but we might need to update fields
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ farm_name: farmName, phone: phone })
            .eq('id', data.user.id);

          if (updateError) console.error("Update profile error:", updateError);
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
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl mx-auto mb-6">🐟</div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">
              {type === 'login' ? 'স্বাগতম!' : 'একউন্ট তৈরি করুন'}
            </h1>
            <p className="text-slate-500 font-medium">
              {type === 'login' ? 'আপনার খামারের ড্যাশবোর্ডে লগইন করুন' : 'আপনার খামারকে ডিজিটাল করতে রেজিস্ট্রেশন করুন'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {type === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">খামারের নাম</label>
                  <input 
                    type="text" 
                    required 
                    value={farmName}
                    onChange={e => setFarmName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                    placeholder="উদা: সোনালী ফিশ ফার্ম"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">মোবাইল নম্বর</label>
                  <input 
                    type="tel" 
                    required 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                    placeholder="০১৭XXXXXXXX"
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ইমেইল ঠিকানা</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                placeholder="example@mail.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">পাসওয়ার্ড</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                placeholder="********"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'প্রসেসিং...' : (type === 'login' ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন')}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-600 font-bold">
            {type === 'login' ? (
              <p>নতুন খামারি? <Link to="/register" className="text-blue-600">রেজিস্ট্রেশন করুন</Link></p>
            ) : (
              <p>আগে থেকেই একউন্ট আছে? <Link to="/login" className="text-blue-600">লগইন করুন</Link></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;