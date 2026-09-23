import { Resident, Payment } from './types';

export const initialResidents: Resident[] = [
  { id: 'r1', name: 'Budi Santoso', propertyType: 'Perumahan', block: 'A', houseNumber: '01', phone: '081234567890', joinDate: '2023-01-15' },
  { id: 'r2', name: 'Siti Aminah', propertyType: 'Perumahan', block: 'A', houseNumber: '02', phone: '081234567891', joinDate: '2023-02-10' },
  { id: 'r3', name: 'Andi Wijaya', propertyType: 'Perumahan', block: 'B', houseNumber: '01', phone: '081234567892', joinDate: '2023-03-05' },
  { id: 'r4', name: 'Dewi Lestari', propertyType: 'Perumahan', block: 'B', houseNumber: '02', phone: '081234567893', joinDate: '2023-04-20' },
  { id: 'r5', name: 'Reza Rahardian', propertyType: 'Perumahan', block: 'C', houseNumber: '05', phone: '081234567894', joinDate: '2023-05-12' },
  { id: 'r6', name: 'Maya Sari', propertyType: 'Perumahan', block: 'C', houseNumber: '06', phone: '081234567895', joinDate: '2023-06-08' },
  { id: 'r7', name: 'Hendra Gunawan', propertyType: 'Perumahan', block: 'D', houseNumber: '10', phone: '081234567896', joinDate: '2023-07-22' },
  { id: 'r8', name: 'Nina Zatulini', propertyType: 'Perumahan', block: 'D', houseNumber: '11', phone: '081234567897', joinDate: '2023-08-30' },
];

const generateInitialPayments = (): Payment[] => {
  const payments: Payment[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // Base dues amount
  const DUES_AMOUNT = 150000;

  // Generate payments for the last 4 months for most residents
  for (let i = 0; i < 4; i++) {
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    initialResidents.forEach(resident => {
      // Simulate some unpaid dues:
      // Resident r8 is always 2 months behind
      if (resident.id === 'r8' && i < 2) return;
      
      // Resident r3 hasn't paid current month yet
      if (resident.id === 'r3' && i === 0) return;

      // Resident r7 is spotty, missed previous month
      if (resident.id === 'r7' && i === 1) return;

      payments.push({
        id: `p_${resident.id}_${targetYear}_${targetMonth}`,
        residentId: resident.id,
        amount: DUES_AMOUNT,
        date: new Date(targetYear, targetMonth - 1, 5 + parseInt(resident.id.replace('r', ''))).toISOString(),
        month: targetMonth,
        year: targetYear,
      });
    });
  }
  
  return payments;
};

export const initialPayments = generateInitialPayments();
