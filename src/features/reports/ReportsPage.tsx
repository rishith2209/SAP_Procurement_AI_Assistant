import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { FileSpreadsheet, FileText, Download, Play, CheckCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('spend');
  const [department, setDepartment] = useState('ALL');
  const [format, setFormat] = useState('pdf');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{ name: string; date: string; size: string } | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedReport(null);

    // Simulate audit calculations delay
    setTimeout(() => {
      setIsGenerating(false);
      const nameMap: Record<string, string> = {
        spend: 'Spend_Analysis_Report',
        vendor: 'Supplier_Compliance_Audit',
        invoice: 'Invoice_Reconciliation_Summary'
      };
      const baseName = nameMap[reportType] || 'Procurement_Export';
      
      setGeneratedReport({
        name: `${baseName}_Q2_2026_${department === 'ALL' ? 'Global' : department.replace(/[^a-zA-Z]/g, '')}.${format}`,
        date: new Date().toISOString().split('T')[0],
        size: format === 'pdf' ? '1.8 MB' : '420 KB'
      });
    }, 1500);
  };

  const handleDownload = () => {
    if (generatedReport) {
      alert(`Simulating file download: ${generatedReport.name} (${generatedReport.size}) has been written to local downloads folder.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">ERP Audits & Reports</h2>
        <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">Compile transactional audit registries, export ledger balances, and download PDF sheets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters Form */}
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark lg:col-span-2">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white uppercase tracking-wider mb-4">Report Parameters</h3>
          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-sap-gray-500" htmlFor="report-type-select">Audit Scope Type</label>
              <select
                id="report-type-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="fiori-input select-none"
              >
                <option value="spend">Spend Analysis & Requisitions Volume</option>
                <option value="vendor">Supplier Operational Compliance & Risk Audit</option>
                <option value="invoice">Accounts Payable Invoice Reconciliation</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-sap-gray-500" htmlFor="department-select">Target Cost Center</label>
                <select
                  id="department-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="fiori-input"
                >
                  <option value="ALL">All Departments (Global)</option>
                  <option value="IT & Infrastructure">IT & Infrastructure</option>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Operations & Logistics">Operations & Logistics</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-sap-gray-500" htmlFor="format-select">Output File Format</label>
                <select
                  id="format-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="fiori-input"
                >
                  <option value="pdf">Adobe PDF Document (.pdf)</option>
                  <option value="csv">Excel Spreadsheet (.csv)</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isGenerating}
              leftIcon={<Play className="w-4 h-4" />}
            >
              Compile Report Records
            </Button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark flex flex-col justify-between">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white uppercase tracking-wider mb-4">Export Registry</h3>
          
          {isGenerating ? (
            <div className="flex-grow flex flex-col items-center justify-center py-8 space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-sap-blue border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-sap-gray-500 animate-pulse">Running database audit routines...</p>
            </div>
          ) : generatedReport ? (
            <div className="flex-grow flex flex-col justify-between space-y-6">
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-sap-status-success-bg/25 border border-sap-status-success-text/20 rounded-xl flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-sap-status-success-text flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sap-status-success-text">Report Compiled Successfully</h4>
                    <p className="text-[10px] text-sap-gray-500 mt-0.5">S/4HANA records matching constraints verified.</p>
                  </div>
                </div>

                <div className="p-4 border border-sap-border-light dark:border-sap-border-dark rounded-xl flex items-center space-x-3 bg-sap-gray-50/20">
                  {format === 'pdf' ? <FileText className="w-8 h-8 text-red-600" /> : <FileSpreadsheet className="w-8 h-8 text-green-600" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate text-sap-gray-800 dark:text-white">{generatedReport.name}</p>
                    <p className="text-[10px] text-sap-gray-400">Created: {generatedReport.date} • {generatedReport.size}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="accent"
                size="sm"
                onClick={handleDownload}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full"
              >
                Download Export file
              </Button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-8 text-sap-gray-400 text-xs">
              <FileText className="w-8 h-8 text-sap-gray-300 mb-2" />
              <span>Configure report filters and click compile.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
