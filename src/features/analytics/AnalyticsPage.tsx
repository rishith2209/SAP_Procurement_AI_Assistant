import React, { useState } from 'react';
import { usePurchaseOrders, useVendors } from '../../hooks/useQueries';
import { SkeletonCard, Skeleton } from '../../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Calendar, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { data: pos = [], isLoading: poLoading } = usePurchaseOrders();
  const { data: vendors = [], isLoading: vendorLoading } = useVendors();

  const [dateRange, setDateRange] = useState('6M');

  const isLoading = poLoading || vendorLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Monthly Spend curve (aggregating real PO data)
  const monthlyData: Record<string, { spend: number; count: number }> = {};
  pos.forEach(po => {
    const month = po.orderDate.slice(5, 7); // 'MM'
    const nameMap: Record<string, string> = { '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul' };
    const monthName = nameMap[month] || 'Other';
    
    if (monthName !== 'Other') {
      if (!monthlyData[monthName]) monthlyData[monthName] = { spend: 0, count: 0 };
      monthlyData[monthName].spend += po.amount;
      monthlyData[monthName].count += 1;
    }
  });

  const spendTrendData = Object.entries(monthlyData).map(([month, val]) => ({
    name: month,
    spend: val.spend,
    requisitions: val.count
  }));

  // Vendor Performance Bar Charts (top 5 spend partners)
  const sortedVendors = [...vendors].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);
  const vendorPerformanceData = sortedVendors.map(v => ({
    name: v.name.split(' ')[0], // Short name
    Quality: v.performanceScore,
    Delivery: v.deliveryScore,
    Risk: v.riskScore
  }));

  // Cost savings calculations
  const totalAmountVal = pos.reduce((sum, po) => sum + po.amount, 0);
  const totalSavings = totalAmountVal * 0.084;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">ERP Analytics Cockpit</h2>
          <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">Data-driven operations audits and spend optimizations</p>
        </div>
        
        {/* Date Filters */}
        <div className="flex bg-white dark:bg-sap-gray-800 rounded-lg p-1 border border-sap-border-light dark:border-sap-border-dark w-fit">
          {['1M', '3M', '6M', 'YTD'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-xs font-bold rounded ${
                dateRange === range
                  ? 'bg-sap-blue text-white'
                  : 'text-sap-gray-600 dark:text-sap-gray-300 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Spend Analytics Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark flex items-center space-x-4">
          <div className="p-3 bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sap-gray-500 font-bold uppercase tracking-wide">Aggregate ERP Outlay</p>
            <h3 className="text-lg font-black mt-1 text-sap-gray-800 dark:text-white">${totalAmountVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark flex items-center space-x-4">
          <div className="p-3 bg-sap-status-success-bg text-sap-status-success-text rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sap-gray-500 font-bold uppercase tracking-wide">Optimized Savings Secured</p>
            <h3 className="text-lg font-black mt-1 text-sap-gray-800 dark:text-white">${totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark flex items-center space-x-4">
          <div className="p-3 bg-sap-status-info-bg text-sap-status-info-text rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sap-gray-500 font-bold uppercase tracking-wide">Audit Automation Index</p>
            <h3 className="text-lg font-black mt-1 text-sap-gray-800 dark:text-white">82.4%</h3>
          </div>
        </div>
      </div>

      {/* Recharts Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend Curve */}
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white uppercase tracking-wider mb-4">Requisitions Spend Cycles</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendTrendData}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005a9e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#005a9e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3b45" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
                <Area type="monotone" dataKey="spend" name="Spend Volume" stroke="#005a9e" fill="url(#spendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor score metrics */}
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark">
          <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white uppercase tracking-wider mb-4">Supplier Performance & Risk Ratings</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3b45" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Quality" fill="#107c41" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Delivery" fill="#005a9e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Risk" fill="#a80000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
