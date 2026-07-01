import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVendors, useUpdateVendor } from '../../hooks/useQueries';
import { SkeletonCard } from '../../components/Skeleton';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Search, Mail, Phone, MapPin, BarChart3, AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Vendor } from '../../types';

export const VendorsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: vendors = [], isLoading, error } = useVendors();
  const updateVendorMutation = useUpdateVendor();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) setSearchQuery(searchVal);
  }, [searchParams]);

  if (error) {
    return (
      <div className="p-6 text-center bg-sap-status-error-bg text-sap-status-error-text dark:bg-sap-status-error-darkBg dark:text-sap-status-error-darkText rounded-xl">
        <h3 className="font-bold">Error loading Vendor catalogs</h3>
        <p className="text-xs">Database lookup failed. Ensure local database files exist.</p>
      </div>
    );
  }

  // Filter lists
  const filteredVendors = vendors.filter(v => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || v.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(vendors.map(v => v.category)));

  // Score visual rendering helpers
  const getScoreColor = (score: number, isRisk = false) => {
    if (isRisk) {
      if (score < 20) return 'text-sap-status-success-text';
      if (score < 40) return 'text-sap-status-warning-text';
      return 'text-sap-status-error-text';
    }
    if (score >= 90) return 'text-sap-status-success-text';
    if (score >= 80) return 'text-sap-status-warning-text';
    return 'text-sap-status-error-text';
  };

  const handleStatusChange = (vendor: Vendor, newStatus: Vendor['status']) => {
    const updated = { ...vendor, status: newStatus };
    updateVendorMutation.mutate(updated, {
      onSuccess: (res) => {
        setSelectedVendor(res);
      }
    });
  };

  return (
    <div className="space-y-6 relative h-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">Supplier Master Ledger</h2>
        <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">Audit vendor performance records, analyze compliance risk ratings, and review spending volume.</p>
      </div>

      {/* Filters */}
      <div className="fiori-card bg-white dark:bg-sap-card-dark p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-sap-gray-400" />
          <input
            type="text"
            placeholder="Search by vendor name, vendor code, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="fiori-input pl-10"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="fiori-input max-w-[240px] appearance-none pr-8 cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Vendor Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="p-16 text-center text-xs text-sap-gray-400">
          No matching supplier catalogs found in ERP.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <div
              key={vendor.id}
              onClick={() => setSelectedVendor(vendor)}
              className="fiori-card fiori-card-hover bg-white dark:bg-sap-card-dark p-5 cursor-pointer flex flex-col space-y-4"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white truncate" title={vendor.name}>
                    {vendor.name}
                  </h3>
                  <span className="text-[10px] text-sap-gray-400 font-bold block mt-0.5">{vendor.code} • {vendor.category}</span>
                </div>
                <Badge
                  type={
                    vendor.status === 'Active'
                      ? 'success'
                      : vendor.status === 'Under Review'
                      ? 'warning'
                      : 'error'
                  }
                >
                  {vendor.status}
                </Badge>
              </div>

              {/* Spend Details */}
              <div className="border-t border-b border-sap-border-light dark:border-sap-border-dark py-2.5 flex justify-between items-center text-xs">
                <span className="text-sap-gray-500 font-medium">YTD Spend Volume</span>
                <span className="font-extrabold text-sap-gray-800 dark:text-white">${vendor.totalSpend.toLocaleString()}</span>
              </div>

              {/* KPI Score circles */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <p className="text-[9px] text-sap-gray-400 font-bold uppercase tracking-wider">Quality Score</p>
                  <span className={`text-base font-black ${getScoreColor(vendor.performanceScore)}`}>
                    {vendor.performanceScore}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-sap-gray-400 font-bold uppercase tracking-wider">On-Time Deliv</p>
                  <span className={`text-base font-black ${getScoreColor(vendor.deliveryScore)}`}>
                    {vendor.deliveryScore}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-sap-gray-400 font-bold uppercase tracking-wider">Risk Level</p>
                  <span className={`text-base font-black ${getScoreColor(vendor.riskScore, true)}`}>
                    {vendor.riskScore}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Drawer */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedVendor(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-sap-card-dark shadow-2xl h-full flex flex-col z-10 animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-sap-border-light dark:border-sap-border-dark bg-sap-gray-50 dark:bg-sap-gray-800/50 flex justify-between items-center">
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-1 rounded-md text-sap-gray-500 hover:bg-sap-gray-200 dark:hover:bg-sap-gray-800 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span className="text-xs font-bold">Back to List</span>
              </button>
              <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white">Supplier Audit Scorecard</h3>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {/* Header info */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold text-sap-gray-800 dark:text-white">{selectedVendor.name}</h4>
                  <p className="text-xs text-sap-gray-500 mt-1">{selectedVendor.code} • {selectedVendor.category}</p>
                </div>
                <Badge
                  type={
                    selectedVendor.status === 'Active'
                      ? 'success'
                      : selectedVendor.status === 'Under Review'
                      ? 'warning'
                      : 'error'
                  }
                >
                  {selectedVendor.status}
                </Badge>
              </div>

              {/* Score indicators */}
              <div className="fiori-card p-5 bg-sap-gray-50 dark:bg-sap-gray-800/30 rounded-xl space-y-4">
                <h5 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider mb-2">Performance Audit Breakdown</h5>
                
                {/* Score bar 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-sap-gray-600 dark:text-sap-gray-400">Quality Performance Rating</span>
                    <span className={getScoreColor(selectedVendor.performanceScore)}>{selectedVendor.performanceScore}/100</span>
                  </div>
                  <div className="h-2 w-full bg-sap-gray-200 dark:bg-sap-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sap-status-success-text rounded-full transition-all"
                      style={{ width: `${selectedVendor.performanceScore}%` }}
                    />
                  </div>
                </div>

                {/* Score bar 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-sap-gray-600 dark:text-sap-gray-400">Logistical Delivery Rating</span>
                    <span className={getScoreColor(selectedVendor.deliveryScore)}>{selectedVendor.deliveryScore}/100</span>
                  </div>
                  <div className="h-2 w-full bg-sap-gray-200 dark:bg-sap-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sap-blue rounded-full transition-all"
                      style={{ width: `${selectedVendor.deliveryScore}%` }}
                    />
                  </div>
                </div>

                {/* Score bar 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-sap-gray-600 dark:text-sap-gray-400">Operational Compliance Risk (Lower is better)</span>
                    <span className={getScoreColor(selectedVendor.riskScore, true)}>{selectedVendor.riskScore}/100</span>
                  </div>
                  <div className="h-2 w-full bg-sap-gray-200 dark:bg-sap-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sap-status-error-text rounded-full transition-all"
                      style={{ width: `${selectedVendor.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 text-xs">
                <h5 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider">Contact Ledger</h5>
                <div className="fiori-card p-4 space-y-3 bg-white dark:bg-sap-gray-900/40">
                  <div className="flex items-center space-x-3 text-sap-gray-600 dark:text-sap-gray-300">
                    <Mail className="w-4.5 h-4.5 text-sap-gray-400" />
                    <span>{selectedVendor.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sap-gray-600 dark:text-sap-gray-300">
                    <Phone className="w-4.5 h-4.5 text-sap-gray-400" />
                    <span>{selectedVendor.contact}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sap-gray-600 dark:text-sap-gray-300">
                    <MapPin className="w-4.5 h-4.5 text-sap-gray-400" />
                    <span>Corporate Offices: Global Logistics Center</span>
                  </div>
                </div>
              </div>

              {/* Spend Stats */}
              <div className="space-y-3 text-xs">
                <h5 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider">Financial Overview</h5>
                <div className="fiori-card p-4 bg-sap-blue-light/20 border border-sap-blue/20 dark:bg-sap-blue/10 dark:border-sap-blue-medium/20 text-xs flex justify-between items-center rounded-xl">
                  <div className="flex items-center space-x-2 text-sap-blue dark:text-sap-blue-medium">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-semibold">Year-to-Date Spend</span>
                  </div>
                  <span className="font-extrabold text-sap-gray-800 dark:text-white text-base">
                    ${selectedVendor.totalSpend.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer / Status Management controls */}
            <div className="p-4 border-t border-sap-border-light dark:border-sap-border-dark flex justify-between bg-sap-gray-50 dark:bg-sap-gray-800/50">
              <Button variant="secondary" size="sm" onClick={() => setSelectedVendor(null)}>
                Close Panel
              </Button>

              <div className="flex space-x-1.5">
                {selectedVendor.status !== 'Active' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-sap-status-success-text hover:bg-sap-status-success-bg border-sap-status-success-text/30"
                    onClick={() => handleStatusChange(selectedVendor, 'Active')}
                    isLoading={updateVendorMutation.isPending}
                    leftIcon={<CheckCircle2 className="w-4.5 h-4.5" />}
                  >
                    Set Active
                  </Button>
                )}

                {selectedVendor.status !== 'Suspended' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleStatusChange(selectedVendor, 'Suspended')}
                    isLoading={updateVendorMutation.isPending}
                    leftIcon={<AlertTriangle className="w-4.5 h-4.5" />}
                  >
                    Suspend Partner
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
