import { supabase } from '../lib/supabase';

/**
 * Calculates net profit (Total Sales - Total Expenses) and updates database:
 * 1. financial_summaries table (user_id, total_income, total_expense, net_profit)
 * 2. profiles table (net_profit)
 * 3. ponds table (net_profit for each specific pond)
 */
export const syncFinancialNetProfit = async (
  userId: string,
  salesList: any[],
  expensesList: any[],
  pondsList: any[]
): Promise<{ totalIncome: number; totalExpense: number; netProfit: number }> => {
  const totalIncome = salesList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpense = expensesList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  if (!userId || userId === 'guest-id') {
    return { totalIncome, totalExpense, netProfit };
  }

  try {
    // 1. Upsert financial_summaries table
    try {
      await supabase.from('financial_summaries').upsert([{
        user_id: userId,
        total_income: totalIncome,
        total_expense: totalExpense,
        net_profit: netProfit,
        updated_at: new Date().toISOString()
      }], { onConflict: 'user_id' });
    } catch (err) {
      console.warn("financial_summaries update notice:", err);
    }

    // 2. Update user profile net_profit
    try {
      await supabase.from('profiles').update({
        net_profit: netProfit
      }).eq('id', userId);
    } catch (err) {
      console.warn("profiles net_profit update notice:", err);
    }

    // 3. Update per-pond net_profit in ponds table
    if (pondsList && pondsList.length > 0) {
      for (const pond of pondsList) {
        const pondSales = salesList.filter(s => s.pond_id === pond.id);
        const pondExpenses = expensesList.filter(e => e.pond_id === pond.id);

        const pondIncome = pondSales.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const pondCost = pondExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const pondNetProfit = pondIncome - pondCost;

        try {
          await supabase.from('ponds').update({
            net_profit: pondNetProfit
          }).eq('id', pond.id);
        } catch (err) {
          console.warn("ponds net_profit update notice:", err);
        }
      }
    }
  } catch (error) {
    console.error("Error syncing financial net profit to database:", error);
  }

  return { totalIncome, totalExpense, netProfit };
};
