
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond, StockingRecord } from '../types';

const PondsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [newPond, setNewPond] = useState({ name: '', area: '', fish_type: '' });
  const [stocking, setStocking] = useState({ species: '', count: '', total_weight: '' });

  useEffect(() => {
    fetchPonds();
  }, []);

  const fetchPonds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ponds')
        .select(`*, stocking_records(*)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedPonds = data?.map((p: any) => {
        const totalCount = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.count), 0) || 0;
        const totalWeight = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.total_weight_kg), 0) || 0;
        return {
          ...p,
          total_stocked_count: totalCount,
          total_stocked_weight_kg: totalWeight,
          avg_stocked_weight_gm: totalCount > 0 ? (totalWeight * 1000) / totalCount : 0
        };
      });
      
      setPonds(processedPonds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStocking = async () => {
    if (!selectedPond || !stocking.count || !stocking.total_weight) return;
    setSaving(true);
    const avg = (parseFloat(stocking.total_weight) * 1000) / parseInt(stocking.count);
    
    const { error } = await supabase.from('stocking_records').insert([{
      pond_id: selectedPond.id,
      species: stocking.species || selectedPond.fish_type,
      count: parseInt(stocking.count),
      total_weight_kg: parseFloat(stocking.total_weight),
      avg_weight_gm: avg,
      date: new Date().toISOString().split('T')[0]
    }]);

    if (!error) {
      alert("মাছ মজুদ সফল হয়েছে!");
      setIsStockModalOpen(false);
      setStocking({ species: '', count: '', total_weight: '' });
      fetchPonds();
    }
    setSaving(false);
  };

  const handleDeletePond = async (id: string, name: string) => {
    if (confirm(`আপনি কি "${name}" পুকুরটি ডিলিট করতে চান?`)) {
      await supabase.from('ponds').delete().eq('id', id);
      setPonds(ponds.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">আমার পুকুর ও মজুদ</h1>
          <p className="text-slate-500 font-bold mt-1">পুকুরের আয়তন ও মাছের বায়োমাস ট্র্যাকিং</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all">➕ নতুন পুকুর</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ponds.map(pond => (
          <div key={pond.id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all">
            <div className="p-8 space-y-6">
               <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">🌊</div>
                  <button onClick={() => handleDeletePond(pond.id, pond.name)} className="text-rose-200 hover:text-rose-500 p-2">🗑️</button>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-800">{pond.name}</h3>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{pond.area} শতাংশ | {pond.fish_type}</p>
               </div>

               <div className="bg-slate-50 p-6 rounded-[2rem] space-y-3">
                  <div className="flex justify-between text-xs font-black uppercase text-slate-400">
                     <span>মজুদ মাছ</span>
                     <span>{pond.total_stocked_count} টি</span>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase text-slate-400">
                     <span>মোট ওজন</span>
                     <span className="text-blue-600">{pond.total_stocked_weight_kg?.toFixed(1)} কেজি</span>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase text-slate-400 border-t border-slate-100 pt-2">
                     <span>গড় ওজন</span>
                     <span className="text-slate-800">{pond.avg_stocked_weight_gm?.toFixed(1)} গ্রাম</span>
                  </div>
               </div>

               <button 
                onClick={() => { setSelectedPond(pond); setIsStockModalOpen(true); }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-colors"
               >
                 🐟 মাছ মজুদ করুন
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stocking Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95">
            <div className="text-center">
               <h3 className="text-2xl font-black text-slate-800">পোনা মজুদ করুন</h3>
               <p className="text-slate-500 font-bold text-sm mt-1">{selectedPond?.name} পুকুর</p>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="মাছের প্রজাতি (উদা: রুই)" value={stocking.species} onChange={e => setStocking({...stocking, species: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none border-none" />
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" placeholder="মাছ সংখ্যা" value={stocking.count} onChange={e => setStocking({...stocking, count: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black outline-none border-none" />
                 <input type="number" placeholder="মোট ওজন (কেজি)" value={stocking.total_weight} onChange={e => setStocking({...stocking, total_weight: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black outline-none border-none text-blue-600" />
              </div>
              {stocking.count && stocking.total_weight && (
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                   <p className="text-[10px] font-black text-blue-400 uppercase">সম্ভাব্য গড় ওজন</p>
                   <p className="text-xl font-black text-blue-700">{((parseFloat(stocking.total_weight) * 1000) / parseInt(stocking.count)).toFixed(2)} গ্রাম</p>
                </div>
              )}
            </div>
            <div className="flex gap-4">
               <button onClick={() => setIsStockModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">বাতিল</button>
               <button onClick={handleStocking} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">মজুদ সম্পন্ন</button>
            </div>
          </div>
        </div>
      )}

      {/* New Pond Modal ... (Keep existing logic) */}
    </div>
  );
};

export default PondsPage;
