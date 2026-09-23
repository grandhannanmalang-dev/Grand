import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LogOut, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../AppContext';

interface HeaderProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onSettingsClick }) => {
  const { currentUser, signOutUser, notifications, markNotificationRead } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const userIdentifier = currentUser?.email?.replace('@grandhannan.com', '') || 'U';
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 relative z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {currentUser?.role === 'admin' && (
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
              )}
            </button>
            
            <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed left-4 right-4 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 origin-top sm:origin-top-right bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-[100] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-800">Notifikasi</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="flex flex-col divide-y divide-slate-50">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            if (!notif.read) markNotificationRead(notif.id);
                          }}
                          className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-emerald-50/30' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {notif.title}
                            </h4>
                            {!notif.read && <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                          </div>
                          <p className="text-xs text-slate-500 leading-snug">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {new Date(notif.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      Belum ada notifikasi
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}

        <button 
          onClick={onSettingsClick}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          title="Pengaturan Akun"
        >
          <Settings className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 pr-4 border-r border-slate-200 pl-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm uppercase">
            {userIdentifier.substring(0,2)}
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium text-slate-900 leading-none truncate max-w-[120px]">{userIdentifier}</p>
            <p className="text-slate-500 mt-1 text-xs uppercase">{currentUser?.role}</p>
          </div>
        </div>
        <button 
          onClick={signOutUser}
          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
          title="Keluar"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
