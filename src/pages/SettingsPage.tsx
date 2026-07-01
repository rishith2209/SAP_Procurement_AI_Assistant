import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/Button';
import { Settings, Shield, Bell, Moon, Sun, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Notification toggles
  const [notifyApprove, setNotifyApprove] = useState(true);
  const [notifyAlerts, setNotifyAlerts] = useState(true);
  const [notifyReports, setNotifyReports] = useState(false);
  const [language, setLanguage] = useState('EN');

  const handleSave = () => {
    alert('ERP Local configuration parameters successfully saved.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">System Settings</h2>
        <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">Configure theme profiles, email alerts, and local preferences.</p>
      </div>

      <div className="fiori-card bg-white dark:bg-sap-card-dark p-6 space-y-6 max-w-2xl text-xs">
        {/* Theme Settings */}
        <div className="space-y-3 pb-5 border-b border-sap-border-light dark:border-sap-border-dark">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white flex items-center">
            <Moon className="w-4.5 h-4.5 mr-2 text-sap-blue-medium" /> Visual Theme Profile
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sap-gray-500 font-semibold">Enable Night Mode theme (Evening Horizon)</span>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                theme === 'dark' ? 'bg-sap-blue' : 'bg-sap-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4 pb-5 border-b border-sap-border-light dark:border-sap-border-dark">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white flex items-center">
            <Bell className="w-4.5 h-4.5 mr-2 text-sap-blue-medium" /> Alert Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sap-gray-500 font-semibold">Notify when purchase requisitions await approvals</span>
              <input
                type="checkbox"
                checked={notifyApprove}
                onChange={(e) => setNotifyApprove(e.target.checked)}
                className="h-4 w-4 text-sap-blue focus:ring-sap-blue-medium border-sap-border-light rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sap-gray-500 font-semibold">Alert on overdue invoices and compliance risks</span>
              <input
                type="checkbox"
                checked={notifyAlerts}
                onChange={(e) => setNotifyAlerts(e.target.checked)}
                className="h-4 w-4 text-sap-blue focus:ring-sap-blue-medium border-sap-border-light rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sap-gray-500 font-semibold">Weekly compiled spend summary report delivery</span>
              <input
                type="checkbox"
                checked={notifyReports}
                onChange={(e) => setNotifyReports(e.target.checked)}
                className="h-4 w-4 text-sap-blue focus:ring-sap-blue-medium border-sap-border-light rounded"
              />
            </div>
          </div>
        </div>

        {/* Localization settings */}
        <div className="space-y-3 pb-5 border-b border-sap-border-light dark:border-sap-border-dark">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white flex items-center">
            <Globe className="w-4.5 h-4.5 mr-2 text-sap-blue-medium" /> Localization & Language
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sap-gray-500 font-semibold">Select corporate language dictionary</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="fiori-input max-w-[160px] appearance-none pr-8 cursor-pointer"
            >
              <option value="EN">English (US)</option>
              <option value="DE">Deutsch (DE)</option>
              <option value="FR">Français (FR)</option>
            </select>
          </div>
        </div>

        {/* Security Info */}
        <div className="space-y-3 pb-2">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white flex items-center">
            <Shield className="w-4.5 h-4.5 mr-2 text-sap-blue-medium" /> Session Security Profile
          </h3>
          <div className="flex justify-between items-center text-xs">
            <span className="text-sap-gray-500 font-semibold">Active ERP Connection Status</span>
            <span className="font-bold text-sap-status-success-text flex items-center">
              🟢 SECURED (INTERNAL WORKSPACE)
            </span>
          </div>
        </div>

        {/* Save Button */}
        <Button variant="primary" onClick={handleSave} className="w-full mt-4">
          Save Settings Profile
        </Button>
      </div>
    </div>
  );
};
