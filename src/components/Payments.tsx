import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../AppContext';
import { Plus, XCircle, Search, Trash2, Receipt, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateId, formatIDR, getMonthName } from '../utils';
import { Payment } from '../types';

export const Payments: React.FC = () => {
  const { residents, payments, addPayment, deletePayment, currentUser } = useAppContext();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<Payment | null>(null);

  const [formData, setFormData] = useState({
    residentId: '',
    amount: 150000,
    month: currentMonth,
    year: currentYear,
    date: new Date().toISOString().split('T')[0],
  });

  const filteredPayments = payments
    .filter(p => p.month === filterMonth && p.year === filterYear)
    .filter(p => {
      if (!searchTerm) return true;
      const resident = residents.find(r => r.id === p.residentId);
      return resident?.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.residentId) return;

    // Check if payment already exists for this resident and period
    const exists = payments.some(
      p => p.residentId === formData.residentId && p.month === formData.month && p.year === formData.year
    );

    if (exists) {
      alert('Pembayaran untuk warga ini pada periode tersebut sudah tercatat.');
      return;
    }

    await addPayment({
      id: `p_${generateId()}`,
      residentId: formData.residentId,
      amount: formData.amount,
      month: formData.month,
      year: formData.year,
      date: new Date(formData.date).toISOString(),
      status: 'verified' // Direct admin entry is verified
    });
    
    setIsModalOpen(false);
    setFormData(prev => ({ ...prev, residentId: '' })); // Reset selection
  };

  const getUnpaidResidents = () => {
    return residents.filter(r => 
      !payments.some(p => p.residentId === r.id && p.month === formData.month && p.year === formData.year)
    );
  };

  const handleVerify = async (paymentId: string) => {
    // To keep it simple with our AppContext pattern, we re-add with verified status
    // since we don't have an update method right now. Wait, we can't easily update.
    // Let's implement a workaround: delete and re-add.
    const paymentToUpdate = payments.find(p => p.id === paymentId);
    if (paymentToUpdate) {
      await deletePayment(paymentId);
      await addPayment({ ...paymentToUpdate, status: 'verified' });
      setProofModalOpen(false);
      setSelectedProof(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900">Pembayaran Iuran</h1>
          <p className="text-slate-500 mt-1">Catat dan pantau riwayat pembayaran warga</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Catat Pembayaran
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 justify-between bg-slate-50/50">
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>
              ))}
            </select>
            <select 
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              {Array.from({ length: 22 }, (_, i) => currentYear - 1 + i).map(y => (
                <option key={y} value={y} className="text-slate-900 font-medium">{y}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari warga..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">Warga</th>
                <th className="px-6 py-4 font-medium">Nominal</th>
                <th className="px-6 py-4 font-medium">Status & Bukti</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment, index) => {
                  const resident = residents.find(r => r.id === payment.residentId);
                  return (
                    <motion.tr 
                      key={payment.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{resident?.name || 'Unknown'}</div>
                        <div className="text-sm text-slate-500">{resident?.propertyType || 'Perumahan'} - {resident?.houseNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">{formatIDR(payment.amount)}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(payment.date).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {payment.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              <AlertCircle className="w-3 h-3" /> Menunggu Verifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" /> Selesai
                            </span>
                          )}
                          {payment.proofOfPayment && (
                            <button 
                              onClick={() => {
                                setSelectedProof(payment);
                                setProofModalOpen(true);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="Lihat Bukti"
                            >
                              <ImageIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {currentUser?.role === 'admin' && (
                          <button 
                            onClick={() => {
                              if(window.confirm('Hapus rekam pembayaran ini?')) {
                                deletePayment(payment.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 bg-slate-50/30">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <p>Tidak ada catatan pembayaran untuk periode ini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {filteredPayments.length > 0 ? (
            filteredPayments.map(payment => {
              const resident = residents.find(r => r.id === payment.residentId);
              return (
                <div key={payment.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-slate-900 text-base">{resident?.name || 'Unknown'}</h4>
                      <p className="text-sm text-slate-500">{resident?.propertyType || 'Perumahan'} - {resident?.houseNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-600 text-base">{formatIDR(payment.amount)}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(payment.date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-1">
                    <div className="flex items-center gap-2">
                      {payment.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                          <AlertCircle className="w-3 h-3" /> Menunggu Verifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                      )}
                      {payment.proofOfPayment && (
                        <button 
                          onClick={() => {
                            setSelectedProof(payment);
                            setProofModalOpen(true);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors text-xs flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded-md"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Lihat
                        </button>
                      )}
                    </div>
                    
                    {currentUser?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          if(window.confirm('Hapus rekam pembayaran ini?')) {
                            deletePayment(payment.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors text-sm flex items-center gap-1 p-1"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2 bg-slate-50/30">
              <Receipt className="w-8 h-8 text-slate-300" />
              <p>Tidak ada catatan pembayaran untuk periode ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal View Proof */}
      {proofModalOpen && selectedProof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-slate-900">Bukti Pembayaran</h3>
              <button 
                onClick={() => setProofModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 flex flex-col items-center justify-center">
              <img 
                src={selectedProof.proofOfPayment} 
                alt="Bukti Transfer" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-slate-200"
              />
            </div>
            {currentUser?.role === 'admin' && selectedProof.status === 'pending' && (
              <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button 
                  onClick={() => setProofModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors sm:text-sm"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => handleVerify(selectedProof.id)}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm sm:text-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Tandai Selesai
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Add Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[100%] sm:max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-display font-semibold text-slate-900">Catat Pembayaran</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Periode Bulan</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tahun</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm appearance-none"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Warga</label>
                <select
                  required
                  value={formData.residentId}
                  onChange={(e) => setFormData({...formData, residentId: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm appearance-none"
                >
                  <option value="" disabled>-- Pilih Warga (Belum Bayar) --</option>
                  {getUnpaidResidents().map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.propertyType || 'Perumahan'} - {r.houseNumber}
                    </option>
                  ))}
                </select>
                {getUnpaidResidents().length === 0 && (
                  <p className="text-xs text-emerald-600 mt-2">Semua warga sudah membayar untuk periode ini.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nominal Iuran (Rp)</label>
                <input 
                  required
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Bayar</label>
                <input 
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm"
                />
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors sm:text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={!formData.residentId}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
