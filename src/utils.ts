export const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getMonthName = (month: number) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1] || '';
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Compresses an image file (e.g. up to 3MB or larger) into an optimized
 * base64 JPEG string with a maximum dimension of 1200px and balanced quality.
 * This ensures that proof receipts are legible while keeping document payload size
 * well within Firestore's 1MB limit (~70KB - 130KB).
 */
export const compressImage = (
  file: File,
  maxDimension = 1200,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih harus berupa gambar (JPG, PNG, JPEG, dsb).'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale proportionally if either dimension exceeds maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG
        let compressed = canvas.toDataURL('image/jpeg', quality);

        // If for any edge case base64 length is still > 650KB (~870,000 characters),
        // re-encode with lower quality to strictly guarantee safety under 1MB
        if (compressed.length > 650000) {
          compressed = canvas.toDataURL('image/jpeg', 0.55);
        }

        resolve(compressed);
      };

      img.onerror = () => reject(new Error('Gagal memproses file gambar. Format file mungkin tidak didukung.'));
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
  });
};

/**
 * Recursively removes keys with undefined values to prevent Firestore unsupported field errors.
 */
export const cleanFirestoreData = <T extends Record<string, any>>(obj: T): T => {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = cleanFirestoreData(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result as T;
};
