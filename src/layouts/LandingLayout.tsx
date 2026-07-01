import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';

export const LandingLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-sap-bg-dark text-sap-gray-800 dark:text-sap-gray-100 transition-colors duration-200">
      {/* Landing Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 dark:bg-sap-bg-dark/80 backdrop-blur-md border-b border-sap-border-light dark:border-sap-border-dark z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sap-blue flex items-center justify-center text-white font-bold text-lg select-none">
              S
            </div>
            <div>
              <span className="text-sm font-bold text-sap-gray-900 dark:text-white leading-none">SAP Procurement</span>
              <span className="ml-1 text-[10px] bg-sap-accent text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">AI</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-sap-gray-500 dark:text-sap-gray-400 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 rounded-md focus:outline-none"
              title="Theme Toggle"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Workspace
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content slot */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-sap-gray-50 dark:bg-sap-gray-900/50 border-t border-sap-border-light dark:border-sap-border-dark py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs text-sap-gray-500 dark:text-sap-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-sap-blue flex items-center justify-center text-white font-bold text-xs select-none">
              S
            </div>
            <span className="font-semibold text-sap-gray-700 dark:text-sap-gray-300">SAP Procurement AI Assistant</span>
          </div>
          <div className="flex space-x-6">
            <a href="#features" className="hover:text-sap-blue">Features</a>
            <a href="#security" className="hover:text-sap-blue">Security</a>
            <a href="#compliance" className="hover:text-sap-blue">Compliance</a>
            <a href="#terms" className="hover:text-sap-blue">Terms</a>
          </div>
          <div>
            © 2026 SAP SE. Internal Corporate Sandbox Mockup.
          </div>
        </div>
      </footer>
    </div>
  );
};
