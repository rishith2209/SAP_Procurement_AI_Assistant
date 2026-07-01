import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePurchaseOrders, useUpdatePOStatus } from '../../hooks/useQueries';
import { SkeletonTable } from '../../components/Skeleton';
import { POStatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { WorkflowVisualizer } from '../../components/WorkflowVisualizer';
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, ArrowLeft, Check, Calendar } from 'lucide-react';
import { POStatus, PurchaseOrder } from '../../types';

export const PurchaseOrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: pos = [], isLoading, error } = usePurchaseOrders();
  const updatePOStatusMutation = useUpdatePOStatus();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Sort state
  const [sortField, setSortField] = useState<'amount' | 'orderDate' | 'deliveryDate' | 'poNumber'>('poNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected PO for Side Drawer
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Sync search from URL params if any
  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) setSearchQuery(searchVal);
  }, [searchParams]);

  if (error) {
    return (
      <div className="p-6 text-center bg-sap-status-error-bg text-sap-status-error-text dark:bg-sap-status-error-darkBg dark:text-sap-status-error-darkText rounded-xl">
        <h3 className="font-bold">Error loading Purchase Orders</h3>
        <p className="text-xs mt-1">Check database tables or connection rules.</p>
      </div>
    );
  }

  // Handle sorting toggles
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Extract departments for dropdown
  const departments = Array.from(new Set(pos.map(po => po.department)));

  // Filter logic
  const filteredPOs = pos.filter(po => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'APPROVALS' && ['Manager Approval', 'Finance Approval'].includes(po.status)) ||
      po.status === statusFilter;

    const matchesDept = deptFilter === 'ALL' || po.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Sort logic
  const sortedPOs = [...filteredPOs].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'amount') comparison = a.amount - b.amount;
    else if (sortField === 'poNumber') comparison = a.poNumber.localeCompare(b.poNumber);
    else {
      comparison = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedPOs.length / itemsPerPage);
  const paginatedPOs = sortedPOs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleApprove = (po: PurchaseOrder) => {
    let nextStatus: POStatus = po.status;
    if (po.status === 'Manager Approval') nextStatus = 'Finance Approval';
    else if (po.status === 'Finance Approval') nextStatus = 'PO Generated';

    updatePOStatusMutation.mutate(
      { id: po.id, status: nextStatus },
      {
        onSuccess: (updated) => {
          setSelectedPO(updated);
        }
      }
    );
  };

  const isPendingApproval = selectedPO && ['Manager Approval', 'Finance Approval'].includes(selectedPO.status);

  return (
    <div className="space-y-6 relative h-full">
      {/* Top controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">Purchase Requisitions</h2>
          <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">Manage S/4HANA PO records, track approvals, and release orders.</p>
        </div>
      </div>

      {/* Tabs / Filters Panel */}
      <div className="fiori-card bg-white dark:bg-sap-card-dark p-4 space-y-4">
        {/* Status Tab Group */}
        <div className="flex flex-wrap border-b border-sap-border-light dark:border-sap-border-dark text-xs">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'APPROVALS', label: 'Pending Approvals' },
            { id: 'Draft', label: 'Draft' },
            { id: 'PO Generated', label: 'Issued' },
            { id: 'Delivered', label: 'Delivered' },
            { id: 'Closed', label: 'Closed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 -mb-px font-bold border-b-2 transition-all ${
                statusFilter === tab.id
                  ? 'border-sap-blue text-sap-blue dark:border-sap-blue-medium dark:text-sap-blue-medium'
                  : 'border-transparent text-sap-gray-500 hover:text-sap-gray-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input and Select Fields */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-sap-gray-400 dark:text-sap-gray-500" />
            <input
              type="text"
              placeholder="Search by PO #, Supplier, or Department..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="fiori-input pl-10"
            />
          </div>

          <div className="flex gap-2 min-w-[200px]">
            <div className="relative w-full">
              <SlidersHorizontal className="absolute left-3 top-2.5 w-4 h-4 text-sap-gray-400" />
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="fiori-input pl-9 appearance-none cursor-pointer pr-8"
              >
                <option value="ALL">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="fiori-card bg-white dark:bg-sap-card-dark overflow-hidden">
        {isLoading ? (
          <div className="p-6"><SkeletonTable cols={6} rows={6} /></div>
        ) : sortedPOs.length === 0 ? (
          <div className="p-16 text-center text-xs text-sap-gray-400">
            No matching Purchase Orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="fiori-table-header select-none">
                  <th className="p-4 cursor-pointer" onClick={() => handleSort('poNumber')}>
                    <span className="flex items-center">PO Number {sortField === 'poNumber' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />)}</span>
                  </th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Department</th>
                  <th className="p-4 cursor-pointer text-right" onClick={() => handleSort('amount')}>
                    <span className="flex items-center justify-end">Amount {sortField === 'amount' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />)}</span>
                  </th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSort('deliveryDate')}>
                    <span className="flex items-center">Delivery Date {sortField === 'deliveryDate' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />)}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-border-light dark:divide-sap-border-dark">
                {paginatedPOs.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => setSelectedPO(po)}
                    className="fiori-table-row cursor-pointer"
                  >
                    <td className="p-4 font-bold text-sap-blue dark:text-sap-blue-medium">{po.poNumber}</td>
                    <td className="p-4 font-semibold text-sap-gray-800 dark:text-white">{po.vendorName}</td>
                    <td className="p-4 text-sap-gray-500">{po.department}</td>
                    <td className="p-4 text-right font-bold text-sap-gray-800 dark:text-white">${po.amount.toLocaleString()}</td>
                    <td className="p-4 text-center"><POStatusBadge status={po.status} /></td>
                    <td className="p-4 text-sap-gray-500 font-medium">{po.deliveryDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center border-t border-sap-border-light dark:border-sap-border-dark text-xs">
            <span className="text-sap-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedPOs.length)} of {sortedPOs.length} items
            </span>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* PO Side Drawer Details */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedPO(null)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-sap-card-dark shadow-2xl h-full flex flex-col z-10 animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-sap-border-light dark:border-sap-border-dark bg-sap-gray-50 dark:bg-sap-gray-800/50 flex justify-between items-center">
              <button
                onClick={() => setSelectedPO(null)}
                className="p-1 rounded-md text-sap-gray-500 hover:bg-sap-gray-200 dark:hover:bg-sap-gray-800 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span className="text-xs font-bold">Back to List</span>
              </button>
              <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white">Document Details</h3>
            </div>

            {/* Content Container */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-extrabold text-sap-blue dark:text-sap-blue-medium">{selectedPO.poNumber}</h4>
                  <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400 mt-1">{selectedPO.department} Cost Center</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-sap-gray-800 dark:text-white">${selectedPO.amount.toLocaleString()}</span>
                  <div className="mt-1.5"><POStatusBadge status={selectedPO.status} /></div>
                </div>
              </div>

              {/* Workflow visualizer */}
              <div className="fiori-card bg-sap-gray-50 dark:bg-sap-gray-800/30 p-4 border border-sap-border-light dark:border-sap-border-dark rounded-xl">
                <h5 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider mb-2">Requisition Progression Timeline</h5>
                <WorkflowVisualizer currentStatus={selectedPO.status} />
              </div>

              {/* Vendor & Dates */}
              <div className="grid grid-cols-2 gap-6 text-xs border-t border-b border-sap-border-light dark:border-sap-border-dark py-4">
                <div className="space-y-1">
                  <p className="font-bold text-sap-gray-400 uppercase tracking-wider">Supplier</p>
                  <p className="font-semibold text-sap-gray-800 dark:text-white">{selectedPO.vendorName}</p>
                  <p className="text-sap-gray-500">ID: {selectedPO.vendorId}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sap-gray-500">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    <span>Order Date: <strong>{selectedPO.orderDate}</strong></span>
                  </div>
                  <div className="flex items-center text-sap-gray-500">
                    <Calendar className="w-4 h-4 mr-1.5 text-sap-accent" />
                    <span>Delivery Date: <strong>{selectedPO.deliveryDate}</strong></span>
                  </div>
                </div>
              </div>

              {/* Item Lines */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider">Requisition Items</h5>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-sap-border-light dark:border-sap-border-dark text-sap-gray-400 font-bold text-left">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Quantity</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sap-border-light dark:divide-sap-border-dark">
                    {selectedPO.items.map(item => (
                      <tr key={item.id} className="py-2.5 text-sap-gray-700 dark:text-sap-gray-300">
                        <td className="py-2.5 font-medium">{item.description}</td>
                        <td className="py-2.5 text-center">{item.quantity}</td>
                        <td className="py-2.5 text-right">${item.unitPrice.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-bold text-sap-gray-800 dark:text-white">${item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-sap-border-light dark:border-sap-border-dark flex justify-between bg-sap-gray-50 dark:bg-sap-gray-800/50">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedPO(null)}
              >
                Close Panel
              </Button>

              {isPendingApproval && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(selectedPO)}
                  isLoading={updatePOStatusMutation.isPending}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Approve Requisition Step
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
