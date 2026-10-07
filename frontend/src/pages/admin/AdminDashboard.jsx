import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import ChangePassword from '../../components/common/ChangePassword';

// Import các màn hình quản lý tương ứng với API Routers Backend
import InvoiceManagement from './InvoiceManagement';   // Mapping: /api/v1/invoices
import CustomerManagement from './CustomerManagement'; // Mapping: /api/v1/customers
import ServiceManagement from './ServiceManagement';   // Mapping: /api/v1/services
import AccountManagement from './AccountManagement';   // Mapping: /api/v1/users
import AuditLogManagement from './AuditLogManagement'; // Mapping: /api/v1/audit-logs

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('invoices');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Danh mục tab chức năng xác định dựa trên Backend Routers
  const navItems = [
    { id: 'invoices', label: 'Quản lý Hóa đơn', icon: '🧾', description: 'Lập, thu tiền & hủy hóa đơn' },
    { id: 'customers', label: 'Quản lý Khách hàng', icon: '👥', description: 'Danh sách & thông tin khách hàng' },
    { id: 'services', label: 'Danh mục Dịch vụ', icon: '🏷️', description: 'Đơn giá & trạng thái kinh doanh' },
    { id: 'accounts', label: 'Tài khoản Người dùng', icon: '👤', description: 'Quản lý tài khoản & phân quyền' },
    { id: 'logs', label: 'Nhật ký Hệ thống', icon: '📜', description: 'Audit logs lịch sử thao tác' },
    { id: 'security', label: 'Đổi mật khẩu', icon: '🔑', description: 'Cập nhật mật khẩu cá nhân' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans transition-colors duration-200">
      
      {/* Top Header trên thiết bị Di động */}
      <div className="md:hidden bg-slate-900 text-slate-100 p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md shadow-amber-500/20">
            🧾
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">Hệ thống Hóa đơn</h1>
            <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Admin Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white focus:outline-none border border-slate-700"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex w-full md:w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex-shrink-0 flex-col justify-between border-r border-slate-800/80 transition-colors z-20`}
      >
        <div>
          {/* Brand Logo Header (Desktop) */}
          <div className="hidden md:flex p-5 border-b border-slate-800/80 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xl shadow-md shadow-amber-500/20">
              🧾
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Quản lý Hóa đơn</h1>
              <span className="text-[11px] text-amber-400 font-semibold tracking-wider uppercase">Admin Portal</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 sm:p-4 space-y-1.5">
            {navItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-left truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Khối Thông tin User & Thao tác dưới Sidebar */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="pt-2 border-t border-slate-800/60">
            <div className="mb-3 px-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Đang đăng nhập</p>
              <p className="text-sm font-bold text-white truncate mt-0.5">{user?.full_name || user?.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  {user?.role || 'ADMIN'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Trực tuyến"></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <button
                onClick={logout}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800/60 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Area Nội dung chính */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <ErrorBoundary key={activeTab}>
          {activeTab === 'invoices' && <InvoiceManagement />}
          {activeTab === 'customers' && <CustomerManagement />}
          {activeTab === 'services' && <ServiceManagement />}
          {activeTab === 'accounts' && <AccountManagement />}
          {activeTab === 'logs' && <AuditLogManagement />}
          {activeTab === 'security' && <ChangePassword />}
        </ErrorBoundary>
      </main>

    </div>
  );
}