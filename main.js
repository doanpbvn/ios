// Hệ thống thông báo
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications');
        this.notifications = [];
    }

    show(title, message, type = 'success', duration = 3000) {
        const notification = this.create(title, message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Tự động xóa sau khoảng thời gian.
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        return notification;
    }

    create(title, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Chức năng nút đóng.
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    remove(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.add('slide-out');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            // Xóa khỏi mảng
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }
}

// Khởi tạo trình quản lý thông báo
const notificationManager = new NotificationManager();

// Hàm sao chép vào clipboard
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            return successful;
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    }
}

// Chức năng sao chép văn bản
// Chờ DOM sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    const copyButtons = document.querySelectorAll('.fa-copy');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Lấy văn bản cần sao chép từ thuộc tính data-text hoặc từ input
            let textToCopy = this.closest('#dataContainer').querySelector('input').value;

            if (!textToCopy) {
                const input = this.parentElement.querySelector('input');
                textToCopy = input ? input.value : '';
            }
            
            if (textToCopy) {
                const success = await copyToClipboard(textToCopy);
                
                if (success) {
                    // Hiển thị thông báo thành công
                    const preview = textToCopy.length > 30 ? 
                        textToCopy.substring(0, 30) + '...' : textToCopy;
                    
                    notificationManager.show('Đã sao chép!','','success',2500);
                    
                    // Hiệu ứng nền
                    this.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
                    
                    setTimeout(() => {this.style.background = '';}, 1000);
                    
                } else {
                    // Hiển thị thông báo lỗi
                    this.style.background = 'linear-gradient(45deg, #f44336, #e53935)';
                    notificationManager.show('Lỗi sao chép','','error',3000);
                }
            }
        });
    });

    // Chức năng hiển thị danh sách sao chép
    function toggleVisibility(button, target, isVisible) {
    isVisible = !isVisible;
    target.classList.toggle('show', isVisible);
    button.textContent = isVisible ? button.dataset.hideText : button.dataset.showText;
    return isVisible;
}

const toggleBtn = document.getElementById('toggleBtn');
const showBtn = document.getElementById('showBtn');
let isVisible = false;

toggleBtn.dataset.showText = 'Hiện Copy Text';
toggleBtn.dataset.hideText = 'Ẩn Copy Text';

toggleBtn.addEventListener('click', function() {
    isVisible = toggleVisibility(this, showBtn, isVisible);
});

const bioBtn = document.getElementById('bioBtn');
const bioShowBtn = document.getElementById('bioShowBtn');
let isVisibleBio = false;

bioBtn.dataset.showText = 'Giới Thiệu';
bioBtn.dataset.hideText = 'Ẩn Bio';

bioBtn.addEventListener('click', function() {
    isVisibleBio = toggleVisibility(this, bioShowBtn, isVisibleBio);
});


});


// Hiệu ứng ripple cho nút bấm
document.addEventListener('DOMContentLoaded', function() {
    // Chọn tất cả nút và liên kết có lớp .textURL
    const buttons = document.querySelectorAll('button, .textURL');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            if (!this.style.position || this.style.position === 'static') {
                this.style.position = 'relative';
            }
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Thêm CSS cho hiệu ứng ripple
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});