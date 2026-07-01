import React from 'react';

type BadgeType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  type?: BadgeType;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, type = 'neutral', className = '' }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
  
  const typeStyles = {
    success: 'bg-sap-status-success-bg text-sap-status-success-text dark:bg-sap-status-success-darkBg dark:text-sap-status-success-darkText',
    warning: 'bg-sap-status-warning-bg text-sap-status-warning-text dark:bg-sap-status-warning-darkBg dark:text-sap-status-warning-darkText',
    error: 'bg-sap-status-error-bg text-sap-status-error-text dark:bg-sap-status-error-darkBg dark:text-sap-status-error-darkText',
    info: 'bg-sap-status-info-bg text-sap-status-info-text dark:bg-sap-status-info-darkBg dark:text-sap-status-info-darkText',
    neutral: 'bg-sap-status-draft-bg text-sap-status-draft-text dark:bg-sap-status-draft-darkBg dark:text-sap-status-draft-darkText',
  };

  return (
    <span className={`${baseStyles} ${typeStyles[type]} ${className}`}>
      {children}
    </span>
  );
};

export const POStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let type: BadgeType = 'neutral';
  
  switch (status) {
    case 'Closed':
      type = 'neutral';
      break;
    case 'Draft':
      type = 'neutral';
      break;
    case 'Manager Approval':
    case 'Finance Approval':
      type = 'warning';
      break;
    case 'PO Generated':
    case 'Vendor Accepted':
      type = 'info';
      break;
    case 'Delivered':
    case 'Invoice Received':
      type = 'success';
      break;
    default:
      type = 'neutral';
  }

  return <Badge type={type}>{status}</Badge>;
};

export const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let type: BadgeType = 'neutral';

  switch (status) {
    case 'Paid':
      type = 'success';
      break;
    case 'Pending Approval':
    case 'Approved':
      type = 'warning';
      break;
    case 'Overdue':
    case 'Rejected':
      type = 'error';
      break;
    case 'Draft':
      type = 'neutral';
      break;
    default:
      type = 'neutral';
  }

  return <Badge type={type}>{status}</Badge>;
};
