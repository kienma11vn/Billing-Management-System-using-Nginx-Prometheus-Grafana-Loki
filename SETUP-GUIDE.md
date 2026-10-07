# HƯỚNG DẪN THIẾT LẬP HỆ THỐNG (SETUP GUIDE)

Tài liệu này hướng dẫn chi tiết cách:

1. Kết nối VS Code với Ubuntu Server thông qua extension **Remote - SSH**.
2. Tạo chứng chỉ SSL tự ký (Self-Signed SSL Certificate: `nginx.key` & `nginx.crt`) để cấu hình HTTPS cho **Nginx**.
3. Khởi chạy dự án bằng **Docker Compose**.
4. Cấu hình kết nối CSDL PostgreSQL từ giao diện quản trị **pgAdmin**.
5. Cấu hình **Grafana** & Thiết lập Dashboards.

## YÊU CẦU TIÊN QUYẾT

* **Ubuntu Server** đã được cài đặt, đang chạy và có thể truy cập qua mạng.

* Địa chỉ IP của Ubuntu Server (VD: `192.168.123.123`).

* Tài khoản user trên Ubuntu Server có quyền `sudo` (VD: `ubuntu`, `root`, hoặc tên user bạn tự tạo).

* Đã cài đặt **OpenSSL** trên Ubuntu Server (mặc định Ubuntu Server luôn cài sẵn).

* Đã cài đặt **Visual Studio Code** trên máy cá nhân (Windows/macOS/Linux).

---

## Phần 1: Kết nối VS Code với Ubuntu Server qua Remote - SSH

### Bước 1: Cài đặt extension trên VS Code

1. Mở **VS Code** trên máy tính cá nhân.

2. Nhấn biểu tượng **Extensions** ở thanh công cụ bên trái (hoặc bấm tổ hợp phím `Ctrl + Shift + X` trên Windows / `Cmd + Shift + X` trên Mac).

3. Tìm kiếm từ khóa: `Remote - SSH`.

4. Nhấn **Install** để cài đặt extension do **Microsoft** phát triển.

### Bước 2: Cấu hình File SSH Config

1. Bấm tổ hợp phím `Ctrl + Shift + P` (Windows) hoặc `Cmd + Shift + P` (Mac) để mở **Command Palette**.

2. Nhập `Remote-SSH: Open SSH Configuration File...` và nhấn `Enter`.

3. Chọn file config người dùng (thường là `C:\Users\<Your-User-Name>\.ssh\config` trên Windows hoặc `/Users/<Your-User-Name>/.ssh/config` trên Mac/Linux).

4. Thêm cấu hình Ubuntu Server của bạn vào cuối file theo cú pháp:

```
Host ubuntu-server
    HostName <IP-Ubuntu>   # Thay <IP-Ubuntu> bằng địa chỉ IP của Ubuntu Server
    User ubuntu
    Port 22
```

> **Lưu ý:**
>
> * `Host`: Tên gợi nhớ bạn tự đặt để quản lý kết nối.
>
> * `HostName`: IP thực tế của máy Ubuntu Server.
>
> * `User`: Tên người dùng đăng nhập trên Ubuntu Server.
>
> * Nếu bạn dùng SSH Key thay vì password, bổ sung dòng: `IdentityFile ~/.ssh/id_rsa`

5. Nhấn `Ctrl + S` để lưu file config.

### Bước 3: Kết nối tới Ubuntu Server

1. Nhấn nút góc dưới cùng bên trái của VS Code (biểu tượng `<>` xanh lá/xanh dương) hoặc bấm `Ctrl + Shift + P` -> gõ `Remote-SSH: Connect to Host...`.

2. Chọn `ubuntu-server` (tên Host bạn vừa cấu hình ở Bước 2).

3. Một cửa sổ VS Code mới sẽ mở ra.

4. Nếu được hỏi hệ điều hành target, chọn **Linux**.

5. Nhập mật khẩu tài khoản người dùng của Ubuntu Server khi được yêu cầu.

6. Khi góc dưới bên trái VS Code hiển thị `SSH: ubuntu-server`, bạn đã kết nối thành công!

7. Chọn menu **File > Open Folder...** và chọn thư mục chứa dự án trên Server (VD: `/home/ubuntu/sdm332_project`) để bắt đầu làm việc.

---

## Phần 2: Tạo cặp khóa SSL (nginx.key & nginx.crt) cho Nginx

Trong file `docker-compose.yml` và `nginx.conf`, Nginx mount volume và load hai file chứng chỉ từ thư mục `./nginx/certs`:

* `/etc/nginx/certs/nginx.crt`

* `/etc/nginx/certs/nginx.key`

Dưới đây là các bước tạo hai file chứng chỉ này trên Server.

### Bước 1: Tạo thư mục nginx/certs

Truy cập vào thư mục gốc của dự án trên Ubuntu Server (thông qua terminal của VS Code hoặc terminal hệ thống) và chạy lệnh:

```
# Di chuyển vào thư mục dự án
cd /path/to/your/project

# Tạo thư mục nginx/certs nếu chưa có
mkdir -p nginx/certs
```

### Bước 2: Sinh khóa private key và chứng chỉ certificate

Chạy lệnh OpenSSL bên dưới để tạo chứng chỉ tự ký (Self-Signed Certificate) có thời hạn 365 ngày:

```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/nginx.key \
  -out nginx/certs/nginx.crt \
  -subj "/C=VN/ST=ThaiNguyen/L=ThaiNguyen/O=SDM332/OU=DevOps/CN=192.168.123.123"
```

**Giải thích các thông số:**

* `-x509`: Yêu cầu tạo chứng chỉ x509 tự ký thay vì tạo Certificate Signing Request (CSR).

* `-nodes`: Không mã hóa private key (để Nginx có thể khởi động tự động mà không cần nhập passphrase).

* `-days 365`: Thời hạn hiệu lực của chứng chỉ là 1 năm.

* `-newkey rsa:2048`: Tạo đồng thời cặp khóa RSA 2048-bit mới.

* `-keyout nginx/certs/nginx.key`: Đường dẫn lưu trữ Private Key.

* `-out nginx/certs/nginx.crt`: Đường dẫn lưu trữ Certificate.

* `-subj "..."`: Thiết lập thông tin mặc định cho chứng chỉ:

  * `C=VN`: Quốc gia (Vietnam).

  * `ST=ThaiNguyen`: Tỉnh/Thành phố.

  * `L=ThaiNguyen`: Thị xã/Quận/Huyện.

  * `O=SDM332`: Tên tổ chức/Dự án.

  * `CN=192.168.123.123`: Common Name (Điền IP Server hoặc tên miền của bạn).

### Bước 3: Kiểm tra & Phân quyền file

1. **Kiểm tra xem 2 file đã được tạo thành công chưa:**

```
ls -la nginx/certs/
```

Kết quả đầu ra phải chứa đủ 2 file:

```
-rw-r--r-- 1 ubuntu ubuntu 1300 Oct  2 01:00 nginx.crt
-rw------- 1 ubuntu ubuntu 1700 Oct  2 01:00 nginx.key
```

2. **Phân quyền truy cập an toàn cho khóa:**

```
chmod 600 nginx/certs/nginx.key
chmod 644 nginx/certs/nginx.crt
```

---

## Phần 3: Khởi chạy dự án với Docker Compose

Sau khi hoàn tất cài đặt SSH và tạo chứng chỉ SSL, bạn có thể khởi chạy toàn bộ hệ thống bằng Docker Compose:

1. **Tạo file `.env`** (nếu chưa có) dựa trên cấu hình các biến môi trường được dùng trong `docker-compose.yml`.

2. **Khởi chạy hệ thống:**

```
docker compose up -d --build
```

3. **Truy cập các dịch vụ qua HTTPS:**

* **Frontend Web Application:** `https://<IP-Ubuntu>/`

* **Backend API (Swagger Docs):** `https://<IP-Ubuntu>/api/docs`

* **pgAdmin:** `https://<IP-Ubuntu>/pgadmin/`

* **Grafana:** `https://<IP-Ubuntu>/grafana/`

* **Prometheus:** `https://<IP-Ubuntu>/prometheus/`

> **Lưu ý về trình duyệt:** Do sử dụng chứng chỉ tự ký (Self-Signed SSL), trình duyệt sẽ cảnh báo *"Your connection is not private"* (Kết nối của bạn không phải là liên kết riêng tư). Hãy nhấn **Advanced (Nâng cao)** -> **Proceed to <IP-Ubuntu> (Tiếp tục truy cập)** để tiếp tục.

---

## Phần 4: Cấu hình kết nối CSDL với pgAdmin

Sau khi khởi chạy hệ thống, bạn cần kết nối pgAdmin với container PostgreSQL để quản lý cơ sở dữ liệu.

### Bước 1: Đăng nhập vào pgAdmin

1. Truy cập địa chỉ `https://<IP-Ubuntu>/pgadmin/` trên trình duyệt.
2. Nhập thông tin đăng nhập của pgAdmin (được cấu hình trong file `.env` hoặc `docker-compose.yml`):
* **Email / Username:** `PGADMIN_DEFAULT_EMAIL` (Mặc định thường là `admin@admin.com`)
* **Password:** `PGADMIN_DEFAULT_PASSWORD` (VD: `admin123`)

### Bước 2: Thêm máy chủ CSDL (Register Server)

1. Tại giao diện chính của pgAdmin, nhấp phải vào **Servers** ở menu cây bên trái -> chọn **Register** -> **Server...** (hoặc chọn biểu tượng **Add New Server** tại Dashboard).
2. Tại tab **General**:
* **Name:** Đặt tên gợi nhớ cho kết nối (VD: `PostgreSQL Server`).

### Bước 3: Cấu hình thông số kết nối (Tab Connection)

Chuyển sang tab **Connection** và điền thông tin chi tiết:

| Trường thông tin | Giá trị nhập |
| --- | --- |
| **Host name/address** | `db` *(Dùng tên service container của Postgres trong Docker Compose Network)* |
| **Port** | `5432` |
| **Maintenance database** | `postgres` (hoặc tên CSDL của bạn) |
| **Username** | `POSTGRES_USER` (VD: `postgres`) |
| **Password** | `POSTGRES_PASSWORD` (VD: `postgres123`) |

> **Lưu ý quan trọng:**
> * Vì pgAdmin và PostgreSQL đều chạy trong cùng một mạng Docker Compose (Docker Network), trường **Host name/address** cần nhập tên service của PostgreSQL định nghĩa trong `docker-compose.yml` (thường là `db` hoặc `postgres`), **không dùng** `localhost` hay IP máy chủ `127.0.0.1`.
> * Đánh dấu chọn **Save password?** nếu không muốn phải nhập lại mật khẩu trong các lần truy cập sau.

### Bước 4: Lưu kết nối & Kiểm tra

1. Nhấn nút **Save** để hoàn tất cài đặt.
2. Kiểm tra cây thư mục bên trái, nếu thấy danh sách các Databases hiển thị bình thường, bạn đã kết nối thành công pgAdmin với PostgreSQL Server.

---

## Phần 5: Cấu hình Grafana & Thiết lập Dashboards

### Bước 1: Đăng nhập Grafana & Khai báo Data Source

1. Truy cập địa chỉ `https://<IP-Ubuntu>/grafana/` trên trình duyệt.
2. Nhập thông tin đăng nhập của Grafana (được cấu hình trong file `.env` hoặc `docker-compose.yml`):
* **Email / Username:** `admin`
* **Password:** `GF_SECURITY_ADMIN_PASSWORD`
3. Thêm Prometheus Data Source:
* Vào menu trái: **Connections** -> **Data sources** -> nhấn **Add data source**.
* Chọn **Prometheus**.
* Tại mục **Prometheus server URL**, nhập: `http://prometheus:9090`
* Kéo xuống cuối trang và nhấn **Save & test**. (Nếu hiển thị thông báo "Data source is working" là thành công).
4. Thêm Loki Data Source:
* Vào menu trái: **Connections** -> **Data sources** -> nhấn **Add data source**.
* Chọn **Loki**.
* Tại mục **Loki server URL**, nhập: `http://loki:3100`
* Kéo xuống cuối trang và nhấn **Save & test**. (Nếu hiển thị thông báo "Data source is working" là thành công).

### Bước 2: Import các Dashboard giám sát (Container / Web / DB)

Bạn có thể sử dụng các **Community Dashboards chuẩn hóa sẵn của Grafana** bằng cách sử dụng tính năng **Import Dashboard ID**:

1. Vào menu **Dashboards** -> chọn **New** -> chọn **Import**:
* Dashboard giám sát Containers (cAdvisor)
  * **Import ID:** `14282`
  * **Chức năng:** Hiển thị thời gian thực CPU, RAM usage, Network I/O, Disk read/write của từng container (`sdm332_postgres`, `sdm332_backend`, `sdm332_nginx`, v.v.).
* Dashboard giám sát Cơ sở dữ liệu (PostgreSQL)
  * **Import ID:** `9628`
  * **Chức năng:** Giám sát số lượng kết nối (Active Connections), Queries per second (QPS), Buffer cache hit ratio, Locks, dung lượng CSDL.

2. **Dashboards** được sử dụng:

| Thành phần giám sát | Exporter thu thập | Endpoint Target Prometheus | Dashboard Grafana Gợi ý |
| --- | --- | --- | --- |
| **Container Metrics** | cAdvisor | `cadvisor:8080` | ID `14282` |
| **Database Metrics** | Postgres Exporter | `postgres-exporter:9187` | ID `9628` |