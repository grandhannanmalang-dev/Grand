import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../AppContext';
import { Plus, XCircle, Search, Trash2, Receipt, Image as ImageIcon, CheckCircle2, AlertCircle, Eye, Check } from 'lucide-react';
import { generateId, formatIDR, getMonthName } from '../utils';
import { Payment } from '../types';

export const Payments: React.FC = () => {
  const { residents, payments, addPayment, updatePayment, deletePayment, currentUser } = useAppContext();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 0 means "All months / all years"
  const [filterMonth, setFilterMonth] = useState<number>(currentMonth);
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<Payment | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState({
    residentId: '',
    amount: 150000,
    month: currentMonth,
    year: currentYear,
    date: new Date().toISOString().split('T')[0],
  });

  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;
  const verifiedPaymentsCount = payments.filter(p => p.status === 'verified').length;

  const filteredPayments = payments
    .filter(p => {
      if (filterMonth !== 0 && Number(p.month) !== Number(filterMonth)) return false;
      if (filterYear !== 0 && Number(p.year) !== Number(filterYear)) return false;
      if (filterStatus !== 'all' && (p.status || 'verified') !== filterStatus) return false;
      
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const resident = residents.find(r => r.id === p.residentId);
        const residentName = resident?.name.toLowerCase() || '';
        const residentHouse = resident?.houseNumber.toLowerCase() || '';
        const residentBlock = resident?.block?.toLowerCase() || '';
        const residentProp = resident?.propertyType.toLowerCase() || '';
        return (
          residentName.includes(term) ||
          residentHouse.includes(term) ||
          residentBlock.includes(term) ||
          residentProp.includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.residentId) return;

    // Check if payment already exists for this resident and period
    const exists = payments.some(
      p => p.residentId === formData.residentId && Number(p.month) === Number(formData.month) && Number(p.year) === Number(formData.year)
    );

    if (exists) {
      alert('Pembayaran untuk warga ini pada periode tersebut sudah tercatat.');
      return;
    }

    try {
      await addPayment({
        id: `p_${generateId()}`,
        residentId: formData.residentId,
        amount: Number(formData.amount),
        month: Number(formData.month),
        year: Number(formData.year),
        date: new Date(formData.date).toISOString(),
        status: 'verified' // Direct admin manual entry is verified
      });
      
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, residentId: '' }));
    } catch (err: any) {
      alert('Gagal mencatat pembayaran: ' + (err.message || 'Terjadi kesalahan sistem.'));
    }
  };

  const getUnpaidResidents = () => {
    return residents.filter(r => 
      !payments.some(p => p.residentId === r.id && Number(p.month) === Number(formData.month) && Number(p.year) === Number(formData.year))
    );
  };

  const handleVerify = async (paymentId: string) => {
    setIsVerifying(true);
    try {
      await updatePayment(paymentId, { status: 'verified' });
      setProofModalOpen(false);
      setSelectedProof(null);
    } catch (err: any) {
      alert('Gagal memverifikasi pembayaran: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900">Pembayaran Iuran</h1>
          <p className="text-slate-500 mt-1">Catat, verifikasi bukti transfer, dan pantau riwayat iuran warga</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Catat Pembayaran
          </button>
        )}
      </div>

      {/* Pending Alert Banner for Admin if there are unverified payments */}
      {currentUser?.role === 'admin' && pendingPaymentsCount > 0 && filterStatus !== 'pending' && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 text-sm">
                Ada {pendingPaymentsCount} Bukti Pembayaran Warga Menunggu Verifikasi
              </h4>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Warga telah mengunggah bukti transfer. Silakan periksa foto bukti dan konfirmasi status pembayaran.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFilterStatus('pending');
              setFilterMonth(0); // show all months for pending
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Lihat Menunggu Verifikasi ({pendingPaymentsCount})
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Status Filter Tabs */}
        <div className="px-4 pt-4 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({payments.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : pendingPaymentsCount > 0
                ? 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Menunggu Verifikasi</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'}`}>
              {pendingPaymentsCount}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus('verified')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'verified'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai / Terverifikasi</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'verified' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {verifiedPaymentsCount}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value={0}>Semua Bulan (Tampilkan Semua)</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>Bulan {getMonthName(i+1)}</option>
              ))}
            </select>
            <select 
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value={0}>Semua Tahun</option>
              {Array.from({ length: 22 }, (_, i) => currentYear - 1 + i).map(y => (
                <option key={y} value={y} className="text-slate-900 font-medium">{y}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, blok, nomor rumah..."
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
                <th className="px-6 py-4 font-medium">Warga & Properti</th>
                <th className="px-6 py-4 font-medium">Periode</th>
                <th className="px-6 py-4 font-medium">Nominal</th>
                <th className="px-6 py-4 font-medium">Status & Bukti Transfer</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment, index) => {
                  const resident = residents.find(r => r.id === payment.residentId);
                  const isPending = payment.status === 'pending';
                  return (
                    <motion.tr 
                      key={payment.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`transition-colors ${isPending ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{resident?.name || 'Warga (ID: ' + payment.residentId + ')'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {resident?.propertyType || 'Perumahan'} {resident?.block ? `Blok ${resident.block}` : ''} No. {resident?.houseNumber || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {getMonthName(payment.month)} {payment.year}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-semibold">{formatIDR(payment.amount)}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(payment.date).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Menunggu Verifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                            </span>
                          )}
                          
                          {payment.proofOfPayment && (
                            <button 
                              onClick={() => {
                                setSelectedProof(payment);
                                setProofModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-colors cursor-pointer"
                              title="Lihat Bukti Foto Transfer"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Lihat Bukti</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {currentUser?.role === 'admin' && isPending && (
                            <button
                              onClick={() => handleVerify(payment.id)}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
                              title="Verifikasi Pembayaran"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verifikasi</span>
                            </button>
                          )}
                          {currentUser?.role === 'admin' && (
                            <button 
                              onClick={() => {
                                if (window.confirm('Hapus rekam pembayaran ini dari sistem?')) {
                                  deletePayment(payment.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Hapus Pembayaran"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-slate-50/30">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600">Tidak ada catatan pembayaran untuk filter ini.</p>
                      <p className="text-xs text-slate-400">Coba ubah filter bulan, tahun, status atau kata kunci pencarian.</p>
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
              const isPending = payment.status === 'pending';
              return (
                <div key={payment.id} className={`p-4 flex flex-col gap-3 transition-colors ${isPending ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-900 text-base">{resident?.name || 'Warga'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {resident?.propertyType || 'Perumahan'} {resident?.block ? `Blok ${resident.block}` : ''} No. {resident?.houseNumber || '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatIDR(payment.amount)}</div>
                      <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {getMonthName(payment.month)} {payment.year}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      {new Date(payment.date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {payment.proofOfPayment && (
                      <button 
                        onClick={() => {
                          setSelectedProof(payment);
                          setProofModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Bukti Foto</span>
                      </button>
                    )}
                    {currentUser?.role === 'admin' && isPending && (
                      <button
                        onClick={() => handleVerify(payment.id)}
                        className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verifikasi</span>
                      </button>
                    )}
                    {currentUser?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          if (window.confirm('Hapus rekam pembayaran ini dari sistem?')) {
                            deletePayment(payment.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              Tidak ada catatan pembayaran untuk filter ini.
            </div>
          )}
        </div>
      </div>

      {/* Modal View Proof */}
      {proofModalOpen && selectedProof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Bukti Transfer Pembayaran</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periode {getMonthName(selectedProof.month)} {selectedProof.year} • {formatIDR(selectedProof.amount)}
                </p>
              </div>
              <button 
                onClick={() => setProofModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto bg-slate-900/5 flex-1 flex flex-col items-center justify-center min-h-[250px]">
              {selectedProof.proofOfPayment ? (
                <img 
                  src={selectedProof.proofOfPayment} 
                  alt="Bukti Transfer" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md border border-slate-200"
                />
              ) : (
                <p className="text-sm text-slate-500">Tidak ada gambar bukti terlampir.</p>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                selectedProof.status === 'pending'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                Status: {selectedProof.status === 'pending' ? 'Menunggu Verifikasi' : 'Terverifikasi Selesai'}
              </span>

              <div className="flex gap-2">
                <button 
                  onClick={() => setProofModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Tutup
                </button>
                {currentUser?.role === 'admin' && selectedProof.status === 'pending' && (
                  <button 
                    disabled={isVerifying}
                    onClick={() => handleVerify(selectedProof.id)}
                    className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isVerifying ? 'Memverifikasi...' : 'Verifikasi & Selesai'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Manual Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[100%] sm:max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-base">Catat Pembayaran Manual</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
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
                    {Array.from({ length: 22 }, (_, i) => currentYear - 1 + i).map(y => (
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
                  onChange={(e) => {
                    const rId = e.target.value;
                    const res = residents.find(r => r.id === rId);
                    setFormData({
                      ...formData, 
                      residentId: rId,
                      amount: res?.monthlyDues || 150000
                    });
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm appearance-none"
                >
                  <option value="" disabled>-- Pilih Warga (Belum Bayar) --</option>
                  {getUnpaidResidents().map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.propertyType} {r.block ? `Blok ${r.block}` : ''} No. {r.houseNumber}
                    </option>
                  ))}
                </select>
                {getUnpaidResidents().length === 0 && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Semua warga sudah membayar untuk periode ini.</p>
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
              
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors sm:text-sm cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={!formData.residentId}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
