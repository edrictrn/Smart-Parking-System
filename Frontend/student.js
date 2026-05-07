checkAuth('STUDENT');

let zones = [];
let activeZoneId = null;

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
}

function isFreeStatus(status) {
    return status === 'EMPTY';
}

async function loadParkingSlots() {
    try {
        const response = await fetch(`${API_BASE}/api/slots/all`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const zoneMap = {};
        result.data.forEach(slot => {
            const zoneId = slot.zone || 'UNKNOWN';
            if (!zoneMap[zoneId]) zoneMap[zoneId] = { id: zoneId, name: zoneId, slots: [] };
            zoneMap[zoneId].slots.push(slot);
        });
        zones = Object.values(zoneMap);
        if (zones.length > 0 && activeZoneId === null) activeZoneId = zones[0].id;
        renderParkingData();
    } catch (err) {
        console.error('Lỗi lấy dữ liệu bãi xe:', err);
        document.getElementById('zone-title').innerText = 'Không tải được dữ liệu bãi xe';
    }
}

async function loadHistory() {
    const studentID = sessionStorage.getItem('studentID');
    const tbody = document.querySelector('#tab-history tbody');
    if (!tbody || !studentID) return;

    try {
        const response = await fetch(`${API_BASE}/api/user/history/${studentID}`);
        const result = await response.json();
        const data = result.success ? result.data : [];

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500 font-medium">Chưa có lịch sử gửi xe</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(session => {
            const isActive = session.status !== 'Completed' || !session.check_out_time;
            const statusHtml = buildHistoryStatus(session, isActive);
            const slotLabel = session.slot_id ? `Slot ${session.slot_id}` : 'Chưa gán slot';
            const zoneName = session.parking_slots?.zone || '';
            const rowClass = isActive ? 'border-b bg-yellow-50/40 hover:bg-yellow-50' : 'border-b hover:bg-gray-50';

            return `
                <tr class="${rowClass}">
                    <td class="p-4">${formatDateShort(session.check_in_time)}</td>
                    <td class="p-4 font-medium">${formatTimeShort(session.check_in_time)}</td>
                    <td class="p-4 ${isActive ? 'text-yellow-700 font-semibold' : ''}">${isActive ? 'Đang đậu' : formatTimeShort(session.check_out_time)}</td>
                    <td class="p-4">
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">${slotLabel}</span>
                        ${zoneName ? `<div class="text-xs text-gray-400 mt-1">${zoneName}</div>` : ''}
                    </td>
                    <td class="p-4">${statusHtml}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Lỗi lấy lịch sử:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-600 font-medium">Không tải được lịch sử</td></tr>`;
    }
}

function formatDateShort(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('vi-VN');
}

function formatTimeShort(value) {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function isLearnerAccount() {
    const role = sessionStorage.getItem('userRole') || '';
    return role === 'Learner' || role === 'Student';
}

function buildHistoryStatus(session, isActive) {
    if (isActive) {
        return `<div class="inline-flex flex-col gap-0.5">
            <span class="text-yellow-700 font-bold">● Đang đậu xe</span>
            <span class="text-xs text-yellow-700/80">Chưa ghi nhận giờ ra</span>
        </div>`;
    }

    if (session.source === 'CARD' && isLearnerAccount()) {
        return `<div class="inline-flex flex-col gap-0.5">
            <span class="text-green-600 font-bold">✓ Đã ghi nhận</span>
            <span class="text-xs text-gray-500">Tính trong phí tháng, không cộng theo lượt</span>
        </div>`;
    }

    const fee = Number(session.fee_calculated || 0);
    if (fee > 0) {
        return `<span class="text-green-600 font-bold">✓ Đã thanh toán (${formatCurrency(fee)})</span>`;
    }
    return `<span class="text-gray-600 font-bold">✓ Hoàn thành (miễn phí)</span>`;
}

async function updateDebtDisplay() {
    const studentID = sessionStorage.getItem('studentID');
    if (!studentID) return;

    try {
        const response = await fetch(`${API_BASE}/api/user/debt/${studentID}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        const debt = Number(data.debt || 0);
        sessionStorage.setItem('userDebt', debt);
        const debtDisplay = document.getElementById('debt-display');
        const modalDebtAmount = document.getElementById('modal-debt-amount');
        const btnPay = document.getElementById('btn-pay');
        const noDebtMsg = document.getElementById('no-debt-msg');

        if (debtDisplay) debtDisplay.innerHTML = `${debt.toLocaleString('vi-VN')} <span class="text-lg font-normal">VNĐ</span>`;
        if (modalDebtAmount) modalDebtAmount.innerText = `${debt.toLocaleString('vi-VN')}đ`;

        if (debt === 0) {
            btnPay?.classList.add('hidden');
            noDebtMsg?.classList.remove('hidden');
        } else {
            btnPay?.classList.remove('hidden');
            noDebtMsg?.classList.add('hidden');
        }
    } catch (err) {
        console.error('Lỗi lấy công nợ:', err);
    }
}

function renderParkingData() {
    const zoneTabs = document.getElementById('zone-tabs');
    const zoneTitle = document.getElementById('zone-title');
    const slotsGrid = document.getElementById('slots-grid');
    if (!zoneTabs || !zoneTitle || !slotsGrid) return;

    if (!zones.length) {
        zoneTabs.innerHTML = '';
        zoneTitle.innerText = 'Chưa có dữ liệu slot';
        slotsGrid.innerHTML = '';
        return;
    }

    zoneTabs.innerHTML = zones.map(z => {
        const isActive = z.id === activeZoneId;
        const freeCount = z.slots.filter(s => isFreeStatus(s.status)).length;
        return `
            <button onclick="changeZone('${z.id.replace(/'/g, "\\'")}')" class="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-b-2 font-semibold transition ${isActive ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}">
                ${z.name} <span class="${isActive ? 'bg-blue-100' : 'bg-gray-100'} text-xs px-2 py-0.5 rounded-full">${freeCount}/${z.slots.length}</span>
            </button>
        `;
    }).join('');

    const activeZone = zones.find(z => z.id === activeZoneId);
    if (!activeZone) return;
    zoneTitle.innerText = activeZone.name;
    slotsGrid.innerHTML = activeZone.slots.map(renderSlotCard).join('');
}

function renderSlotCard(slot) {
    const base = 'aspect-square rounded-xl flex flex-col items-center justify-center text-center shadow-sm p-2 leading-tight';
    const label = `<span class="text-sm sm:text-base font-black whitespace-nowrap">Slot ${slot.slot_id}</span>`;

    if (slot.status === 'EMPTY') {
        return `<div class="${base} bg-white border-2 border-green-400 text-green-700">${label}<span class="mt-1 text-[10px] font-bold uppercase tracking-wide text-green-600">Trống</span></div>`;
    }
    if (slot.status === 'UNKNOWN') {
        return `<div class="${base} bg-yellow-50 border-2 border-yellow-300 text-yellow-800">${label}<span class="mt-1 px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-[10px] font-black uppercase tracking-wide">Không rõ</span></div>`;
    }
    if (slot.status === 'OUT_OF_SERVICE') {
        return `<div class="${base} bg-red-50 border-2 border-red-300 text-red-700">${label}<span class="mt-1 px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-[10px] font-black uppercase tracking-wide">Bảo trì</span></div>`;
    }
    return `<div class="${base} bg-gray-100 border-2 border-gray-200 text-gray-400 relative overflow-hidden"><i class="ph-fill ph-car text-3xl absolute opacity-15"></i><span class="z-10 text-sm sm:text-base font-black whitespace-nowrap">Slot ${slot.slot_id}</span><span class="z-10 mt-1 text-[10px] font-bold uppercase tracking-wide">Có xe</span></div>`;
}

window.changeZone = function (id) {
    activeZoneId = id;
    renderParkingData();
};

function fillProfile() {
    const realName = sessionStorage.getItem('fullName') || 'HCMUT User';
    const studentID = sessionStorage.getItem('studentID') || '';
    const role = sessionStorage.getItem('userRole') || '';
    const roleLabel = sessionStorage.getItem('roleLabel') || role;
    const email = sessionStorage.getItem('userEmail') || '';
    const rfid = sessionStorage.getItem('userRfid') || 'Chưa đăng ký';
    const plate = sessionStorage.getItem('userPlate') || '';

    const headerName = document.querySelector('.text-right p.text-gray-800');
    if (headerName) headerName.innerText = realName;
    document.getElementById('profile-name').innerText = realName;
    document.getElementById('profile-role-text').innerText = roleLabel;
    document.getElementById('profile-student-id').innerText = studentID;
    document.getElementById('profile-email').innerText = email;
    document.getElementById('profile-rfid').innerText = rfid;
    document.getElementById('profile-plate').value = plate;
    document.getElementById('header-role').innerText = roleLabel;

    const nameParts = realName.trim().split(/\s+/);
    const initials = nameParts.length >= 2 ? `${nameParts.at(-2)[0]}${nameParts.at(-1)[0]}` : realName.slice(0, 2);
    document.querySelectorAll('.avatar-text').forEach(el => { el.innerText = initials.toUpperCase(); });

    if (role === 'Faculty' || role === 'Staff') {
        document.getElementById('payment-box')?.classList.add('hidden');
        document.getElementById('label-student-id').innerText = 'Mã số cán bộ';
        document.getElementById('label-rfid').innerText = 'Mã thẻ cán bộ (RFID)';
    }
}

function bindTabs() {
    const tabs = ['dashboard', 'history', 'profile'];
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-tab-${t}`);
        btn?.addEventListener('click', () => {
            tabs.forEach(tab => {
                document.getElementById(`tab-${tab}`).classList.toggle('hidden', tab !== t);
                document.getElementById(`tab-${tab}`).classList.toggle('block', tab === t);
                const tabBtn = document.getElementById(`btn-tab-${tab}`);
                tabBtn.className = tab === t
                    ? 'w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium transition'
                    : 'w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition';
            });
            const titles = { dashboard: 'Theo dõi Bãi đỗ', history: 'Lịch sử Gửi xe', profile: 'Cá nhân' };
            document.getElementById('header-title').innerText = titles[t];
        });
    });
}

function bindPayment() {
    const modal = document.getElementById('bkpay-modal');
    const content = document.getElementById('bkpay-content');
    document.getElementById('btn-pay')?.addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('btn-cancel-pay')?.addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('btn-confirm-pay')?.addEventListener('click', async () => {
        const originalContent = content.innerHTML;
        content.innerHTML = `<div class="py-6"><i class="ph-bold ph-spinner animate-spin text-4xl text-blue-600 mb-4"></i><p class="font-semibold text-blue-600">Đang kết nối BKPay mock...</p></div>`;
        try {
            const studentID = sessionStorage.getItem('studentID');
            const debt = Number(sessionStorage.getItem('userDebt') || 0);
            const response = await fetch(`${API_BASE}/api/payment/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentID, amount: debt })
            });
            const data = await response.json();
            if (data.success) {
                content.innerHTML = `<div class="py-4"><div class="text-5xl text-green-500 mb-4"><i class="ph-fill ph-check-circle"></i></div><h4 class="text-xl font-bold text-gray-800 mb-2">Thành công!</h4><p class="text-sm text-gray-500 mb-4">Mã GD: ${data.transactionID}<br>BKPay Ref: ${data.bkpayRef}</p><button onclick="location.reload()" class="w-full bg-gray-900 text-white py-2.5 rounded mt-4">Đóng</button></div>`;
                sessionStorage.setItem('userDebt', 0);
                await updateDebtDisplay();
                await loadHistory();
            } else {
                content.innerHTML = `<div class="py-4"><div class="text-5xl text-red-500 mb-4"><i class="ph-fill ph-x-circle"></i></div><h4 class="text-xl font-bold text-gray-800 mb-2">Thất bại!</h4><p class="text-sm text-gray-500 mb-4">${data.message || 'Lỗi không xác định'}</p><button onclick="location.reload()" class="w-full bg-gray-900 text-white py-2.5 rounded mt-4">Đóng</button></div>`;
            }
        } catch (err) {
            content.innerHTML = originalContent;
            alert('Không thể kết nối Server.');
        }
    });
}

function bindProfileUpdate() {
    const btnSaveProfile = document.getElementById('btn-save-profile');
    btnSaveProfile?.addEventListener('click', async () => {
        const newPlate = document.getElementById('profile-plate').value.trim();
        const studentID = sessionStorage.getItem('studentID');
        const originalText = btnSaveProfile.innerText;
        btnSaveProfile.innerText = 'Đang lưu...';
        try {
            const response = await fetch(`${API_BASE}/api/user/update-plate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentID, licensePlate: newPlate })
            });
            const data = await response.json();
            alert(data.success ? 'Cập nhật biển số thành công!' : `Lỗi: ${data.message}`);
            if (data.success) sessionStorage.setItem('userPlate', newPlate);
        } catch (err) {
            alert('Lỗi kết nối Server!');
        } finally {
            btnSaveProfile.innerText = originalText;
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    fillProfile();
    bindTabs();
    bindPayment();
    bindProfileUpdate();
    document.getElementById('btn-logout')?.addEventListener('click', logout);

    await Promise.allSettled([loadParkingSlots(), updateDebtDisplay(), loadHistory()]);
});
