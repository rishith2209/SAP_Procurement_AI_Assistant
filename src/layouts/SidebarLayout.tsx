import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useDashboardData } from '../hooks/useQueries';
import {
  Menu, X, Sun, Moon, Bell, LogOut, Search,
  LayoutDashboard, FileText, CreditCard, Users, FolderOpen, MessageSquare, BarChart3, FileSpreadsheet, User, Settings, AlertTriangle
} from 'lucide-react';

export const SidebarLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { globalSearchQuery, setGlobalSearchQuery, isSearchOpen, setIsSearchOpen } = useData();
  const { results: searchResults, isLoading: searchLoading } = useGlobalSearch();
  const { data: dashboardData } = useDashboardData();

  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close overlays on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsSearchOpen]);

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileSidebarOpen(false);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: FileText },
    { name: 'Invoices', path: '/invoices', icon: CreditCard },
    { name: 'Vendors', path: '/vendors', icon: Users },
    { name: 'Document Center', path: '/documents', icon: FolderOpen },
    { name: 'AI Assistant', path: '/ai-assistant', icon: MessageSquare, primary: true },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Derive breadcrumbs based on pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { label, path };
  });

  const alerts = dashboardData?.alerts || [];

  return (
    <div className="flex h-screen bg-sap-bg-light dark:bg-sap-bg-dark transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sap-card-light dark:bg-sap-card-dark border-r border-sap-border-light dark:border-sap-border-dark shadow-sm">
        <div className="flex items-center h-16 px-6 border-b border-sap-border-light dark:border-sap-border-dark">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sap-blue flex items-center justify-center text-white font-bold text-lg select-none">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-sap-gray-800 dark:text-white leading-none">SAP Procurement</h1>
              <span className="text-[10px] text-sap-accent font-bold uppercase tracking-wider">AI Assistant</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-md transition-colors ${
                  isActive
                    ? 'bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium'
                    : item.primary
                    ? 'bg-sap-accent/10 hover:bg-sap-accent/20 text-sap-accent-dark dark:text-sap-accent'
                    : 'text-sap-gray-600 dark:text-sap-gray-300 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-sap-blue dark:text-sap-blue-medium' : ''}`} />
                {item.name}
                {item.primary && (
                  <span className="ml-auto px-1.5 py-0.5 text-[9px] bg-sap-accent text-white rounded font-bold uppercase tracking-wide">
                    Core
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sap-border-light dark:border-sap-border-dark">
          <div className="flex items-center space-x-3 p-2">
            <div className="w-9 h-9 rounded-full bg-sap-blue flex items-center justify-center text-white font-bold text-sm">
              {user?.avatar || 'MC'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sap-gray-800 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-sap-gray-500 dark:text-sap-gray-400 truncate">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-sap-gray-400 hover:text-sap-status-error-text rounded-md hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile/Tablet drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 max-w-xs bg-sap-card-light dark:bg-sap-card-dark border-r border-sap-border-light dark:border-sap-border-dark animate-fade-in">
            <div className="flex items-center justify-between h-16 px-6 border-b border-sap-border-light dark:border-sap-border-dark">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-sap-blue flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div>
                  <h1 className="text-sm font-bold text-sap-gray-800 dark:text-white leading-none">SAP Procurement</h1>
                  <span className="text-[10px] text-sap-accent font-bold uppercase">AI Assistant</span>
                </div>
              </div>
              <button
                className="p-1 rounded-md text-sap-gray-500 dark:text-sap-gray-400 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center w-full px-4 py-2.5 text-sm font-semibold rounded-md text-left transition-colors ${
                      isActive
                        ? 'bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium'
                        : 'text-sap-gray-600 dark:text-sap-gray-300 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-sap-border-light dark:border-sap-border-dark">
              <div className="flex items-center space-x-3 p-2">
                <div className="w-9 h-9 rounded-full bg-sap-blue flex items-center justify-center text-white font-bold text-sm">
                  {user?.avatar || 'MC'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sap-gray-800 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-sap-gray-500 dark:text-sap-gray-400 truncate">{user?.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-sap-gray-400 hover:text-sap-status-error-text rounded-md hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace Column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-sap-card-light dark:bg-sap-card-dark border-b border-sap-border-light dark:border-sap-border-dark shadow-sm z-30">
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-md lg:hidden text-sap-gray-500 dark:text-sap-gray-400 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 focus:outline-none"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center space-x-1.5 text-xs font-semibold text-sap-gray-500 dark:text-sap-gray-400">
              <Link to="/dashboard" className="hover:text-sap-blue transition-colors">SAP</Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.path}>
                  <span>/</span>
                  <Link
                    to={crumb.path}
                    className={`hover:text-sap-blue transition-colors ${
                      idx === breadcrumbs.length - 1 ? 'text-sap-gray-800 dark:text-white font-bold' : ''
                    }`}
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Search, Notifications, Theme and Profile controls */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Global Search Bar */}
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-sap-gray-400 dark:text-sap-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Global search S/4HANA..."
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-40 sm:w-60 pl-9 pr-4 py-1.5 text-xs bg-sap-gray-100 dark:bg-sap-gray-800 border border-transparent hover:bg-sap-gray-200 dark:hover:bg-sap-gray-700 focus:bg-white dark:focus:bg-sap-gray-900 focus:border-sap-blue-medium focus:ring-1 focus:ring-sap-blue-medium dark:text-white rounded-md transition-all outline-none"
                  aria-label="Global ERP Search"
                />
              </div>

              {/* Global Search Overlay Panel */}
              {isSearchOpen && globalSearchQuery.trim() !== '' && (
                <div className="absolute right-0 mt-2 w-80 sm:w-[480px] max-h-[420px] overflow-y-auto bg-white dark:bg-sap-card-dark border border-sap-border-light dark:border-sap-border-dark rounded-lg shadow-xl z-50 p-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-sap-border-light dark:border-sap-border-dark">
                    <span className="text-xs font-bold text-sap-gray-400 uppercase tracking-wider">Search Results</span>
                    <span className="text-[10px] bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium px-2 py-0.5 rounded-full font-bold">
                      {searchLoading ? 'Scanning...' : `${searchResults.totalResults} found`}
                    </span>
                  </div>

                  {searchLoading ? (
                    <div className="py-8 text-center text-xs text-sap-gray-400">Searching S/4HANA tables...</div>
                  ) : searchResults.totalResults === 0 ? (
                    <div className="py-8 text-center text-xs text-sap-gray-400">No records matching "{globalSearchQuery}" found.</div>
                  ) : (
                    <div className="space-y-4">
                      {/* PO Results */}
                      {searchResults.purchaseOrders.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider mb-1.5">Purchase Orders</h4>
                          <div className="space-y-1">
                            {searchResults.purchaseOrders.map(po => (
                              <button
                                key={po.id}
                                onClick={() => {
                                  setGlobalSearchQuery('');
                                  setIsSearchOpen(false);
                                  navigate(`/purchase-orders?search=${po.poNumber}`);
                                }}
                                className="w-full text-left p-2 rounded hover:bg-sap-gray-50 dark:hover:bg-sap-gray-800 transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-xs font-bold text-sap-blue dark:text-sap-blue-medium">{po.poNumber}</p>
                                  <p className="text-[10px] text-sap-gray-400">{po.vendorName} • {po.department}</p>
                                </div>
                                <span className="text-xs font-semibold text-sap-gray-800 dark:text-white">${po.amount.toLocaleString()}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Invoices */}
                      {searchResults.invoices.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider mb-1.5">Invoices</h4>
                          <div className="space-y-1">
                            {searchResults.invoices.map(inv => (
                              <button
                                key={inv.id}
                                onClick={() => {
                                  setGlobalSearchQuery('');
                                  setIsSearchOpen(false);
                                  navigate(`/invoices?search=${inv.invoiceNumber}`);
                                }}
                                className="w-full text-left p-2 rounded hover:bg-sap-gray-50 dark:hover:bg-sap-gray-800 transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-xs font-bold text-sap-gray-800 dark:text-white">{inv.invoiceNumber}</p>
                                  <p className="text-[10px] text-sap-gray-400">{inv.vendorName} • PO: {inv.poNumber}</p>
                                </div>
                                <span className="text-xs font-semibold text-sap-gray-800 dark:text-white">${inv.amount.toLocaleString()}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vendors */}
                      {searchResults.vendors.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider mb-1.5">Vendors</h4>
                          <div className="space-y-1">
                            {searchResults.vendors.map(v => (
                              <button
                                key={v.id}
                                onClick={() => {
                                  setGlobalSearchQuery('');
                                  setIsSearchOpen(false);
                                  navigate(`/vendors?search=${v.name}`);
                                }}
                                className="w-full text-left p-2 rounded hover:bg-sap-gray-50 dark:hover:bg-sap-gray-800 transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-xs font-bold text-sap-gray-800 dark:text-white">{v.name}</p>
                                  <p className="text-[10px] text-sap-gray-400">{v.code} • {v.category}</p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sap-status-success-bg text-sap-status-success-text font-bold">
                                  {v.performanceScore}/100
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {searchResults.documents.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-sap-gray-400 uppercase tracking-wider mb-1.5">Documents</h4>
                          <div className="space-y-1">
                            {searchResults.documents.map(doc => (
                              <button
                                key={doc.id}
                                onClick={() => {
                                  setGlobalSearchQuery('');
                                  setIsSearchOpen(false);
                                  navigate(`/documents?search=${doc.name}`);
                                }}
                                className="w-full text-left p-2 rounded hover:bg-sap-gray-50 dark:hover:bg-sap-gray-800 transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-xs font-bold text-sap-gray-800 dark:text-white">{doc.name}</p>
                                  <p className="text-[10px] text-sap-gray-400">{doc.category} • {doc.size}</p>
                                </div>
                                <span className="text-[9px] text-sap-gray-400">{doc.uploadedAt}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-sap-gray-500 dark:text-sap-gray-400 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 rounded-md focus:outline-none"
              aria-label="Toggle Color Theme"
              title="Theme Toggle"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Notifications panel dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-sap-gray-500 dark:text-sap-gray-400 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 rounded-md focus:outline-none"
                aria-label="View system alerts"
                title="System Notifications"
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-sap-status-error-text text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-sap-card-dark border border-sap-border-light dark:border-sap-border-dark rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                  <div className="p-3 bg-sap-gray-100 dark:bg-sap-gray-800 border-b border-sap-border-light dark:border-sap-border-dark flex justify-between items-center">
                    <span className="text-xs font-bold text-sap-gray-800 dark:text-white">Active ERP Alerts</span>
                    <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                      {alerts.length} Issues
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-sap-border-light dark:divide-sap-border-dark">
                    {alerts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-sap-gray-400">All ERP checks passing.</div>
                    ) : (
                      alerts.map((alert: any) => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            if (alert.link) navigate(`/${alert.link}`);
                          }}
                          className="p-3 hover:bg-sap-gray-50 dark:hover:bg-sap-gray-800/50 cursor-pointer transition-colors flex items-start space-x-2.5"
                        >
                          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            alert.severity === 'error'
                              ? 'text-sap-status-error-text'
                              : alert.severity === 'warning'
                              ? 'text-sap-status-warning-text'
                              : 'text-sap-status-info-text'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-sap-gray-700 dark:text-sap-gray-300 leading-tight">{alert.message}</p>
                            <span className="text-[9px] text-sap-gray-400 dark:text-sap-gray-500 mt-1 block">
                              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/dashboard');
                    }}
                    className="p-2.5 bg-sap-gray-50 dark:bg-sap-gray-800/30 text-center border-t border-sap-border-light dark:border-sap-border-dark hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 text-xs font-bold text-sap-blue dark:text-sap-blue-medium cursor-pointer"
                  >
                    View All in Dashboard
                  </div>
                </div>
              )}
            </div>

            {/* User Quick menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 transition-colors focus:outline-none"
                aria-label="User Profile Options"
                title="User Profile Menu"
              >
                <div className="w-8 h-8 rounded-full bg-sap-blue flex items-center justify-center text-white font-bold text-sm">
                  {user?.avatar}
                </div>
                <span className="hidden sm:block text-xs font-bold text-sap-gray-700 dark:text-sap-gray-300">{user?.name}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-sap-card-dark border border-sap-border-light dark:border-sap-border-dark rounded-lg shadow-xl z-50 py-1 animate-fade-in">
                  <div className="px-4 py-2 border-b border-sap-border-light dark:border-sap-border-dark">
                    <p className="text-xs font-bold text-sap-gray-800 dark:text-white">{user?.name}</p>
                    <p className="text-[10px] text-sap-gray-500 dark:text-sap-gray-400">{user?.department}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-sap-gray-700 dark:text-sap-gray-300 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-sap-gray-700 dark:text-sap-gray-300 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800"
                  >
                    Account Settings
                  </button>
                  <div className="border-t border-sap-border-light dark:border-sap-border-dark" />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-sap-status-error-text hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 font-semibold"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main page content space */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-sap-bg-light dark:bg-sap-bg-dark transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
