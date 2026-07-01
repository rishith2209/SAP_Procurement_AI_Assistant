import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
      <div className="p-4 bg-sap-status-error-bg text-sap-status-error-text dark:bg-sap-status-error-darkBg dark:text-sap-status-error-darkText rounded-full mb-6 animate-bounce">
        <AlertCircle className="w-10 h-10" />
      </div>

      <h2 className="text-3xl font-extrabold text-sap-gray-900 dark:text-white mb-2">404 - Document Not Found</h2>
      
      <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400 max-w-md mb-8 leading-relaxed">
        The requested ERP S/4HANA document registry index could not be located in this directory. 
        It may have been archived, deleted, or moved to another ledger folder.
      </p>

      <Button
        variant="primary"
        onClick={() => navigate('/dashboard')}
        leftIcon={<Home className="w-4 h-4" />}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
