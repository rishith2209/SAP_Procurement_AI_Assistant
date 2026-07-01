export interface Vendor {
  id: string;
  name: string;
  code: string;
  email: string;
  contact: string;
  performanceScore: number; // 0-100
  deliveryScore: number;    // 0-100
  riskScore: number;        // 0-100 (lower is better, or higher is riskier)
  totalSpend: number;
  category: string;
  status: 'Active' | 'Under Review' | 'Suspended';
}

export type POStatus =
  | 'Draft'
  | 'Manager Approval'
  | 'Finance Approval'
  | 'PO Generated'
  | 'Vendor Accepted'
  | 'Delivered'
  | 'Invoice Received'
  | 'Closed';

export interface POItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  department: string;
  amount: number;
  status: POStatus;
  deliveryDate: string;
  orderDate: string;
  items: POItem[];
}

export type InvoiceStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Paid' | 'Overdue' | 'Rejected';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  category: string;
  fileName?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  category: 'Purchase Orders' | 'Invoices' | 'Vendors' | 'Reports' | 'Unsorted';
  url?: string;
  status: 'Processed' | 'Processing' | 'Failed';
}

export interface ProcurementKPIs {
  totalSpend: number;
  poCount: number;
  invoiceCount: number;
  pendingApprovalsCount: number;
  averageCycleTimeDays: number;
  costSavings: number;
  savingsRate: number;
}

export interface ProcurementAlert {
  id: string;
  type: 'vendor' | 'invoice' | 'po';
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  link?: string;
}

export interface UserActivity {
  id: string;
  type: 'po' | 'invoice' | 'vendor' | 'document' | 'auth';
  description: string;
  timestamp: string;
  user: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: { name: string; size: string; type: string }[];
  suggestions?: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessageAt: string;
  messages: ChatMessage[];
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'saving' | 'risk' | 'process';
  impact: string;
  details: string;
}
