
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const PondsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('active');
  const [fishTypeFilter, setFishTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'area' | 'date'>('date');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newPond, setNewPond] = useState({ name: '', area: '', fish_type: '' });

  useEffect(() => {
    fetchPonds();
  }, []);

  const fetchPonds = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ponds')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setPonds(data);
    setLoading(false);
  };

  const handleAddPond = async () => {
    if (!newPond.name || !newPond.area || !newPond.fish_type) return;

    const { data } = await supabase.from('ponds').insert([
      {
        user_id: user.id,
        name: newPond.name,
        area: parseFloat(newPond.area),
        fish_type: newPond.fish_type,
        is_active: true,
        is_archived: false
      }
    ]).select();

    if (data) {
      setPonds([...data, ...ponds]);
      setIsModalOpen(false);
      setNewPond({ name: '', area: '', fish_type: '' });
    }
  };

  const handleArchivePond = async (id: string, currentlyArchived: boolean) => {
    const { error } = await supabase
      .from('ponds')
      .update({ is_archived: !currentlyArchived })
      .eq('id', id);

    if (!error) {
      setPonds(ponds.map(p => p.id === id ? { ...p, is_archived: !currentlyArchived } : p));
    }
  };

  const isLimitReached = ponds.filter(p => !p.is_archived).length >= user.max_ponds && user.max_ponds !== 999;

  const uniqueFishTypes = useMemo(() => {
    const types = new Set(ponds.map(p => p.fish_type));
    return Array.from(types);
  }, [ponds]);

  const processedPonds = useMemo(() => {
    let result = [...ponds];

    if (filterStatus === 'active') result = result.filter(p => p.is_active && !p.is_archived);
    else if (filterStatus === 'inactive') result = result.filter(p => !p.is_active && !p.is_archived);
    else if (filterStatus === 'archived') result = result.filter(p => p.is_archived);
    else result = result.filter(p => !p.is_archived);

    if (fishTypeFilter !== 'all') {
      result = result.filter(p => p.fish_type === fishTypeFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'area') return b.area - a.area;
      if (sortBy === 'date') return new Date(b.stock_date).getTime() - new Date(a.stock_date).getTime();
      return 0;
    });

    return result;
  }, [ponds, filterStatus, fishTypeFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">আমার পুকুরসমূহ</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">
            সক্রিয় পুকুর: <span className="text-blue-600">{ponds.filter(p => !p.is_archived).length}</span> / {user.max_ponds === 999 ? 'আনলিমিটেড' : user.max_ponds}
          </p>
        </div>
        <button 
          onClick={() => !isLimitReached && setIsModalOpen(true)}
          disabled={isLimitReached}
          className={`px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl transition-all ${isLimitReached ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 active:scale-95'}`}
        >
          <span>➕</span>
          <span>নতুন পুকুর যোগ</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">অবস্থা:</span>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 border-none rounded-xl px-5 py-2.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="active">সক্রিয় (Active)</option>
            <option value="inactive">বন্ধ (Inactive)</option>
            <option value="archived">আর্কাইভড (Archived)</option>
            <option value="all">সব</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মাছের ধরণ:</span>
          <select 
            value={fishTypeFilter} 
            onChange={(e) => setFishTypeFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-5 py-2.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="all">সব মাছ</option>
            {uniqueFishTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সাজানো:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border-none rounded-xl px-5 py-2.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="date">তারিখ অনুযায়ী</option>
            <option value="name">নাম অনুযায়ী</option>
            <option value="area">আয়তন অনুযায়ী</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {processedPonds.map(pond => (
            <div key={pond.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 hover:shadow-2xl hover:border-blue-100 transition-all group relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-6 relative">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{pond.name}</h3>
                  {pond.is_archived && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1">Archived</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleArchivePond(pond.id, !!pond.is_archived)}
                    className="text-xs p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    title={pond.is_archived ? "Restore" : "Archive"}
                  >
                    {pond.is_archived ? '📤' : '📥'}
                  </button>
                  <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${pond.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {pond.is_active ? 'চলমান' : 'বন্ধ'}
                  </span>
                </div>
              </div>
              <div className="space-y-4 text-sm relative">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-slate-400 font-bold">মাছের প্রজাতি</span>
                  <span className="font-black text-slate-800 bg-slate-50 px-3 py-1 rounded-lg">{pond.fish_type}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-slate-400 font-bold">পুকুর আয়তন</span>
                  <span className="font-black text-slate-800 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">{pond.area} শতাংশ</span>
                </div>
              </div>
              <div className="mt-10 flex gap-4 relative">
                <Link to="/dashboard/reports" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all text-center shadow-lg shadow-blue-100">রিপোর্ট দেখুন</Link>
                <button className="px-5 py-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all hover:text-slate-600 border border-slate-100">⚙️</button>
              </div>
            </div>
          ))}
          {processedPonds.length === 0 && (
            <div className="col-span-full py-24 text-center text-slate-400 font-black italic text-xl border-2 border-dashed border-slate-100 rounded-[3rem]">
              কোন পুকুর পাওয়া যায়নি!
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন পুকুর যোগ করুন</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">পুকুরের নাম</label>
                <input 
                  type="text" 
                  value={newPond.name}
                  onChange={e => setNewPond({...newPond, name: e.target.value})}
                  placeholder="উদা: উত্তর পাড়ের বড় পুকুর" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">আয়তন (শতাংশ)</label>
                <input 
                  type="number" 
                  value={newPond.area}
                  onChange={e => setNewPond({...newPond, area: e.target.value})}
                  placeholder="00" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মাছের প্রজাতি</label>
                <input 
                  type="text" 
                  value={newPond.fish_type}
                  onChange={e => setNewPond({...newPond, fish_type: e.target.value})}
                  placeholder="উদা: তেলাপিয়া / কার্প" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black" 
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all">বাতিল</button>
              <button onClick={handleAddPond} className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all text-lg">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PondsPage;
