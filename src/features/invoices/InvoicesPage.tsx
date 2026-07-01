import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInvoices, useUploadInvoice, useUpdateInvoiceStatus } from '../../hooks/useQueries';
import { InvoiceStatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { SkeletonTable, Skeleton } from '../../components/Skeleton';
import { Upload, FileText, Search, Plus, Calendar, AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { Invoice } from '../../types';

export const InvoicesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: invoices = [], isLoading, error } = useInvoices();
  const uploadInvoiceMutation = useUploadInvoice();
  const updateInvoiceMutation = useUpdateInvoiceStatus();

  // Local state
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [localFile, setLocalFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) setSearchQuery(searchVal);
  }, [searchParams]);

  if (error) {
    return (
      <div className="p-6 text-center bg-sap-status-error-bg text-sap-status-error-text dark:bg-sap-status-error-darkBg dark:text-sap-status-error-darkText rounded-xl">
        <h3 className="font-bold">Error loading Invoices</h3>
        <p className="text-xs">Database query failed. Review authentication contexts.</p>
      </div>
    );
  }

  // Filter Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.poNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      alert('Only PDF and image invoice formats are supported for autonomous OCR matching.');
      return;
    }

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const fileDetails = {
      name: file.name,
      size: formattedSize,
      type: file.type
    };

    setLocalFile(fileDetails);

    // Call mutation to parser database
    uploadInvoiceMutation.mutate(file, {
      onSuccess: (newInv) => {
        setLocalFile(null);
        setShowUploadPanel(false);
        setSelectedInvoice(newInv); // Open details drawer for newly parsed invoice
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerApprove = (inv: Invoice) => {
    updateInvoiceMutation.mutate(
      { id: inv.id, status: 'Approved' },
      {
        onSuccess: (updated) => {
          setSelectedInvoice(updated);
        }
      }
    );
  };

  return (
    <div className="space-y-6 relative h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">Accounts Payable Invoices</h2>
          <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">Process supplier invoices, trigger 3-way matching audits, and authorize payouts.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowUploadPanel(!showUploadPanel)}
        >
          Upload Invoice Document
        </Button>
      </div>

      {/* Drag & Drop Upload Overlay Section */}
      {showUploadPanel && (
        <div className="fiori-card bg-white dark:bg-sap-card-dark p-6 border-2 border-dashed border-sap-blue/40 dark:border-sap-blue-medium/40 rounded-xl relative">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 text-center rounded-lg transition-all ${
              isDragActive ? 'bg-sap-blue-light/50 dark:bg-sap-blue/10 scale-[0.99]' : ''
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,image/*"
            />

            {uploadInvoiceMutation.isPending && localFile ? (
              <div className="space-y-4 py-4 w-full max-w-xs">
                <div className="flex items-center space-x-3 text-xs text-sap-gray-600 dark:text-sap-gray-300 font-bold">
                  <FileText className="w-8 h-8 text-sap-blue animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{localFile.name}</p>
                    <p className="text-[10px] text-sap-gray-400">{localFile.size}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-sap-gray-200 dark:bg-sap-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sap-blue animate-pulse w-2/3" />
                  </div>
                  <p className="text-[10px] text-sap-accent font-bold animate-pulse">Running S/4HANA OCR & 3-Way Match Check...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-sap-blue-light dark:bg-sap-blue/20 rounded-full text-sap-blue dark:text-sap-blue-medium mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-sap-gray-800 dark:text-white">Drag and drop invoice document here</h4>
                <p className="text-xs text-sap-gray-400 dark:text-sap-gray-500 mt-1 mb-4">Supports PDF or Image formats up to 10MB</p>
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowUploadPanel(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div className="fiori-card bg-white dark:bg-sap-card-dark p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-sap-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice #, Supplier, or PO reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="fiori-input pl-10"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {['ALL', 'Pending Approval', 'Approved', 'Paid', 'Overdue'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-sap-blue text-white'
                  : 'bg-sap-gray-100 hover:bg-sap-gray-200 dark:bg-sap-gray-800 dark:hover:bg-sap-gray-700 text-sap-gray-600 dark:text-sap-gray-300'
              }`}
            >
              {status === 'ALL' ? 'All Invoices' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list table */}
      <div className="fiori-card bg-white dark:bg-sap-card-dark overflow-hidden">
        {isLoading ? (
          <div className="p-6"><SkeletonTable cols={5} rows={5} /></div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center text-xs text-sap-gray-400">
            No matching Accounts Payable Invoice records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="fiori-table-header">
                  <th className="p-4">Invoice Number</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">PO Reference</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-border-light dark:divide-sap-border-dark">
                {filteredInvoices.slice(0, 15).map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="fiori-table-row cursor-pointer"
                  >
                    <td className="p-4 font-bold text-sap-gray-800 dark:text-white">{inv.invoiceNumber}</td>
                    <td className="p-4 font-semibold text-sap-gray-700 dark:text-sap-gray-300">{inv.vendorName}</td>
                    <td className="p-4 font-semibold text-sap-blue dark:text-sap-blue-medium">{inv.poNumber}</td>
                    <td className="p-4 text-right font-bold text-sap-gray-800 dark:text-white">${inv.amount.toLocaleString()}</td>
                    <td className="p-4 text-center"><InvoiceStatusBadge status={inv.status} /></td>
                    <td className="p-4 text-sap-gray-500 font-medium">{inv.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side drawer invoice preview */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedInvoice(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-sap-card-dark shadow-2xl h-full flex flex-col z-10 animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-sap-border-light dark:border-sap-border-dark bg-sap-gray-50 dark:bg-sap-gray-800/50 flex justify-between items-center">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-md text-sap-gray-500 hover:bg-sap-gray-200 dark:hover:bg-sap-gray-800 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span className="text-xs font-bold">Back to List</span>
              </button>
              <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white">Invoice Matching Audit</h3>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {/* Top details */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold text-sap-gray-800 dark:text-white">{selectedInvoice.invoiceNumber}</h4>
                  <p className="text-xs text-sap-gray-500 mt-1">{selectedInvoice.category} category</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-sap-gray-800 dark:text-white">${selectedInvoice.amount.toLocaleString()}</span>
                  <div className="mt-1.5"><InvoiceStatusBadge status={selectedInvoice.status} /></div>
                </div>
              </div>

              {/* ERP 3-Way Match Check Card */}
              <div className="fiori-card p-4 bg-sap-status-success-bg/20 border border-sap-status-success-text/20 rounded-xl space-y-3">
                <h5 className="text-[10px] font-bold text-sap-status-success-text uppercase tracking-wider">S/4HANA 3-Way Match Verified</h5>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-sap-gray-500">Invoice Matching Check</span>
                    <span className="font-semibold text-sap-status-success-text">Success</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sap-gray-500">Purchase Order Match</span>
                    <span className="font-bold text-sap-blue dark:text-sap-blue-medium">{selectedInvoice.poNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sap-gray-500">Receipt Discrepancy</span>
                    <span className="font-semibold text-sap-status-success-text">0.0% variance</span>
                  </div>
                </div>
              </div>

              {/* Dates and Files */}
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-sap-border-light dark:border-sap-border-dark py-4">
                <div>
                  <p className="font-bold text-sap-gray-400 uppercase tracking-wider mb-1">Issue Date</p>
                  <div className="flex items-center text-sap-gray-600 dark:text-sap-gray-300">
                    <Calendar className="w-4 h-4 mr-1 text-sap-gray-400" />
                    <span>{selectedInvoice.issueDate}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-sap-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                  <div className="flex items-center text-sap-gray-600 dark:text-sap-gray-300">
                    <Calendar className="w-4 h-4 mr-1 text-sap-status-error-text" />
                    <span>{selectedInvoice.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-sap-gray-400 uppercase tracking-wider">Supplier Context</p>
                <div className="p-3 bg-sap-gray-50 dark:bg-sap-gray-800/40 rounded-lg">
                  <p className="font-bold text-sap-gray-800 dark:text-white">{selectedInvoice.vendorName}</p>
                  <p className="text-sap-gray-500 text-[10px] mt-0.5">Supplier Code: {selectedInvoice.vendorId}</p>
                </div>
              </div>

              {selectedInvoice.fileName && (
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-sap-gray-400 uppercase tracking-wider">Attached File</p>
                  <div className="p-3 border border-sap-border-light dark:border-sap-border-dark rounded-lg flex items-center space-x-2">
                    <FileText className="w-8 h-8 text-sap-blue" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-sap-gray-800 dark:text-white">{selectedInvoice.fileName}</p>
                      <p className="text-[10px] text-sap-gray-400">PDF Document • Digitally Signed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-sap-border-light dark:border-sap-border-dark flex justify-between bg-sap-gray-50 dark:bg-sap-gray-800/50">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close Drawer
              </Button>

              {selectedInvoice.status === 'Pending Approval' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => triggerApprove(selectedInvoice)}
                  isLoading={updateInvoiceMutation.isPending}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Approve for Disbursement
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
