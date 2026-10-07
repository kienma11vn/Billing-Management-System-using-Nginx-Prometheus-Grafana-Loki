from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers import auth, users, customers, services, invoices, audit_logs

app = FastAPI(title="Billing Management API")

# Tự động xuất metrics tại endpoint /metrics
Instrumentator().instrument(app).expose(app)

# Danh sách các origin được phép gọi API (Frontend Vite React)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # Cho phép các Domain trong danh sách
    allow_credentials=True,    # Cho phép gửi Cookie / Authorization Headers
    allow_methods=["*"],       # Cho phép tất cả các phương thức HTTP (GET, POST, PUT, DELETE, OPTIONS, v.v.)
    allow_headers=["*"],       # Cho phép tất cả các Headers
)

# Đăng ký các Router
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(services.router, prefix="/api/v1/services", tags=["Services"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["Invoices"])
app.include_router(audit_logs.router, prefix="/api/v1/audit-logs", tags=["Audit Logs"])