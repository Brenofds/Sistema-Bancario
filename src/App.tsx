import React, { useEffect, useState, useMemo } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Landmark, 
  BellRing, 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarDays,
  RefreshCcw,
  Plus
} from 'lucide-react';
import { ChatBot } from './components/ChatBot';
import { ReceiptScanner } from './components/ReceiptScanner';
import { Charts } from './components/Charts';
import type { AppData, Expense } from './types';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncBank = async () => {
    try {
      const res = await fetch('/api/sync-bank', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      fetchData();
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const currentMonthExpenses = useMemo(() => {
    if (!data) return [];
    const currentMonth = new Date().getMonth();
    return data.expenses.filter(e => new Date(e.date).getMonth() === currentMonth);
  }, [data]);

  const futureExpenses = useMemo(() => {
    if (!data) return [];
    const currentMonth = new Date().getMonth();
    return data.expenses.filter(e => new Date(e.date).getMonth() > currentMonth);
  }, [data]);

  const totalSpent = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const budgetLimit = data?.budget.limit || 0;
  const budgetPercent = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-400">Carregando...</div>;
  }

  return (
    <div className="min-h-screen text-slate-100 font-sans p-4 md:p-8 overflow-x-hidden" style={{ background: 'radial-gradient(circle at top left, #1e293b, #020617, #0f172a)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light text-slate-100 tracking-tight">Finanças <span className="font-semibold">Smart</span></h1>
            <p className="text-sm text-slate-400 mt-1">Visão geral do seu orçamento</p>
          </div>
          
          <div className="flex items-center gap-3">
            {data?.bankSync ? (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase border border-emerald-500/20">
                <Landmark className="w-3.5 h-3.5" />
                Sincronizado
              </span>
            ) : (
              <button 
                onClick={handleSyncBank}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors shadow-lg"
              >
                <RefreshCcw className="w-4 h-4" />
                Conectar Banco
              </button>
            )}
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Nova Despesa
            </button>
          </div>
        </header>

        {/* ALERTS */}
        {data?.budget.alerts.map(alert => (
          <div key={alert.id} className="p-6 bg-orange-500/10 border border-orange-500/20 backdrop-blur-md rounded-3xl flex items-start gap-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
            <BellRing className="w-6 h-6 text-orange-400 mt-0.5 relative z-10" />
            <div className="relative z-10">
              <h4 className="text-orange-300 text-sm font-bold uppercase mb-1">Alerta de Limite</h4>
              <p className="text-lg font-semibold leading-tight text-white">{alert.message}</p>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MAIN DASHBOARD */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-3xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-slate-400 text-sm font-medium">Fatura Atual</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-4">R$ {totalSpent.toFixed(2)}</div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${budgetPercent > 80 ? 'bg-orange-500' : 'bg-blue-500'}`} 
                      style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500 flex justify-between font-mono uppercase">
                    <span>Limite R$ {budgetLimit.toFixed(2)}</span>
                    <span>{budgetPercent.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-3xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <span className="text-slate-400 text-sm font-medium">Próximos Meses</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-4">
                    R$ {futureExpenses.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-[10px] font-bold uppercase">Agendados</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CHARTS */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-3xl">
              <h3 className="font-semibold text-lg text-white mb-6">Gastos por Categoria</h3>
              <Charts expenses={currentMonthExpenses} />
            </div>

            {/* EXPENSE LIST */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-white">Histórico Recente</h3>
              </div>
              <div className="divide-y divide-white/10">
                {data?.expenses.map(expense => (
                  <div key={expense.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{expense.description}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">{expense.category} • {expense.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">R$ {expense.amount.toFixed(2)}</p>
                      {expense.recurring && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded uppercase">Recorrente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SIDEBAR: CHAT & ACTIONS */}
          <div className="lg:col-span-1 space-y-6 flex flex-col h-[800px] lg:h-auto">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-1">
               <ReceiptScanner onScanned={handleAddExpense} />
            </div>
            <div className="flex-1 min-h-[400px]">
              <ChatBot />
            </div>
          </div>

        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 text-slate-100 shadow-2xl">
            <h2 className="text-xl font-semibold mb-6 text-white">Adicionar Despesa</h2>
            {/* Simple Form Demo */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleAddExpense({
                description: fd.get('desc') as string,
                amount: parseFloat(fd.get('amount') as string),
                category: fd.get('category') as string,
                date: fd.get('date') as string,
                recurring: fd.get('recurring') === 'on'
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                <input required name="desc" type="text" className="w-full bg-white/5 border-white/10 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/40 border outline-none placeholder:text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Valor</label>
                  <input required name="amount" type="number" step="0.01" className="w-full bg-white/5 border-white/10 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/40 border outline-none placeholder:text-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Data</label>
                  <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border-white/10 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/40 border outline-none" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                <select name="category" className="w-full bg-[#1e293b] border-white/10 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/40 border outline-none appearance-none">
                  <option>Supermercado</option>
                  <option>Transporte</option>
                  <option>Lazer</option>
                  <option>Moradia</option>
                  <option>Outros</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="recurring" id="recurring" className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-[#0f172a]" />
                <label htmlFor="recurring" className="text-sm text-slate-300">Despesa recorrente mensal</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-slate-900 bg-white hover:bg-slate-200 rounded-xl transition-colors shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
