import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';
import { getDashboardByRole } from '../../utils/roleRedirect';
import ThemeToggle from '../../components/common/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      const tokenResponse = await authApi.login({ username: email, password });
      const accessToken = tokenResponse.data.access_token;

      localStorage.setItem('access_token', accessToken);

      const meResponse = await authApi.getMe();
      const currentUser = meResponse.data;

      login(accessToken, currentUser);

      const targetDashboard = getDashboardByRole(currentUser.role);
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      if (err.response && err.response.status === 401) {
        setErrorMsg('Email hoặc mật khẩu không chính xác.');
      } else if (err.response && err.response.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại Backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-amber-50/40 via-slate-50 to-amber-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      
      {/* 🖼️ Lớp Background Image / Pattern Mờ */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-25 dark:opacity-10 transition-opacity"
        style={{ backgroundImage: `url('/bg_opacity.jpg')` }}
      />

      {/* Nút Chuyển Light / Dark Mode */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* 🖼️ Thẻ bọc phủ toàn bộ nội dung lên trên background (z-10) */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Header Thương hiệu & Tiêu đề */}
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center items-center gap-3 group focus:outline-none">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 text-3xl shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform duration-200">
              🧾
            </div>
          </Link>
          <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hệ thống Quản lý Hóa đơn
          </h2>
          <p className="mt-1.5 text-center text-sm text-slate-600 dark:text-slate-400">
            Cổng thông tin thanh toán & quản lý dịch vụ
          </p>
        </div>

        {/* Khung Form Đăng nhập */}
        <div className="mt-8">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md py-8 px-4 shadow-xl shadow-amber-950/5 dark:shadow-black/40 sm:rounded-2xl sm:px-10 border border-slate-200/80 dark:border-slate-700/80">
            
            {/* Thẻ thông báo lỗi */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Input Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ Email <span className="text-amber-500 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhanvien@hoadon.vn"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all"
                />
              </div>

              {/* Input Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu <span className="text-amber-500 font-bold">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all"
                />

                {/* Checkbox hiện mật khẩu & liên kết quên mật khẩu */}
                <div className="flex items-center justify-between mt-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Hiện mật khẩu</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              {/* Nút Đăng nhập */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}