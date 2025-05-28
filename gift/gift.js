// File: gift.js
let isSubmitting = false;
let lastSubmitTime = 0;

function showStatus(message, type) {
// Lấy phần tử chứa trạng thái
const statusContainer = document.getElementById('statusContainer');

// Làm mới nội dung container (xóa các thông báo cũ)
statusContainer.innerHTML = '';

// Lấy thời gian hiện tại
const timestamp = new Date().toLocaleString('vi-VN', { 
hour12: false, 
hour: '2-digit', 
minute: '2-digit', 
second: '2-digit' 
});

// Tạo phần tử thông báo mới
const statusMessage = document.createElement('div');
statusMessage.className = `status-message ${type}`;
statusMessage.innerHTML = `<strong>${timestamp}</strong>: ${message}`;

// Thêm thông báo mới vào container
statusContainer.appendChild(statusMessage);
}

function canSubmit() {
  const now = Date.now();
  if (now - lastSubmitTime < 2500) {
    showStatus(`Vui lòng đợi ${Math.ceil((2500 - (now - lastSubmitTime)) / 1000)} giây...`, 'error');
    return false;
  }
  lastSubmitTime = now;
  return true;
}

function sendGiftToSheet(sheetName) {
  if (isSubmitting || !canSubmit()) return;

  const giftLink = document.getElementById('giftLink').value.trim();
  const giftType = document.getElementById('giftTypeCustom').value.trim();

  if (!giftLink) {
    showStatus('Vui lòng nhập link gift!', 'error');
    return;
  }

  isSubmitting = true;
  document.querySelectorAll('button').forEach(btn => btn.disabled = true);
  showStatus('Đang gửi dữ liệu...', '');

  const params = new URLSearchParams({
    sheet: sheetName,
    type: giftType,
    link: giftLink
  });

  fetch(scriptURL + "?" + params.toString(), { method: 'GET' })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.text();
    })
    .then(data => {
      showStatus('✅ Lưu gift thành công!', 'success');
      document.getElementById('giftLink').value = '';
    })
    .catch(error => {
      console.error('Lỗi gửi dữ liệu:', error);
      showStatus(`❌ Gửi dữ liệu thất bại: ${error.message}`, 'error');
    })
    .finally(() => {
      isSubmitting = false;
      document.querySelectorAll('button').forEach(btn => btn.disabled = false);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.gift-type-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.gift-type-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('giftTypeCustom').value = this.dataset.value;
    });
  });
});