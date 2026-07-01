import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Quick basic validation
    if (!email) {
      setError('Corporate email is required.');
      return;
    }
    if (!password) {
      setError('Account security password is required.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        if (rememberMe) {
          localStorage.setItem('sap_remembered_email', email);
        } else {
          localStorage.removeItem('sap_remembered_email');
        }
        navigate('/dashboard');
      } else {
        setError('Invalid S/4HANA credentials. Please check your credentials.');
      }
    } catch (_err) {
      setError('Authentication server timeout. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-sap-blue flex items-center justify-center text-white shadow-md mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">SAP Procurement Portal</h2>
        <p className="text-xs text-sap-gray-400 dark:text-sap-gray-500">Sign in to access corporate ERP sandbox</p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-sap-status-error-bg text-sap-status-error-text dark:bg-sap-status-error-darkBg dark:text-sap-status-error-darkText rounded-md font-semibold animate-fade-in">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-sap-gray-500 dark:text-sap-gray-400" htmlFor="email-input">
            Corporate Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-sap-gray-400 dark:text-sap-gray-500" />
            <input
              id="email-input"
              type="email"
              placeholder="name@sap-procurement.corp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fiori-input pl-9"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-sap-gray-500 dark:text-sap-gray-400" htmlFor="password-input">
              ERP Security Password
            </label>
            <button
              type="button"
              className="text-xs text-sap-blue dark:text-sap-blue-medium hover:underline"
              onClick={() => alert('For sandbox credentials, any password of 4+ characters will grant access.')}
            >
              Forgot Credentials?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-sap-gray-400 dark:text-sap-gray-500" />
            <input
              id="password-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fiori-input pl-9"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-sap-blue focus:ring-sap-blue-medium border-sap-border-light dark:border-sap-border-dark rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-sap-gray-600 dark:text-sap-gray-400">
              Remember Email
            </label>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5"
          isLoading={isLoading}
        >
          Authenticate Session
        </Button>
      </form>

      <div className="text-center pt-2">
        <p className="text-[10px] text-sap-gray-400 dark:text-sap-gray-500">
          SECURE CONNECTION ENFORCED • INTERNAL AUDIT REGISTERED
        </p>
      </div>
    </div>
  );
};
