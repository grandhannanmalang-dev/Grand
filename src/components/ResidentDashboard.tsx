import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { getMonthName, formatIDR, generateId, compressImage } from '../utils';
import { CheckCircle2, XCircle, Upload, Image as ImageIcon, Loader2, Bell, Eye, X, AlertCircle } from 'lucide-react';
import { Payment } from '../types';
import { BankCard } from './BankCard';

export const ResidentDashboard: React.FC = () => {
  const { currentUser, residents, payments, addPayment, addNotification, bankAccount } = useAppContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [previewProof, setPreviewProof] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find resident data
  const resident = residents.find(r => r.userId === currentUser?.uid || r.id === currentUser?.residentId);

  if (!resident) {
    return (
      <div className="p-8 text-center text-slate-500">
        Data warga tidak ditemukan. Silakan hubungi admin.
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Sort payment history
  const myPayments = payments
    .filter(p => p.residentId === resident.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Check if paid for selected month
  const selectedMonthPayment = myPayments.find(
    p => Number(p.month) === Number(selectedMonth) && Number(p.year) === Number(selectedYear)
  );
  const hasPaidSelected = !!selectedMonthPayment;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB limit
    if (file.size > MAX_FILE_SIZE) {
      alert(`Ukuran file maksimal adalah 3MB. File yang Anda pilih berukuran ${(file.size / (1024 * 1024)).toFixed(2)} MB. Silakan gunakan file gambar di bawah 3MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    try {
      // Compress image client-side before sending to Firestore so it easily fits within 1MB document limit (~80KB)
      const compressedBase64 = await compressImage(file, 1200, 0.78);
      
      const newPayment: Payment = {
        id: `p_${generateId()}`,
        residentId: resident.id,
        amount: resident.monthlyDues || 150000,
        month: Number(selectedMonth),
        year: Number(selectedYear),
        date: new Date().toISOString(),
        proofOfPayment: compressedBase64,
        status: 'pending' // Admin needs to verify
      };

      await addPayment(newPayment);

      // Add notification for admin
      addNotification(
        'Bukti Pembayaran Baru',
        `${resident.name} (${resident.propertyType} Blok ${resident.block || ''} No ${resident.houseNumber}) telah mengunggah bukti pembayaran iuran periode ${getMonthName(selectedMonth)} ${selectedYear}.`
      );

      alert(`Bukti pembayaran untuk periode ${getMonthName(selectedMonth)} ${selectedYear} berhasil diunggah! Notifikasi telah dikirimkan ke Admin untuk diverifikasi.`);
    } catch (err: any) {
      console.error('Error uploading payment:', err);
      alert('Gagal mengunggah bukti pembayaran: ' + (err.message || 'Terjadi kesalahan jaringan atau sistem.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-slate-900">Halo, {resident.name}</h1>
        <p className="text-slate-500 mt-1">Dashboard Tagihan Iuran Warga</p>
      </div>

      {/* Pengingat Pembayaran Rutin Tanggal 1 */}
      {!myPayments.some(p => Number(p.month) === Number(currentMonth) && Number(p.year) === Number(currentYear)) ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 uppercase tracking-wider">
                  Pengingat Tanggal 1
                </span>
                <span className="text-xs text-amber-800 font-medium">
                  Periode {getMonthName(currentMonth)} {currentYear}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-base mt-1.5">
                Jadwal Pembayaran Iuran Bulanan Warga
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Setiap <strong>tanggal 1 di awal bulan</strong> adalah jadwal dimulainya pembayaran iuran warga Grand Hannan. Status iuran Anda bulan ini masih <strong>Belum Bayar</strong>. Mohon transfer ke rekening paguyuban dan unggah foto bukti transfer di bawah.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">
            Terima kasih! Iuran bulan <strong>{getMonthName(currentMonth)} {currentYear}</strong> Anda telah tercatat lunas.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Warga */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Informasi Properti</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-slate-500">Tipe Properti</span>
              <span className="font-medium text-slate-900">{resident.propertyType}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-slate-500">Nomor / Blok</span>
              <span className="font-medium text-slate-900">{resident.propertyType === 'Perumahan' ? `Blok ${resident.block || '-'} No. ${resident.houseNumber}` : `No. ${resident.houseNumber}`}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-slate-500">Iuran Bulanan</span>
              <span className="font-medium text-slate-900">{formatIDR(resident.monthlyDues || 150000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status Bulan Ini</span>
              {myPayments.some(p => Number(p.month) === Number(currentMonth) && Number(p.year) === Number(currentYear)) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                  <XCircle className="w-3.5 h-3.5" /> Belum
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Pembayaran */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Bayar Iuran (Upload Bukti)</h2>
          <div className="space-y-4">
            <BankCard 
              bankAccount={bankAccount} 
              nominal={resident.monthlyDues || 150000} 
              className="mb-4"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 sm:text-sm appearance-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 sm:text-sm appearance-none cursor-pointer"
                >
                  {Array.from({ length: 22 }, (_, i) => currentYear - 1 + i).map(y => (
                    <option key={y} value={y} className="text-slate-900 font-medium">{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasPaidSelected ? (
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                selectedMonthPayment?.status === 'pending'
                  ? 'bg-amber-50 text-amber-900 border-amber-200/80'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <div className="flex gap-3 items-start">
                  {selectedMonthPayment?.status === 'pending' ? (
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">
                        {selectedMonthPayment?.status === 'pending' 
                          ? 'Menunggu Verifikasi Admin' 
                          : 'Pembayaran Terverifikasi Lunas'}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedMonthPayment?.status === 'pending'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-emerald-200 text-emerald-800'
                      }`}>
                        {selectedMonthPayment?.status === 'pending' ? 'Pending' : 'Lunas'}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 mt-1 leading-relaxed">
                      {selectedMonthPayment?.status === 'pending'
                        ? 'Bukti pembayaran Anda telah berhasil terkirim dan tersimpan di sistem. Pengurus paguyuban akan memverifikasi bukti Anda.'
                        : 'Iuran untuk periode ini sudah selesai diverifikasi oleh pengurus.'}
                    </p>
                  </div>
                </div>

                {selectedMonthPayment?.proofOfPayment && (
                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewProof(selectedMonthPayment.proofOfPayment || null)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-white/70 px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      Lihat Bukti Transfer yang Diunggah
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-amber-800 hover:underline font-medium"
                    >
                      Unggah Ulang Bukti
                    </button>
                  </div>
                )}
                
                {/* Hidden input for re-uploading if needed */}
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </div>
            ) : (
              <div>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 shadow-sm cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mengompresi & Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload Bukti Pembayaran</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  Format gambar: JPG, JPEG, PNG. Maksimal ukuran 3MB.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Riwayat Pembayaran */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Riwayat Pembayaran Anda</h2>
        {myPayments.length > 0 ? (
          <div className="flex flex-col divide-y divide-slate-100">
            {myPayments.map(payment => (
              <div key={payment.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="font-medium text-slate-900 text-base">
                    Periode {getMonthName(payment.month)} {payment.year}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {new Date(payment.date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900">{formatIDR(payment.amount)}</span>
                  {payment.status === 'pending' ? (
                     <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                       Menunggu Verifikasi
                     </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Terverifikasi
                    </span>
                  )}
                  {payment.proofOfPayment && (
                    <button
                      onClick={() => setPreviewProof(payment.proofOfPayment || null)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200/60"
                      title="Lihat Bukti Transfer"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            Belum ada riwayat pembayaran.
          </div>
        )}
      </div>

      {/* Modal Preview Bukti Transfer untuk Warga */}
      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm">Bukti Transfer Pembayaran</h3>
              <button 
                onClick={() => setPreviewProof(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-900/5 max-h-[70vh] overflow-auto">
              <img 
                src={previewProof} 
                alt="Bukti Transfer" 
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm border border-slate-200"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
