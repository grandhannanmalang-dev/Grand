import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../AppContext';
import { formatIDR, getMonthName, generateId } from '../utils';
import { Wallet, Users, AlertCircle, CheckCircle2, XCircle, Upload, Loader2, Building2, Bell } from 'lucide-react';
import { Payment } from '../types';

export const Dashboard: React.FC = () => {
  const { currentUser, residents, payments, addPayment, addNotification } = useAppContext();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Statistics (for Admin and general view)
  const currentMonthPayments = payments.filter(p => p.month === currentMonth && p.year === currentYear);
  const verifiedMonthPayments = currentMonthPayments.filter(p => p.status === 'verified');
  const totalCollected = verifiedMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const paidResidentIds = new Set(verifiedMonthPayments.map(p => p.residentId));
  const paidCount = paidResidentIds.size;
  const unpaidCount = residents.length - paidCount;

  const resident = currentUser?.role === 'resident' 
    ? residents.find(r => r.userId === currentUser?.uid || r.id === currentUser?.residentId)
    : null;

  const myPayments = resident 
    ? payments.filter(p => p.residentId === resident.id)
    : [];

  const myVerifiedPayments = myPayments.filter(p => p.status === 'verified');
  const myTotalPaid = myVerifiedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Recent 5 transactions (filter if resident)
  const recentPayments = (currentUser?.role === 'resident' ? myPayments : payments)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {currentUser?.role === 'resident' && resident 
              ? `Halo, ${resident.name} - Ringkasan Tagihan Anda`
              : `Ringkasan iuran bulan ${getMonthName(currentMonth)} ${currentYear}`
            }
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-xl text-emerald-800 text-xs font-medium self-start md:self-auto">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Bell className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pengingat Otomatis Tanggal 1 Aktif</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentUser?.role === 'resident' ? (
          <>
            {/* Resident Card 1 */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/40 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 z-10">
                <Wallet className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-semibold text-slate-500 mb-1">Total Iuran Lunas Anda</p>
                <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tight">{formatIDR(myTotalPaid)}</h3>
              </div>
            </motion.div>

            {/* Resident Card 2 */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/40 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-500/0 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 z-10">
                <Users className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-semibold text-slate-500 mb-1">Riwayat Pembayaran</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tight">{myPayments.length}</h3>
                  <span className="text-slate-500 font-medium">Bulan Terbayar</span>
                </div>
              </div>
            </motion.div>

            {/* Resident Card 3 */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/40 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-rose-500/0 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20 z-10">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-semibold text-slate-500 mb-1">Tagihan Bulan Ini</p>
                <h3 className="text-xl font-display font-bold text-slate-900 tracking-tight pt-1.5">
                  {myVerifiedPayments.some(p => p.month === currentMonth && p.year === currentYear) 
                    ? <span className="inline-flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-5 h-5"/> Selesai</span>
                    : <span className="inline-flex items-center gap-1.5 text-rose-600"><AlertCircle className="w-5 h-5"/> Belum Dibayar</span>
                  }
                </h3>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Admin Card 1 */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/40 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 z-10">
                <Wallet className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-semibold text-slate-500 mb-1">Terkumpul Bulan Ini</p>
                <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tight">{formatIDR(totalCollected)}</h3>
              </div>
            </motion.div>

            {/* Admin Card 2 */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/40 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-indigo-500/0 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 z-10">
                <Users className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-semibold text-slate-500 mb-1">Sudah Membayar</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tight">{paidCount}</h3>
                  <span className="text-slate-500 font-medium">/ {residents.length} Warga</span>
                </div>
              </div>
            </motion.div>

            {/* Admin Card 3 */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/40 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-rose-500/0 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20 z-10">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-semibold text-slate-500 mb-1">Belum Membayar</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tight">{unpaidCount}</h3>
                  <span className="text-slate-500 font-medium">Warga</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-slate-900">Transaksi Terakhir</h2>
        </div>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">Warga</th>
                <th className="px-6 py-4 font-medium">Properti</th>
                <th className="px-6 py-4 font-medium">Periode</th>
                <th className="px-6 py-4 font-medium text-right">Nominal</th>
                <th className="px-6 py-4 font-medium">Tanggal Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment, index) => {
                  const resident = residents.find(r => r.id === payment.residentId);
                  return (
                    <motion.tr 
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {resident?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {resident?.propertyType || 'Perumahan'} - {resident?.houseNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          {getMonthName(payment.month)} {payment.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium text-right">
                        {formatIDR(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(payment.date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Belum ada transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {recentPayments.length > 0 ? (
            recentPayments.map(payment => {
              const resident = residents.find(r => r.id === payment.residentId);
              return (
                <div key={payment.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-slate-900 text-base">{resident?.name || 'Unknown'}</h4>
                      <p className="text-sm text-slate-500">{resident?.propertyType || 'Perumahan'} - {resident?.houseNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900 text-base">{formatIDR(payment.amount)}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(payment.date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Periode {getMonthName(payment.month)} {payment.year}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              Belum ada transaksi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
