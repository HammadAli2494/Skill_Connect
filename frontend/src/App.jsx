import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { useAuth } from './context/AuthContext';
import { dashboardPath } from './utils/roleHome';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/auth/AuthPages';
import {
  AdminBookingsPage,
  AdminCategoriesPage,
  AdminHomePage,
  AdminProvidersPage,
  AdminReportsPage,
  AdminServicesPage,
  AdminUsersPage,
} from './pages/admin/AdminPages';
import {
  AccountPage,
  BookingDetailPage,
  CustomerBookingsPage,
  NotificationsPage,
  RequireRole,
} from './pages/customer/CustomerPages';
import {
  AvailabilityPage,
  ProviderBookingsPage,
  ProviderDashboardPage,
  ProviderProfilePage,
  ProviderReviewsPage,
  ProviderServicesPage,
  ServiceFormPage,
} from './pages/provider/ProviderPages';
import HomePage from './pages/public/HomePage';
import { PrivacyPage, TermsPage } from './pages/public/LegalPages';
import NotFoundPage from './pages/public/NotFoundPage';
import ProviderPage from './pages/public/ProviderPage';
import ServiceDetailPage from './pages/public/ServiceDetailPage';
import ServicesPage from './pages/public/ServicesPage';

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="px-4 py-16 text-center text-sm text-muted">Loading…</p>;
  if (user) {
    const next = new URLSearchParams(window.location.search).get('next');
    return <Navigate to={dashboardPath(user.role, next) || '/'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout><HomePage /></PublicLayout>} path="/" />
      <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
      <Route path="/services/:id" element={<PublicLayout><ServiceDetailPage /></PublicLayout>} />
      <Route path="/providers/:id" element={<PublicLayout><ProviderPage /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><GuestOnly><LoginPage /></GuestOnly></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><GuestOnly><RegisterPage /></GuestOnly></PublicLayout>} />
      <Route path="/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />
      <Route path="/reset-password" element={<PublicLayout><ResetPasswordPage /></PublicLayout>} />
      <Route path="/verify-email" element={<PublicLayout><VerifyEmailPage /></PublicLayout>} />
      <Route path="/privacy-policy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
      <Route path="/terms-and-conditions" element={<PublicLayout><TermsPage /></PublicLayout>} />

      <Route path="/bookings" element={<RequireRole role="customer"><CustomerBookingsPage /></RequireRole>} />
      <Route path="/bookings/:id" element={<RequireRole role={['customer', 'provider', 'admin']}><BookingDetailPage /></RequireRole>} />
      <Route path="/account" element={<RequireRole role={['customer', 'provider']}><AccountPage /></RequireRole>} />
      <Route path="/notifications" element={<RequireRole role={['customer', 'provider', 'admin']}><NotificationsPage /></RequireRole>} />

      <Route path="/provider" element={<RequireRole role="provider"><ProviderDashboardPage /></RequireRole>} />
      <Route path="/provider/services" element={<RequireRole role="provider"><ProviderServicesPage /></RequireRole>} />
      <Route path="/provider/services/new" element={<RequireRole role="provider"><ServiceFormPage /></RequireRole>} />
      <Route path="/provider/services/:id/edit" element={<RequireRole role="provider"><ServiceFormPage /></RequireRole>} />
      <Route path="/provider/bookings" element={<RequireRole role="provider"><ProviderBookingsPage /></RequireRole>} />
      <Route path="/provider/availability" element={<RequireRole role="provider"><AvailabilityPage /></RequireRole>} />
      <Route path="/provider/reviews" element={<RequireRole role="provider"><ProviderReviewsPage /></RequireRole>} />
      <Route path="/provider/profile" element={<RequireRole role="provider"><ProviderProfilePage /></RequireRole>} />

      <Route path="/admin" element={<RequireRole role="admin"><AdminHomePage /></RequireRole>} />
      <Route path="/admin/users" element={<RequireRole role="admin"><AdminUsersPage /></RequireRole>} />
      <Route path="/admin/providers" element={<RequireRole role="admin"><AdminProvidersPage /></RequireRole>} />
      <Route path="/admin/categories" element={<RequireRole role="admin"><AdminCategoriesPage /></RequireRole>} />
      <Route path="/admin/services" element={<RequireRole role="admin"><AdminServicesPage /></RequireRole>} />
      <Route path="/admin/bookings" element={<RequireRole role="admin"><AdminBookingsPage /></RequireRole>} />
      <Route path="/admin/reports" element={<RequireRole role="admin"><AdminReportsPage /></RequireRole>} />
      <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
    </Routes>
  );
}
