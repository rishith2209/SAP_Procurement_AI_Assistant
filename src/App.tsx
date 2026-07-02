import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

// Layouts
import { SidebarLayout } from './layouts/SidebarLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LandingLayout } from './layouts/LandingLayout';

// Pages
import { LandingPage } from './features/dashboard/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { PurchaseOrdersPage } from './features/purchase-orders/PurchaseOrdersPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { VendorsPage } from './features/vendors/VendorsPage';
import { DocumentsPage } from './features/documents/DocumentsPage';
import { CoPilotPage } from './features/copilot/CoPilotPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents refetching cached mock data on window focus
      retry: false,
    },
  },
});

// Guard Route for workspace pages
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Landing View */}
                <Route element={<LandingLayout />}>
                  <Route path="/" element={<LandingPage />} />
                </Route>

                {/* Authentication View */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>

                {/* Protected Workspace Layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <SidebarLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/vendors" element={<VendorsPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/ai-assistant" element={<CoPilotPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                </Route>

                {/* Redirect any other URLs to landing or 404 */}
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
