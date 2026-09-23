import React from 'react';
import { LayoutDashboard, Users, Receipt, BarChart3, Building, FileText } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
import { useAppContext } from '../AppContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewType = 'dashboard' | 'residents' | 'payments' | 'reports';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose }) => {
  const { currentUser } = useAppContext();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'residents', label: 'Data Warga', icon: Users },
    { id: 'payments', label: 'Pembayaran', icon: Receipt },
    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3 },
  ] as const;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
              <span className="font-display font-semibold text-lg text-slate-900 tracking-tight leading-tight">Grand Hannan</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <div className="mb-4 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={item.id}
                  onClick={() => {
                    onChangeView(item.id as ViewType);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all relative overflow-hidden group",
                    isActive 
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  )}
                  <Icon className={cn("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400")} />
                  <span className="relative z-10">{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
