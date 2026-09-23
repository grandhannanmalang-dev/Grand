import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { getMonthName, formatIDR, generateId } from '../utils';
import { CheckCircle2, XCircle, Upload, Image as ImageIcon, Send, Loader2, Bell, Calendar } from 'lucide-react';
import { Payment } from '../types';

export const ResidentDashboard: React.FC = () => {
  const { currentUser, residents, payments, addPayment, addNotification, bankAccount } = useAppContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
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
  const hasPaidSelected = myPayments.some(
    p => p.month === selectedMonth && p.year === selectedYear
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Ukuran gambar maksimal 2MB.');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      const newPayment: Payment = {
        id: `p_${generateId()}`,
        residentId: resident.id,
        amount: resident.monthlyDues || 150000,
        month: selectedMonth,
        year: selectedYear,
        date: new Date().toISOString().split('T')[0],
        proofOfPayment: base64,
        status: 'pending' // Admin needs to verify
      };

      try {
        await addPayment(newPayment);
        // Add notification for admin
        addNotification(
          'Bukti Pembayaran Baru',
          `${resident.name} telah mengunggah bukti pembayaran iuran periode ${getMonthName(selectedMonth)} ${selectedYear}.`
        );
        
        // Simulating sending email
        console.log(`[SYSTEM] SENDING EMAIL TO ADMIN: Bukti pembayaran dari ${resident.name} untuk periode ${getMonthName(selectedMonth)} ${selectedYear} telah diunggah.`);
        
        alert(`Bukti pembayaran berhasil diunggah! Notifikasi telah dikirim ke Admin.`);
      } catch (err: any) {
        alert("Gagal mengunggah pembayaran: " + err.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert('Gagal membaca file.');
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-slate-900">Halo, {resident.name}</h1>
        <p className="text-slate-500 mt-1">Dashboard Tagihan Iuran Warga</p>
      </div>

      {/* Pengingat Pembayaran Rutin Tanggal 1 */}
      {!myPayments.some(p => p.month === currentMonth && p.year === currentYear) ? (
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
              <span className="font-medium text-slate-900">{resident.propertyType || 'Perumahan'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-slate-500">Nomor Rumah / Ruko</span>
              <span className="font-medium text-slate-900">{resident.houseNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-slate-500">Status Bulan Ini</span>
              {myPayments.some(p => p.month === currentMonth && p.year === currentYear) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide bg-rose-50 text-rose-700">
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
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
              <p className="text-sm text-slate-500 mb-1">Transfer ke Rekening Pengurus:</p>
              <p className="font-semibold text-slate-900 text-lg">{bankAccount.bankName} - {bankAccount.accountNumber}</p>
              <p className="text-sm font-medium text-slate-700">a.n. {bankAccount.accountName}</p>
              <p className="text-sm text-slate-500 mt-2">Nominal tagihan bulanan: <strong className="text-slate-900">Rp {(resident.monthlyDues || 150000).toLocaleString('id-ID')}</strong></p>
            </div>
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
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Pembayaran Tercatat</p>
                  <p className="text-xs text-emerald-700/80 mt-1">Anda sudah melakukan pembayaran / upload untuk periode ini.</p>
                </div>
              </div>
            ) : (
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 shadow-sm"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span>{isUploading ? 'Mengunggah...' : 'Upload Bukti Pembayaran'}</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-2 text-center">Format: JPG, PNG. Maksimal 2MB.</p>
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
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-900">{formatIDR(payment.amount)}</span>
                  {payment.status === 'pending' ? (
                     <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                       Menunggu Verifikasi
                     </span>
                  ) : payment.status === 'verified' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Lunas
                    </span>
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

    </div>
  );
};
