import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import { getDashboardByRole } from '../utils/roleRedirect';

export default function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    if (user && user.role) {
      navigate(getDashboardByRole(user.role));
    } else {
      navigate('/login');
    }
  };

  // Hàm chuyển đổi vai trò tiếng Anh sang tiếng Việt cho Hệ thống Hóa đơn
  const getRoleLabel = (role) => {
    if (!role) return '';
    const r = String(role).toLowerCase();
    if (r.includes('admin')) return 'Quản trị viên';
    if (r.includes('staff')) return 'Nhân viên';
    return role;
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* 🖼️ Lớp Background Image Mờ toàn trang */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-60 transition-opacity"
        style={{ backgroundImage: `url('/bg_opacity.jpg')` }}
      />

      {/* Nội dung chính phủ lên trên Background */}
      <div className="relative z-10">

        {/* 1. Header Navigation */}
        <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[5rem] py-3 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-amber-500/30">
                🧾
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-300 bg-clip-text text-transparent">
                  BillingMaster
                </span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wider uppercase">
                  Hệ thống Quản lý Hóa đơn
                </p>
              </div>
            </Link>

            {/* Menu điều hướng */}
            <nav className="hidden md:flex items-center space-x-8 font-medium text-slate-600 dark:text-slate-300">
              <a href="#about" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Giới thiệu</a>
              <a href="#features" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Tính năng</a>
              <a href="#services" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Danh mục Dịch vụ</a>
              <a href="#contact" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Liên hệ</a>
            </nav>

            {/* Nút hành động Đăng nhập/Chuyển hướng + Thông tin người dùng */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={handleGoToDashboard}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                      <span>Vào Trang Quản lý</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    <button
                      onClick={logout}
                      className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition-all"
                    >
                      Đăng xuất
                    </button>
                  </div>
                  {user && (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-medium shadow-sm backdrop-blur-sm">
                      👋 Xin chào, <strong className="font-bold text-amber-800 dark:text-amber-300"><em className="italic">{getRoleLabel(user.role)}</em>: {user.full_name || user.email}</strong>!
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-5 py-2.5 rounded-xl border border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 font-medium transition-all"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/login"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-md shadow-amber-500/20 transition-all"
                  >
                    Trải nghiệm ngay
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 2. Hero Section (Giới thiệu) */}
        <section id="about" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-amber-50/50 via-slate-50/60 to-white/70 dark:from-slate-900/60 dark:via-slate-900/80 dark:to-slate-900/90 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Cột trái: Văn bản */}
              <div className="space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Giải pháp Quản lý Tài chính & Hóa đơn Minh bạch
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Quản lý Hóa đơn & Thu tiền <span className="text-amber-600 dark:text-amber-400">Chuyên nghiệp</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0">
                  Tối ưu hóa toàn bộ quy trình lập hóa đơn, tính toán chiết khấu, theo dõi thanh toán nhiều đợt và ghi nhận nhật ký hệ thống minh bạch cho doanh nghiệp.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={handleGoToDashboard}
                        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/30 transition-all text-center flex items-center justify-center gap-2"
                      >
                        <span>Truy cập Trang Quản Lý</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                      <button
                        onClick={logout}
                        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold shadow-sm transition-all text-center"
                      >
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/30 transition-all text-center"
                      >
                        Đăng nhập Hệ thống
                      </Link>
                    </>
                  )}
                </div>

                {/* Thống kê nhanh */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200/80 dark:border-slate-800">
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">100%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Chính xác & Minh bạch</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">04</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Trạng thái Thanh toán</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">Audit</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Nhật ký Giám sát</div>
                  </div>
                </div>
              </div>

              {/* Cột phải: Hình ảnh / Card minh họa Hóa đơn */}
              <div className="relative">
                <div className="absolute -inset-4 bg-amber-500/10 dark:bg-amber-500/20 rounded-3xl blur-2xl"></div>
                <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 transition-colors">
                  <div className="space-y-4">
                    
                    {/* Demo Card Hóa đơn */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-900/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                          📄
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">Hóa đơn #INV-2026-001</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Khách hàng: Công ty TNHH Công Nghệ ABC</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300">
                        PARTIAL (Thanh toán 1 phần)
                      </span>
                    </div>

                    {/* Chi tiết khoản thu */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Tổng tiền hàng:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">19.800.000 VNĐ</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Chiết khấu:</span>
                        <span className="font-medium text-red-500">-1.000.000 VNĐ</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>Thực thu (Final):</span>
                        <span className="text-amber-600 dark:text-amber-400">18.800.000 VNĐ</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                        <div className="text-xs text-slate-400 dark:text-slate-400">Đã thanh toán</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">5.000.000 VNĐ</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                        <div className="text-xs text-slate-400 dark:text-slate-400">Còn nợ</div>
                        <div className="font-bold text-amber-600 dark:text-amber-400">13.800.000 VNĐ</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Khu vực Tính năng nổi bật */}
        <section id="features" className="py-16 bg-gradient-to-b from-white/80 via-amber-50/20 to-slate-50/80 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900/95 border-y border-amber-100/60 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Nghiệp vụ Quản lý Toàn diện
              </span>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
                Tính năng Trọng tâm của Hệ thống
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 text-base">
                Tối ưu hóa thao tác cho Nhân viên lập hóa đơn và hỗ trợ Quản trị viên theo dõi sát sao luồng tiền.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-xl border border-slate-100 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 group-hover:bg-amber-500 text-amber-600 dark:text-amber-400 group-hover:text-white flex items-center justify-center text-2xl transition-colors mb-6 shadow-sm">
                  💳
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Lập Hóa đơn & Chiết khấu
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tạo nhanh hóa đơn từ danh mục dịch vụ có sẵn, tùy chỉnh số lượng, đơn giá và áp dụng mức giảm giá linh hoạt cho khách hàng.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-xl border border-slate-100 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 group-hover:bg-amber-500 text-amber-600 dark:text-amber-400 group-hover:text-white flex items-center justify-center text-2xl transition-colors mb-6 shadow-sm">
                  📊
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Quản lý Thu tiền & Đợt thanh toán
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ghi nhận lịch sử thu tiền theo nhiều phương thức (Tiền mặt, Chuyển khoản). Tự động cập nhật trạng thái hóa đơn (Chưa thanh toán, 1 phần, Đã trả, Hủy).
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-xl border border-slate-100 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 group-hover:bg-amber-500 text-amber-600 dark:text-amber-400 group-hover:text-white flex items-center justify-center text-2xl transition-colors mb-6 shadow-sm">
                  🛡️
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Giám sát Nhật ký Audit Log
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Lưu trữ vết hoạt động chi tiết của từng nhân viên khi lập hóa đơn, nhận tiền hoặc hủy đơn, giúp Admin kiểm soát rủi ro tài chính hiệu quả.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Dịch vụ / Sản phẩm Mẫu */}
        <section id="services" className="py-20 bg-white/70 dark:bg-slate-900/80 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Danh mục Sản phẩm & Dịch vụ</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Các gói dịch vụ tiêu chuẩn được cập nhật kịp thời để lập hóa đơn nhanh chóng
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
              {[
                { title: 'Thiết kế Website Doanh Nghiệp', code: 'WEB-DEV', price: '15.000.000 VNĐ', desc: 'Gói thiết kế website chuẩn SEO, responsive cho doanh nghiệp.' },
                { title: 'Dịch vụ Cloud Hosting High-Speed', code: 'HOST-PRO', price: '2.400.000 VNĐ', desc: 'Hosting tốc độ cao, dung lượng 20GB, băng thông không giới hạn.' },
                { title: 'Bảo trì & Vận hành Hệ thống', code: 'MAINT-SYS', price: '5.000.000 VNĐ', desc: 'Gói bảo trì phần mềm và hạ tầng máy chủ hàng tháng.' },
                { title: 'Tư vấn & Tối ưu SEO Tổng thể', code: 'SEO-ADV', price: '8.000.000 VNĐ', desc: 'Đẩy từ khóa lên top Google và tối ưu trải nghiệm người dùng.' },
              ].map((service) => (
                <div key={service.code} className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-500 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800">
                      {service.code}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-lg">{service.price}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Footer */}
        <footer id="contact" className="bg-slate-900/95 backdrop-blur-md text-slate-400 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
                  🧾
                </div>
                <span className="text-lg font-bold text-white">Billing Management System</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm">
                Hệ thống hỗ trợ quản lý danh mục dịch vụ, lập hóa đơn thanh toán, theo dõi công nợ khách hàng và ghi nhận nhật ký hệ thống minh bạch.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Hỗ trợ Hệ thống</h4>
              <ul className="space-y-2 text-sm">
                <li>📍 Hà Nội, Việt Nam</li>
                <li>📞 Hotline: 0901 234 567</li>
                <li>✉️ Email: support@billing-system.vn</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Giờ vận hành</h4>
              <ul className="space-y-2 text-sm">
                <li>Thứ 2 - Thứ 6: 08:00 - 17:30</li>
                <li>Thứ 7: 08:00 - 12:00</li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            © 2026 Billing Management System. Tất cả quyền được bảo lưu.
          </div>
        </footer>

      </div>
    </div>
  );
}