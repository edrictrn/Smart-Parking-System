let revenueChart = null;
let trafficChart = null;
let currentBillingCycle = null;

const ROLE_OPTIONS = ['Learner', 'Faculty', 'Staff', 'ParkingOperator', 'Admin'];
const SLOT_STATUS_OPTIONS = ['EMPTY', 'OCCUPIED', 'UNKNOWN', 'OUT_OF_SERVICE'];

const statusMeta = {
    EMPTY: { label: 'Trống', cls: 'bg-green-100 text-green-700 border-green-200' },
    OCCUPIED: { label: 'Đang đỗ', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    UNKNOWN: { label: 'Không xác định', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    OUT_OF_SERVICE: { label: 'Ngưng hoạt động', cls: 'bg-red-100 text-red-700 border-red-200' }
};

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth('ADMIN');

    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const headerTitle = document.getElementById('header-title');
    const tabTitles = {
        dashboard: 'Tổng quan Hệ thống',
        slots: 'Trạng thái Bãi xe',
        users: 'Quản lý Người dùng',
        pricing: 'Cấu hình Giá vé',
        sync: 'Đồng bộ Dữ liệu DATACORE',
        reports: 'Trích xuất Báo cáo'
    };

    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetTab = btn.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.classList.toggle('hidden', content.id !== `tab-${targetTab}`);
                content.classList.toggle('block', content.id === `tab-${targetTab}`);
            });
            sidebarBtns.forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
                b.classList.add('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
            });
            btn.classList.remove('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
            btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
            if (headerTitle) headerTitle.innerText = tabTitles[targetTab] || 'IoT-SPMS';

            if (targetTab === 'slots') await loadSlots();
            if (targetTab === 'users') await loadUsers();
            if (targetTab === 'pricing') await loadPricing();
        });
    });

    document.getElementById('btn-logout')?.addEventListener('click', logout);
    document.getElementById('btn-refresh-slots')?.addEventListener('click', loadSlots);

    const adminName = document.getElementById('admin-display-name');
    const adminRole = document.getElementById('admin-display-role');
    if (adminName) adminName.innerText = sessionStorage.getItem('fullName') || 'System Administrator';
    if (adminRole) adminRole.innerText = sessionStorage.getItem('roleLabel') || sessionStorage.getItem('userRole') || 'Admin';

    bindSyncButton();
    bindPricingButton();
    bindMonthlyBillingButton();
    bindReportForm();
    bindHardwareSimulator();

    await Promise.allSettled([loadDashboard(), loadUsers(), loadPricing(), loadSlots()]);

    // FIX: Auto-refresh dashboard mỗi 30s để chart cập nhật ngay khi learner thanh toán
    setInterval(async () => {
        await loadDashboard();
        updateLastRefreshedLabel();
    }, 30000);
    updateLastRefreshedLabel();
});

function updateLastRefreshedLabel() {
    const el = document.getElementById('dashboard-last-refresh');
    if (el) el.innerText = new Date().toLocaleTimeString('vi-VN');
}

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
}

function formatDateTime(value) {
    if (!value) return 'Chưa có dữ liệu';
    return new Date(value).toLocaleString('vi-VN');
}

function formatStatus(status) {
    const map = {
        Active: 'Đang hoạt động',
        Closed: 'Đã đóng',
        Lost: 'Mất vé',
        Cancelled: 'Đã hủy',
        Parked: 'Đang đậu xe',
        Completed: 'Đã hoàn thành',
        Paid: 'Đã thanh toán',
        PaymentReady: 'Chờ thanh toán',
        Pending: 'Đang chờ',
        Failed: 'Thất bại'
    };
    return map[status] || status || 'Không rõ';
}

function roleBadge(role) {
    const colors = {
        Learner: 'bg-blue-100 text-blue-700',
        Faculty: 'bg-purple-100 text-purple-700',
        Staff: 'bg-emerald-100 text-emerald-700',
        ParkingOperator: 'bg-orange-100 text-orange-700',
        Admin: 'bg-red-100 text-red-700',
        Visitor: 'bg-gray-100 text-gray-700'
    };
    return `<span class="${colors[role] || 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full text-xs font-bold">${role}</span>`;
}

function slotBadge(status) {
    const meta = statusMeta[status] || statusMeta.UNKNOWN;
    return `<span class="${meta.cls} border px-2 py-1 rounded-full text-xs font-bold">${meta.label}</span>`;
}

async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/dashboard`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        document.getElementById('dashboard-revenue').innerText = formatCurrency(data.data.revenue);
        const revenueLabel = document.getElementById('dashboard-revenue-label');
        if (revenueLabel && data.data.revenuePeriod) revenueLabel.innerText = `Doanh thu kỳ ${data.data.revenuePeriod}`;
        document.getElementById('dashboard-learner-debt').innerText = formatCurrency(data.data.learnerOutstandingDebt);
        document.getElementById('dashboard-entries').innerText = `${data.data.todayEntries || 0} vào / ${data.data.todayExits || 0} ra`;
        document.getElementById('dashboard-sensor-issues').innerText = `${data.data.sensorIssues} / ${data.data.totalSlots} thiết bị`;
        document.getElementById('dashboard-sync').innerText = data.data.lastDataCoreSync ? formatDateTime(data.data.lastDataCoreSync) : 'Chưa sync trong phiên này';

        updateCharts(data.data.charts || {});
    } catch (err) {
        console.warn('Không tải được dashboard:', err.message);
    }
}

function updateCharts(charts) {
    const revenueLabels = charts.revenueLabels || [];
    const revenueByDay = charts.revenueByDay || [];
    const trafficLabels = charts.trafficLabels || [];
    const trafficInByHour = charts.trafficInByHour || charts.trafficByHour || [];
    const trafficOutByHour = charts.trafficOutByHour || [];

    const ctxRevenue = document.getElementById('revenueChart');
    if (ctxRevenue) {
        if (!revenueChart) {
            revenueChart = new Chart(ctxRevenue, {
                type: 'bar',
                data: {
                    labels: revenueLabels,
                    datasets: [{ label: 'Doanh thu đã thanh toán theo ngày', data: revenueByDay, backgroundColor: '#2563eb', borderRadius: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
            });
        } else {
            revenueChart.data.labels = revenueLabels;
            revenueChart.data.datasets[0].data = revenueByDay;
            revenueChart.update();
        }
    }

    const ctxTraffic = document.getElementById('trafficChart');
    if (ctxTraffic) {
        const trafficDatasets = [
            { label: 'Lượt xe vào hôm nay', data: trafficInByHour, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.10)', borderWidth: 2, fill: false, tension: 0.4 },
            { label: 'Lượt xe ra hôm nay', data: trafficOutByHour, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.10)', borderWidth: 2, fill: false, tension: 0.4 }
        ];
        if (!trafficChart) {
            trafficChart = new Chart(ctxTraffic, {
                type: 'line',
                data: { labels: trafficLabels, datasets: trafficDatasets },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
            });
        } else {
            trafficChart.data.labels = trafficLabels;
            trafficChart.data.datasets = trafficDatasets;
            trafficChart.update();
        }
    }
}

async function loadSlots() {
    const summary = document.getElementById('slot-summary');
    const container = document.getElementById('slot-zone-container');
    if (!container) return;

    container.innerHTML = `<p class="text-gray-500 text-center">Đang tải dữ liệu slot...</p>`;
    try {
        const res = await fetch(`${API_BASE}/api/slots/all`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const slots = data.data || [];
        const counts = SLOT_STATUS_OPTIONS.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
        const zones = {};
        slots.forEach(slot => {
            counts[slot.status] = (counts[slot.status] || 0) + 1;
            const zone = slot.zone || 'Không rõ khu';
            if (!zones[zone]) zones[zone] = [];
            zones[zone].push(slot);
        });

        if (summary) {
            summary.innerHTML = SLOT_STATUS_OPTIONS.map(status => {
                const meta = statusMeta[status] || statusMeta.UNKNOWN;
                return `<div class="rounded-xl border ${meta.cls} p-4">
                    <p class="text-xs font-bold uppercase">${meta.label}</p>
                    <p class="text-2xl font-black mt-1">${counts[status] || 0}</p>
                </div>`;
            }).join('');
        }

        if (!slots.length) {
            container.innerHTML = `<p class="text-gray-500 text-center">Chưa có slot trong database.</p>`;
            return;
        }

        container.innerHTML = Object.entries(zones).map(([zone, zoneSlots]) => `
            <section class="border border-gray-200 rounded-xl overflow-hidden">
                <div class="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                    <h4 class="font-bold text-gray-800">${zone}</h4>
                    <span class="text-sm text-gray-500">${zoneSlots.length} slot</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                    ${zoneSlots.map(slot => `
                        <div class="border rounded-xl p-4 bg-white shadow-sm">
                            <div class="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <p class="text-xs text-gray-500 font-semibold">Slot ID</p>
                                    <p class="text-xl font-black text-gray-900">#${slot.slot_id}</p>
                                </div>
                                ${slotBadge(slot.status)}
                            </div>
                            <p class="text-sm text-gray-600 mb-1"><strong>Sensor:</strong> ${slot.sensor_mac || 'N/A'}</p>
                            <p class="text-xs text-gray-400 mb-3">Cập nhật: ${formatDateTime(slot.last_updated)}</p>
                            <div class="flex gap-2">
                                <select id="slot-status-${slot.slot_id}" class="flex-1 border border-gray-300 rounded px-2 py-2 text-sm">
                                    ${SLOT_STATUS_OPTIONS.map(status => `<option value="${status}" ${status === slot.status ? 'selected' : ''}>${status}</option>`).join('')}
                                </select>
                                <button class="btn-slot-update bg-gray-900 hover:bg-black text-white px-3 rounded font-bold" data-slot-id="${slot.slot_id}">Lưu</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `).join('');

        document.querySelectorAll('.btn-slot-update').forEach(btn => {
            btn.addEventListener('click', async () => {
                const slotID = btn.dataset.slotId;
                const select = document.getElementById(`slot-status-${slotID}`);
                await updateSlotStatus(slotID, select.value);
            });
        });
    } catch (err) {
        container.innerHTML = `<p class="text-red-600 text-center font-semibold">${err.message}</p>`;
    }
}

async function updateSlotStatus(slotID, status) {
    try {
        const res = await fetch(`${API_BASE}/api/admin/slots/${slotID}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, reason: 'Admin dashboard manual override' })
        });
        const data = await res.json();
        alert(data.success ? `✅ ${data.message}` : `❌ ${data.message}`);
        await Promise.allSettled([loadSlots(), loadDashboard()]);
    } catch (err) {
        alert('Lỗi kết nối Server!');
    }
}

async function loadUsers() {
    const tbody = document.querySelector('#tab-users tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">Đang tải dữ liệu...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/api/admin/users`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!data.data.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">Chưa có người dùng</td></tr>`;
            return;
        }

        tbody.innerHTML = data.data.map(user => `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-4 font-medium">${user.student_id}</td>
                <td class="p-4 font-bold text-gray-900">${user.full_name}</td>
                <td class="p-4">${user.email}</td>
                <td class="p-4">${roleBadge(user.role)}</td>
                <td class="p-4 text-sm text-gray-600">${user.license_plate || 'Chưa có'}</td>
                <td class="p-4 font-bold ${Number(user.debt || 0) > 0 ? 'text-amber-700' : 'text-gray-400'}">${formatCurrency(user.debt || 0)}</td>
                <td class="p-4">
                    <div class="flex gap-2 min-w-[220px]">
                        <select id="role-${user.student_id}" class="border border-gray-300 rounded px-2 py-2 text-sm flex-1">
                            ${ROLE_OPTIONS.map(role => `<option value="${role}" ${role === user.role ? 'selected' : ''}>${role}</option>`).join('')}
                        </select>
                        <button class="btn-role-update bg-blue-600 hover:bg-blue-700 text-white px-3 rounded font-bold" data-student-id="${user.student_id}">Lưu</button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.btn-role-update').forEach(btn => {
            btn.addEventListener('click', async () => {
                const studentID = btn.dataset.studentId;
                const role = document.getElementById(`role-${studentID}`).value;
                await updateUserRole(studentID, role);
            });
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-600">${err.message}</td></tr>`;
    }
}

async function updateUserRole(studentID, role) {
    try {
        const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(studentID)}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        const data = await res.json();
        alert(data.success ? `✅ ${data.message}` : `❌ ${data.message}`);
        await loadUsers();
    } catch (err) {
        alert('Lỗi kết nối Server!');
    }
}

async function loadPricing() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/pricing`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        currentBillingCycle = data.data.billingCycle;
        document.getElementById('input-price-learner').value = data.data.priceLearnerMonthly ?? data.data.priceLearner;
        document.getElementById('input-price-visitor').value = data.data.priceVisitor;
        document.getElementById('input-price-faculty').value = data.data.priceFaculty;
        document.getElementById('input-price-staff').value = data.data.priceStaff;
    } catch (err) {
        console.warn('Không tải được pricing:', err.message);
    }
}

function bindSyncButton() {
    const btnSyncDefault = document.getElementById('sync-btn-default');
    const btnSyncLoading = document.getElementById('sync-btn-loading');
    const btnSyncSuccess = document.getElementById('sync-btn-success');

    btnSyncDefault?.addEventListener('click', async () => {
        btnSyncDefault.classList.add('hidden');
        btnSyncLoading?.classList.remove('hidden');
        try {
            const res = await fetch(`${API_BASE}/api/sync/datacore`, { method: 'POST' });
            const data = await res.json();
            btnSyncLoading?.classList.add('hidden');
            if (data.success) {
                btnSyncSuccess.innerHTML = `<i class="ph-bold ph-check"></i> ${data.message}`;
                btnSyncSuccess.classList.remove('hidden');
                await Promise.allSettled([loadUsers(), loadDashboard()]);
                setTimeout(() => {
                    btnSyncSuccess.classList.add('hidden');
                    btnSyncDefault.classList.remove('hidden');
                }, 2500);
            } else {
                alert('Đồng bộ thất bại: ' + data.message);
                btnSyncDefault.classList.remove('hidden');
            }
        } catch (err) {
            btnSyncLoading?.classList.add('hidden');
            btnSyncDefault.classList.remove('hidden');
            alert('Lỗi kết nối Server!');
        }
    });
}

function bindPricingButton() {
    const btnSavePricing = document.getElementById('btn-save-pricing');
    btnSavePricing?.addEventListener('click', async () => {
        const payload = {
            priceLearnerMonthly: Number(document.getElementById('input-price-learner').value),
            priceVisitor: Number(document.getElementById('input-price-visitor').value),
            priceFaculty: Number(document.getElementById('input-price-faculty').value),
            priceStaff: Number(document.getElementById('input-price-staff').value)
        };

        if (Object.values(payload).some(v => !Number.isFinite(v) || v < 0)) {
            alert('Vui lòng nhập giá hợp lệ và không âm!');
            return;
        }

        const originalText = btnSavePricing.innerText;
        btnSavePricing.innerText = 'Đang lưu...';
        btnSavePricing.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/api/admin/pricing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            alert(data.success ? `✅ ${data.message}` : `❌ ${data.message}`);
            await loadPricing();
        } catch (err) {
            alert('Lỗi kết nối Server!');
        } finally {
            btnSavePricing.innerText = originalText;
            btnSavePricing.disabled = false;
        }
    });
}

function bindMonthlyBillingButton() {
    const btnGenerate = document.getElementById('btn-generate-monthly');
    const billingMsg = document.getElementById('billing-msg');
    btnGenerate?.addEventListener('click', async () => {
        const cycle = currentBillingCycle || new Date().toISOString().slice(0, 7);
        const confirmed = confirm(`Tạo công nợ tháng ${cycle} cho toàn bộ Learner?\nHệ thống sẽ bỏ qua learner đã có bill trong tháng này.`);
        if (!confirmed) return;

        btnGenerate.disabled = true;
        const originalText = btnGenerate.innerText;
        btnGenerate.innerText = 'Đang tạo công nợ...';
        if (billingMsg) billingMsg.innerText = '';

        try {
            const res = await fetch(`${API_BASE}/api/admin/billing/generate-monthly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billingCycle: cycle })
            });
            const data = await res.json();
            if (billingMsg) {
                billingMsg.className = `text-sm font-semibold text-center mt-3 ${data.success ? 'text-green-600' : 'text-red-600'}`;
                billingMsg.innerText = data.message;
            }
            await Promise.allSettled([loadUsers(), loadDashboard()]);
        } catch (err) {
            if (billingMsg) {
                billingMsg.className = 'text-sm font-semibold text-center mt-3 text-red-600';
                billingMsg.innerText = 'Lỗi kết nối Server!';
            }
        } finally {
            btnGenerate.disabled = false;
            btnGenerate.innerText = originalText;
        }
    });
}

function bindReportForm() {
    const reportForm = document.getElementById('report-form');
    const reportErrorAlert = document.getElementById('report-error-alert');
    const btnGenDefault = document.getElementById('btn-generate-default');
    const btnGenLoading = document.getElementById('btn-generate-loading');
    const downloadModal = document.getElementById('download-modal');
    const btnCloseDownload = document.getElementById('btn-close-download');

    const endInput = document.getElementById('end-date');
    const startInput = document.getElementById('start-date');
    if (endInput && startInput && !endInput.value && !startInput.value) {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 6);
        endInput.value = today.toISOString().slice(0, 10);
        startInput.value = start.toISOString().slice(0, 10);
    }

    reportForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        reportErrorAlert?.classList.add('hidden');
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const reportType = document.getElementById('report-type')?.value || 'sessions';
        const reportFormat = document.getElementById('report-format')?.value || 'xls';
        if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
            reportErrorAlert?.classList.remove('hidden');
            return;
        }

        btnGenDefault?.classList.add('hidden');
        btnGenLoading?.classList.remove('hidden');

        try {
            const reportUrl = `${API_BASE}/api/admin/reports?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&reportType=${encodeURIComponent(reportType)}&format=${encodeURIComponent(reportFormat)}`;

            // PDF: open in a new tab; the page auto-triggers print dialog where user can save as PDF.
            if (reportFormat === 'pdf') {
                const newTab = window.open(reportUrl, '_blank');
                if (!newTab) {
                    alert('Trình duyệt đang chặn pop-up. Hãy cho phép pop-up cho trang này rồi thử lại.');
                } else {
                    downloadModal?.classList.remove('hidden');
                }
                return;
            }

            const res = await fetch(reportUrl);
            if (!res.ok) throw new Error('Không tạo được báo cáo');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const extensionMap = { csv: 'csv', xls: 'xls', excel: 'xls', html: 'html' };
            const ext = extensionMap[reportFormat] || 'xls';
            const link = document.createElement('a');
            link.href = url;
            link.download = `iot-spms-${reportType}-report-${startDate}-${endDate}.${ext}`;
            link.click();
            URL.revokeObjectURL(url);
            downloadModal?.classList.remove('hidden');
        } catch (err) {
            alert(err.message);
        } finally {
            btnGenLoading?.classList.add('hidden');
            btnGenDefault?.classList.remove('hidden');
        }
    });

    btnCloseDownload?.addEventListener('click', () => downloadModal?.classList.add('hidden'));
}

function bindHardwareSimulator() {
    const msg = document.getElementById('sim-msg');
    const resultBox = document.getElementById('sim-ticket-result');
    const setMsg = (text, ok = true) => {
        if (!msg) return;
        msg.innerText = text;
        msg.className = `mt-3 text-sm font-semibold text-center ${ok ? 'text-green-600' : 'text-red-600'}`;
    };

    const renderTicketLookup = (payload) => {
        if (!resultBox) return;
        const data = payload?.data;
        if (!payload?.success || !data) {
            resultBox.classList.remove('hidden');
            resultBox.innerHTML = `<div class="text-red-600 font-bold">Không tìm thấy dữ liệu vé/giao dịch.</div>`;
            return;
        }

        const ticket = data.ticket;
        const session = data.sessions?.[0];
        const tx = data.transactions?.[0];
        const linked = data.linkedUser;
        const objectText = linked
            ? `${linked.full_name} (${linked.student_id}) - Quên thẻ`
            : 'Khách vãng lai';

        resultBox.classList.remove('hidden');
        resultBox.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-3">
                <div class="font-extrabold text-gray-800">Kết quả tra cứu vé</div>
                <span class="px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${formatStatus(ticket.status)}</span>
            </div>
            <div class="grid grid-cols-1 gap-2 text-gray-700">
                <div><b>Mã vé:</b> <span class="font-mono text-blue-700">${ticket.ticket_code}</span></div>
                <div><b>Đối tượng:</b> ${objectText}</div>
                <div><b>Khu/slot:</b> ${ticket.zone || session?.zone || 'N/A'} - Slot ${ticket.slot_id || session?.slot_id || 'N/A'}</div>
                <div><b>Giờ vào:</b> ${formatDateTime(session?.check_in_time || ticket.issued_at)}</div>
                <div><b>Giờ ra:</b> ${formatDateTime(session?.check_out_time || ticket.closed_at)}</div>
                <div><b>Trạng thái phiên:</b> ${formatStatus(session?.status)}</div>
                <div><b>Số tiền:</b> ${formatCurrency(tx?.amount || ticket.fee_paid || session?.fee_calculated || 0)}</div>
                <div><b>Giao dịch:</b> ${tx ? `#${tx.transaction_id} - ${formatStatus(tx.status)} - ${tx.bkpay_ref_id || 'N/A'}` : 'Chưa phát sinh giao dịch thanh toán'}</div>
            </div>
        `;
    };

    const lookupTicket = async (ticketCode) => {
        if (!ticketCode) {
            setMsg('Cần nhập hoặc sinh mã vé tạm để tra cứu.', false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/visitor/lookup/${encodeURIComponent(ticketCode)}`);
            const data = await res.json();
            renderTicketLookup(data);
            setMsg(data.success ? '✅ Đã tra cứu thông tin vé/giao dịch.' : `❌ ${data.message}`, data.success);
        } catch (err) {
            setMsg('Lỗi kết nối server khi tra cứu vé!', false);
        }
    };

    document.getElementById('btn-sim-entry')?.addEventListener('click', async () => {
        const studentID = document.getElementById('sim-mssv').value.trim();
        const slotID = document.getElementById('sim-slot').value.trim();
        if (!studentID || !slotID) return setMsg('Cần nhập MSSV/Mã cán bộ và slot.', false);
        try {
            const res = await fetch(`${API_BASE}/api/gate/entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentID, slotID: Number(slotID) })
            });
            const data = await res.json();
            setMsg(data.success ? `✅ ${data.message}` : `❌ ${data.message}`, data.success);
            await Promise.allSettled([loadDashboard(), loadUsers(), loadSlots()]);
        } catch (err) {
            setMsg('Lỗi kết nối server!', false);
        }
    });

    document.getElementById('btn-sim-visitor-entry')?.addEventListener('click', async () => {
        const slotID = document.getElementById('sim-slot').value.trim();
        const studentID = document.getElementById('sim-mssv').value.trim();
        if (!slotID) return setMsg('Cần nhập slot cho vé tạm.', false);
        try {
            const res = await fetch(`${API_BASE}/api/gate/visitor-entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotID: Number(slotID), studentID: studentID || undefined })
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('sim-ticket').value = data.ticketCode;
                setMsg(`✅ ${data.message} Mã vé: ${data.ticketCode}`, true);
                await lookupTicket(data.ticketCode);
            } else {
                setMsg(`❌ ${data.message}`, false);
            }
            await Promise.allSettled([loadDashboard(), loadSlots()]);
        } catch (err) {
            setMsg('Lỗi kết nối server!', false);
        }
    });

    document.getElementById('btn-sim-exit')?.addEventListener('click', async () => {
        const studentID = document.getElementById('sim-mssv').value.trim();
        const ticketCode = document.getElementById('sim-ticket').value.trim();
        if (!studentID && !ticketCode) return setMsg('Cần nhập MSSV/Mã cán bộ hoặc mã vé tạm để xe ra.', false);
        try {
            const res = await fetch(`${API_BASE}/api/gate/exit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketCode ? { ticketCode } : { studentID })
            });
            const data = await res.json();
            setMsg(data.success ? `✅ ${data.message} Phí: ${formatCurrency(data.fee)}` : `❌ ${data.message}`, data.success);
            if (data.success && ticketCode) await lookupTicket(ticketCode);
            await Promise.allSettled([loadDashboard(), loadUsers(), loadSlots()]);
        } catch (err) {
            setMsg('Lỗi kết nối server!', false);
        }
    });

    document.getElementById('btn-sim-ticket-lookup')?.addEventListener('click', async () => {
        const ticketCode = document.getElementById('sim-ticket').value.trim();
        await lookupTicket(ticketCode);
    });
}
