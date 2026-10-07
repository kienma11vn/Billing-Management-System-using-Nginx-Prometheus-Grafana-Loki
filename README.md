# BILLING MANAGEMENT SYSTEM

Hệ thống quản lý hóa đơn và khách hàng được xây dựng theo mô hình full-stack hiện đại, tích hợp giao diện web, API, cơ sở dữ liệu, reverse proxy, monitoring và logging. Dự án này phù hợp cho các doanh nghiệp hoặc phòng ban cần theo dõi doanh thu, quản lý khách hàng, lập hóa đơn, thanh toán và giám sát hệ thống.

---

## TỔNG QUAN HỆ THỐNG

Dự án gồm các thành phần chính:

- Frontend: React + Vite, giao diện quản lý cho Admin và Staff
- Backend: FastAPI, cung cấp API REST cho đăng nhập, quản lý người dùng, khách hàng, dịch vụ / sản phẩm, hóa đơn và nhật ký hệ thống
- Database: PostgreSQL
- Reverse Proxy: Nginx, đóng vai trò truy cập HTTPS và route request đến các dịch vụ
- Monitoring: Prometheus + Grafana + cAdvisor + Postgres Exporter
- Logging: Loki + Promtail
- Database Management: pgAdmin

### Mô hình chức năng chính

- Quản lý người dùng theo vai trò: Admin & Staff
- Quản lý khách hàng
- Quản lý danh mục dịch vụ / sản phẩm
- Lập và xem hóa đơn
- Theo dõi trạng thái thanh toán: chưa thanh toán, một phần, đã thanh toán, đã hủy
- Lưu nhật ký hoạt động (Audit Log)
- Bảo mật bằng JWT
- Giám sát hệ thống và metric qua Prometheus/Grafana
- Thu thập log qua Loki/Promtail

---

## KIẾN TRÚC HỆ THỐNG

```text
Browser
  │
  ▼
Nginx (HTTPS / Reverse Proxy)
  ├── Frontend (React + Vite)
  ├── Backend API (FastAPI)
  ├── pgAdmin
  ├── Grafana
  └── Prometheus

Backend API → PostgreSQL
Prometheus → cAdvisor / postgres-exporter / backend
Promtail → Loki → Grafana
```

---

## CẤU TRÚC THƯ MỤC DỰ ÁN

```text
.
├── backend/                 # API FastAPI
│   ├── app/
│   ├── alembic/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # Frontend React
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── nginx/                   # Cấu hình Nginx + certs
│   ├── nginx.conf
│   ├── certs/
│   └── .htpasswd
├── monitoring/              # Prometheus, Grafana, exporter
├── logging/                 # Loki + Promtail
├── postgres/                # Initialize script cho PostgreSQL
├── docker-compose.yml       # Orchestrator các container
├── .env.example             # Template cấu hình môi trường
├── SETUP-GUIDE.md           # Hướng dẫn chi tiết cài đặt và kết nối server
├── README.md                # Tài liệu giới thiệu và mô tả hệ thống
└── .gitignore
```

---

## CÔNG NGHỆ SỬ DỤNG

- React 19
- Vite
- FastAPI
- SQLAlchemy
- PostgreSQL 15
- JWT / OAuth-like auth pattern cho API
- Nginx
- Prometheus
- Grafana
- Loki
- cAdvisor
- Docker / Docker Compose

---

## TÍNH NĂNG CHÍNH

### 1. Quản lý người dùng và phân quyền

- Tạo tài khoản Admin và Staff
- Chia quyền theo vai trò
- Xác thực bằng JWT
- Phân quyền truy cập route riêng cho Admin/Staff

### 2. Quản lý khách hàng và dịch vụ

- Thêm, sửa, xóa, xem thông tin khách hàng
- Quản lý dịch vụ / gói sản phẩm
- Hỗ trợ định giá theo đơn vị, số lượng và chiết khấu

### 3. Hóa đơn và thanh toán

- Tạo hóa đơn từ khách hàng và danh mục dịch vụ
- Tính tổng tiền, chiết khấu và số tiền cần thanh toán
- Theo dõi các lần thanh toán và trạng thái hóa đơn

### 4. Audit log

- Lưu lịch sử thao tác của Staff/Admin
- Ghi nhận: tạo hóa đơn, xóa khách hàng, cập nhật, v.v.
- Dễ dàng theo dõi hoạt động quản trị

### 5. Giám sát và logging

- Prometheus thu thập metric từ backend, database, container
- Grafana hiển thị dashboard và alerting
- Loki thu thập log từ hệ thống và container
- cAdvisor giám sát hiệu suất Docker

## TÀI KHOẢN MẶC ĐỊNH

Khi backend khởi động, hệ thống sẽ tự seed dữ liệu mẫu gồm:

- Admin: `admin@example.com` / `Admin123!`
- Staff: `staff@example.com` / `Staff123!`

---

## YÊU CẦU MÔI TRƯỜNG

Trước khi khởi chạy hệ thống, đảm bảo máy của bạn đã cài đặt:

- Docker
- Docker Compose
- OpenSSL
- Git
- Truy cập mạng / địa chỉ IP hoặc domain để truy cập HTTPS

---

## CÀI ĐẶT VÀ KHỞI CHẠY HỆ THỐNG

### Bước 1: Clone repo

```bash
git clone https://github.com/kienma11vn/Billing-Management-System-using-Nginx-Prometheus-Grafana-Loki.git
cd Billing-Management-System-using-Nginx-Prometheus-Grafana-Loki
```

### Bước 2: Cấu hình biến môi trường

Copy file `.env.example` thành `.env` nếu chưa tồn tại:

```bash
cp .env.example .env
```

Kiểm tra các biến môi trường quan trọng như:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `GF_SECURITY_ADMIN_PASSWORD`
- `PROMETHEUS_AUTH_USER`
- `PROMETHEUS_AUTH_PASS`

### Bước 3: Tạo chứng chỉ SSL cho Nginx

Dự án sử dụng Nginx làm reverse proxy HTTPS với chứng chỉ tự ký. Tạo thư mục cert và sinh khóa như sau:

```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/nginx.key \
  -out nginx/certs/nginx.crt \
  -subj "/C=VN/ST=ThaiNguyen/L=ThaiNguyen/O=SDM332/OU=DevOps/CN=192.168.xxx.xxx"
chmod 600 nginx/certs/nginx.key
chmod 644 nginx/certs/nginx.crt
```

Lưu ý: thay `192.168.xxx.xxx` bằng địa chỉ IP hoặc domain của máy chủ đang chạy hệ thống.

### Bước 4: Khởi chạy toàn bộ hệ thống bằng Docker Compose

```bash
docker compose up -d --build
```

Nếu máy bạn dùng phiên bản Docker cũ, có thể dùng:

```bash
docker-compose up -d --build
```

### Bước 5: Theo dõi log container

```bash
docker compose logs -f
```

Sau khi các container khởi động xong, backend sẽ tự chạy migration và seeding dữ liệu.

---

## ĐỊA CHỈ TRUY CẬP HỆ THỐNG

Sau khi đã khởi chạy thành công, truy cập các dịch vụ theo địa chỉ sau:

- Frontend: `https://<IP-CUA-MAY-CHU>/`
- Backend Swagger Docs: `https://<IP-CUA-MAY-CHU>/api/docs`
- pgAdmin: `https://<IP-CUA-MAY-CHU>/pgadmin/`
- Grafana: `https://<IP-CUA-MAY-CHU>/grafana/`
- Prometheus: `https://<IP-CUA-MAY-CHU>/prometheus/`

Lưu ý: vì chứng chỉ là self-signed, trình duyệt có thể cảnh báo "Your connection is not private". Bạn cần chọn "Advanced" → "Proceed to ..." hoặc chấp nhận cảnh báo tạm thời để tiếp tục truy cập.

---

## THÔNG TIN ĐĂNG NHẬP MẶC ĐỊNH

### Admin

- Email: `admin@example.com`
- Password: `Admin123!` (*Nên đổi sau khi khởi chạy*)

### Staff

- Email: `staff@example.com`
- Password: `Staff123!` (*Nên đổi sau khi khởi chạy*)

### pgAdmin

- Email: cấu hình trong `.env` (`PGADMIN_DEFAULT_EMAIL`)
- Password: cấu hình trong `.env` (`PGADMIN_DEFAULT_PASSWORD`)

### Prometheus

- Username: cấu hình trong `.env` (`PROMETHEUS_AUTH_USER`)
- Password: cấu hình trong `.env` (`PROMETHEUS_AUTH_PASS`)

### Grafana

- Username: `admin`
- Password: cấu hình trong `.env` (`GF_SECURITY_ADMIN_PASSWORD`)

---

## DỪNG VÀ XÓA HỆ THỐNG

Để dừng tất cả container:

```bash
docker compose down
```

Nếu muốn xóa cả volume dữ liệu:

```bash
docker compose down -v
```

---

## KHẮC PHỤC SỰ CỐ THƯỜNG GẶP

### Backend không khởi động

- Kiểm tra biến `DATABASE_URL` trong `.env` có đúng không
- Kiểm tra PostgreSQL đã sẵn sàng chưa
- Xem log:

```bash
docker compose logs -f backend
```

### Nginx không mở HTTPS

- Kiểm tra tệp cert đã tồn tại:

```bash
ls -la nginx/certs
```
- Kiểm tra cấu hình Nginx:

```bash
docker compose logs -f nginx
```

### Frontend không tải được API

- Kiểm tra CORS trong backend
- Kiểm tra URL API trong frontend (`VITE_API_BASE_URL`)

---

## GHI CHÚ

Dự án này là một hệ thống mô phỏng thực tế về quản lý hóa đơn và giám sát hạ tầng một cách toàn diện, phục vụ chủ yếu cho mục đích giáo dục và học tập. Cấu trúc Docker Compose giúp triển khai nhanh trên server hoặc môi trường local mà không cần cài đặt từng thành phần thủ công.