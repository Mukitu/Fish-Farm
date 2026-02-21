
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const PondsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedPond, setSelectedPond] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const [newPond, setNewPond] = useState({ name: '', area: '', fish_type: '' });
  const [stocking, setStocking] = useState({ species: '', count: '', total_weight: '', avg_size_inch: '' });
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);

  useEffect(() => { 
    fetchPonds(); 
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    const { data } = await supabase.from('farming_guides').select('species_name');
    if (data) setAvailableGuides(data);
  };

  const fetchPonds = async () => {
    if (user.id === 'guest-id') {
      setPonds([
        { id: '1', name: 'পুকুর ১ (রুই)', area: 20, fish_type: 'রুই', total_weight: 1200, total_count: 2500, avg_weight: 480 },
        { id: '2', name: 'পুকুর ২ (কাতলা)', area: 15, fish_type: 'কাতলা', total_weight: 850, total_count: 1500, avg_weight: 566 },
        { id: '3', name: 'পুকুর ৩ (পাঙ্গাস)', area: 30, fish_type: 'পাঙ্গাস', total_weight: 2500, total_count: 5000, avg_weight: 500 },
        { id: '4', name: 'পুকুর ৪ (তেলাপিয়া)', area: 10, fish_type: 'তেলাপিয়া', total_weight: 400, total_count: 2000, avg_weight: 200 },
        { id: '5', name: 'পুকুর ৫ (কার্প)', area: 25, fish_type: 'কার্প', total_weight: 1500, total_count: 3000, avg_weight: 500 }
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ponds')
        .select(`*, stocking_records(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = data?.map(p => {
        const totalW = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.total_weight_kg), 0) || 0;
        const totalC = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.count), 0) || 0;
        return { 
          ...p, 
          total_weight: totalW, 
          total_count: totalC, 
          avg_weight: totalC > 0 ? (totalW * 1000) / totalC : 0 
        };
      });
      setPonds(processed || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddPond = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (ponds.length >= user.max_ponds) {
      alert(`⚠️ আপনার প্যাকেজ লিমিট শেষ! আপনি সর্বোচ্চ ${user.max_ponds}টি পুকুর যোগ করতে পারবেন। প্যাকেজ আপগ্রেড করুন।`);
      return;
    }

    if (!newPond.name || !newPond.area) {
      alert("পুকুরের নাম এবং আয়তন অবশ্যই দিতে হবে!");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('ponds').insert([{ 
        user_id: user.id, 
        name: newPond.name, 
        area: parseFloat(newPond.area), 
        fish_type: newPond.fish_type 
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setNewPond({ name: '', area: '', fish_type: '' });
      await fetchPonds();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleStocking = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (!selectedPond || !stocking.species) return alert("মাছের জাত নির্বাচন করুন");
    setSaving(true);
    try {
      const count = parseInt(stocking.count);
      const weight = parseFloat(stocking.total_weight);
      const { error } = await supabase.from('stocking_records').insert([{
        user_id: user.id,
        pond_id: selectedPond.id,
        species: stocking.species,
        count: count,
        total_weight_kg: weight,
        avg_weight_gm: (weight * 1000) / count,
        avg_size_inch: parseFloat(stocking.avg_size_inch || '0')
      }]);
      if (error) throw error;
      setIsStockModalOpen(false);
      setStocking({ species: '', count: '', total_weight: '', avg_size_inch: '' });
      await fetchPonds();
      alert("✅ মাছের পোনা সফলভাবে মজুদ করা হয়েছে!");
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">আমার পুকুরসমূহ</h1>
          <p className="text-slate-500 font-bold">প্যাকেজ ব্যবহার: {ponds.length} / {user.max_ponds === 999 ? 'আনলিমিটেড' : user.max_ponds}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-xl">➕ নতুন পুকুর</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-20 font-black animate-pulse">ডাটা লোড হচ্ছে...</div>
        ) : (
          ponds.map(pond => (
            <div key={pond.id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 hover:shadow-2xl transition-all">
              <div className="flex justify-between mb-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">🌊</div>
                <button onClick={async () => {if(confirm('পুকুরটি মুছে ফেলবেন?')) {await supabase.from('ponds').delete().eq('id', pond.id); fetchPonds();}}} className="text-slate-200 hover:text-rose-500">🗑️</button>
              </div>
              <h3 className="text-2xl font-black text-slate-800">{pond.name}</h3>
              <p className="text-slate-400 font-black text-sm uppercase mb-8">{pond.area} শতাংশ | {pond.fish_type}</p>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 mb-8">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400">মোট মাছ:</span> 
                  <span className="text-slate-800 font-black">{pond.total_count} পিস</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400">মোট ওজন:</span> 
                  <span className="text-blue-600 font-black">{pond.total_weight} কেজি</span>
                </div>
              </div>

              <button onClick={() => {setSelectedPond(pond); setIsStockModalOpen(true);}} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">🐟 পোনা মজুদ</button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6">
            <h3 className="text-2xl font-black text-center">নতুন পুকুর যোগ</h3>
            <div className="space-y-4">
              <input type="text" placeholder="পুকুরের নাম" value={newPond.name} onChange={e => setNewPond({...newPond, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
              <input type="number" placeholder="আয়তন (শতাংশ)" value={newPond.area} onChange={e => setNewPond({...newPond, area: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
              <input type="text" placeholder="মাছের ধরন" value={newPond.fish_type} onChange={e => setNewPond({...newPond, fish_type: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAddPond} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6">
            <h3 className="text-2xl font-black text-center">মাছ পোনা মজুদ</h3>
            <div className="space-y-4">
              <select 
                value={stocking.species} 
                onChange={e => setStocking({...stocking, species: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold"
              >
                <option value="">মাছের জাত নির্বাচন করুন</option>
                {availableGuides.map(g => <option key={g.species_name} value={g.species_name}>{g.species_name}</option>)}
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
              {stocking.species === 'অন্যান্য' && (
                <input type="text" placeholder="মাছের নাম লিখুন" onChange={e => setStocking({...stocking, species: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
              )}
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="সংখ্যা (পিস)" value={stocking.count} onChange={e => setStocking({...stocking, count: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
                <input type="number" placeholder="সাইজ (ইঞ্চি)" value={stocking.avg_size_inch} onChange={e => setStocking({...stocking, avg_size_inch: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
              </div>
              <input type="number" placeholder="মোট ওজন (কেজি)" value={stocking.total_weight} onChange={e => setStocking({...stocking, total_weight: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsStockModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleStocking} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">
                {saving ? 'সেভ হচ্ছে...' : 'মজুদ সম্পন্ন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PondsPage;
