import React, { createContext, useContext, useState, useEffect } from 'react';
import { Resident, Payment, AppUser, AppNotification, Expense, BankAccount } from './types';
import { generateId } from './utils';

interface AppContextType {
  currentUser: AppUser | null;
  isLoadingAuth: boolean;
  residents: Resident[];
  payments: Payment[];
  notifications: AppNotification[];
  expenses: Expense[];
  addResident: (resident: Resident, idLogin?: string, password?: string) => Promise<void>;
  addPayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateResident: (id: string, updatedData: Partial<Resident>, newPassword?: string) => Promise<void>;
  deleteResident: (id: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  addNotification: (title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  bankAccount: BankAccount;
  updateBankAccount: (bankAccount: BankAccount) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    bankName: 'BCA',
    accountNumber: '1234 5678 90',
    accountName: 'Paguyuban Grand Hannan'
  });

  // Load initial data
  useEffect(() => {
    const loadData = () => {
      const storedUsers = localStorage.getItem('app_users');
      if (!storedUsers) {
        // Initialize with default admin if not exists
        const defaultAdmin = {
          uid: 'admin_uid',
          email: 'admin',
          password: 'admin99',
          role: 'admin' as const
        };
        localStorage.setItem('app_users', JSON.stringify([defaultAdmin]));
      }

      const storedResidents = localStorage.getItem('app_residents');
      if (storedResidents) setResidents(JSON.parse(storedResidents));

      const storedPayments = localStorage.getItem('app_payments');
      if (storedPayments) setPayments(JSON.parse(storedPayments));

      const storedExpenses = localStorage.getItem('app_expenses');
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

      const storedNotifications = localStorage.getItem('app_notifications');
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

      const storedBank = localStorage.getItem('app_bank_account');
      if (storedBank) setBankAccount(JSON.parse(storedBank));

      // Check current session
      const session = localStorage.getItem('app_session');
      if (session) {
        setCurrentUser(JSON.parse(session));
      }
      setIsLoadingAuth(false);
    };

    loadData();
  }, []);

  // Save data on change
  useEffect(() => {
    if (!isLoadingAuth) {
      localStorage.setItem('app_residents', JSON.stringify(residents));
    }
  }, [residents, isLoadingAuth]);

  useEffect(() => {
    if (!isLoadingAuth) {
      localStorage.setItem('app_payments', JSON.stringify(payments));
    }
  }, [payments, isLoadingAuth]);

  useEffect(() => {
    if (!isLoadingAuth) {
      localStorage.setItem('app_expenses', JSON.stringify(expenses));
    }
  }, [expenses, isLoadingAuth]);

  useEffect(() => {
    if (!isLoadingAuth) {
      localStorage.setItem('app_notifications', JSON.stringify(notifications));
    }
  }, [notifications, isLoadingAuth]);

  useEffect(() => {
    if (!isLoadingAuth) {
      localStorage.setItem('app_bank_account', JSON.stringify(bankAccount));
    }
  }, [bankAccount, isLoadingAuth]);

  const addResident = async (resident: Resident, idLogin?: string, password?: string) => {
    if (currentUser?.role !== 'admin') return;

    if (idLogin && password) {
      const users = JSON.parse(localStorage.getItem('app_users') || '[]');
      
      // Check if ID already exists
      if (users.some((u: any) => u.email === idLogin)) {
        throw new Error("ID Pengguna sudah terdaftar.");
      }

      const newUid = `u_${generateId()}`;
      users.push({
        uid: newUid,
        email: idLogin,
        password: password,
        role: 'resident',
        residentId: resident.id
      });
      localStorage.setItem('app_users', JSON.stringify(users));
      
      resident.userId = newUid;
    }
    
    setResidents(prev => [...prev, resident]);
  };

  const addPayment = async (payment: Payment) => {
    if (!currentUser) return;
    setPayments(prev => [...prev, payment]);
  };

  const deletePayment = async (id: string) => {
    if (currentUser?.role !== 'admin') return;
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const addExpense = async (expense: Expense) => {
    if (currentUser?.role !== 'admin') return;
    setExpenses(prev => [...prev, expense]);
  };

  const deleteExpense = async (id: string) => {
    if (currentUser?.role !== 'admin') return;
    setExpenses(prev => prev.filter(p => p.id !== id));
  };

  const updateResident = async (id: string, updatedData: Partial<Resident>, newPassword?: string) => {
    if (currentUser?.role !== 'admin') return;

    setResidents(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));

    if (newPassword) {
      const resident = residents.find(r => r.id === id);
      if (resident?.userId) {
        const users = JSON.parse(localStorage.getItem('app_users') || '[]');
        const updatedUsers = users.map((u: any) => u.uid === resident.userId ? { ...u, password: newPassword } : u);
        localStorage.setItem('app_users', JSON.stringify(updatedUsers));
      }
    }
  };

  const deleteResident = async (id: string) => {
    if (currentUser?.role !== 'admin') return;

    const resident = residents.find(r => r.id === id);
    if (resident?.userId) {
      const users = JSON.parse(localStorage.getItem('app_users') || '[]');
      const updatedUsers = users.filter((u: any) => u.uid !== resident.userId);
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    }

    setResidents(prev => prev.filter(r => r.id !== id));
    setPayments(prev => prev.filter(p => p.residentId !== id));
  };

  const addNotification = (title: string, message: string) => {
    const newNotif: AppNotification = {
      id: `n_${generateId()}`,
      title,
      message,
      date: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updateBankAccount = (newBankAccount: BankAccount) => {
    setBankAccount(newBankAccount);
  };

  const signOutUser = async () => {
    localStorage.removeItem('app_session');
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, 
      isLoadingAuth, 
      residents, 
      payments, 
      notifications,
      expenses,
      addResident, 
      updateResident,
      deleteResident,
      addPayment, 
      deletePayment,
      addExpense,
      deleteExpense,
      signOutUser,
      addNotification,
      markNotificationRead,
      bankAccount,
      updateBankAccount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
