import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from '../hooks/useQueries';
import { Badge } from '../components/Badge';
import { User, ClipboardList, Shield, ShieldCheck, Mail, Users } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data: dash } = useDashboardData();

  const activities = dash?.activities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">User ERP Profile</h2>
        <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">View corporate profile assignments, authorization limits, and audit logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Profile Card */}
        <div className="fiori-card p-6 bg-white dark:bg-sap-card-dark flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-sap-blue flex items-center justify-center text-white font-extrabold text-2xl shadow">
            {user?.avatar || 'MC'}
          </div>
          <div>
            <h3 className="text-base font-bold text-sap-gray-800 dark:text-white">{user?.name}</h3>
            <p className="text-xs text-sap-gray-500 mt-1">{user?.role}</p>
          </div>
          
          <Badge type="success">Active Session</Badge>

          <div className="w-full border-t border-sap-border-light dark:border-sap-border-dark pt-4 space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-sap-gray-500 font-semibold flex items-center"><Mail className="w-4 h-4 mr-2" /> Email</span>
              <span className="font-bold text-sap-gray-700 dark:text-sap-gray-300">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sap-gray-500 font-semibold flex items-center"><Users className="w-4 h-4 mr-2" /> Department</span>
              <span className="font-bold text-sap-gray-700 dark:text-sap-gray-300">{user?.department}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sap-gray-500 font-semibold flex items-center"><Shield className="w-4 h-4 mr-2" /> Clear Limit</span>
              <span className="font-bold text-sap-accent-dark dark:text-sap-accent">${user?.approvalLimit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities Log */}
        <div className="fiori-card p-6 bg-white dark:bg-sap-card-dark lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white uppercase tracking-wider mb-2 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-sap-blue-medium" /> Operational Audit Logs
          </h3>

          <div className="relative border-l-2 border-sap-gray-200 dark:border-sap-gray-800 pl-4 space-y-5 py-2">
            {activities.length === 0 ? (
              <p className="text-sap-gray-400">No recent activities logged in this session.</p>
            ) : (
              activities.map((act: any) => (
                <div key={act.id} className="relative">
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-[22px] top-0.5 w-3.5 h-3.5 rounded-full bg-sap-blue border-2 border-white dark:border-sap-card-dark flex items-center justify-center">
                    <ShieldCheck className="w-2.5 h-2.5 text-white" />
                  </span>
                  
                  <div className="space-y-1">
                    <p className="font-bold text-sap-gray-800 dark:text-white">{act.description}</p>
                    <div className="flex items-center text-[10px] text-sap-gray-400 space-x-2">
                      <span>Operator: <strong>{act.user}</strong></span>
                      <span>•</span>
                      <span>{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
