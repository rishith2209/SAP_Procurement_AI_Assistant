import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData, usePurchaseOrders, useInvoices, useDocuments, useUpdatePOStatus, useUpdateInvoiceStatus } from '../../hooks/useQueries';
import { SkeletonCard, Skeleton } from '../../components/Skeleton';
import { POStatusBadge, InvoiceStatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useData } from '../../contexts/DataContext';
import {
  DollarSign, TrendingUp, AlertCircle, Clock, ArrowRight,
  TrendingDown, Check, X, FileText, Bot, PlusCircle, Compass, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { setGlobalSearchQuery } = useData();

  // Load queries
  const { data: dash, isLoading: dashLoading, error: dashError } = useDashboardData();
  const { data: pos = [] } = usePurchaseOrders();
  const { data: invoices = [] } = useInvoices();
  const { data: docs = [] } = useDocuments();

  // Load mutations
  const updatePOMutation = useUpdatePOStatus();
  const updateInvMutation = useUpdateInvoiceStatus();

  if (dashLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (dashError || !dash) {
    return (
      <div className="p-8 text-center bg-sap-status-error-bg text-sap-status-error-text dark:bg-sap-status-error-darkBg dark:text-sap-status-error-darkText rounded-xl">
        <h3 className="text-lg font-bold">Failed to load ERP Dashboard data</h3>
        <p className="text-sm mt-1">Please ensure your security credentials are valid and refresh the page.</p>
      </div>
    );
  }

  const { kpis, alerts, insights, activities } = dash;

  // Process data for charts
  // 1. Monthly Spend Trend (Simulate last 6 months based on PO amounts)
  const monthlySpendData = [
    { month: 'Jan', spend: kpis.totalSpend * 0.14, savings: kpis.costSavings * 0.12 },
    { month: 'Feb', spend: kpis.totalSpend * 0.16, savings: kpis.costSavings * 0.15 },
    { month: 'Mar', spend: kpis.totalSpend * 0.15, savings: kpis.costSavings * 0.14 },
    { month: 'Apr', spend: kpis.totalSpend * 0.18, savings: kpis.costSavings * 0.18 },
    { month: 'May', spend: kpis.totalSpend * 0.17, savings: kpis.costSavings * 0.16 },
    { month: 'Jun', spend: kpis.totalSpend * 0.20, savings: kpis.costSavings * 0.25 },
  ];

  // 2. Spend by Category
  const categoryMap: Record<string, number> = {};
  pos.forEach(po => {
    // Lookup vendor category
    const cat = po.department; // or category
    categoryMap[cat] = (categoryMap[cat] || 0) + po.amount;
  });
  const categorySpendData = Object.entries(categoryMap).map(([name, value]) => ({
    name: name.split(' & ')[0], // Shorten name
    value
  })).slice(0, 5);

  const COLORS = ['#005a9e', '#ff8c00', '#107c41', '#795600', '#2b6cb0'];

  // Filter pending approval items
  const pendingApprovals = [
    ...pos.filter(po => ['Manager Approval', 'Finance Approval'].includes(po.status)).map(po => ({
      id: po.id,
      type: 'Purchase Order',
      ref: po.poNumber,
      amount: po.amount,
      vendor: po.vendorName,
      status: po.status,
      action: () => updatePOMutation.mutate({ id: po.id, status: 'PO Generated' })
    })),
    ...invoices.filter(inv => inv.status === 'Pending Approval').map(inv => ({
      id: inv.id,
      type: 'Invoice',
      ref: inv.invoiceNumber,
      amount: inv.amount,
      vendor: inv.vendorName,
      status: inv.status,
      action: () => updateInvMutation.mutate({ id: inv.id, status: 'Approved' })
    }))
  ].slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-sap-gray-800 dark:text-white">Enterprise Cockpit</h2>
          <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">ERP S/4HANA transactional review & AI insights</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate('/ai-assistant')}
            leftIcon={<Bot className="w-4 h-4" />}
          >
            Ask Procurement Co-pilot
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/purchase-orders')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Requisition
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="fiori-card p-5 flex items-center space-x-4 bg-white dark:bg-sap-card-dark">
          <div className="p-3 bg-sap-blue-light dark:bg-sap-blue/20 rounded-lg text-sap-blue dark:text-sap-blue-medium">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400 font-semibold uppercase tracking-wider">Total ERP Spend</p>
            <h3 className="text-lg font-extrabold text-sap-gray-800 dark:text-white mt-1">${kpis.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <span className="text-[10px] text-sap-status-success-text font-bold flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +4.2% vs last Q
            </span>
          </div>
        </div>

        <div className="fiori-card p-5 flex items-center space-x-4 bg-white dark:bg-sap-card-dark">
          <div className="p-3 bg-sap-status-success-bg text-sap-status-success-text rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400 font-semibold uppercase tracking-wider">AI Negotiated Savings</p>
            <h3 className="text-lg font-extrabold text-sap-gray-800 dark:text-white mt-1">${kpis.costSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <span className="text-[10px] text-sap-status-success-text font-bold flex items-center mt-1">
              {kpis.savingsRate}% overall savings rate
            </span>
          </div>
        </div>

        <div className="fiori-card p-5 flex items-center space-x-4 bg-white dark:bg-sap-card-dark">
          <div className="p-3 bg-sap-status-warning-bg text-sap-status-warning-text rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400 font-semibold uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-lg font-extrabold text-sap-gray-800 dark:text-white mt-1">{kpis.pendingApprovalsCount} Items</h3>
            <span className="text-[10px] text-sap-status-warning-text font-bold flex items-center mt-1">
              Requires immediate signatures
            </span>
          </div>
        </div>

        <div className="fiori-card p-5 flex items-center space-x-4 bg-white dark:bg-sap-card-dark">
          <div className="p-3 bg-sap-status-info-bg text-sap-status-info-text rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400 font-semibold uppercase tracking-wider">Avg Cycle Speed</p>
            <h3 className="text-lg font-extrabold text-sap-gray-800 dark:text-white mt-1">{kpis.averageCycleTimeDays} Days</h3>
            <span className="text-[10px] text-sap-status-success-text font-bold flex items-center mt-1">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -12.4% cycle time reduction
            </span>
          </div>
        </div>
      </div>

      {/* Main spend and category charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly spend graph */}
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark lg:col-span-2">
          <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white mb-4">Spend & Negotiated Savings Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005a9e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#005a9e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#107c41" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#107c41" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3b45" className="hidden dark:block" />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
                <Area type="monotone" dataKey="spend" name="Total Spend" stroke="#005a9e" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                <Area type="monotone" dataKey="savings" name="Savings Secured" stroke="#107c41" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by category chart */}
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark flex flex-col">
          <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white mb-4">Spend Distribution by Department</h3>
          <div className="flex-1 h-56 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpendData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categorySpendData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
                <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-sap-accent" />
          <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white">Active AI Recommendation Feed</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((ins: any) => (
            <div
              key={ins.id}
              onClick={() => {
                // Pre-populate global assistant search and redirect
                navigate(`/ai-assistant?prompt=${encodeURIComponent(ins.title)}`);
              }}
              className="fiori-card p-5 bg-white dark:bg-sap-card-dark border-l-4 border-l-sap-accent hover:border-l-sap-accent-dark cursor-pointer transition-all hover:shadow-md relative overflow-hidden group"
            >
              <div className="absolute top-4 right-4 text-sap-accent opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-sap-accent-light dark:bg-sap-accent/20 text-sap-accent-dark dark:text-sap-accent font-bold rounded">
                {ins.type.toUpperCase()} • {ins.impact}
              </span>
              <h4 className="text-xs font-bold text-sap-gray-800 dark:text-white mt-3 group-hover:text-sap-blue dark:group-hover:text-sap-blue-medium transition-colors">
                {ins.title}
              </h4>
              <p className="text-[11px] text-sap-gray-500 dark:text-sap-gray-400 mt-2 leading-relaxed">
                {ins.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Approvals Table & Alerts Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approvals (Col-span 2) */}
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white">Prioritized Approvals Queue</h3>
            <button
              onClick={() => navigate('/purchase-orders')}
              className="text-xs text-sap-blue dark:text-sap-blue-medium hover:underline flex items-center font-bold"
            >
              View Full Queue <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {pendingApprovals.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8 text-xs text-sap-gray-400">
                No items pending approvals. Approval limits are fully cleared.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-sap-border-light dark:border-sap-border-dark text-sap-gray-400 font-bold">
                    <th className="py-2 text-left">Ref Number</th>
                    <th className="py-2 text-left">Supplier</th>
                    <th className="py-2 text-left">Type</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sap-border-light dark:divide-sap-border-dark">
                  {pendingApprovals.map((item) => (
                    <tr key={item.id} className="hover:bg-sap-gray-50/50 dark:hover:bg-sap-gray-800/30 transition-colors">
                      <td className="py-3 font-bold text-sap-blue dark:text-sap-blue-medium">{item.ref}</td>
                      <td className="py-3 font-semibold text-sap-gray-700 dark:text-sap-gray-300">{item.vendor}</td>
                      <td className="py-3 text-sap-gray-500">{item.type}</td>
                      <td className="py-3 text-right font-bold text-sap-gray-800 dark:text-white">${item.amount.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        {item.type === 'Purchase Order' ? (
                          <POStatusBadge status={item.status} />
                        ) : (
                          <InvoiceStatusBadge status={item.status} />
                        )}
                      </td>
                      <td className="py-3 text-right flex justify-end space-x-1.5">
                        <button
                          onClick={item.action}
                          disabled={updatePOMutation.isPending || updateInvMutation.isPending}
                          className="p-1 rounded bg-sap-status-success-bg text-sap-status-success-text hover:bg-sap-status-success-text hover:text-white transition-colors"
                          title="Approve immediately"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(item.type === 'Purchase Order' ? '/purchase-orders' : '/invoices')}
                          className="p-1 rounded bg-sap-gray-100 dark:bg-sap-gray-800 text-sap-gray-500 hover:bg-sap-gray-200 dark:hover:bg-sap-gray-700 transition-colors"
                          title="Examine line items"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Alerts & Critical Log */}
        <div className="fiori-card p-5 bg-white dark:bg-sap-card-dark flex flex-col">
          <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white mb-4">Operational Compliance Alerts</h3>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-1">
            {alerts.slice(0, 4).map((alert: any) => (
              <div
                key={alert.id}
                onClick={() => alert.link && navigate(`/${alert.link}`)}
                className={`p-3 rounded border flex items-start space-x-2.5 transition-colors cursor-pointer ${
                  alert.severity === 'error'
                    ? 'bg-sap-status-error-bg/30 border-sap-status-error-bg dark:bg-sap-status-error-darkBg/20 dark:border-sap-status-error-darkBg hover:bg-sap-status-error-bg/50'
                    : 'bg-sap-status-warning-bg/30 border-sap-status-warning-bg dark:bg-sap-status-warning-darkBg/20 dark:border-sap-status-warning-darkBg hover:bg-sap-status-warning-bg/50'
                }`}
              >
                <div className={`mt-0.5 ${alert.severity === 'error' ? 'text-sap-status-error-text' : 'text-sap-status-warning-text'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-sap-gray-700 dark:text-sap-gray-300 leading-tight">{alert.message}</p>
                  <span className="text-[9px] text-sap-gray-400 dark:text-sap-gray-500 block mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
