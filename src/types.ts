export interface Resident {
  id: string;
  name: string;
  propertyType: 'Perumahan' | 'Ruko';
  houseNumber: string;
  phone?: string;
  joinDate: string;
  userId?: string;
  monthlyDues?: number;
}

export interface Payment {
  id: string;
  residentId: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  proofOfPayment?: string;
  status?: 'pending' | 'verified';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalCollected: number;
  expectedTotal: number;
  paidCount: number;
  unpaidCount: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  month: number;
  year: number;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export type UserRole = 'admin' | 'resident';

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  residentId?: string; // If role is resident, link to resident record
}
