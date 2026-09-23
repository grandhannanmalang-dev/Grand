import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { Resident, Payment, AppUser, AppNotification, Expense, BankAccount } from './types';
import { initialResidents, initialPayments } from './data';
import { generateId, getMonthName } from './utils';
import { db, handleFirestoreError, OperationType } from './firebase';

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
  
  // Initialize with cached localStorage or empty array while Firestore streams in
  const [residents, setResidents] = useState<Resident[]>(() => {
    try {
      const stored = localStorage.getItem('app_residents');
      return stored ? JSON.parse(stored) : initialResidents;
    } catch {
      return initialResidents;
    }
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const stored = localStorage.getItem('app_payments');
      return stored ? JSON.parse(stored) : initialPayments;
    } catch {
      return initialPayments;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem('app_expenses');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem('app_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [bankAccount, setBankAccount] = useState<BankAccount>(() => {
    try {
      const stored = localStorage.getItem('app_bank_account');
      return stored ? JSON.parse(stored) : {
        bankName: 'BCA',
        accountNumber: '1234 5678 90',
        accountName: 'Paguyuban Grand Hannan'
      };
    } catch {
      return {
        bankName: 'BCA',
        accountNumber: '1234 5678 90',
        accountName: 'Paguyuban Grand Hannan'
      };
    }
  });

  // Check local session
  useEffect(() => {
    try {
      const session = localStorage.getItem('app_session');
      if (session) {
        setCurrentUser(JSON.parse(session));
      }
    } catch (e) {
      console.error('Error loading session:', e);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Ensure Admin and Initial Data in Firestore
  useEffect(() => {
    const initializeCloudData = async () => {
      try {
        // 1. Ensure official Admin exists in cloud Firestore
        const adminDocRef = doc(db, 'users', 'admin_uid');
        const adminSnap = await getDoc(adminDocRef);
        if (!adminSnap.exists()) {
          await setDoc(adminDocRef, {
            uid: 'admin_uid',
            email: 'admin',
            password: 'admin99',
            role: 'admin'
          });
        }

        // 2. Check if residents collection in Firestore has data; if empty, seed initialResidents
        const resColRef = collection(db, 'residents');
        const resSnap = await getDocs(resColRef);
        if (resSnap.empty) {
          for (const res of initialResidents) {
            await setDoc(doc(db, 'residents', res.id), res);
          }
        }

        // 3. Check if payments collection in Firestore has data; if empty, seed initialPayments
        const payColRef = collection(db, 'payments');
        const paySnap = await getDocs(payColRef);
        if (paySnap.empty) {
          for (const pay of initialPayments) {
            await setDoc(doc(db, 'payments', pay.id), pay);
          }
        }

        // 4. Ensure bankAccount exists in Firestore
        const bankDocRef = doc(db, 'settings', 'bankAccount');
        const bankSnap = await getDoc(bankDocRef);
        if (!bankSnap.exists()) {
          await setDoc(bankDocRef, {
            bankName: 'BCA',
            accountNumber: '1234 5678 90',
            accountName: 'Paguyuban Grand Hannan'
          });
        }

        // 5. Automated 1st of the Month Payment Reminder Notification
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1; // 1 to 12
        const reminderId = `reminder_iuran_${curYear}_${curMonth}`;
        const reminderRef = doc(db, 'notifications', reminderId);
        const reminderSnap = await getDoc(reminderRef);

        if (!reminderSnap.exists()) {
          const monthName = getMonthName(curMonth);
          const reminderNotif: AppNotification = {
            id: reminderId,
            title: `Pengingat Pembayaran Iuran Bulan ${monthName} ${curYear}`,
            message: `Halo Warga Grand Hannan, setiap tanggal 1 adalah jadwal dimulainya pembayaran iuran bulanan periode ${monthName} ${curYear}. Mohon segera lakukan pembayaran transfer ke rekening paguyuban dan unggah bukti transfer. Terima kasih atas kerja samanya!`,
            date: new Date(curYear, curMonth - 1, 1, 7, 0, 0).toISOString(),
            read: false
          };
          await setDoc(reminderRef, reminderNotif);
        }

        // Web Notification prompt & push if supported
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            const notifiedKey = `app_notified_due_${curYear}_${curMonth}`;
            if (!localStorage.getItem(notifiedKey)) {
              try {
                const monthName = getMonthName(curMonth);
                new Notification(`Grand Hannan - Pengingat Iuran Tanggal 1`, {
                  body: `Periode iuran bulan ${monthName} ${curYear} telah dibuka. Mohon selesaikan pembayaran tepat waktu.`,
                  icon: '/icon.svg'
                });
                localStorage.setItem(notifiedKey, 'true');
              } catch (notifErr) {
                console.warn('Browser notification error:', notifErr);
              }
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'init_seed');
      }
    };

    initializeCloudData();
  }, []);

  // Real-time Firestore Listeners (Live Auto-Sync across all phones and devices)
  useEffect(() => {
    // 1. Listen to Residents
    const unsubResidents = onSnapshot(
      collection(db, 'residents'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudResidents: Resident[] = [];
          snapshot.forEach((d) => {
            cloudResidents.push(d.data() as Resident);
          });
          setResidents(cloudResidents);
          localStorage.setItem('app_residents', JSON.stringify(cloudResidents));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'residents');
      }
    );

    // 2. Listen to Payments
    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudPayments: Payment[] = [];
          snapshot.forEach((d) => {
            cloudPayments.push(d.data() as Payment);
          });
          setPayments(cloudPayments);
          localStorage.setItem('app_payments', JSON.stringify(cloudPayments));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'payments');
      }
    );

    // 3. Listen to Expenses
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const cloudExpenses: Expense[] = [];
        snapshot.forEach((d) => {
          cloudExpenses.push(d.data() as Expense);
        });
        setExpenses(cloudExpenses);
        localStorage.setItem('app_expenses', JSON.stringify(cloudExpenses));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'expenses');
      }
    );

    // 4. Listen to Notifications
    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const cloudNotifs: AppNotification[] = [];
        snapshot.forEach((d) => {
          cloudNotifs.push(d.data() as AppNotification);
        });
        // Sort newest first
        cloudNotifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotifications(cloudNotifs);
        localStorage.setItem('app_notifications', JSON.stringify(cloudNotifs));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    // 5. Listen to Bank Account Settings
    const unsubBank = onSnapshot(
      doc(db, 'settings', 'bankAccount'),
      (snapshot) => {
        if (snapshot.exists()) {
          const bankData = snapshot.data() as BankAccount;
          setBankAccount(bankData);
          localStorage.setItem('app_bank_account', JSON.stringify(bankData));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/bankAccount');
      }
    );

    return () => {
      unsubResidents();
      unsubPayments();
      unsubExpenses();
      unsubNotifs();
      unsubBank();
    };
  }, []);

  // Actions with Cloud Persistence & Auto-Sync
  const addResident = async (resident: Resident, idLogin?: string, password?: string) => {
    if (currentUser?.role !== 'admin') return;

    try {
      if (idLogin && password) {
        const cleanedId = idLogin.trim();
        // Check if ID exists in Firestore users
        const usersSnap = await getDocs(collection(db, 'users'));
        let exists = false;
        usersSnap.forEach((u) => {
          const data = u.data();
          if (data.email?.toLowerCase() === cleanedId.toLowerCase() || data.uid === cleanedId) {
            exists = true;
          }
        });

        if (exists) {
          throw new Error("ID Pengguna sudah terdaftar di sistem.");
        }

        const newUid = `u_${generateId()}`;
        const newUserData = {
          uid: newUid,
          email: cleanedId,
          password: password,
          role: 'resident',
          residentId: resident.id
        };

        // Save user to cloud Firestore for cross-device login
        await setDoc(doc(db, 'users', newUid), newUserData);
        resident.userId = newUid;
      }

      // Save resident to cloud Firestore
      await setDoc(doc(db, 'residents', resident.id), resident);

      // Local optimistic update
      setResidents(prev => {
        const filtered = prev.filter(r => r.id !== resident.id);
        const updated = [...filtered, resident];
        localStorage.setItem('app_residents', JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `residents/${resident.id}`);
      throw err;
    }
  };

  const addPayment = async (payment: Payment) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'payments', payment.id), payment);
      setPayments(prev => {
        const updated = [...prev.filter(p => p.id !== payment.id), payment];
        localStorage.setItem('app_payments', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `payments/${payment.id}`);
    }
  };

  const deletePayment = async (id: string) => {
    if (currentUser?.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'payments', id));
      setPayments(prev => {
        const updated = prev.filter(p => p.id !== id);
        localStorage.setItem('app_payments', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `payments/${id}`);
    }
  };

  const addExpense = async (expense: Expense) => {
    if (currentUser?.role !== 'admin') return;
    try {
      await setDoc(doc(db, 'expenses', expense.id), expense);
      setExpenses(prev => {
        const updated = [...prev.filter(e => e.id !== expense.id), expense];
        localStorage.setItem('app_expenses', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `expenses/${expense.id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    if (currentUser?.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        localStorage.setItem('app_expenses', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const updateResident = async (id: string, updatedData: Partial<Resident>, newPassword?: string) => {
    if (currentUser?.role !== 'admin') return;

    try {
      await updateDoc(doc(db, 'residents', id), updatedData);

      setResidents(prev => {
        const updated = prev.map(r => r.id === id ? { ...r, ...updatedData } : r);
        localStorage.setItem('app_residents', JSON.stringify(updated));
        return updated;
      });

      if (newPassword) {
        const resident = residents.find(r => r.id === id);
        if (resident?.userId) {
          await updateDoc(doc(db, 'users', resident.userId), { password: newPassword });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `residents/${id}`);
    }
  };

  const deleteResident = async (id: string) => {
    if (currentUser?.role !== 'admin') return;

    try {
      const resident = residents.find(r => r.id === id);
      if (resident?.userId) {
        await deleteDoc(doc(db, 'users', resident.userId));
      }

      await deleteDoc(doc(db, 'residents', id));

      // Remove related payments in Firestore
      const residentPayments = payments.filter(p => p.residentId === id);
      for (const p of residentPayments) {
        await deleteDoc(doc(db, 'payments', p.id));
      }

      setResidents(prev => {
        const updated = prev.filter(r => r.id !== id);
        localStorage.setItem('app_residents', JSON.stringify(updated));
        return updated;
      });

      setPayments(prev => {
        const updated = prev.filter(p => p.residentId !== id);
        localStorage.setItem('app_payments', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `residents/${id}`);
    }
  };

  const addNotification = async (title: string, message: string) => {
    const newNotif: AppNotification = {
      id: `n_${generateId()}`,
      title,
      message,
      date: new Date().toISOString(),
      read: false
    };

    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      setNotifications(prev => [newNotif, ...prev]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${newNotif.id}`);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const updateBankAccount = async (newBankAccount: BankAccount) => {
    try {
      await setDoc(doc(db, 'settings', 'bankAccount'), newBankAccount);
      setBankAccount(newBankAccount);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/bankAccount');
    }
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
