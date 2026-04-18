// Bảo vệ trang
checkAuth('STUDENT');

// 1. DỮ LIỆU MÔ PHỎNG BÃI XE
const zones = [
    { 
        id: 'A', name: 'Khu A', 
        slots: Array.from({length: 32}, (_, i) => ({ id: `A${i+1}`, isFree: Math.random() > 0.4 })) 
    },
    { 
        id: 'B', name: 'Khu B (Hầm)', 
        slots: Array.from({length: 48}, (_, i) => ({ id: `B${i+1}`, isFree: Math.random() > 0.8 })) 
    }
];
let activeZoneId = 'A';

// 2. LOGIC RENDER BÃI XE
function renderParkingData() {
    // Vẽ Tab khu vực
    document.getElementById('zone-tabs').innerHTML = zones.map(z => {
        const isActive = z.id === activeZoneId;
        const freeCount = z.slots.filter(s => s.isFree).length;
        return `
            <button onclick="changeZone('${z.id}')" class="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-b-2 font-semibold transition ${isActive ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}">
                ${z.name} <span class="bg-${isActive?'blue':'gray'}-100 text-xs px-2 py-0.5 rounded-full">${freeCount}</span>
            </button>
        `;
    }).join('');

    // Vẽ lưới các ô đỗ xe
    const activeZone = zones.find(z => z.id === activeZoneId);
    document.getElementById('zone-title').innerText = activeZone.name;
    
    document.getElementById('slots-grid').innerHTML = activeZone.slots.map(s => {
        if(s.isFree) {
            return `<div class="aspect-square bg-white border-2 border-green-400 rounded-lg flex items-center justify-center font-bold text-green-700 shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer">${s.id}</div>`;
        } else {
            return `<div class="aspect-square bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-400 relative"><i class="ph-fill ph-car text-3xl absolute opacity-20"></i><span class="z-10">${s.id}</span></div>`;
        }
    }).join('');
}

function changeZone(id) {
    activeZoneId = id;
    renderParkingData();
}

// 3. LOGIC CHUYỂN TAB (DASHBOARD / HISTORY / PROFILE)
const tabs = ['dashboard', 'history', 'profile'];
tabs.forEach(t => {
    document.getElementById(`btn-tab-${t}`).addEventListener('click', () => {
        // Đổi nội dung
        tabs.forEach(tab => {
            document.getElementById(`tab-${tab}`).classList.toggle('hidden', tab !== t);
            document.getElementById(`tab-${tab}`).classList.toggle('block', tab === t);
        });
        
        // Đổi màu menu
        document.getElementById('btn-tab-dashboard').className = t === 'dashboard' ? 'w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium transition' : 'w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition';
        document.getElementById('btn-tab-history').className = t === 'history' ? 'w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium transition' : 'w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition';
        document.getElementById('btn-tab-profile').className = t === 'profile' ? 'w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium transition' : 'w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition';
        
        // Đổi tiêu đề
        const titles = { 'dashboard': 'Theo dõi Bãi đỗ', 'history': 'Lịch sử Gửi xe', 'profile': 'Cá nhân' };
        document.getElementById('header-title').innerText = titles[t];
    });
});

// 4. LOGIC THANH TOÁN (BKPAY)
const modal = document.getElementById('bkpay-modal');
const content = document.getElementById('bkpay-content');

document.getElementById('btn-pay').addEventListener('click', () => {
    modal.classList.remove('hidden');
});

document.getElementById('btn-cancel-pay').addEventListener('click', () => {
    modal.classList.add('hidden');
});

document.getElementById('btn-confirm-pay').addEventListener('click', () => {
    content.innerHTML = `<div class="py-6"><i class="ph-bold ph-spinner animate-spin text-4xl text-blue-600 mb-4"></i><p class="font-semibold text-blue-600">Đang kết nối BKPay...</p></div>`;
    
    setTimeout(() => {
        content.innerHTML = `<div class="py-4"><div class="text-5xl text-green-500 mb-4"><i class="ph-fill ph-check-circle"></i></div><h4 class="text-xl font-bold text-gray-800 mb-2">Thành công!</h4><button onclick="document.getElementById('bkpay-modal').classList.add('hidden')" class="w-full bg-gray-900 text-white py-2.5 rounded mt-4">Đóng</button></div>`;
        document.getElementById('debt-display').innerHTML = `0 <span class="text-lg font-normal">VNĐ</span>`;
        document.getElementById('btn-pay').classList.add('hidden');
        document.getElementById('no-debt-msg').classList.remove('hidden');
    }, 1500);
});

// Nút Đăng xuất
document.getElementById('btn-logout').addEventListener('click', logout);

// Khởi chạy khi load xong
document.addEventListener('DOMContentLoaded', renderParkingData);