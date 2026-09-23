import React from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { getMonthName, formatIDR } from '../utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const Reports: React.FC = () => {
  const { residents, payments, expenses, currentUser, addExpense, deleteExpense } = useAppContext();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Generate last 6 months data
  const chartData = [];
  const expectedTotal = residents.reduce((sum, r) => sum + (r.monthlyDues || 150000), 0);

  for (let i = 5; i >= 0; i--) {
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const monthPayments = payments.filter(p => p.month === targetMonth && p.year === targetYear && p.status === 'verified');
    const totalCollected = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    chartData.push({
      name: `${getMonthName(targetMonth).substring(0,3)} ${targetYear}`,
      Terkumpul: totalCollected,
      Target: expectedTotal,
      paidCount: monthPayments.length,
    });
  }

  // Summary of current year
  const verifiedPayments = payments.filter(p => p.status === 'verified');
  const totalCollectedAllTime = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpensesAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentBalance = totalCollectedAllTime - totalExpensesAllTime;

  const currentYearPayments = verifiedPayments.filter(p => p.year === currentYear);
  const totalYearCollected = currentYearPayments.reduce((sum, p) => sum + p.amount, 0);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = React.useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [expenseForm, setExpenseForm] = React.useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const confirmDeleteExpense = async () => {
    if (deleteConfirmId) {
      await deleteExpense(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || expenseForm.amount <= 0) return;
    
    const dateObj = new Date(expenseForm.date);
    await addExpense({
      id: `exp_${Date.now()}`,
      description: expenseForm.description,
      amount: expenseForm.amount,
      date: dateObj.toISOString(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear()
    });
    
    setIsExpenseModalOpen(false);
    setExpenseForm({ description: '', amount: 0, date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900">Laporan Keuangan</h1>
          <p className="text-slate-500 mt-1">Pantau pemasukan, pengeluaran, dan saldo kas</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Catat Pengeluaran
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <p className="text-sm font-medium text-emerald-100 mb-2 relative z-10">Total Saldo Kas</p>
          <h3 className="text-3xl font-display font-bold text-white tracking-tight relative z-10">{formatIDR(currentBalance)}</h3>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-500/0 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <p className="text-sm font-medium text-slate-500 mb-2 relative z-10">Total Pemasukan ({currentYear})</p>
          <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight relative z-10">{formatIDR(totalYearCollected)}</h3>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-rose-500/0 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <p className="text-sm font-medium text-slate-500 mb-2 relative z-10">Total Pengeluaran (Semua)</p>
          <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight relative z-10">{formatIDR(totalExpensesAllTime)}</h3>
        </motion.div>
      </div>

      <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
        <h2 className="text-lg font-display font-semibold text-slate-900 mb-6">Tren Pemasukan (6 Bulan Terakhir)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `Rp${value / 1000}k`}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => formatIDR(value)}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar 
                dataKey="Terkumpul" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
              <Bar 
                dataKey="Target" 
                fill="#cbd5e1" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-slate-900">Riwayat Pengeluaran</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">Keterangan</th>
                <th className="px-6 py-4 font-medium text-right">Nominal</th>
                {currentUser?.role === 'admin' && (
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length > 0 ? (
                [...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-900 font-medium">
                        {new Date(expense.date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-rose-600">
                      -{formatIDR(expense.amount)}
                    </td>
                    {currentUser?.role === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteConfirmId(expense.id)}
                          className="text-sm text-slate-400 hover:text-rose-600 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={currentUser?.role === 'admin' ? 4 : 3} className="px-6 py-12 text-center text-slate-500">
                    Belum ada riwayat pengeluaran tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[100%] sm:max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-display font-semibold text-slate-900">Catat Pengeluaran</h3>
              <p className="text-sm text-slate-500 mt-1">Saldo kas akan berkurang otomatis</p>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan / Keperluan</label>
                <input 
                  required
                  type="text" 
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="Contoh: Perbaikan gerbang utama"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nominal (Rp)</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  value={expenseForm.amount || ''}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Keluar</label>
                <input 
                  required
                  type="date" 
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                />
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm text-sm"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center transform transition-all">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Hapus Pengeluaran?</h3>
            <p className="text-slate-500 mb-6">
              Apakah anda yakin ingin menghapus catatan pengeluaran ini? Saldo kas akan otomatis bertambah kembali.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-2.5 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors w-full sm:w-auto"
              >
                BATAL
              </button>
              <button
                onClick={confirmDeleteExpense}
                className="px-6 py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors w-full sm:w-auto shadow-sm shadow-rose-200"
              >
                HAPUS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
