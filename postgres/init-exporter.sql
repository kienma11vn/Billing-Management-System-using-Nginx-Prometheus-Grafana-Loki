-- 1. Tạo user riêng cho exporter
CREATE USER postgres_exporter WITH PASSWORD 'ExporterStrongPass123!';

-- 2. Cấp quyền pg_monitor (quyền đọc toàn bộ thông số giám sát hệ thống)
GRANT pg_monitor TO postgres_exporter;