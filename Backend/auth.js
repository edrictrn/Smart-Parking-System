// --- LOGIC CHO TRANG ĐĂNG NHẬP (login.html) ---
let selectedRole = null;

function showLoginForm(role) {
    selectedRole = role;
    
    // Đổi tiêu đề form theo role
    const title = document.getElementById('login-title');
    const emailInput = document.getElementById('email-input');
    
    if (role === 'STUDENT') {
        title.innerText = "Tài khoản Sinh viên / Cán bộ";
        emailInput.value = "hao.tran@hcmut.edu.vn";
    } else {
        title.innerText = "Tài khoản Quản trị hệ thống";
        emailInput.value = "admin@hcmut.edu.vn";
    }

    // Ẩn bước 1, hiện bước 2
    document.getElementById('step-select-role').classList.add('hidden');
    document.getElementById('step-login-form').classList.remove('hidden');
}

function hideLoginForm() {
    selectedRole = null;
    document.getElementById('step-login-form').classList.add('hidden');
    document.getElementById('step-select-role').classList.remove('hidden');
}

// Lắng nghe sự kiện submit form đăng nhập
const loginForm = document.getElementById('step-login-form');
if(loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Lưu quyền vào localStorage và chuyển trang
        localStorage.setItem('userRole', selectedRole);
        
        if (selectedRole === 'STUDENT') {
            window.location.href = 'student.html';
        } else if (selectedRole === 'ADMIN') {
            window.location.href = 'admin.html';
        }
    });
}

// --- LOGIC BẢO VỆ TRANG & ĐĂNG XUẤT ---
function checkAuth(expectedRole) {
    const currentRole = localStorage.getItem('userRole');
    if (!currentRole) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}