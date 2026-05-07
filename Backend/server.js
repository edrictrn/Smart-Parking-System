require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ROLE_GROUPS = {
    campusUsers: ['Learner', 'Faculty', 'Staff'],
    adminUsers: ['Admin', 'ParkingOperator']
};

const SLOT_STATUSES = ['EMPTY', 'OCCUPIED', 'UNKNOWN', 'OUT_OF_SERVICE'];
const BILLABLE_CARD_ROLES = ['Faculty', 'Staff'];
const DEFAULT_PRICES = {
    LEARNER_MONTHLY: 45000,
    VISITOR_PER_SESSION: 5000,
    FACULTY_PER_SESSION: 0,
    STAFF_PER_SESSION: 0
};

// ── Timezone helpers ────────────────────────────────────────────────────────
// FIX: All date operations use Vietnam timezone (UTC+7) explicitly.
// Without this, a UTC server treats midnight UTC as "start of day",
// which is 07:00 Vietnam time — causing the chart to lag 1 day behind
// and payments made before 07:00 Vietnam to appear under the wrong date.
const TZ = 'Asia/Ho_Chi_Minh';

// Returns a Date whose .toISOString() is UTC, but whose local parts
// represent the current Vietnam date/time.
function nowVN() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

// Return a Date object representing midnight Vietnam time for the given date.
function startOfLocalDay(date = new Date()) {
    // Convert to Vietnam local string, strip time part, then rebuild.
    const vnStr = new Date(date).toLocaleDateString('en-CA', { timeZone: TZ }); // 'YYYY-MM-DD'
    // Build as UTC midnight + 7h offset so arithmetic stays correct.
    return new Date(`${vnStr}T00:00:00+07:00`);
}

function startOfLocalMonth(date = new Date()) {
    const key = formatLocalDateKey(date).slice(0, 7); // YYYY-MM
    return new Date(`${key}-01T00:00:00+07:00`);
}

function addMonths(date, months) {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
}

function getVietnamHour(date) {
    return Number(new Date(date).toLocaleString('en-US', {
        timeZone: TZ,
        hour: '2-digit',
        hour12: false
    }));
}

function makeLocalDateRange(startDate, endDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) {
        return { error: 'Ngày phải có dạng YYYY-MM-DD!' };
    }
    const start = new Date(`${startDate}T00:00:00+07:00`);
    const end = new Date(`${endDate}T23:59:59.999+07:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        return { error: 'Khoảng ngày không hợp lệ!' };
    }
    return { start, end };
}

function addDays(date, days) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}

// Returns 'YYYY-MM-DD' in Vietnam local time.
function formatLocalDateKey(date) {
    return new Date(date).toLocaleDateString('en-CA', { timeZone: TZ }); // en-CA gives YYYY-MM-DD
}

// Returns 'MM-DD' in Vietnam local time.
function formatLocalDateLabel(date) {
    const key = formatLocalDateKey(date);
    return key.slice(5); // drop 'YYYY-'
}

function getCurrentBillingCycle(date = new Date()) {
    const key = formatLocalDateKey(date);
    return key.slice(0, 7); // 'YYYY-MM'
}

function normalizeRole(role) {
    const roleMap = {
        Student: 'Learner',
        Learner: 'Learner',
        Faculty: 'Faculty',
        Staff: 'Staff',
        Visitor: 'Visitor',
        ParkingOperator: 'ParkingOperator',
        Operator: 'ParkingOperator',
        Admin: 'Admin'
    };
    return roleMap[role] || 'Learner';
}

function safeUser(user) {
    if (!user) return null;
    return {
        user_id: user.user_id,
        student_id: user.student_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        rfid: user.rfid,
        license_plate: user.license_plate,
        debt: user.accumulated_debt || 0
    };
}

async function getConfigNumber(key, fallback = 0) {
    const config = await prisma.system_config.findUnique({ where: { config_key: key } });
    const value = config ? Number(config.config_value) : fallback;
    return Number.isFinite(value) ? value : fallback;
}

async function setConfigNumber(key, value) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
        throw new Error(`Invalid configuration value for ${key}`);
    }
    return prisma.system_config.upsert({
        where: { config_key: key },
        update: { config_value: String(Number(value)) },
        create: { config_key: key, config_value: String(Number(value)) }
    });
}

async function getLearnerMonthlyFee() {
    return getConfigNumber('PRICE_LEARNER_MONTHLY', DEFAULT_PRICES.LEARNER_MONTHLY);
}

async function calculateFeeByRole(role) {
    switch (normalizeRole(role)) {
        case 'Learner':
            // Learners do not pay per session. They are billed once per monthly cycle.
            return 0;
        case 'Faculty':
            return getConfigNumber('PRICE_FACULTY_PER_SESSION', DEFAULT_PRICES.FACULTY_PER_SESSION);
        case 'Staff':
            return getConfigNumber('PRICE_STAFF_PER_SESSION', DEFAULT_PRICES.STAFF_PER_SESSION);
        case 'Visitor':
            return getConfigNumber('PRICE_VISITOR_PER_SESSION', DEFAULT_PRICES.VISITOR_PER_SESSION);
        default:
            return 0;
    }
}

async function writeLog({ actorId = null, action, detail = '' }) {
    try {
        await prisma.operation_logs.create({
            data: {
                actor_id: actorId,
                action,
                detail: String(detail).slice(0, 1000)
            }
        });
    } catch (err) {
        console.warn('Cannot write operation log:', err.message);
    }
}

async function requireEmptySlot(slotID) {
    const slotId = Number(slotID);
    if (!Number.isInteger(slotId) || slotId <= 0) {
        const error = new Error('slotID không hợp lệ!');
        error.status = 400;
        throw error;
    }

    const slot = await prisma.parking_slots.findUnique({ where: { slot_id: slotId } });
    if (!slot) {
        const error = new Error('Ô đỗ xe không tồn tại!');
        error.status = 404;
        throw error;
    }
    if (slot.status !== 'EMPTY') {
        const error = new Error(`Ô đỗ xe hiện đang ở trạng thái ${slot.status}, không thể cấp phiên gửi xe mới!`);
        error.status = 409;
        throw error;
    }
    return slot;
}

function makeTicketCode() {
    return `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function toCsv(rows) {
    if (!rows.length) return 'No data\n';
    const headers = Object.keys(rows[0]);
    const escape = (value) => {
        const text = String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    };
    return [headers.join(','), ...rows.map(row => headers.map(h => escape(row[h])).join(','))].join('\n');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const REPORT_LABELS = {
    transaction_id: 'Mã GD',
    transaction_type: 'Loại giao dịch',
    user_or_ticket: 'Người dùng / Mã vé',
    full_name: 'Họ tên',
    role_or_source: 'Vai trò / Nguồn',
    amount: 'Số tiền',
    status: 'Trạng thái',
    billing_cycle: 'Kỳ tính phí',
    bkpay_ref_id: 'Mã BKPay',
    paid_at: 'Ngày thanh toán',
    created_at: 'Ngày tạo',
    session_id: 'Mã phiên',
    slot: 'Slot',
    zone: 'Khu vực',
    description: 'Ghi chú',
    user: 'Người dùng / Mã vé',
    check_in: 'Giờ vào',
    check_out: 'Giờ ra',
    fee: 'Phí tính toán',
    paid_transaction_count: 'Số GD đã trả',
    paid_amount: 'Đã thanh toán'
};

function formatReportValue(key, value) {
    if (value === null || value === undefined || value === '') return '';
    if (['amount', 'fee', 'paid_amount'].includes(key)) {
        return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
    }
    if (['paid_at', 'created_at', 'check_in', 'check_out'].includes(key)) {
        return new Date(value).toLocaleString('vi-VN', { timeZone: TZ });
    }
    return String(value);
}

function toExcelHtmlReport({ title, subtitle, rows, totalRevenue = 0, reportType }) {
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const generatedAt = new Date().toLocaleString('vi-VN', { timeZone: TZ });
    const headerHtml = headers.map(h => `<th>${escapeHtml(REPORT_LABELS[h] || h)}</th>`).join('');
    const bodyHtml = rows.length
        ? rows.map((row, idx) => `<tr><td class="idx">${idx + 1}</td>${headers.map(h => `<td>${escapeHtml(formatReportValue(h, row[h]))}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${headers.length + 1 || 1}" class="empty">Không có dữ liệu trong khoảng thời gian đã chọn</td></tr>`;

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
    body { font-family: Arial, sans-serif; color: #172033; }
    .header { padding: 18px 22px; background: #0f3b82; color: white; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; }
    .summary { display: flex; gap: 12px; padding: 14px 0; }
    .card { border: 1px solid #d9e2ef; border-radius: 8px; padding: 10px 14px; min-width: 160px; background: #f8fbff; }
    .label { color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .value { margin-top: 4px; font-size: 18px; font-weight: 800; color: #0f3b82; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th { background: #e8f0fe; color: #0f3b82; border: 1px solid #b9c8df; padding: 8px; text-align: left; font-weight: 800; }
    td { border: 1px solid #d6dde8; padding: 7px; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .idx { text-align: center; font-weight: 700; color: #64748b; }
    .empty { text-align: center; padding: 18px; color: #64748b; }
    .footer { margin-top: 14px; font-size: 11px; color: #64748b; }
</style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
    </div>
    <div class="summary">
        <div class="card"><div class="label">Loại báo cáo</div><div class="value">${escapeHtml(reportType)}</div></div>
        <div class="card"><div class="label">Số dòng</div><div class="value">${rows.length}</div></div>
        <div class="card"><div class="label">Tổng đã thanh toán</div><div class="value">${Number(totalRevenue || 0).toLocaleString('vi-VN')} VNĐ</div></div>
    </div>
    <table>
        <thead><tr><th>#</th>${headerHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
    </table>
    <div class="footer">Generated at ${escapeHtml(generatedAt)} by IoT-SPMS MVP. This file is Excel-compatible HTML.</div>
</body>
</html>`;
}

// Print-ready HTML report. Opens inline in the browser, auto-triggers the
// print dialog so the user can either print on paper or save as PDF via
// the browser's built-in PDF printer (works on Chrome/Edge/Firefox/Safari).
function toPrintReadyReport({ title, subtitle, rows, totalRevenue = 0, reportType }) {
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const generatedAt = new Date().toLocaleString('vi-VN', { timeZone: TZ });
    const headerHtml = headers.map(h => `<th>${escapeHtml(REPORT_LABELS[h] || h)}</th>`).join('');
    const bodyHtml = rows.length
        ? rows.map((row, idx) => `<tr><td class="idx">${idx + 1}</td>${headers.map(h => `<td>${escapeHtml(formatReportValue(h, row[h]))}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${headers.length + 1 || 1}" class="empty">Không có dữ liệu trong khoảng thời gian đã chọn</td></tr>`;

    return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
    @page { size: A4 landscape; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #172033; margin: 0; padding: 18px; background: #f3f4f6; }
    .page { background: white; max-width: 1100px; margin: 0 auto; padding: 28px 32px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border-radius: 8px; }
    .header { border-bottom: 3px solid #0f3b82; padding-bottom: 14px; margin-bottom: 18px; }
    .header h1 { margin: 0; font-size: 22px; color: #0f3b82; }
    .header p { margin: 6px 0 0; font-size: 12.5px; color: #475569; }
    .summary { display: flex; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
    .card { border: 1px solid #d9e2ef; border-radius: 8px; padding: 12px 16px; min-width: 170px; background: #f8fbff; flex: 1; }
    .label { color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { margin-top: 4px; font-size: 18px; font-weight: 800; color: #0f3b82; }
    table { border-collapse: collapse; width: 100%; font-size: 11.5px; }
    th { background: #0f3b82; color: white; border: 1px solid #0f3b82; padding: 8px 6px; text-align: left; font-weight: 700; }
    td { border: 1px solid #d6dde8; padding: 6px; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .idx { text-align: center; font-weight: 700; color: #64748b; width: 32px; }
    .empty { text-align: center; padding: 18px; color: #64748b; }
    .footer { margin-top: 18px; font-size: 10.5px; color: #64748b; text-align: right; }
    .toolbar {
        position: sticky; top: 0; background: white; padding: 10px 0 14px; margin: -10px 0 14px;
        border-bottom: 1px dashed #cbd5e1; display: flex; gap: 10px; align-items: center;
    }
    .toolbar button {
        background: #0f3b82; color: white; border: none; padding: 8px 16px;
        border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px;
    }
    .toolbar button:hover { background: #15499c; }
    .toolbar .hint { color: #64748b; font-size: 12px; }
    @media print {
        body { background: white; padding: 0; }
        .page { box-shadow: none; max-width: none; padding: 0; border-radius: 0; }
        .toolbar { display: none; }
    }
</style>
</head>
<body>
    <div class="page">
        <div class="toolbar">
            <button onclick="window.print()">⎙ In hoặc Lưu thành PDF</button>
            <span class="hint">Trên hộp thoại in, chọn "Save as PDF" để xuất file PDF.</span>
        </div>
        <div class="header">
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="summary">
            <div class="card"><div class="label">Loại báo cáo</div><div class="value">${escapeHtml(reportType)}</div></div>
            <div class="card"><div class="label">Số dòng</div><div class="value">${rows.length}</div></div>
            <div class="card"><div class="label">Tổng đã thanh toán</div><div class="value">${Number(totalRevenue || 0).toLocaleString('vi-VN')} VNĐ</div></div>
        </div>
        <table>
            <thead><tr><th>#</th>${headerHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
        </table>
        <div class="footer">Xuất lúc ${escapeHtml(generatedAt)} • IoT-SPMS MVP</div>
    </div>
    <script>
        // Auto-open print dialog 600ms after load so user can save as PDF immediately.
        window.addEventListener('load', function () {
            setTimeout(function () { window.print(); }, 600);
        });
    </script>
</body>
</html>`;
}

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'IoT-SPMS backend is running',
        modules: ['Auth', 'Gate', 'VisitorTicket', 'RoleBasedPricing', 'BKPayMock', 'DataCoreMock', 'Reports']
    });
});

// =============================================
// MODULE: AUTH - Local mock for HCMUT_SSO
// =============================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu!' });
    }

    try {
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user || user.password !== password) {
            await writeLog({ action: 'AUTH_FAILED', detail: `Failed login for email ${email}` });
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
        }

        await writeLog({ actorId: user.user_id, action: 'AUTH_SUCCESS', detail: 'Mock HCMUT_SSO login successful' });
        return res.json({ success: true, user: safeUser(user) });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

// =============================================
// MODULE: USER
// =============================================
app.get('/api/user/debt/:studentID', async (req, res) => {
    try {
        const user = await prisma.users.findUnique({ where: { student_id: req.params.studentID } });
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
        return res.json({ success: true, debt: user.accumulated_debt || 0 });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.get('/api/user/history/:studentID', async (req, res) => {
    try {
        const user = await prisma.users.findUnique({ where: { student_id: req.params.studentID } });
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });

        const history = await prisma.parking_sessions.findMany({
            where: { user_id: user.user_id },
            include: { parking_slots: true },
            orderBy: { check_in_time: 'desc' }
        });
        return res.json({ success: true, data: history });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.put('/api/user/update-plate', async (req, res) => {
    const { studentID, licensePlate } = req.body;
    if (!studentID || !licensePlate) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin studentID hoặc licensePlate!' });
    }

    try {
        const user = await prisma.users.update({
            where: { student_id: studentID },
            data: { license_plate: licensePlate }
        });
        await writeLog({ actorId: user.user_id, action: 'UPDATE_LICENSE_PLATE', detail: `New plate: ${licensePlate}` });
        return res.json({ success: true, message: 'Cập nhật biển số thành công!' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

// =============================================
// MODULE: PAYMENT - BKPay mock integration
// =============================================
app.post('/api/payment/initiate', async (req, res) => {
    const { studentID, amount } = req.body;
    if (!studentID || amount === undefined) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin studentID hoặc amount!' });
    }

    try {
        const user = await prisma.users.findUnique({ where: { student_id: studentID } });
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });

        const debt = Number(user.accumulated_debt || 0);
        const paidAmount = Number(amount);
        if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Số tiền thanh toán không hợp lệ!' });
        }
        if (paidAmount > debt) {
            return res.status(400).json({ success: false, message: 'Số tiền thanh toán lớn hơn công nợ hiện tại!' });
        }

        const now = new Date();
        const bkpayRef = `BKP-${Date.now()}`;
        const unpaidBills = await prisma.transactions.findMany({
            where: {
                user_id: user.user_id,
                status: { in: ['PaymentReady', 'Pending', 'Processing'] },
                transaction_type: { in: ['LearnerBilling', 'ManualAdjustment'] }
            },
            orderBy: { created_at: 'asc' }
        });

        let remaining = paidAmount;
        const paidTransactionIds = [];

        for (const bill of unpaidBills) {
            if (remaining <= 0) break;
            const billAmount = Number(bill.amount || 0);
            if (billAmount <= remaining) {
                const paidBill = await prisma.transactions.update({
                    where: { transaction_id: bill.transaction_id },
                    data: {
                        status: 'Paid',
                        bkpay_ref_id: `${bkpayRef}-BILL-${bill.transaction_id}`,
                        paid_at: now,
                        description: String(`${bill.description || 'Outstanding learner bill'} | settled by ${bkpayRef}`).slice(0, 255)
                    }
                });
                paidTransactionIds.push(paidBill.transaction_id);
                remaining -= billAmount;
            } else {
                // Partial payment support: keep the remainder as PaymentReady and create one Paid payment record.
                await prisma.transactions.update({
                    where: { transaction_id: bill.transaction_id },
                    data: {
                        amount: billAmount - remaining,
                        description: String(`${bill.description || 'Outstanding learner bill'} | partially paid ${remaining} by ${bkpayRef}`).slice(0, 255)
                    }
                });
                const partialPayment = await prisma.transactions.create({
                    data: {
                        user_id: user.user_id,
                        amount: remaining,
                        bkpay_ref_id: bkpayRef,
                        status: 'Paid',
                        transaction_type: 'LearnerBilling',
                        billing_cycle: getCurrentBillingCycle(now),
                        description: 'BKPay mock partial learner debt payment',
                        paid_at: now
                    }
                });
                paidTransactionIds.push(partialPayment.transaction_id);
                remaining = 0;
            }
        }

        if (remaining > 0 || paidTransactionIds.length === 0) {
            const extraPayment = await prisma.transactions.create({
                data: {
                    user_id: user.user_id,
                    amount: remaining > 0 ? remaining : paidAmount,
                    bkpay_ref_id: bkpayRef,
                    status: 'Paid',
                    transaction_type: 'LearnerBilling',
                    billing_cycle: getCurrentBillingCycle(now),
                    description: 'BKPay mock payment for learner accumulated debt',
                    paid_at: now
                }
            });
            paidTransactionIds.push(extraPayment.transaction_id);
        }

        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { accumulated_debt: { decrement: paidAmount } }
        });
        await writeLog({ actorId: user.user_id, action: 'BKPAY_PAYMENT_PAID', detail: `ref=${bkpayRef}, amount=${paidAmount}, transactionIds=${paidTransactionIds.join(',')}` });

        return res.json({ success: true, transactionID: paidTransactionIds[0], transactionIDs: paidTransactionIds, bkpayRef });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

// =============================================
// MODULE: PARKING SLOTS
// =============================================
app.get('/api/slots/available', async (req, res) => {
    try {
        const count = await prisma.parking_slots.count({ where: { status: 'EMPTY' } });
        return res.json({ success: true, available: count });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.get('/api/slots/all', async (req, res) => {
    try {
        const slots = await prisma.parking_slots.findMany({ orderBy: [{ zone: 'asc' }, { slot_id: 'asc' }] });
        return res.json({ success: true, data: slots });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.get('/api/slots/list', async (req, res) => {
    try {
        const slots = await prisma.parking_slots.findMany({ orderBy: [{ zone: 'asc' }, { slot_id: 'asc' }] });
        const zoneMap = {};
        slots.forEach(slot => {
            const zone = slot.zone || 'UNKNOWN';
            if (!zoneMap[zone]) zoneMap[zone] = [];
            zoneMap[zone].push({ id: slot.slot_id, zone, isFree: slot.status === 'EMPTY', status: slot.status });
        });
        return res.json({ success: true, zones: zoneMap });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

// =============================================
// MODULE: ENTRY & EXIT
// =============================================
app.post('/api/gate/entry', async (req, res) => {
    const { studentID, slotID } = req.body;
    if (!studentID || !slotID) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin studentID hoặc slotID!' });
    }

    try {
        await requireEmptySlot(slotID);
        const user = await prisma.users.findUnique({ where: { student_id: studentID } });
        if (!user || !ROLE_GROUPS.campusUsers.includes(user.role)) {
            return res.status(404).json({ success: false, message: 'Thẻ không hợp lệ hoặc user không thuộc nhóm HCMUT hợp lệ!' });
        }

        const session = await prisma.parking_sessions.create({
            data: {
                user_id: user.user_id,
                slot_id: Number(slotID),
                status: 'Parked',
                source: 'CARD'
            }
        });

        await prisma.parking_slots.update({ where: { slot_id: Number(slotID) }, data: { status: 'OCCUPIED' } });
        await writeLog({ actorId: user.user_id, action: 'CARD_ENTRY', detail: `session=${session.session_id}, slot=${slotID}` });
        return res.json({ success: true, sessionID: session.session_id, message: 'Xe đã vào bãi bằng thẻ HCMUT.' });
    } catch (err) {
        return res.status(err.status || 500).json({ success: false, message: err.message || 'Lỗi hệ thống!' });
    }
});

app.post('/api/gate/visitor-entry', async (req, res) => {
    const { slotID, studentID } = req.body;
    if (!slotID) return res.status(400).json({ success: false, message: 'Thiếu slotID!' });

    try {
        await requireEmptySlot(slotID);
        const ticketCode = makeTicketCode();
        let linkedUser = null;

        // Optional: if a campus member forgot their card, operator can type MSSV/Mã cán bộ
        // and still issue a temporary ticket while keeping the record traceable.
        if (studentID) {
            linkedUser = await prisma.users.findUnique({ where: { student_id: String(studentID).trim() } });
            if (!linkedUser) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng cho trường hợp quên thẻ!' });
            }
        }

        await prisma.temporary_tickets.create({
            data: { ticket_code: ticketCode, slot_id: Number(slotID), status: 'Active' }
        });
        const session = await prisma.parking_sessions.create({
            data: {
                user_id: linkedUser?.user_id || null,
                slot_id: Number(slotID),
                visitor_ticket_code: ticketCode,
                status: 'Parked',
                source: 'TEMPORARY_TICKET'
            }
        });
        await prisma.parking_slots.update({ where: { slot_id: Number(slotID) }, data: { status: 'OCCUPIED' } });
        await writeLog({ actorId: linkedUser?.user_id || null, action: linkedUser ? 'FORGOT_CARD_TICKET_ENTRY' : 'VISITOR_ENTRY', detail: `ticket=${ticketCode}, session=${session.session_id}, slot=${slotID}` });

        return res.json({
            success: true,
            ticketCode,
            sessionID: session.session_id,
            linkedUser: linkedUser ? safeUser(linkedUser) : null,
            message: linkedUser ? 'Đã phát vé tạm cho người dùng quên thẻ.' : 'Đã phát vé tạm thời cho khách vãng lai.'
        });
    } catch (err) {
        return res.status(err.status || 500).json({ success: false, message: err.message || 'Lỗi hệ thống!' });
    }
});

app.get('/api/visitor/lookup/:ticketCode', async (req, res) => {
    const ticketCode = String(req.params.ticketCode || '').trim();
    if (!ticketCode) return res.status(400).json({ success: false, message: 'Thiếu mã vé tạm!' });

    try {
        const ticket = await prisma.temporary_tickets.findUnique({
            where: { ticket_code: ticketCode },
            include: { parking_slots: true }
        });
        if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy mã vé tạm này!' });

        const sessions = await prisma.parking_sessions.findMany({
            where: { visitor_ticket_code: ticketCode },
            include: { users: true, parking_slots: true, transactions: true },
            orderBy: { check_in_time: 'desc' }
        });
        const transactions = await prisma.transactions.findMany({
            where: { ticket_code: ticketCode },
            include: { users: true, parking_sessions: { include: { parking_slots: true } } },
            orderBy: [{ paid_at: 'desc' }, { created_at: 'desc' }]
        });

        const latestSession = sessions[0] || null;
        return res.json({
            success: true,
            data: {
                ticket: {
                    ticket_code: ticket.ticket_code,
                    status: ticket.status,
                    issued_at: ticket.issued_at,
                    closed_at: ticket.closed_at,
                    fee_paid: ticket.fee_paid || 0,
                    slot_id: ticket.slot_id,
                    zone: ticket.parking_slots?.zone || '',
                    slot_status: ticket.parking_slots?.status || ''
                },
                linkedUser: latestSession?.users ? safeUser(latestSession.users) : null,
                sessions: sessions.map(s => ({
                    session_id: s.session_id,
                    status: s.status,
                    source: s.source,
                    check_in_time: s.check_in_time,
                    check_out_time: s.check_out_time,
                    fee_calculated: s.fee_calculated || 0,
                    slot_id: s.slot_id,
                    zone: s.parking_slots?.zone || '',
                    linked_user: s.users ? safeUser(s.users) : null
                })),
                transactions: transactions.map(t => ({
                    transaction_id: t.transaction_id,
                    transaction_type: t.transaction_type,
                    amount: t.amount,
                    status: t.status,
                    bkpay_ref_id: t.bkpay_ref_id || '',
                    paid_at: t.paid_at,
                    created_at: t.created_at,
                    description: t.description || ''
                }))
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.post('/api/gate/exit', async (req, res) => {
    const { studentID, ticketCode } = req.body;
    if (!studentID && !ticketCode) {
        return res.status(400).json({ success: false, message: 'Thiếu studentID hoặc ticketCode!' });
    }

    try {
        if (ticketCode) {
            const session = await prisma.parking_sessions.findFirst({
                where: { visitor_ticket_code: ticketCode, status: 'Parked' },
                orderBy: { check_in_time: 'desc' }
            });
            if (!session) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên gửi xe cho vé tạm này!' });

            const fee = await calculateFeeByRole('Visitor');
            const now = new Date();
            await prisma.parking_sessions.update({
                where: { session_id: session.session_id },
                data: { check_out_time: now, fee_calculated: fee, status: 'Completed' }
            });
            await prisma.temporary_tickets.update({
                where: { ticket_code: ticketCode },
                data: { closed_at: now, status: 'Closed', fee_paid: fee }
            });
            if (session.slot_id !== null) {
                await prisma.parking_slots.update({ where: { slot_id: session.slot_id }, data: { status: 'EMPTY' } });
            }
            const transaction = await prisma.transactions.create({
                data: {
                    user_id: session.user_id || null,
                    session_id: session.session_id,
                    ticket_code: ticketCode,
                    amount: fee,
                    bkpay_ref_id: `VIS-${Date.now()}`,
                    status: 'Paid',
                    transaction_type: 'VisitorImmediate',
                    description: session.user_id ? 'Forgot-card temporary ticket immediate payment' : 'Visitor temporary ticket immediate payment',
                    paid_at: now
                }
            });
            await writeLog({ actorId: session.user_id || null, action: session.user_id ? 'FORGOT_CARD_EXIT_PAID' : 'VISITOR_EXIT_PAID', detail: `ticket=${ticketCode}, fee=${fee}` });
            return res.json({ success: true, fee, transactionID: transaction.transaction_id, ticketCode, message: session.user_id ? 'Người dùng quên thẻ đã thanh toán và xe đã ra bãi.' : 'Khách đã thanh toán và xe đã ra bãi.' });
        }

        const user = await prisma.users.findUnique({ where: { student_id: studentID } });
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });

        const session = await prisma.parking_sessions.findFirst({
            where: { user_id: user.user_id, status: 'Parked' },
            orderBy: { check_in_time: 'desc' }
        });
        if (!session) return res.status(404).json({ success: false, message: 'Không tìm thấy xe trong bãi!' });

        const fee = await calculateFeeByRole(user.role);
        const now = new Date();
        await prisma.parking_sessions.update({
            where: { session_id: session.session_id },
            data: { check_out_time: now, fee_calculated: fee, status: 'Completed' }
        });
        if (session.slot_id !== null) {
            await prisma.parking_slots.update({ where: { slot_id: session.slot_id }, data: { status: 'EMPTY' } });
        }

        const normalizedRole = normalizeRole(user.role);
        let message = 'Xe đã ra.';
        if (normalizedRole === 'Learner') {
            message = 'Xe đã ra. Learner không bị tính phí theo lượt; công nợ tháng được tạo trong module Billing Cycle.';
        } else if (fee > 0 && BILLABLE_CARD_ROLES.includes(normalizedRole)) {
            await prisma.users.update({
                where: { user_id: user.user_id },
                data: { accumulated_debt: { increment: fee } }
            });
            await prisma.transactions.create({
                data: {
                    user_id: user.user_id,
                    session_id: session.session_id,
                    amount: fee,
                    status: 'PaymentReady',
                    transaction_type: 'ManualAdjustment',
                    description: `${normalizedRole} card-user per-session parking fee`
                }
            });
            message = 'Xe đã ra, phí theo vai trò đã được cộng vào công nợ.';
        } else {
            message = 'Xe đã ra, nhóm người dùng này được miễn phí.';
        }

        await writeLog({ actorId: user.user_id, action: 'CARD_EXIT', detail: `session=${session.session_id}, role=${user.role}, fee=${fee}` });
        return res.json({ success: true, fee, role: user.role, message });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

// =============================================
// MODULE: IOT
// =============================================
app.patch('/api/iot/sensor-update', async (req, res) => {
    const { mac, status } = req.body;
    if (!mac || !status) return res.status(400).json({ success: false, message: 'Thiếu mac hoặc status!' });
    if (!SLOT_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái cảm biến không hợp lệ!' });

    try {
        const slot = await prisma.parking_slots.update({ where: { sensor_mac: mac }, data: { status } });
        await writeLog({ action: 'IOT_SENSOR_UPDATE', detail: `mac=${mac}, slot=${slot.slot_id}, status=${status}` });
        return res.json({ success: true, message: 'Cập nhật cảm biến thành công.', slot });
    } catch (err) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sensor_mac hoặc lỗi hệ thống: ' + err.message });
    }
});

// =============================================
// MODULE: ADMIN
// =============================================
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await prisma.users.findMany({ orderBy: [{ role: 'asc' }, { student_id: 'asc' }] });
        return res.json({ success: true, data: users.map(safeUser) });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.put('/api/admin/users/:studentID/role', async (req, res) => {
    const { role } = req.body;
    const normalizedRole = normalizeRole(role);
    if (!['Learner', 'Faculty', 'Staff', 'Visitor', 'ParkingOperator', 'Admin'].includes(normalizedRole)) {
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ!' });
    }

    try {
        const user = await prisma.users.update({
            where: { student_id: req.params.studentID },
            data: { role: normalizedRole }
        });
        await writeLog({ actorId: user.user_id, action: 'ADMIN_UPDATE_USER_ROLE', detail: `role=${normalizedRole}` });
        return res.json({ success: true, user: safeUser(user), message: 'Đã cập nhật vai trò người dùng.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.post('/api/sync/datacore', async (req, res) => {
    const mockDataCoreUsers = [
        { student_id: 'STAFF001', full_name: 'Le Thi Mai', email: 'mai.le@hcmut.edu.vn', password: '123456', role: 'Staff', rfid: 'AA:BB:CC:DD:88', license_plate: '51-F1 444.44' },
        { student_id: 'OP001', full_name: 'Parking Operator', email: 'operator.parking@hcmut.edu.vn', password: '123456', role: 'ParkingOperator', rfid: 'OP:00:00:00:01', license_plate: 'OP-BIKE' },
        { student_id: 'FAC001', full_name: 'Nguyen Thanh Cong', email: 'cong.nguyen@hcmut.edu.vn', password: '123456', role: 'Faculty', rfid: 'FF:EE:DD:CC:01', license_plate: '59-L1 999.99' }
    ];

    try {
        let updated = 0;
        for (const item of mockDataCoreUsers) {
            await prisma.users.upsert({
                where: { student_id: item.student_id },
                update: {
                    full_name: item.full_name,
                    email: item.email,
                    role: normalizeRole(item.role),
                    rfid: item.rfid,
                    license_plate: item.license_plate
                },
                create: {
                    student_id: item.student_id,
                    full_name: item.full_name,
                    email: item.email,
                    password: item.password,
                    role: normalizeRole(item.role),
                    rfid: item.rfid,
                    license_plate: item.license_plate,
                    accumulated_debt: 0
                }
            });
            updated += 1;
        }
        await writeLog({ action: 'DATACORE_SYNC_MOCK', detail: `updated=${updated}` });
        return res.json({ success: true, updatedRecords: updated, message: `Đã đồng bộ ${updated} user từ HCMUT_DATACORE mock.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi đồng bộ: ' + err.message });
    }
});

app.get('/api/admin/pricing', async (req, res) => {
    try {
        const billingCycle = getCurrentBillingCycle();
        return res.json({
            success: true,
            data: {
                // Learners pay once per monthly cycle, not per parking session.
                priceLearnerMonthly: await getLearnerMonthlyFee(),
                // Backward-compatible alias for older frontend code.
                priceLearner: await getLearnerMonthlyFee(),
                priceVisitor: await getConfigNumber('PRICE_VISITOR_PER_SESSION', DEFAULT_PRICES.VISITOR_PER_SESSION),
                priceFaculty: await getConfigNumber('PRICE_FACULTY_PER_SESSION', DEFAULT_PRICES.FACULTY_PER_SESSION),
                priceStaff: await getConfigNumber('PRICE_STAFF_PER_SESSION', DEFAULT_PRICES.STAFF_PER_SESSION),
                billingCycle,
                billingMode: 'Learner monthly, visitor per session'
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.put('/api/admin/pricing', async (req, res) => {
    const priceLearnerMonthly = req.body.priceLearnerMonthly ?? req.body.priceLearner ?? req.body.priceDay;
    const priceVisitor = req.body.priceVisitor ?? req.body.priceNight;
    const priceFaculty = req.body.priceFaculty ?? 0;
    const priceStaff = req.body.priceStaff ?? 0;

    try {
        await Promise.all([
            setConfigNumber('PRICE_LEARNER_MONTHLY', priceLearnerMonthly),
            setConfigNumber('PRICE_VISITOR_PER_SESSION', priceVisitor),
            setConfigNumber('PRICE_FACULTY_PER_SESSION', priceFaculty),
            setConfigNumber('PRICE_STAFF_PER_SESSION', priceStaff)
        ]);
        await writeLog({ action: 'ADMIN_UPDATE_PRICING', detail: JSON.stringify({ priceLearnerMonthly, priceVisitor, priceFaculty, priceStaff }) });
        return res.json({ success: true, message: 'Đã cập nhật chính sách giá: learner theo tháng, visitor theo lượt.' });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/billing/generate-monthly', async (req, res) => {
    const billingCycle = req.body.billingCycle || getCurrentBillingCycle();
    if (!/^\d{4}-\d{2}$/.test(billingCycle)) {
        return res.status(400).json({ success: false, message: 'billingCycle phải có dạng YYYY-MM!' });
    }

    try {
        const monthlyFee = await getLearnerMonthlyFee();
        if (monthlyFee <= 0) {
            return res.status(400).json({ success: false, message: 'Phí tháng của Learner phải lớn hơn 0 để tạo công nợ.' });
        }

        const learners = await prisma.users.findMany({ where: { role: 'Learner' }, orderBy: { student_id: 'asc' } });
        let created = 0;
        let skipped = 0;

        for (const learner of learners) {
            const existingBill = await prisma.transactions.findFirst({
                where: {
                    user_id: learner.user_id,
                    transaction_type: 'LearnerBilling',
                    billing_cycle: billingCycle,
                    description: { startsWith: 'Monthly learner parking fee' }
                }
            });

            if (existingBill) {
                skipped += 1;
                continue;
            }

            await prisma.transactions.create({
                data: {
                    user_id: learner.user_id,
                    amount: monthlyFee,
                    status: 'PaymentReady',
                    transaction_type: 'LearnerBilling',
                    billing_cycle: billingCycle,
                    description: `Monthly learner parking fee for ${billingCycle}`
                }
            });
            await prisma.users.update({
                where: { user_id: learner.user_id },
                data: { accumulated_debt: { increment: monthlyFee } }
            });
            created += 1;
        }

        await writeLog({ action: 'ADMIN_GENERATE_MONTHLY_LEARNER_BILLING', detail: JSON.stringify({ billingCycle, monthlyFee, created, skipped }) });
        return res.json({
            success: true,
            billingCycle,
            monthlyFee,
            createdBills: created,
            skippedExistingBills: skipped,
            message: `Đã tạo ${created} công nợ tháng ${billingCycle}; bỏ qua ${skipped} learner đã có bill.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi tạo công nợ tháng: ' + err.message });
    }
});

app.patch('/api/admin/slots/:slotID/status', async (req, res) => {
    const slotID = Number(req.params.slotID);
    const { status, reason = 'Manual admin/operator override' } = req.body;
    if (!Number.isInteger(slotID) || slotID <= 0) {
        return res.status(400).json({ success: false, message: 'slotID không hợp lệ!' });
    }
    if (!SLOT_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái slot không hợp lệ!' });
    }

    try {
        const slot = await prisma.parking_slots.update({ where: { slot_id: slotID }, data: { status } });
        await writeLog({ action: 'ADMIN_OVERRIDE_SLOT_STATUS', detail: `slot=${slotID}, status=${status}, reason=${reason}` });
        return res.json({ success: true, slot, message: `Đã cập nhật slot ${slotID} thành ${status}.` });
    } catch (err) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy slot hoặc lỗi hệ thống: ' + err.message });
    }
});

app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const startToday = startOfLocalDay();
        const tomorrow = addDays(startToday, 1);
        const start7Days = addDays(startToday, -6);
        const startMonth = startOfLocalMonth();
        const nextMonth = addMonths(startMonth, 1);

        const [revenueAgg, todayEntries, todayExits, sensorIssues, slots, paidTransactions, todayTrafficSessions, lastSyncLog, learnerDebtAgg] = await Promise.all([
            prisma.transactions.aggregate({
                where: {
                    status: 'Paid',
                    OR: [
                        { paid_at: { gte: startMonth, lt: nextMonth } },
                        { paid_at: null, created_at: { gte: startMonth, lt: nextMonth } }
                    ]
                },
                _sum: { amount: true }
            }),
            prisma.parking_sessions.count({ where: { check_in_time: { gte: startToday, lt: tomorrow } } }),
            prisma.parking_sessions.count({ where: { check_out_time: { gte: startToday, lt: tomorrow } } }),
            prisma.parking_slots.count({ where: { status: { in: ['UNKNOWN', 'OUT_OF_SERVICE'] } } }),
            prisma.parking_slots.findMany({ orderBy: [{ zone: 'asc' }, { slot_id: 'asc' }] }),
            prisma.transactions.findMany({
                where: {
                    status: 'Paid',
                    OR: [
                        { paid_at: { gte: start7Days, lt: tomorrow } },
                        { paid_at: null, created_at: { gte: start7Days, lt: tomorrow } }
                    ]
                },
                select: { amount: true, created_at: true, paid_at: true }
            }),
            prisma.parking_sessions.findMany({
                where: {
                    OR: [
                        { check_in_time: { gte: startToday, lt: tomorrow } },
                        { check_out_time: { gte: startToday, lt: tomorrow } }
                    ]
                },
                select: { check_in_time: true, check_out_time: true }
            }),
            prisma.operation_logs.findFirst({ where: { action: 'DATACORE_SYNC_MOCK' }, orderBy: { created_at: 'desc' } }),
            prisma.users.aggregate({ where: { role: 'Learner' }, _sum: { accumulated_debt: true } })
        ]);

        const slotSummary = SLOT_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
        slots.forEach(slot => { slotSummary[slot.status] = (slotSummary[slot.status] || 0) + 1; });

        const labels7 = [];
        const revenueByDay = [];
        for (let i = 0; i < 7; i += 1) {
            const d = addDays(start7Days, i);
            const key = formatLocalDateKey(d);
            labels7.push(formatLocalDateLabel(d));
            revenueByDay.push(paidTransactions
                .filter(t => formatLocalDateKey(t.paid_at || t.created_at) === key)
                .reduce((sum, t) => sum + Number(t.amount || 0), 0));
        }

        const trafficLabels = ['06:00-08:00', '08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'];
        const trafficInByHour = trafficLabels.map(label => {
            const startHour = Number(label.slice(0, 2));
            const endHour = Number(label.slice(6, 8));
            return todayTrafficSessions.filter(s => {
                if (!s.check_in_time) return false;
                const h = getVietnamHour(s.check_in_time);
                return h >= startHour && h < endHour;
            }).length;
        });
        const trafficOutByHour = trafficLabels.map(label => {
            const startHour = Number(label.slice(0, 2));
            const endHour = Number(label.slice(6, 8));
            return todayTrafficSessions.filter(s => {
                if (!s.check_out_time) return false;
                const h = getVietnamHour(s.check_out_time);
                return h >= startHour && h < endHour;
            }).length;
        });

        return res.json({
            success: true,
            data: {
                revenue: revenueAgg._sum.amount || 0,
                revenuePeriod: getCurrentBillingCycle(),
                todayEntries,
                todayExits,
                todayTrafficTotal: todayEntries + todayExits,
                sensorIssues,
                totalSlots: slots.length,
                learnerOutstandingDebt: learnerDebtAgg._sum.accumulated_debt || 0,
                slotSummary,
                lastDataCoreSync: lastSyncLog?.created_at || null,
                charts: {
                    revenueLabels: labels7,
                    revenueByDay,
                    trafficLabels,
                    trafficInByHour,
                    trafficOutByHour,
                    trafficByHour: trafficInByHour
                }
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.get('/api/admin/reports', async (req, res) => {
    const { startDate, endDate, format = 'json', reportType = 'sessions' } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Thiếu startDate hoặc endDate!' });
    }

    const range = makeLocalDateRange(startDate, endDate);
    if (range.error) return res.status(400).json({ success: false, message: range.error });
    const { start, end } = range;
    const normalizedType = reportType === 'revenue' || reportType === 'transactions' ? 'transactions' : 'sessions';

    try {
        let rows = [];
        let totalRevenue = 0;
        const normalizedFormat = String(format || 'json').toLowerCase();
        const title = normalizedType === 'transactions' ? 'Báo cáo Doanh thu / Giao dịch IoT-SPMS' : 'Báo cáo Lưu lượng / Phiên gửi xe IoT-SPMS';
        const subtitle = `Khoảng thời gian: ${startDate} đến ${endDate} • Múi giờ: Việt Nam (UTC+7)`;
        const filenameBase = `iot-spms-${normalizedType}-report-${startDate}-${endDate}`;

        if (normalizedType === 'transactions') {
            const transactions = await prisma.transactions.findMany({
                where: {
                    OR: [
                        { paid_at: { gte: start, lte: end } },
                        { paid_at: null, created_at: { gte: start, lte: end } }
                    ]
                },
                include: { users: true, parking_sessions: { include: { parking_slots: true } } },
                orderBy: [{ paid_at: 'desc' }, { created_at: 'desc' }]
            });

            rows = transactions.map(t => ({
                transaction_id: t.transaction_id,
                transaction_type: t.transaction_type,
                user_or_ticket: t.users ? t.users.student_id : (t.ticket_code || ''),
                full_name: t.users ? t.users.full_name : 'Visitor / Temporary ticket',
                role_or_source: t.users ? t.users.role : 'Visitor',
                amount: t.amount,
                status: t.status,
                billing_cycle: t.billing_cycle || '',
                bkpay_ref_id: t.bkpay_ref_id || '',
                paid_at: t.paid_at || '',
                created_at: t.created_at || '',
                session_id: t.session_id || '',
                slot: t.parking_sessions?.slot_id || '',
                zone: t.parking_sessions?.parking_slots?.zone || '',
                description: t.description || ''
            }));
            totalRevenue = rows
                .filter(row => row.status === 'Paid')
                .reduce((sum, row) => sum + Number(row.amount || 0), 0);
        } else {
            const sessions = await prisma.parking_sessions.findMany({
                where: { check_in_time: { gte: start, lte: end } },
                include: { users: true, parking_slots: true, transactions: true },
                orderBy: { check_in_time: 'desc' }
            });

            rows = sessions.map(s => ({
                session_id: s.session_id,
                user: s.users ? s.users.student_id : s.visitor_ticket_code,
                role_or_source: s.users ? s.users.role : 'Visitor',
                slot: s.slot_id || '',
                zone: s.parking_slots ? s.parking_slots.zone : '',
                check_in: s.check_in_time,
                check_out: s.check_out_time || '',
                status: s.status,
                fee: s.fee_calculated,
                paid_transaction_count: s.transactions.filter(t => t.status === 'Paid').length,
                paid_amount: s.transactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + Number(t.amount || 0), 0),
                billing_cycle: s.transactions.map(t => t.billing_cycle).filter(Boolean).join('; ')
            }));
            totalRevenue = rows.reduce((sum, row) => sum + Number(row.paid_amount || row.fee || 0), 0);
        }

        if (normalizedFormat === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
            return res.send('\uFEFF' + toCsv(rows));
        }

        if (['xls', 'excel', 'html'].includes(normalizedFormat)) {
            const extension = normalizedFormat === 'html' ? 'html' : 'xls';
            const contentType = normalizedFormat === 'html' ? 'text/html; charset=utf-8' : 'application/vnd.ms-excel; charset=utf-8';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.${extension}"`);
            return res.send('\uFEFF' + toExcelHtmlReport({ title, subtitle, rows, totalRevenue, reportType: normalizedType }));
        }

        // PDF format: open print-ready HTML inline; user uses browser "Save as PDF" via Ctrl+P (auto-triggered).
        if (normalizedFormat === 'pdf' || normalizedFormat === 'print') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            // Inline display so the browser auto-opens the print dialog instead of downloading.
            return res.send('\uFEFF' + toPrintReadyReport({ title, subtitle, rows, totalRevenue, reportType: normalizedType }));
        }

        return res.json({ success: true, reportType: normalizedType, count: rows.length, totalRevenue, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`IoT-SPMS backend đang chạy tại port ${PORT}`);
});
