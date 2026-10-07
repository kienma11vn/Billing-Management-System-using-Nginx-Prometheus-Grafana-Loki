import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authApi from '../../api/authApi';
import ThemeToggle from '../../components/common/ThemeToggle';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Mã khôi phục không tồn tại hoặc đường dẫn không hợp lệ.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token) {
      setErrorMsg('Thiếu mã khôi phục. Vui lòng kiểm tra lại liên kết trong email.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ mật khẩu mới.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu không khớp.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.resetPassword(token, password);
      setSuccessMsg(res.data?.message || 'Đặt lại mật khẩu thành công! Đang chuyển hướng đến trang đăng nhập...');

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      console.error('Lỗi đặt lại mật khẩu:', err);
      if (err.response && err.response.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Không thể đặt lại mật khẩu. Vui lòng thử lại sau.');
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
            Đặt lại mật khẩu
          </h2>
          <p className="mt-1.5 text-center text-sm text-slate-600 dark:text-slate-400">
            Tạo mật khẩu mới cho tài khoản Hệ thống Quản lý Hóa đơn
          </p>
        </div>

        {/* Khung Form Đặt lại mật khẩu */}
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

            {/* Thẻ thông báo thành công */}
            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Input Mật khẩu mới */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu mới <span className="text-amber-500 font-bold">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={!token || !!successMsg}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 dark:placeholder-slate-500 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Input Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận Mật khẩu mới <span className="text-amber-500 font-bold">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={!token || !!successMsg}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 dark:placeholder-slate-500 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Checkbox hiện mật khẩu */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Hiện mật khẩu</span>
                </label>
              </div>

              {/* Nút Cập nhật mật khẩu */}
              <button
                type="submit"
                disabled={loading || !token || !!successMsg}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <span>Cập nhật mật khẩu</span>
                )}
              </button>
            </form>

            {/* Điều hướng về trang Đăng nhập */}
            <div className="mt-6 text-center text-sm">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <span>←</span>
                <span>Quay lại Đăng nhập</span>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}