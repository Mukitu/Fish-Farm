import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { exportReportToPdf } from '../utils/pdfExport';
import { syncFinancialNetProfit } from '../utils/financialSync';

const SalesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProfitLossModalOpen, setIsProfitLossModalOpen] = useState(false);
  
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  // Filtering States
  const [selectedFilterPond, setSelectedFilterPond] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [newSale, setNewSale] = useState({ 
    pond_id: '', 
    species: '', 
    count_sold: '', 
    weight: '', 
    amount: '', 
    item_name: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  // State to hold multiple selected fish species (boolean map)
  const [multiSpeciesSelect, setMultiSpeciesSelect] = useState<{ [speciesName: string]: { selected: boolean } }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (user.id === 'guest-id') {
      setPonds([
        { 
          id: '1', name: 'পুকুর ১ (রুই ও কাতলা)', 
          stocking_records: [
            { id: 's1', species: 'রুই', count: 1500, total_weight_kg: 800 },
            { id: 's2', species: 'কাতলা', count: 1000, total_weight_kg: 400 }
          ] 
        }, 
        { 
          id: '2', name: 'পুকুর ২ (কাতলা)', 
          stocking_records: [
            { id: 's3', species: 'কাতলা', count: 1500, total_weight_kg: 850 }
          ] 
        },
        { 
          id: '3', name: 'পুকুর ৩ (পাঙ্গাস)', 
          stocking_records: [
            { id: 's4', species: 'পাঙ্গাস', count: 5000, total_weight_kg: 2500 }
          ] 
        },
        { 
          id: '4', name: 'পুকুর ৪ (তেলাপিয়া)', 
          stocking_records: [
            { id: 's5', species: 'তেলাপিয়া', count: 2000, total_weight_kg: 400 }
          ] 
        }
      ] as any);

      setSales([
        { id: 's1', date: new Date().toISOString().split('T')[0], ponds: { name: 'পুকুর ১ (রুই ও কাতলা)' }, pond_id: '1', species: 'রুই (২০০ পিস)', count_sold: 200, weight_kg: 100, amount: 30000, item_name: 'আড়ৎ বিক্রি' },
        { id: 's2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], ponds: { name: 'পুকুর ২ (কাতলা)' }, pond_id: '2', species: 'কাতলা (১০০ পিস)', count_sold: 100, weight_kg: 120, amount: 38000, item_name: 'পাইকারি বিক্রি' },
        { id: 's3', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], ponds: { name: 'পুকুর ৪ (তেলাপিয়া)' }, pond_id: '4', species: 'তেলাপিয়া (৩০০ পিস)', count_sold: 300, weight_kg: 80, amount: 12000, item_name: 'স্থানীয় বাজার' }
      ]);

      setExpenses([
        { id: 'e1', date: new Date().toISOString().split('T')[0], pond_id: '1', ponds: { name: 'পুকুর ১ (রুই ও কাতলা)' }, category: 'খাবার', item_name: 'মাছের খাবার (নারিশ)', amount: 12000 },
        { id: 'e2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], pond_id: '2', ponds: { name: 'পুকুর ২ (কাতলা)' }, category: 'প্রস্তুতি', item_name: 'চুন ও সার', amount: 3500 },
        { id: 'e3', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], pond_id: '4', ponds: { name: 'পুকুর ৪ (তেলাপিয়া)' }, category: 'পোনা', item_name: 'পোনা ক্রয়', amount: 5000 }
      ]);

      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: pondData } = await supabase
        .from('ponds')
        .select('*, stocking_records(*)')
        .eq('user_id', user.id);

      if (pondData) setPonds(pondData);

      const { data: saleData } = await supabase.from('sales')
        .select('*, ponds(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (saleData) setSales(saleData);

      const { data: expData } = await supabase.from('expenses')
        .select('*, ponds(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (expData) setExpenses(expData);

      // Automatically sync net profit to database
      if (user.id !== 'guest-id') {
        setIsSyncingDb(true);
        await syncFinancialNetProfit(user.id, saleData || [], expData || [], pondData || []);
        setIsSyncingDb(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (user.id === 'guest-id') {
      alert("ডেমো মোডে নেট প্রফিট ডাটাবেজ সিঙ্ক সিমুলেট করা হয়েছে!");
      return;
    }
    setIsSyncingDb(true);
    const { netProfit } = await syncFinancialNetProfit(user.id, sales, expenses, ponds);
    setIsSyncingDb(false);
    alert(`✅ বিক্রয় ও খরচের বিয়োগফল (নেট প্রফিট ৳ ${netProfit.toLocaleString()}) ডাটাবেজে সফলভাবে আপডেট ও সেভ হয়েছে!`);
  };

  const selectedPondObj = ponds.find(p => p.id === newSale.pond_id);
  const availableSpeciesList = selectedPondObj?.stocking_records || [];

  const handleOpenAddModal = () => {
    setEditingSaleId(null);
    setNewSale({ 
      pond_id: '', 
      species: '', 
      count_sold: '', 
      weight: '', 
      amount: '', 
      item_name: '',
      sale_date: new Date().toISOString().split('T')[0]
    });
    setMultiSpeciesSelect({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sale: any) => {
    setEditingSaleId(sale.id);
    const pId = sale.pond_id || '';
    const sDate = sale.date || new Date().toISOString().split('T')[0];

    setNewSale({
      pond_id: pId,
      species: sale.species || '',
      count_sold: sale.count_sold ? String(sale.count_sold) : '',
      weight: sale.weight_kg ? String(sale.weight_kg) : '',
      amount: sale.amount ? String(sale.amount) : '',
      item_name: sale.item_name || '',
      sale_date: sDate
    });

    // Populate multiSpeciesSelect based on stocking records in selected pond
    const pObj = ponds.find(p => p.id === pId);
    const speciesList = pObj?.stocking_records || [];
    const initialSelect: any = {};
    speciesList.forEach((st: any) => {
      const isChecked = sale.species ? sale.species.toLowerCase().includes(st.species.toLowerCase()) : false;
      initialSelect[st.species] = { selected: isChecked };
    });
    setMultiSpeciesSelect(initialSelect);

    setIsModalOpen(true);
  };

  const handlePondChange = (pondId: string) => {
    const pObj = ponds.find(p => p.id === pondId);
    const speciesList = pObj?.stocking_records || [];
    
    const initialMultiSelect: any = {};
    speciesList.forEach((st: any) => {
      initialMultiSelect[st.species] = { selected: false };
    });

    setNewSale(prev => ({ ...prev, pond_id: pondId, species: '' }));
    setMultiSpeciesSelect(initialMultiSelect);
  };

  const handleSaveSale = async () => {
    if (!newSale.pond_id) return alert("অনুগ্রহ করে পুকুর নির্বাচন করুন!");

    // Determine checked species
    const checkedSpecies = Object.entries(multiSpeciesSelect)
      .filter(([_, val]: [string, any]) => val.selected)
      .map(([spName]) => spName);

    let finalSpecies = newSale.species.trim();
    if (!finalSpecies && checkedSpecies.length > 0) {
      finalSpecies = checkedSpecies.join(' + ');
    }

    if (!finalSpecies) {
      return alert("অনুগ্রহ করে বিক্রিত মাছের নাম নির্বাচন করুন বা লিখুন!");
    }

    const totalAmount = parseFloat(newSale.amount) || 0;
    if (totalAmount <= 0) {
      return alert("অনুগ্রহ করে মোট বিক্রয় মূল্য (৳) সঠিকভাবে দিন!");
    }

    const saleDate = newSale.sale_date || new Date().toISOString().split('T')[0];
    const totalSoldPcs = parseInt(newSale.count_sold) || 0;
    const itemName = newSale.item_name || `${finalSpecies} বিক্রি`;
    const selectedPondObj = ponds.find(p => p.id === newSale.pond_id);

    setSaving(true);
    try {
      if (editingSaleId) {
        // EDIT EXISTING RECORD
        if (user.id === 'guest-id') {
          setSales(prev => prev.map(s => {
            if (s.id === editingSaleId) {
              return {
                ...s,
                date: saleDate,
                pond_id: newSale.pond_id,
                ponds: { name: selectedPondObj?.name || s.ponds?.name || 'পুকুর' },
                species: finalSpecies,
                count_sold: totalSoldPcs,
                weight_kg: parseFloat(newSale.weight) || 0,
                amount: totalAmount,
                item_name: itemName
              };
            }
            return s;
          }));
        } else {
          const { error: updateErr } = await supabase.from('sales').update({
            pond_id: newSale.pond_id,
            species: finalSpecies,
            item_name: itemName,
            count_sold: totalSoldPcs,
            weight_kg: parseFloat(newSale.weight) || 0,
            amount: totalAmount,
            date: saleDate
          }).eq('id', editingSaleId);

          if (updateErr) throw updateErr;
        }

        alert("✅ বিক্রির বিবরণ সফলভাবে আপডেট করা হয়েছে!");
      } else {
        // ADD NEW RECORD
        if (user.id === 'guest-id') {
          const newSaleRecord = {
            id: 'sale-' + Date.now(),
            date: saleDate,
            pond_id: newSale.pond_id,
            ponds: { name: selectedPondObj?.name || 'পুকুর' },
            species: finalSpecies,
            count_sold: totalSoldPcs,
            weight_kg: parseFloat(newSale.weight) || 0,
            amount: totalAmount,
            item_name: itemName
          };

          setSales(prev => [newSaleRecord, ...prev]);
        } else {
          const { error: saleErr } = await supabase.from('sales').insert([{
            user_id: user.id,
            pond_id: newSale.pond_id,
            species: finalSpecies,
            item_name: itemName,
            count_sold: totalSoldPcs,
            weight_kg: parseFloat(newSale.weight) || 0,
            amount: totalAmount,
            date: saleDate
          }]);

          if (saleErr) throw saleErr;
        }

        alert(`✅ ${finalSpecies} বিক্রির রেকর্ড সংরক্ষিত হয়েছে!`);
      }

      setIsModalOpen(false);
      setEditingSaleId(null);
      setNewSale({ pond_id: '', species: '', count_sold: '', amount: '', weight: '', item_name: '', sale_date: new Date().toISOString().split('T')[0] });
      setMultiSpeciesSelect({});

      await fetchData();
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই বিক্রির রেকর্ডটি মুছে ফেলতে চান?')) {
      if (user.id === 'guest-id') {
        setSales(sales.filter(s => s.id !== id));
        return;
      }
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  // Helper function to check if a record's date falls within selected date filter
  const isDateInFilter = (dateStr: string) => {
    if (!dateStr) return true;
    const itemDate = new Date(dateStr);
    itemDate.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (datePreset === 'today') {
      return itemDate.getTime() === now.getTime();
    } else if (datePreset === '7d') {
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 7);
      return itemDate >= cutoff;
    } else if (datePreset === '30d') {
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 30);
      return itemDate >= cutoff;
    } else if (datePreset === 'this_month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    } else if (datePreset === 'custom') {
      let pass = true;
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) pass = false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) pass = false;
      }
      return pass;
    }
    return true; // 'all'
  };

  // Filter Sales
  const filteredSales = sales.filter(s => {
    const matchesPond = selectedFilterPond === 'all' || s.pond_id === selectedFilterPond;
    const matchesDate = isDateInFilter(s.date);
    return matchesPond && matchesDate;
  });

  // Filter Expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesPond = selectedFilterPond === 'all' || e.pond_id === selectedFilterPond;
    const matchesDate = isDateInFilter(e.date);
    return matchesPond && matchesDate;
  });

  const totalSoldCount = filteredSales.reduce((acc, curr) => acc + Number(curr.count_sold || 0), 0);
  const totalSalesIncome = filteredSales.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpensesCost = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netIncome = totalSalesIncome - totalExpensesCost;

  const handleExportFilteredPdf = () => {
    if (filteredSales.length === 0 && filteredExpenses.length === 0) {
      alert("নির্বাচিত ফিল্টারে কোনো বিক্রি বা খরচের তথ্য পাওয়া যায়নি!");
      return;
    }

    // Combine sales & expenses into unified timeline
    const combinedList = [
      ...filteredSales.map(s => ({
        date: s.date,
        type: 'মাছ বিক্রি (আয়)',
        pond: s.ponds?.name || 'অজানা',
        details: `${s.species || 'মাছ বিক্রি'} (${s.count_sold || 0} পিস) ${s.item_name ? `- ${s.item_name}` : ''}`,
        amount: `+ ৳ ${Number(s.amount || 0).toLocaleString()}`,
        isIncome: true
      })),
      ...filteredExpenses.map(e => ({
        date: e.date,
        type: 'খামার খরচ (ব্যয়)',
        pond: e.ponds?.name || 'অজানা',
        details: `${e.category || 'খরচ'}: ${e.item_name || ''}`,
        amount: `- ৳ ${Number(e.amount || 0).toLocaleString()}`,
        isIncome: false
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const tableRows = combinedList.map(item => [
      new Date(item.date).toLocaleDateString('bn-BD'),
      item.type,
      item.pond,
      item.details,
      item.amount
    ]);

    const pName = ponds.find(p => p.id === selectedFilterPond)?.name || 'সকল পুকুর';
    let dateLabel = 'সকল সময়';
    if (datePreset === 'today') dateLabel = 'আজকের স্টেটমেন্ট';
    else if (datePreset === '7d') dateLabel = 'গত ৭ দিন';
    else if (datePreset === '30d') dateLabel = 'গত ৩০ দিন';
    else if (datePreset === 'this_month') dateLabel = 'চলতি মাস';
    else if (datePreset === 'custom') {
      dateLabel = `তারিখ: ${customStartDate || 'শুরু'} থেকে ${customEndDate || 'আজ'}`;
    }

    exportReportToPdf({
      title: 'মাছ বিক্রি আয় ও খরচ স্টেটমেন্ট (Income & Expense Statement)',
      farmName: user.farm_name || 'স্মার্ট মৎস্য খামার',
      userName: user.full_name || user.email,
      filterLabel: `${pName} | ${dateLabel}`,
      summaryCards: [
        { label: 'মোট মাছ বিক্রি আয় (Income)', value: `৳ ${totalSalesIncome.toLocaleString()}`, color: '#059669' },
        { label: 'মোট খামার খরচ (Expense)', value: `৳ ${totalExpensesCost.toLocaleString()}`, color: '#e11d48' },
        { label: 'নিট অবশিষ্ট আয় / লাভ', value: `${netIncome >= 0 ? '+' : ''}৳ ${netIncome.toLocaleString()}`, color: netIncome >= 0 ? '#059669' : '#e11d48' }
      ],
      tableHeaders: ['তারিখ', 'টাইপ', 'পুকুর', 'বিবরণ / প্রজাতি / খাত', 'টাকার পরিমাণ (৳)'],
      tableRows: tableRows,
      footerNotes: 'মাছ বিক্রির অর্জিত আয় থেকে খামারের যাবতীয় খরচ বাদ দিয়ে অবশিষ্ট নিট আয় ও লাভ স্বয়ংক্রিয়ভাবে হিসাব করা হয়েছে।'
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">মাছ বিক্রি ও হিসাব (Income & Expense)</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">পুকুর ও তারিখ ফিল্টার করে আয়, খরচ ও নিট লাভের স্টেটমেন্ট ডাউনলোড করুন</p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <button 
            onClick={handleExportFilteredPdf} 
            className="flex-1 sm:flex-initial px-4 py-3.5 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            📄 স্টেটমেন্ট ডাউনলোড (PDF)
          </button>
          <button 
            onClick={() => setIsDetailModalOpen(true)} 
            className="flex-1 sm:flex-initial px-4 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            🔍 বিস্তারিত ভিউ
          </button>
          <button 
            onClick={handleOpenAddModal} 
            className="w-full sm:w-auto px-5 py-3.5 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            💰 বিক্রি যোগ করুন
          </button>
        </div>
      </div>

      {/* Filter Bar Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            🔍 পুকুর ও তারিখ অনুযায়ী হিসাব ফিল্টার করুন:
          </span>
          {(selectedFilterPond !== 'all' || datePreset !== 'all' || customStartDate || customEndDate) && (
            <button 
              onClick={() => {
                setSelectedFilterPond('all');
                setDatePreset('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-[11px] font-bold text-rose-600 hover:underline"
            >
              🔄 ফিল্টার রিকসেট
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">পুকুর নির্বাচন</label>
            <select 
              value={selectedFilterPond} 
              onChange={e => setSelectedFilterPond(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">সকল পুকুর</option>
              {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">সময়কাল ফিল্টার</label>
            <select 
              value={datePreset} 
              onChange={e => setDatePreset(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">সকল সময়</option>
              <option value="today">আজকে</option>
              <option value="7d">গত ৭ দিন</option>
              <option value="30d">গত ৩০ দিন</option>
              <option value="this_month">চলতি মাস</option>
              <option value="custom">📅 কাস্টম তারিখ নির্বাচন</option>
            </select>
          </div>

          {datePreset === 'custom' && (
            <>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">শুরু তারিখ</label>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={e => setCustomStartDate(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">শেষ তারিখ</label>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={e => setCustomEndDate(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50/80 p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">মোট মাছ বিক্রি আয় (Income)</p>
            <h3 className="text-2xl font-black text-emerald-700">৳ {totalSalesIncome.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-xl">💰</div>
        </div>

        <div className="bg-rose-50/80 p-6 rounded-3xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">মোট খামার খরচ (Expense)</p>
            <h3 className="text-2xl font-black text-rose-700">৳ {totalExpensesCost.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center text-xl">💸</div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${netIncome >= 0 ? 'bg-blue-50/80 border-blue-100' : 'bg-amber-50/80 border-amber-100'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${netIncome >= 0 ? 'text-blue-600' : 'text-amber-700'}`}>
                অবশিষ্ট নিট আয় / নেট প্রফিট
              </p>
              <h3 className={`text-2xl font-black ${netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {netIncome >= 0 ? '+' : ''}৳ {netIncome.toLocaleString()}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${netIncome >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
              ⚖️
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-blue-200/50 flex items-center justify-between text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className={`w-2 h-2 rounded-full ${isSyncingDb ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
              {isSyncingDb ? 'ডাটাবেজে সেভ হচ্ছে...' : 'ডাটাবেজে নেট প্রফিট আপডেট করা হয়েছে'}
            </span>
            <button 
              onClick={handleManualSync} 
              disabled={isSyncingDb}
              className="text-blue-700 hover:underline font-black flex items-center gap-1"
              title="ডাটাবেজে নেট প্রফিট পুনরায় সিঙ্ক করুন"
            >
              🔄 {isSyncingDb ? 'সিঙ্ক...' : 'ডাটাবেজ সেভ'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">বিক্রিত মাছের পরিমাণ</p>
            <h3 className="text-2xl font-black text-slate-800">{totalSoldCount.toLocaleString()} পিস</h3>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center text-xl">🐟</div>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden rounded-[2rem]">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">মাছের ক্যাটাগরি / প্রজাতি</th>
                <th className="px-8 py-6 text-center">বিক্রিত পরিমাণ (পিস)</th>
                <th className="px-8 py-6 text-right">বিক্রয় মূল্য (৳)</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(sale.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{sale.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-800 block">🐟 {sale.species || 'মাছ'}</span>
                    {sale.item_name && <span className="text-xs text-slate-400 block">{sale.item_name}</span>}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="font-black text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-xl text-xs">
                      {sale.count_sold || 0} পিস
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-green-600 text-base">৳ {Number(sale.amount).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(sale)} 
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-xs font-bold flex items-center gap-1" 
                        title="বিক্রির তথ্য এডিট করুন"
                      >
                        ✏️ এডিট
                      </button>
                      <button 
                        onClick={() => handleDelete(sale.id)} 
                        className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors text-xs font-bold" 
                        title="রেকর্ডটি মুছুন"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredSales.length === 0 && (
                <tr><td colSpan={6} className="text-center py-24 text-slate-300 italic">কোন বিক্রির রেকর্ড পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-50">
          {loading ? (
            <div className="p-12 text-center font-bold">লোড হচ্ছে...</div>
          ) : filteredSales.map(sale => (
            <div key={sale.id} className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(sale.date).toLocaleDateString('bn-BD')}</p>
                  <h4 className="font-black text-slate-800">{sale.ponds?.name || 'অজানা'}</h4>
                  <span className="text-xs font-black text-slate-600">🐟 {sale.species || 'মাছ'} {sale.item_name ? `(${sale.item_name})` : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleOpenEditModal(sale)} 
                    className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"
                    title="এডিট করুন"
                  >
                    ✏️ এডিট
                  </button>
                  <button 
                    onClick={() => handleDelete(sale.id)} 
                    className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center text-xs"
                    title="মুছুন"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-black">{sale.count_sold || 0} পিস</span>
                <p className="text-xl font-black text-green-600 tracking-tighter">৳ {Number(sale.amount).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {!loading && filteredSales.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-bold">কোনো বিক্রির রেকর্ড পাওয়া যায়নি</div>
          )}
        </div>
      </div>

      {/* Add / Edit Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-800 text-center">
              {editingSaleId ? '✏️ মাছ বিক্রির তথ্য এডিট করুন' : '💰 মাছ বিক্রি তথ্য যোগ করুন'}
            </h3>
            <p className="text-xs font-bold text-slate-400 text-center -mt-3">
              বিক্রিত মাছ বেছে নিন এবং বিক্রয় মূল্য প্রদান করুন
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">বিক্রির তারিখ</label>
                <input 
                  type="date" 
                  value={newSale.sale_date} 
                  onChange={e => setNewSale({...newSale, sale_date: e.target.value})} 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">১. পুকুর নির্বাচন করুন</label>
                <select 
                  value={newSale.pond_id} 
                  onChange={e => handlePondChange(e.target.value)} 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">পুকুর বেছে নিন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Species Tick-Mark Checkboxes */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                  ২. বিক্রিত মাছ সিলেক্ট করুন (টিক মার্ক দিন)
                </label>
                
                {!newSale.pond_id ? (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-bold border border-slate-200">
                    আগে একটি পুকুর সিলেক্ট করুন
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {availableSpeciesList.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-[11px] font-bold text-slate-500 mb-1">
                          পুকুরে মজুদ থাকা মাছ (যেগুলো বিক্রি হয়েছে টিক দিন):
                        </p>
                        {availableSpeciesList.map((st: any) => {
                          const isSelected = multiSpeciesSelect[st.species]?.selected || false;
                          return (
                            <label 
                              key={st.id || st.species} 
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected ? 'bg-green-50 border-green-400 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    const updated = {
                                      ...multiSpeciesSelect,
                                      [st.species]: { selected: checked }
                                    };
                                    setMultiSpeciesSelect(updated);

                                    const selectedNames = Object.entries(updated)
                                      .filter(([_, v]: [string, any]) => v.selected)
                                      .map(([sp]) => sp);
                                    setNewSale(prev => ({ ...prev, species: selectedNames.join(' + ') }));
                                  }}
                                  className="w-5 h-5 accent-green-600 rounded cursor-pointer"
                                />
                                <span className="text-xs font-black text-slate-800">🐟 {st.species}</span>
                              </div>
                              {st.count ? (
                                <span className="text-[11px] font-bold text-slate-400">
                                  মজুদ: <strong className="text-blue-600">{st.count} পিস</strong>
                                </span>
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                        মাছের ক্যাটাগরি / নাম (এডিট বা পরিবর্তন করুন)
                      </label>
                      <input 
                        type="text" 
                        placeholder="উদা: রুই + কাতলা" 
                        value={newSale.species} 
                        onChange={e => setNewSale({...newSale, species: e.target.value})} 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 text-sm" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity and Weight inputs (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                    মোট বিক্রিত পিস (ঐচ্ছিক)
                  </label>
                  <input 
                    type="number" 
                    placeholder="উদা: ১০০" 
                    value={newSale.count_sold} 
                    onChange={e => setNewSale({...newSale, count_sold: e.target.value})} 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 text-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                    মোট ওজন কেজি (ঐচ্ছিক)
                  </label>
                  <input 
                    type="number" 
                    placeholder="উদা: ৫০" 
                    value={newSale.weight} 
                    onChange={e => setNewSale({...newSale, weight: e.target.value})} 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                  ৩. এককালীন মোট বিক্রয় মূল্য (৳)
                </label>
                <input 
                  type="number" 
                  placeholder="উদা: ৪৫০০০" 
                  value={newSale.amount} 
                  onChange={e => setNewSale({...newSale, amount: e.target.value})} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-green-600 text-xl focus:ring-2 focus:ring-green-500" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">বিবরণ / পাইকার (ঐচ্ছিক)</label>
                <input 
                  type="text" 
                  placeholder="উদা: স্থানীয় পাইকার করিমের কাছে চালানের বিক্রি" 
                  value={newSale.item_name} 
                  onChange={e => setNewSale({...newSale, item_name: e.target.value})} 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 text-sm" 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSaleId(null);
                }} 
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black"
              >
                বাতিল
              </button>
              <button 
                onClick={handleSaveSale} 
                disabled={saving} 
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all"
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : (editingSaleId ? 'আপডেট সেভ করুন' : 'বিক্রি সেভ করুন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profit / Loss Combined Statement Modal */}
      {isProfitLossModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 z-50">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-6 md:p-10 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">📊 মাছ বিক্রি আয় ও খরচ স্টেটমেন্ট</h3>
                <p className="text-xs font-bold text-slate-400">নির্দিষ্ট দিন বা পুকুরের বিক্রি ও খরচের সমন্বিত হিসাব</p>
              </div>
              <button onClick={() => setIsProfitLossModalOpen(false)} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl font-bold">✕</button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">১. পুকুর ফিল্টার</label>
                <select 
                  value={selectedFilterPond} 
                  onChange={e => setSelectedFilterPond(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none"
                >
                  <option value="all">সকল পুকুর</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">২. সময়সীমা</label>
                <select 
                  value={datePreset} 
                  onChange={e => setDatePreset(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none"
                >
                  <option value="all">সকল সময়</option>
                  <option value="today">আজকে</option>
                  <option value="7d">গত ৭ দিন</option>
                  <option value="30d">গত ৩০ দিন</option>
                  <option value="this_month">চলতি মাস</option>
                  <option value="custom">কাস্টম তারিখ</option>
                </select>
              </div>

              <div className="flex items-end">
                <button 
                  onClick={handleExportFilteredPdf} 
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                >
                  📄 স্টেটমেন্ট ডাউনলোড (PDF)
                </button>
              </div>
            </div>

            {/* Summary Cards & Table */}
            {(() => {
              const combinedList = [
                ...filteredSales.map(s => ({
                  id: s.id,
                  date: s.date,
                  type: 'বিক্রি 🟢',
                  pond: s.ponds?.name || 'অজানা',
                  details: `${s.species || 'মাছ বিক্রি'} (${s.count_sold || 0} পিস)`,
                  amount: Number(s.amount || 0),
                  isIncome: true
                })),
                ...filteredExpenses.map(e => ({
                  id: e.id,
                  date: e.date,
                  type: 'খরচ 🔴',
                  pond: e.ponds?.name || 'অজানা',
                  details: `${e.category || 'খরচ'}: ${e.item_name || ''}`,
                  amount: Number(e.amount || 0),
                  isIncome: false
                }))
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return (
                <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-black text-emerald-600 uppercase">মোট মাছ বিক্রি আয়</span>
                      <p className="text-xl font-black text-emerald-700">৳ {totalSalesIncome.toLocaleString()}</p>
                    </div>
                    <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-100">
                      <span className="text-[10px] font-black text-rose-600 uppercase">মোট খামার খরচ</span>
                      <p className="text-xl font-black text-rose-700">৳ {totalExpensesCost.toLocaleString()}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${netIncome >= 0 ? 'bg-blue-50/80 border-blue-100 text-blue-700' : 'bg-amber-50/80 border-amber-100 text-amber-700'}`}>
                      <span className="text-[10px] font-black uppercase">নিট লাভ / অবশিষ্ট</span>
                      <p className="text-xl font-black">{netIncome >= 0 ? '+' : ''}৳ {netIncome.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Combined Timeline Table */}
                  <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b sticky top-0">
                        <tr>
                          <th className="px-6 py-3.5">তারিখ</th>
                          <th className="px-6 py-3.5">টাইপ</th>
                          <th className="px-6 py-3.5">পুকুর</th>
                          <th className="px-6 py-3.5">বিবরণ / খাত</th>
                          <th className="px-6 py-3.5 text-right">টাকার পরিমাণ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-bold">
                        {combinedList.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-12 text-slate-400 italic">কোন তথ্য পাওয়া যায়নি</td></tr>
                        ) : combinedList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-6 py-3.5">{new Date(item.date).toLocaleDateString('bn-BD')}</td>
                            <td className="px-6 py-3.5 font-black">{item.type}</td>
                            <td className="px-6 py-3.5">{item.pond}</td>
                            <td className="px-6 py-3.5 text-slate-600">{item.details}</td>
                            <td className={`px-6 py-3.5 text-right font-black ${item.isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.isIncome ? '+' : '-'} ৳ {item.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 z-50">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-6 md:p-10 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">বিক্রির বিস্তারিত হিস্ট্রি (View Details)</h3>
                <p className="text-xs font-bold text-slate-400">তারিখ ও পুকুর ভিত্তিক সম্পূর্ণ বিক্রির বিবরণ</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl font-bold">✕</button>
            </div>

            {/* Filter by pond and PDF download */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase">পুকুর ফিল্টার:</span>
                <select 
                  value={selectedFilterPond} 
                  onChange={e => setSelectedFilterPond(e.target.value)} 
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none"
                >
                  <option value="all">সকল পুকুর</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <button 
                onClick={handleExportFilteredPdf} 
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow hover:bg-slate-800 transition"
              >
                📄 এই স্টেটমেন্ট ডাউনলোড (PDF)
              </button>
            </div>

            {/* History Table */}
            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b sticky top-0">
                  <tr>
                    <th className="px-6 py-4">তারিখ</th>
                    <th className="px-6 py-4">পুকুর</th>
                    <th className="px-6 py-4">মাছের ক্যাটাগরি</th>
                    <th className="px-6 py-4 text-center">বিক্রিত পিস</th>
                    <th className="px-6 py-4 text-right">মূল্য (৳)</th>
                    <th className="px-6 py-4">বিবরণ</th>
                    <th className="px-6 py-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-bold">
                  {filteredSales.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-slate-400 italic">কোন বিক্রির বিবরণ পাওয়া যায়নি</td></tr>
                  ) : filteredSales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                      <td className="px-6 py-4 font-black">{s.ponds?.name || 'অজানা'}</td>
                      <td className="px-6 py-4 text-blue-600 font-black">🐟 {s.species}</td>
                      <td className="px-6 py-4 text-center font-black">{s.count_sold || 0} পিস</td>
                      <td className="px-6 py-4 text-right font-black text-green-600">৳ {Number(s.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-400">{s.item_name || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setIsDetailModalOpen(false);
                              handleOpenEditModal(s);
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                            title="বিক্রি এডিট করুন"
                          >
                            ✏️ এডিট
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-1 bg-rose-50 text-rose-500 rounded-lg text-xs hover:bg-rose-100"
                            title="মুছুন"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl text-xs font-black">
              <span>মোট বিক্রিত পিস: <strong className="text-blue-600">{totalSoldCount} পিস</strong></span>
              <span>মোট বিক্রয় মূল্য: <strong className="text-green-600">৳ {totalSalesIncome.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
