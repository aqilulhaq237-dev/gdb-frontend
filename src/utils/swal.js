import Swal from 'sweetalert2';

// ==================== SWEET ALERT HELPER ====================

// Sukses
export const swalSukses = (title, text) => {
  return Swal.fire({
    icon: 'success',
    title: title || 'Berhasil!',
    text: text || '',
    confirmButtonText: 'OK',
    confirmButtonColor: '#2E7D32',
    customClass: {
      popup: 'rounded-4',
      confirmButton: 'rounded-3',
    }
  });
};

// Error
export const swalError = (title, text) => {
  return Swal.fire({
    icon: 'error',
    title: title || 'Gagal!',
    text: text || '',
    confirmButtonText: 'OK',
    confirmButtonColor: '#C62828',
    customClass: {
      popup: 'rounded-4',
      confirmButton: 'rounded-3',
    }
  });
};

// Peringatan
export const swalWarning = (title, text) => {
  return Swal.fire({
    icon: 'warning',
    title: title || 'Perhatian!',
    text: text || '',
    confirmButtonText: 'OK',
    confirmButtonColor: '#E65100',
    customClass: {
      popup: 'rounded-4',
      confirmButton: 'rounded-3',
    }
  });
};

// Info
export const swalInfo = (title, text) => {
  return Swal.fire({
    icon: 'info',
    title: title || 'Informasi',
    text: text || '',
    confirmButtonText: 'OK',
    confirmButtonColor: '#1565C0',
    customClass: {
      popup: 'rounded-4',
      confirmButton: 'rounded-3',
    }
  });
};

// Konfirmasi Hapus
export const swalHapus = (text) => {
  return Swal.fire({
    icon: 'question',
    title: 'Yakin ingin menghapus?',
    text: text || 'Data yang dihapus tidak dapat dikembalikan.',
    showCancelButton: true,
    confirmButtonText: '🗑️ Ya, Hapus',
    cancelButtonText: '❌ Batal',
    confirmButtonColor: '#C62828',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-4',
      confirmButton: 'rounded-3',
      cancelButton: 'rounded-3',
    }
  });
};

// Konfirmasi Simpan
export const swalSimpan = (text) => {
  return Swal.fire({
    icon: 'question',
    title: 'Simpan perubahan?',
    text: text || 'Apakah Anda yakin ingin menyimpan perubahan ini?',
    showCancelButton: true,
    confirmButtonText: '💾 Ya, Simpan',
    cancelButtonText: '❌ Batal',
    confirmButtonColor: '#1565C0',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-4',
      confirmButton: 'rounded-3',
      cancelButton: 'rounded-3',
    }
  });
};

// Loading
export const swalLoading = (title) => {
  Swal.fire({
    title: title || 'Memproses...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      popup: 'rounded-4',
    }
  });
};

// Tutup Loading
export const swalClose = () => {
  Swal.close();
};