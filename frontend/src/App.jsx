import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { UserRole } from './constants/enums';

// Trang chủ & Trang xác thực
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000,
		},
	},
});

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<ThemeProvider>
					<Router>
						<Routes>
							{/* 1. Trang chủ công khai (Landing Page) */}
							<Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />

							{/* 2. Public Authentication Routes */}
							<Route path="/login" element={<ErrorBoundary>
								<LoginPage />
							</ErrorBoundary>} />
							<Route path="/unauthorized" element={<ErrorBoundary>
								<UnauthorizedPage />
							</ErrorBoundary>} />

							{/* 3. Role 1: Admin Routes */}
							<Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, 'admin']} />}>
								<Route path="/admin/dashboard" element={<ErrorBoundary>
									<AdminDashboard />
								</ErrorBoundary>} />
							</Route>

							{/* 4. Role 2: Staff Routes */}
							<Route element={<ProtectedRoute allowedRoles={[UserRole.STAFF, 'staff', UserRole.ADMIN, 'admin']} />}>
								<Route path="/staff/dashboard" element={<ErrorBoundary>
									<StaffDashboard />
								</ErrorBoundary>} />
							</Route>

							{/* Quên mật khẩu */}
							<Route path="/forgot-password" element={<ErrorBoundary>
								<ForgotPasswordPage />
							</ErrorBoundary>} />
							<Route path="/reset-password" element={<ErrorBoundary>
								<ResetPasswordPage />
							</ErrorBoundary>} />

							{/* Điều hướng mặc định nếu không khớp route */}
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</Router>
				</ThemeProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}