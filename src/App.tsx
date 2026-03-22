import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { UnreadCountProvider } from '@/context/UnreadCountContext';
import { ToastProvider } from '@/components/ui/toast-provider';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/auth/Login';
import { Signup } from '@/pages/auth/Signup';
import { Home } from '@/pages/Home';
import { Browse } from '@/pages/Browse';

import { Profile } from '@/pages/Profile';
import { CreateListing } from '@/pages/CreateListing';
import { ListingDetail } from '@/pages/ListingDetail';
import { Messages } from '@/pages/Messages';
import { MyListings } from '@/pages/MyListings';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { SubjectPage } from '@/pages/SubjectPage';

export function App() {
  return (
    <AuthProvider>
      <UnreadCountProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/create" element={<CreateListing />} />
                <Route path="/my-listings" element={<MyListings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/subject/:subject_code" element={<SubjectPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </UnreadCountProvider>
    </AuthProvider>
  );
}

export default App;
