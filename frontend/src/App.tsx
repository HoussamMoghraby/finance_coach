import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/MainLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { RecurringTransactionsPage } from '@/pages/RecurringTransactionsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { InsightsPage } from '@/pages/InsightsPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AccountsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TransactionsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BudgetsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recurring"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RecurringTransactionsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ReportsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <InsightsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
