# IoT-SPMS Fixed Version v3

Bản này tiếp tục sửa hai điểm còn tồn tại trong v2: Admin chưa đồng bộ trực quan với bãi xe và pricing chưa phản ánh đúng chính sách **Learner đóng theo tháng, Visitor đóng theo lượt**.

## Nội dung đã sửa

1. Tách `schema.sql` và `seed.sql`.
   - `schema.sql`: chỉ chứa cấu trúc bảng.
   - `seed.sql`: chỉ chứa dữ liệu demo cho MVP.
2. Chuẩn hóa role theo requirement:
   - `Learner`, `Faculty`, `Staff`, `Visitor`, `ParkingOperator`, `Admin`.
3. Sửa pricing theo đúng chính sách:
   - `PRICE_LEARNER_MONTHLY`: phí tháng cố định cho Learner.
   - `PRICE_VISITOR_PER_SESSION`: phí theo từng lượt cho khách vãng lai/vé tạm.
   - `PRICE_FACULTY_PER_SESSION`, `PRICE_STAFF_PER_SESSION`: mặc định 0, có thể bật nếu trường muốn thu theo vai trò.
4. Thêm module tạo công nợ tháng cho Learner:
   - `POST /api/admin/billing/generate-monthly`
   - Hệ thống tạo bill một lần cho mỗi Learner trong từng `billing_cycle` dạng `YYYY-MM`.
   - Nếu Admin chỉnh giá Learner, giá mới chỉ áp dụng cho bill tháng được tạo sau đó; không tự tính lại công nợ cũ.
5. Thêm temporary ticket flow cho Visitor / forgot-card:
   - `POST /api/gate/visitor-entry`
   - `POST /api/gate/exit` với `ticketCode`
   - Visitor dùng giá cấu hình mới nhất tại thời điểm xe ra.
6. Thêm màn hình Admin đồng bộ với bãi xe:
   - Tab **Trạng thái Bãi xe** lấy dữ liệu trực tiếp từ `/api/slots/all`.
   - Có thống kê `EMPTY`, `OCCUPIED`, `UNKNOWN`, `OUT_OF_SERVICE`.
   - Admin/Operator có thể override slot qua `PATCH /api/admin/slots/:slotID/status`.
   - Sau thao tác xe vào/ra hoặc phát vé tạm, dashboard và slot view được reload lại.
7. Thêm chức năng đổi role trực tiếp trên Admin UI:
   - Gọi `PUT /api/admin/users/:studentID/role`.
8. Dashboard không còn chart số 0 cố định:
   - Doanh thu 7 ngày và lượt xe hôm nay lấy từ API `/api/admin/dashboard`.
9. Thêm mock rõ ràng cho các hệ thống tích hợp:
   - HCMUT_SSO: login local mock.
   - HCMUT_DATACORE: `/api/sync/datacore` upsert dữ liệu mẫu.
   - BKPay: `/api/payment/initiate` mock paid callback.
10. Bổ sung `prisma/schema.prisma`, `.env`, script start đúng đường dẫn backend.

## Cách chạy nhanh

### 1. Cài package

```bash
npm install
```

### 2. Cấu hình database

Sửa `DATABASE_URL` trong `.env` theo MySQL local của bạn.

Ví dụ:

```env
DATABASE_URL="mysql://root:123456@localhost:3306/iot_spms"
```

### 3. Tạo database và import SQL

Trong MySQL:

```sql
CREATE DATABASE IF NOT EXISTS iot_spms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iot_spms;
SOURCE schema.sql;
SOURCE seed.sql;
```

Hoặc import 2 file `schema.sql` rồi `seed.sql` bằng MySQL Workbench/phpMyAdmin.

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Chạy backend

```bash
npm run dev
```

Backend mặc định chạy tại port `3000`.

### 6. Mở frontend

Mở `Frontend/login.html` bằng Live Server hoặc trình duyệt.

## Tài khoản demo

| Vai trò | Email | Password |
|---|---|---|
| Admin | admin.parking@hcmut.edu.vn | 123456 |
| Parking Operator | operator.parking@hcmut.edu.vn | 123456 |
| Faculty | cong.nguyen@hcmut.edu.vn | 123456 |
| Staff | mai.le@hcmut.edu.vn | 123456 |
| Learner | hao.tran@hcmut.edu.vn | 123456 |

## Luồng demo gợi ý

1. Login Admin.
2. Vào tab **Trạng thái Bãi xe** để xem slot thật từ database.
3. Dùng bảng giả lập phần cứng để cho xe vào/ra, sau đó kiểm tra slot đổi trạng thái.
4. Vào **Cấu hình Giá vé**, chỉnh phí Visitor rồi thử phát vé tạm và cho xe ra. Phí Visitor sẽ dùng giá mới.
5. Chỉnh phí Learner monthly, bấm **Tạo công nợ tháng cho Learner**. Hệ thống chỉ tạo công nợ một lần cho mỗi Learner trong tháng hiện tại.
6. Login Learner để xem công nợ và thanh toán qua BKPay mock.

## Ghi chú cho báo cáo/demo

Các tích hợp HCMUT_SSO, HCMUT_DATACORE và BKPay trong MVP này là mock services để minh họa luồng phần mềm. Khi viết báo cáo, nên ghi rõ là hệ thống chưa kết nối API thật của trường, nhưng đã tách module và endpoint để dễ thay bằng API thật sau này.


## Demo data note for v4

`seed.sql` has been expanded so the UI is no longer empty during demonstration:

- 34 parking slots across Khu A, Khu B, and Khu C.
- Mixed slot statuses: `EMPTY`, `OCCUPIED`, `UNKNOWN`, `OUT_OF_SERVICE`.
- Different learner debts in the `Users.accumulated_debt` column.
- Monthly learner billing transactions in `Transactions`.
- Completed and active parking sessions in `Parking_sessions`.
- Visitor temporary tickets and paid visitor transactions.
- Paid transactions over the last 7 days so the Admin revenue chart has visible data.

After replacing code, re-import the database for a clean demo:

```bash
mysql -u root -p iot_spms < schema.sql
mysql -u root -p iot_spms < seed.sql
```

## v6 demo data notes

This version expands the demonstration dataset and dashboard behavior:

- The parking lot now has 4 zones, each with 28 slots: Khu A, Khu B, Khu C, and Khu D.
- Learner accounts have different outstanding debts. Paid learners have their debt reduced in `Users.accumulated_debt`.
- Student history includes multiple completed sessions plus active `Parked` sessions for demo.
- Revenue charts use `Transactions.paid_at` first, then `created_at` only when `paid_at` is empty. Therefore a BKPay payment made on 30/04 appears under 04-30.
- Visitor demo flow: enter an empty slot ID, click `Vé tạm`, then click `Xe RA` with the generated ticket code to close the session, collect the visitor fee, release the slot, and refresh the revenue/traffic dashboard.

After updating to this version, reset and reseed the database:

```bash
mysql -u root -p iot_spms < schema.sql
mysql -u root -p iot_spms < seed.sql
npm run prisma:generate
npm run dev
```

## v7 final dashboard/report fixes

This version closes the remaining dashboard and reporting issues found during final review:

- **Current-period revenue card** now sums only `Paid` transactions in the current Vietnam local month instead of all historical paid transactions.
- **Traffic chart** now has two datasets: `Lượt xe vào hôm nay` and `Lượt xe ra hôm nay`.
- **Traffic hour grouping** uses Vietnam timezone (`Asia/Ho_Chi_Minh`) to avoid hour shifts when the backend runs in UTC.
- **Report export** now supports two report types:
  - `transactions`: financial report from the `Transactions` table, including learner monthly billing, BKPay mock payments, visitor payments, `paid_at`, `billing_cycle`, and amount.
  - `sessions`: operational traffic report from the `Parking_sessions` table, including check-in/check-out, slot, zone, status, and linked paid amount.
- The report form in Admin now sends `reportType` to the backend, so the selected report type affects the CSV contents.

Recommended final demo order:

1. Login Admin and check the dashboard revenue card, traffic in/out chart, and slot status.
2. Generate a temporary visitor ticket, then close it using `Xe RA`; verify the visitor payment appears in the revenue chart and transaction report.
3. Login a Learner account, pay debt through BKPay mock, then return to Admin; verify `Công nợ Learner` decreases and the current-period revenue increases.
4. Export both `Báo cáo Doanh thu / Giao dịch` and `Báo cáo Lưu lượng / Phiên gửi xe`.

## v8 auth/session and demo data fixes

- Authentication state was moved from `localStorage` to `sessionStorage` in `auth.js`, `student.js`, and `admin.js`.
- This prevents the Admin tab from being overwritten when another tab logs in as a Learner. Each browser tab now keeps its own signed-in role; refreshing the same tab still preserves login.
- `seed.sql` now includes richer demo histories for all learner demo accounts, plus Faculty/Staff and additional visitor ticket flows.
- Visitor demo data includes more closed tickets, paid transactions, and parking sessions so Admin dashboard charts and reports are less empty during demonstration.

