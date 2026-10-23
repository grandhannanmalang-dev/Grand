import React, { useState } from 'react';
import { Copy, Check, Landmark, CreditCard, CheckCheck } from 'lucide-react';
import { BankAccount } from '../types';
import { formatIDR } from '../utils';

interface BankCardProps {
  bankAccount: BankAccount;
  nominal?: number;
  variant?: 'card' | 'compact' | 'banner';
  className?: string;
}

export const BankCard: React.FC<BankCardProps> = ({
  bankAccount,
  nominal,
  variant = 'card',
  className = '',
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);

  // Copy helper with modern API + fallback
  const copyText = async (text: string, type: 'account' | 'nominal') => {
    // If account number, remove spaces for mobile banking apps
    const toCopy = type === 'account' ? text.replace(/\s+/g, '') : text;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(toCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = toCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (type === 'account') {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2200);
      } else {
        setCopiedNominal(true);
        setTimeout(() => setCopiedNominal(false), 2200);
      }
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white/95 border border-amber-300/80 text-slate-900 rounded-xl shadow-xs ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{bankAccount.bankName}</span>
              <span className="text-xs text-slate-500">a.n. {bankAccount.accountName}</span>
            </div>
            <p className="font-mono font-bold text-sm tracking-wider text-slate-900">{bankAccount.accountNumber}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => copyText(bankAccount.accountNumber, 'account')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-all active:scale-95 shadow-xs"
        >
          {copiedAccount ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Rekening</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-white text-slate-900 p-5 md:p-6 shadow-sm border border-slate-200 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Header Rekening */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-700 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Rekening Resmi Pembayaran</p>
              <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                Bank {bankAccount.bankName}
                <span className="px-2.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200/80">
                  Resmi Paguyuban
                </span>
              </h4>
            </div>
          </div>
        </div>

        {/* Nomor Rekening Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Nomor Rekening Tujuan</span>
            {copiedAccount && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-pulse">
                <CheckCheck className="w-3.5 h-3.5" />
                Tersalin ke Clipboard!
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => copyText(bankAccount.accountNumber, 'account')}
              title="Klik untuk salin nomor rekening"
              className="text-left group/acc focus:outline-none"
            >
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-slate-900 group-hover/acc:text-emerald-700 transition-colors">
                {bankAccount.accountNumber}
              </span>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                a.n. <strong className="text-slate-900 font-semibold">{bankAccount.accountName}</strong>
              </p>
            </button>

            {/* Tombol Copy Utama */}
            <button
              type="button"
              onClick={() => copyText(bankAccount.accountNumber, 'account')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm active:scale-95 shrink-0 ${
                copiedAccount
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {copiedAccount ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin No. Rekening</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nominal Tagihan Section jika ada */}
        {nominal !== undefined && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-sm bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
            <div>
              <span className="text-xs text-slate-500 font-medium">Nominal Tagihan Iuran:</span>
              <p className="font-bold text-slate-900 text-base sm:text-lg mt-0.5 font-display">
                {formatIDR(nominal)}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => copyText(nominal.toString(), 'nominal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs self-start sm:self-auto border ${
                copiedNominal
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {copiedNominal ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nominal Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Nominal ({nominal})</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Nomor rekening disalin tanpa spasi agar siap dipaste langsung ke m-banking.</span>
        </div>
      </div>
    </div>
  );
};
