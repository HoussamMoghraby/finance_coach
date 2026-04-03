/**
 * Main layout component with navigation
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/dashboard" className="flex items-center text-xl font-bold text-primary-600">
                💰 Finance Coach
              </Link>
              <div className="hidden md:flex space-x-4 items-center">
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  Dashboard
                </Link>
                <Link to="/accounts" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  Accounts
                </Link>
                <Link to="/transactions" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  Transactions
                </Link>
                <Link to="/budgets" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  Budgets
                </Link>
                <Link to="/recurring" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  Recurring
                </Link>
                <Link to="/reports" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  Reports
                </Link>
                <Link to="/insights" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  AI Insights
                </Link>
                <Link to="/ai-coach" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  AI Coach
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};
