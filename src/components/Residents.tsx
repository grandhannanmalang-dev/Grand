import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../AppContext';
import { Plus, Search, CheckCircle2, XCircle, Trash2, Edit2 } from 'lucide-react';
import { generateId, getMonthName } from '../utils';
import { Resident } from '../types';
import { cn } from './Sidebar'; // Reusing cn utility

export const Residents: React.FC = () => {
  const { residents, payments, addResident, updateResident, deleteResident, currentUser } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    propertyType: 'Perumahan' as 'Perumahan' | 'Ruko',
    houseNumber: '',
    idLogin: '',
    password: '',
    monthlyDues: 150000,
  });

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ name: '', propertyType: 'Perumahan', houseNumber: '', idLogin: '', password: '', monthlyDues: 150000 });
    setIsModalOpen(true);
  };

  const openEditModal = (resident: Resident) => {
    setIsEditMode(true);
    setEditingId(resident.id);
    setFormData({
      name: resident.name,
      propertyType: resident.propertyType,
      houseNumber: resident.houseNumber,
      idLogin: '',
      password: '',
      monthlyDues: resident.monthlyDues || 150000,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteResident(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.propertyType && r.propertyType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    r.houseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && editingId) {
        await updateResident(
          editingId,
          {
            name: formData.name,
            propertyType: formData.propertyType,
            houseNumber: formData.houseNumber,
            monthlyDues: formData.monthlyDues,
          },
          formData.password || undefined
        );
      } else {
        const newResident: Resident = {
          id: `r_${generateId()}`,
          name: formData.name,
          propertyType: formData.propertyType,
          houseNumber: formData.houseNumber,
          joinDate: new Date().toISOString().split('T')[0],
          monthlyDues: formData.monthlyDues,
        };
        await addResident(newResident, formData.idLogin, formData.password);
      }
      setIsModalOpen(false);
      setFormData({ name: '', propertyType: 'Perumahan', houseNumber: '', idLogin: '', password: '', monthlyDues: 150000 });
    } catch (err: any) {
      alert(`Gagal ${isEditMode ? 'mengubah' : 'menambahkan'} warga: ` + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900">Data Warga</h1>
          <p className="text-slate-500 mt-1">Kelola informasi warga dan status pembayaran bulan ini</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Warga
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau nomor properti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto text-sm font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="hidden sm:inline">Tahun:</span>
            <select
              className="bg-transparent font-semibold text-emerald-700 focus:outline-none cursor-pointer py-1"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: 22 }, (_, i) => currentYear - 1 + i).map(y => (
                <option key={y} value={y} className="text-slate-900 font-medium">{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto w-full pb-4">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="px-3 py-3 font-semibold min-w-[140px] max-w-[160px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">Identitas Warga</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i+1} className="px-1 py-3 font-semibold text-center min-w-[40px]">
                    {new Date(0, i).toLocaleString('id-ID', { month: 'short' })}
                  </th>
                ))}
                {currentUser?.role === 'admin' && (
                  <th className="px-3 py-3 font-semibold text-right sticky right-0 bg-slate-50 z-10 border-l border-slate-100 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)]">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResidents.length > 0 ? (
                filteredResidents.map((resident, index) => {
                  return (
                    <motion.tr 
                      key={resident.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors max-w-[160px]">
                        <div className="font-semibold text-sm text-slate-900 truncate">{resident.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{resident.propertyType || 'Perumahan'} - {resident.houseNumber}</div>
                        <div className="text-[10px] font-semibold text-slate-600 mt-1">Rp {(resident.monthlyDues || 150000).toLocaleString('id-ID')}</div>
                      </td>
                      
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        const hasPaidThisMonth = payments.some(
                          p => p.residentId === resident.id && p.month === month && p.year === selectedYear && p.status === 'verified'
                        );
                        
                        return (
                          <td key={month} className="px-1 py-2 text-center border-r border-slate-50 last:border-r-0">
                            {hasPaidThisMonth ? (
                              <div className="flex justify-center" title={`Lunas - Bulan ${month} ${selectedYear}`}>
                                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center" title={`Belum Lunas - Bulan ${month} ${selectedYear}`}>
                                <div className="w-6 h-6 rounded-full bg-rose-50/50 flex items-center justify-center">
                                  <XCircle className="w-3.5 h-3.5 text-rose-300" />
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      
                      {currentUser?.role === 'admin' && (
                        <td className="px-5 py-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-100 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(resident)}
                              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors bg-white rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
                              title="Edit Warga"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(resident.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-white rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100"
                              title="Hapus Warga"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={currentUser?.role === 'admin' ? 14 : 13} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p>Tidak ada data warga ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[100%] sm:max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-display font-semibold text-slate-900">{isEditMode ? 'Edit Data Warga' : 'Tambah Data Warga'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Opsi Properti</label>
                  <select 
                    value={formData.propertyType}
                    onChange={(e) => setFormData({...formData, propertyType: e.target.value as 'Perumahan' | 'Ruko'})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm appearance-none"
                  >
                    <option value="Perumahan">Perumahan</option>
                    <option value="Ruko">Ruko</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Rumah / Ruko</label>
                  <input 
                    required
                    type="text" 
                    value={formData.houseNumber}
                    onChange={(e) => setFormData({...formData, houseNumber: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nominal Iuran Bulanan (Rp)</label>
                <input 
                  required
                  type="number" 
                  value={formData.monthlyDues}
                  onChange={(e) => setFormData({...formData, monthlyDues: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Akun Akses</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ID Pengguna {isEditMode && '(Tidak bisa diubah)'}</label>
                    <input 
                      required={!isEditMode}
                      disabled={isEditMode}
                      type="text" 
                      value={isEditMode ? '********' : formData.idLogin}
                      onChange={(e) => setFormData({...formData, idLogin: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm disabled:opacity-50 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password {isEditMode && '(Kosongkan jika tetap)'}</label>
                    <input 
                      required={!isEditMode}
                      type="text" 
                      value={formData.password}
                      placeholder={isEditMode ? "Biarkan kosong jika tidak diubah" : ""}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors sm:text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm sm:text-sm"
                >
                  {isEditMode ? 'Simpan Perubahan' : 'Simpan Warga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center transform transition-all">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Hapus Warga?</h3>
            <p className="text-slate-500 mb-6">
              Apakah anda yakin ingin menghapus warga ini? Semua riwayat pembayaran yang terkait juga akan ikut terhapus dan tidak bisa dikembalikan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-2.5 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors w-full sm:w-auto"
              >
                BATAL
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors w-full sm:w-auto shadow-sm shadow-rose-200"
              >
                HAPUS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
