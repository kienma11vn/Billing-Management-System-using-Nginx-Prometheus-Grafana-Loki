import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      showDetails: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState((prevState) => ({ showDetails: !prevState.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-white dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center transition-colors">
            
            {/* Biểu tượng Cảnh báo Amber */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center mb-5 text-amber-500 dark:text-amber-400 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Badge Lỗi */}
            <span className="inline-block text-[11px] font-bold tracking-wider text-amber-800 dark:text-amber-300 uppercase bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 px-3 py-1 rounded-full">
              Hệ thống Hóa đơn • Lỗi giao diện
            </span>

            <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
              Đã xảy ra sự cố không mong muốn
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Giao diện tạm thời không thể hiển thị dữ liệu. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên nếu sự cố tiếp tục diễn ra.
            </p>

            {/* Khối hiển thị Chi tiết Kỹ thuật (Toggle) */}
            {this.state.error && (
              <div className="mt-4 text-left">
                <button
                  onClick={this.toggleDetails}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 mx-auto"
                >
                  <span>{this.state.showDetails ? 'Ẩn chi tiết kỹ thuật' : 'Xem chi tiết kỹ thuật'}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-amber-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-700/80 max-h-40">
                    {this.state.error.toString()}
                  </div>
                )}
              </div>
            )}

            {/* Các Nút Thao tác */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Tải lại trang</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Về Trang chủ</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;