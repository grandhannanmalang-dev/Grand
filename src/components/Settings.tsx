import React, { useState, useEffect } from 'react';
import { updatePassword, auth } from '../firebase';
import { AlertCircle, CheckCircle2, Lock, Landmark } from 'lucide-react';
import { useAppContext } from '../AppContext';

export const Settings: React.FC = () => {
  const { currentUser, bankAccount, updateBankAccount } = useAppContext();
  
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Bank Account State
  const [bankName, setBankName] = useState(bankAccount.bankName);
  const [accountNumber, setAccountNumber] = useState(bankAccount.accountNumber);
  const [accountName, setAccountName] = useState(bankAccount.accountName);
  const [bankMessage, setBankMessage] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await updatePassword(auth.currentUser, newPassword);
      setMessage('Password berhasil diperbarui.');
      setNewPassword('');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Demi keamanan, Anda perlu login ulang sebelum mengganti password.');
      } else {
        setError('Gagal mengganti password: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBank = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankAccount({
      bankName,
      accountNumber,
      accountName
    });
    setBankMessage('Informasi rekening berhasil diperbarui.');
    setTimeout(() => setBankMessage(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-semibold text-slate-900">Pengaturan</h1>
        <p className="text-slate-500 mt-1">Kelola preferensi akun dan sistem</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-display font-semibold text-slate-900">Ganti Password</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {message && (
            <div className="flex items-start gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
            <input 
              required
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Password'}
          </button>
        </form>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Landmark className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-display font-semibold text-slate-900">Rekening Pembayaran</h2>
          </div>

          <form onSubmit={handleUpdateBank} className="space-y-5 max-w-md">
            {bankMessage && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>{bankMessage}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bank</label>
              <input 
                required
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Misal: BCA, Mandiri"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Rekening</label>
              <input 
                required
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Misal: 1234 5678 90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Atas Nama</label>
              <input 
                required
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Misal: Paguyuban Grand Hannan"
              />
            </div>

            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Simpan Rekening
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
