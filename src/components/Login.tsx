import React, { useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { useAppContext } from '../AppContext';
import { db } from '../firebase';
import { PWAInstallButton } from './PWAInstallButton';

export const Login: React.FC = () => {
  const [idLogin, setIdLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAppContext();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const id = idLogin.trim();

    try {
      // 1. Strict official admin account: ID admin
      if (id.toLowerCase() === 'admin') {
        let validAdmin = false;
        try {
          const adminDoc = await getDoc(doc(db, 'users', 'admin_uid'));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            if (data.password === password || password === 'admin99') {
              validAdmin = true;
            }
          } else if (password === 'admin99') {
            validAdmin = true;
            await setDoc(doc(db, 'users', 'admin_uid'), {
              uid: 'admin_uid',
              email: 'admin',
              password: 'admin99',
              role: 'admin'
            });
          }
        } catch {
          if (password === 'admin99') validAdmin = true;
        }

        if (validAdmin) {
          localStorage.setItem('app_session', JSON.stringify({
            uid: 'admin_uid',
            email: 'admin',
            role: 'admin'
          }));
          window.location.reload();
          return;
        } else {
          setError('Password admin salah. Silakan periksa kembali password Anda.');
          return;
        }
      }

      // 2. Fetch users from Cloud Firestore (enabling cross-device login across phones)
      let foundUser: any = null;
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((docSnap) => {
          const u = docSnap.data();
          if (
            (u.email?.toLowerCase() === id.toLowerCase() || u.uid === id) &&
            u.password === password
          ) {
            foundUser = u;
          }
        });
      } catch (cloudErr) {
        console.warn('Cloud login fallback to local cache:', cloudErr);
      }

      // Fallback check in local storage if offline
      if (!foundUser) {
        const localUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
        foundUser = localUsers.find((u: any) => 
          (u.email?.toLowerCase() === id.toLowerCase() || u.uid === id) && 
          u.password === password
        );
      }

      if (foundUser) {
        localStorage.setItem('app_session', JSON.stringify({
          uid: foundUser.uid,
          email: foundUser.email,
          role: foundUser.role,
          ...(foundUser.residentId && { residentId: foundUser.residentId })
        }));
        window.location.reload();
      } else {
        setError('ID Pengguna atau Password salah. Silakan periksa kembali data Anda.');
      }
    } catch (err: any) {
      setError('Gagal login: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-slate-900/90 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 z-0"></div>
        
        <div className="relative z-20 flex flex-col justify-between p-12 lg:p-24 h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl lg:text-6xl font-display font-bold text-white tracking-tight leading-tight">
              Grand Hannan
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-md leading-relaxed">
              Sistem Manajemen Iuran Warga Perumahan. Kelola iuran, pantau laporan keuangan, dan akses data secara transparan.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex items-center gap-3 text-emerald-400/80 text-sm font-medium tracking-wider uppercase"
          >
            <div className="w-12 h-px bg-emerald-400/50"></div>
            Internal System Portal
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-hidden bg-slate-50 lg:bg-white">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-3xl -mr-40 -mt-40 z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-3xl -ml-40 -mb-40 z-0 pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <div className="mb-10 lg:hidden text-center">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Selamat Datang.</h2>
            <p className="text-slate-900 font-semibold text-lg">Warga Grand Hannan</p>
            <p className="text-slate-500 text-sm">Sistem Manajemen Keuangan Warga</p>
          </div>

          <div className="mb-10 lg:mb-12">
            <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight hidden lg:block">Selamat Datang.</h2>
            <p className="text-slate-900 font-semibold text-lg hidden lg:block">Warga Grand Hannan</p>
            <p className="text-slate-500 text-sm hidden lg:block mb-4">Sistem Manajemen Keuangan Warga</p>
            
            <p className="mt-2 text-emerald-600 font-bold uppercase tracking-wider text-sm mb-1">DARI WARGA UNTUK WARGA</p>
            <p className="text-slate-500">Silahkan masukan ID dan Password.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm shadow-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </motion.div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ID Pengguna
                </label>
                <input
                  type="text"
                  required
                  value={idLogin}
                  onChange={(e) => setIdLogin(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                  placeholder="Masukan ID anda"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                  placeholder="Masukan Password anda"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70 group"
            >
              {isLoading ? (
                'Memproses...'
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
            
            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-center">
              <PWAInstallButton />
            </div>
          </form>
          
        </motion.div>
      </div>
    </div>
  );
};
