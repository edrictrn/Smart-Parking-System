// =============================================
// AUTH FRONTEND - HCMUT_SSO mock login
// =============================================
let selectedRole = null;

const ROLE_LABELS = {
    Learner: 'Sinh viên / Học viên',
    Faculty: 'Giảng viên',
    Staff: 'Cán bộ / Nhân viên',
    ParkingOperator: 'Nhân viên vận hành bãi xe',
    Admin: 'Quản trị hệ thống'
};

function isAdminLike(role) {
    return role === 'Admin' || role === 'ParkingOperator';
}

function isCampusUser(role) {
    return role === 'Learner' || role === 'Faculty' || role === 'Staff';
}

function showLoginForm(roleGroup) {
    selectedRole = roleGroup;
    const title = document.getElementById('login-title');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');

    if (title) {
        title.innerText = roleGroup === 'CAMPUS_USER'
            ? 'Tài khoản HCMUT: Learner / Faculty / Staff'
            : 'Tài khoản Admin / Parking Operator';
    }
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';

    document.getElementById('step-select-role')?.classList.add('hidden');
    document.getElementById('step-login-form')?.classList.remove('hidden');
}

function hideLoginForm() {
    selectedRole = null;
    document.getElementById('step-login-form')?.classList.add('hidden');
    document.getElementById('step-select-role')?.classList.remove('hidden');
}

const loginFormElement = document.getElementById('step-login-form');
if (loginFormElement) {
    loginFormElement.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('email-input').value.trim();
        const password = document.getElementById('password-input').value;

        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (!data.success) {
                alert(data.message || 'Đăng nhập thất bại!');
                return;
            }

            const role = data.user.role;
            if (selectedRole === 'CAMPUS_USER' && !isCampusUser(role)) {
                alert('Tài khoản này không thuộc nhóm HCMUT user. Hãy chọn Admin / Operator.');
                return;
            }
            if (selectedRole === 'ADMIN' && !isAdminLike(role)) {
                alert('Tài khoản này không có quyền Admin / Operator.');
                return;
            }

            sessionStorage.setItem('userRole', role);
            sessionStorage.setItem('studentID', data.user.student_id);
            sessionStorage.setItem('fullName', data.user.full_name);
            sessionStorage.setItem('userEmail', data.user.email);
            sessionStorage.setItem('userRfid', data.user.rfid || 'Chưa đăng ký');
            sessionStorage.setItem('userPlate', data.user.license_plate || '');
            sessionStorage.setItem('userDebt', data.user.debt || 0);
            sessionStorage.setItem('roleLabel', ROLE_LABELS[role] || role);

            window.location.href = isAdminLike(role) ? 'admin.html' : 'student.html';
        } catch (err) {
            alert('Không thể kết nối tới server. Hãy chạy npm run dev ở thư mục project.');
        }
    });
}

function checkAuth(expectedGroup) {
    const currentRole = sessionStorage.getItem('userRole');
    if (!currentRole) {
        window.location.href = 'login.html';
        return;
    }

    if (expectedGroup === 'ADMIN' && !isAdminLike(currentRole)) {
        window.location.href = 'login.html';
        return;
    }

    if (expectedGroup === 'STUDENT' && !isCampusUser(currentRole)) {
        window.location.href = 'admin.html';
    }
}

function logout() {
    ['userRole', 'studentID', 'fullName', 'userEmail', 'userRfid', 'userPlate', 'userDebt', 'roleLabel'].forEach(k => sessionStorage.removeItem(k));
    window.location.href = 'login.html';
}

const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInputBox = document.getElementById('password-input');
if (togglePasswordBtn && passwordInputBox) {
    togglePasswordBtn.addEventListener('click', function () {
        const currentType = passwordInputBox.getAttribute('type');
        passwordInputBox.setAttribute('type', currentType === 'password' ? 'text' : 'password');
        togglePasswordBtn.classList.toggle('text-blue-500');
    });
}
