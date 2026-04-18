document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. KIỂM TRA QUYỀN
    // ==========================================
    if (typeof checkAuth === 'function') {
        checkAuth('ADMIN');
    }

    // ==========================================
    // 2. LOGIC CHUYỂN TAB SIDEBAR
    // ==========================================
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const headerTitle = document.getElementById('header-title');

    const tabTitles = {
        'dashboard': 'Tổng quan Hệ thống',
        'users': 'Quản lý Người dùng',
        'pricing': 'Cấu hình Giá vé',
        'sync': 'Đồng bộ Dữ liệu DATACORE',
        'reports': 'Trích xuất Báo cáo'
    };

    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Ẩn tất cả nội dung Tab, hiện Tab được chọn
            tabContents.forEach(content => {
                if (content.id === `tab-${targetTab}`) {
                    content.classList.remove('hidden');
                    content.classList.add('block');
                } else {
                    content.classList.remove('block');
                    content.classList.add('hidden');
                }
            });

            // Reset CSS tất cả các nút Menu
            sidebarBtns.forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
                b.classList.add('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
            });

            // Làm nổi bật nút Menu đang chọn
            btn.classList.remove('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
            btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');

            // Cập nhật tiêu đề Header
            if (headerTitle) {
                headerTitle.innerText = tabTitles[targetTab];
            }
        });
    });

    // ==========================================
    // 3. ĐĂNG XUẤT
    // ==========================================
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if(typeof logout === 'function') logout();
            else window.location.href = 'login.html';
        });
    }

    // ==========================================
    // 4. LOGIC ĐỒNG BỘ DATACORE (Chỉ ẩn/hiện element)
    // ==========================================
    const btnSyncDefault = document.getElementById('sync-btn-default');
    const btnSyncLoading = document.getElementById('sync-btn-loading');
    const btnSyncSuccess = document.getElementById('sync-btn-success');

    if (btnSyncDefault) {
        btnSyncDefault.addEventListener('click', () => {
            // Ẩn nút mặc định, hiện nút Loading
            btnSyncDefault.classList.add('hidden');
            btnSyncLoading.classList.remove('hidden');
            
            // Đợi 2s giả lập tải dữ liệu, chuyển sang nút Success
            setTimeout(() => {
                btnSyncLoading.classList.add('hidden');
                btnSyncSuccess.classList.remove('hidden');
                
                // Đợi thêm 3s trả về trạng thái ban đầu
                setTimeout(() => {
                    btnSyncSuccess.classList.add('hidden');
                    btnSyncDefault.classList.remove('hidden');
                }, 3000);
            }, 2000);
        });
    }

    // ==========================================
    // 5. LOGIC XUẤT BÁO CÁO (Validate Ngày tháng)
    // ==========================================
    const reportForm = document.getElementById('report-form');
    const reportErrorAlert = document.getElementById('report-error-alert');
    const btnGenDefault = document.getElementById('btn-generate-default');
    const btnGenLoading = document.getElementById('btn-generate-loading');
    const downloadModal = document.getElementById('download-modal');
    const btnCloseDownload = document.getElementById('btn-close-download');

    if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Ẩn lỗi cũ đi (nếu có)
            reportErrorAlert.classList.add('hidden');

            const startDate = new Date(document.getElementById('start-date').value);
            const endDate = new Date(document.getElementById('end-date').value);

            // Bắt lỗi: Ngày bắt đầu > Ngày kết thúc
            if (startDate > endDate) {
                // Hiện cục HTML báo lỗi đã có sẵn bên UI
                reportErrorAlert.classList.remove('hidden');
                return;
            }

            // Hợp lệ -> Ẩn nút tạo bình thường, hiện nút Đang xử lý
            btnGenDefault.classList.add('hidden');
            btnGenLoading.classList.remove('hidden');
            
            setTimeout(() => {
                // Trả lại nút bình thường và mở Popup tải file
                btnGenLoading.classList.add('hidden');
                btnGenDefault.classList.remove('hidden');
                downloadModal.classList.remove('hidden');
            }, 1500);
        });
    }

    if (btnCloseDownload) {
        btnCloseDownload.addEventListener('click', () => {
            downloadModal.classList.add('hidden');
        });
    }

    // ==========================================
    // 6. VẼ BIỂU ĐỒ (CHART.JS)
    // *Lưu ý: Chart.js dùng JS API vẽ lên thẻ canvas nên phải truyền mã màu tại đây.
    // ==========================================
    const ctxRevenue = document.getElementById('revenueChart');
    if (ctxRevenue) {
        new Chart(ctxRevenue, {
            type: 'bar',
            data: {
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                datasets: [{
                    label: 'Khách vãng lai',
                    data: [1.2, 1.5, 1.8, 1.4, 2.0, 3.5, 4.2],
                    backgroundColor: '#93c5fd', // Mã màu JS đồ họa
                    borderRadius: 4
                }, {
                    label: 'Sinh viên (BKPay)',
                    data: [5.0, 5.2, 4.8, 5.5, 6.0, 2.5, 1.5],
                    backgroundColor: '#2563eb', // Mã màu JS đồ họa
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
            }
        });
    }

    const ctxTraffic = document.getElementById('trafficChart');
    if (ctxTraffic) {
        new Chart(ctxTraffic, {
            type: 'line',
            data: {
                labels: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00'],
                datasets: [{
                    label: 'Lượt Xe Vào',
                    data: [50, 450, 300, 150, 280, 120],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2, fill: true, tension: 0.4
                }, {
                    label: 'Lượt Xe Ra',
                    data: [20, 100, 150, 400, 200, 500],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2, fill: true, tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
            }
        });
    }
});