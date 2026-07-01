import React from 'react';
import { POStatus } from '../types';
import { Check, ClipboardList, ShieldAlert, FileSignature, ShoppingBag, Truck, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

interface WorkflowVisualizerProps {
  currentStatus: POStatus;
}

interface StepConfig {
  status: POStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  { status: 'Draft', label: 'Draft', icon: ClipboardList },
  { status: 'Manager Approval', label: 'Mgr Approval', icon: ShieldAlert },
  { status: 'Finance Approval', label: 'Fin Approval', icon: FileSignature },
  { status: 'PO Generated', label: 'PO Issued', icon: CheckCircle2 },
  { status: 'Vendor Accepted', label: 'Vendor Ack', icon: ShoppingBag },
  { status: 'Delivered', label: 'Delivered', icon: Truck },
  { status: 'Invoice Received', label: 'Invoice Rec', icon: FileText },
  { status: 'Closed', label: 'Closed', icon: Check }
];

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ currentStatus }) => {
  const currentStepIndex = STEPS.findIndex(step => step.status === currentStatus);

  return (
    <div className="w-full py-4 px-2">
      {/* Desktop Horizontal View */}
      <div className="hidden lg:flex items-center justify-between w-full">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.status}>
              {/* Step Node */}
              <div className="flex flex-col items-center flex-1 relative min-w-[70px]">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-sap-status-success-bg border-sap-status-success-text text-sap-status-success-text'
                      : isActive
                      ? 'bg-sap-blue border-sap-blue text-white shadow-md scale-110'
                      : 'bg-white dark:bg-sap-gray-800 border-sap-gray-300 dark:border-sap-gray-700 text-sap-gray-400'
                  }`}
                  title={step.label}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <span
                  className={`mt-2 text-xs font-semibold text-center select-none truncate max-w-[85px] ${
                    isActive
                      ? 'text-sap-blue dark:text-sap-blue-medium font-bold'
                      : isCompleted
                      ? 'text-sap-status-success-text'
                      : 'text-sap-gray-500 dark:text-sap-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 relative -top-4 -mx-2">
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${
                      index < currentStepIndex
                        ? 'bg-sap-status-success-text'
                        : 'bg-sap-gray-200 dark:bg-sap-gray-700'
                    }`}
                  />
                  <ChevronRight
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 ${
                      index < currentStepIndex
                        ? 'text-sap-status-success-text'
                        : 'text-sap-gray-300 dark:text-sap-gray-600'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile/Tablet Vertical Timeline View */}
      <div className="lg:hidden flex flex-col space-y-4">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex items-start">
              {/* Node Column */}
              <div className="flex flex-col items-center mr-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${
                    isCompleted
                      ? 'bg-sap-status-success-bg border-sap-status-success-text text-sap-status-success-text'
                      : isActive
                      ? 'bg-sap-blue border-sap-blue text-white'
                      : 'bg-white dark:bg-sap-gray-800 border-sap-gray-300 dark:border-sap-gray-700 text-sap-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-10 mt-1 ${
                      index < currentStepIndex
                        ? 'bg-sap-status-success-text'
                        : 'bg-sap-gray-200 dark:bg-sap-gray-700'
                    }`}
                  />
                )}
              </div>

              {/* Content Column */}
              <div className="flex flex-col pt-0.5">
                <span
                  className={`text-sm font-semibold ${
                    isActive
                      ? 'text-sap-blue dark:text-sap-blue-medium font-bold'
                      : 'text-sap-gray-700 dark:text-sap-gray-300'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-xs text-sap-gray-400 dark:text-sap-gray-500">
                  {isActive
                    ? 'Current workflow stage'
                    : isCompleted
                    ? 'Completed stage'
                    : 'Upcoming stage'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
