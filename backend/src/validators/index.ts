import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid corporate email address.' }),
  password: z.string().min(6, { message: 'Password must consist of at least 6 characters.' })
});

export const poItemSchema = z.object({
  description: z.string().min(1, 'Item description required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().positive('Unit price must be positive')
});

export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(3, 'PO Number required'),
  vendorId: z.string().uuid('Invalid Vendor ID format'),
  vendorName: z.string().min(1, 'Vendor Name required'),
  department: z.string().min(1, 'Department required'),
  amount: z.number().nonnegative(),
  status: z.enum(['Draft', 'Manager Approval', 'Finance Approval', 'PO Generated', 'Vendor Accepted', 'Delivered', 'Invoice Received', 'Closed']),
  deliveryDate: z.string(),
  orderDate: z.string(),
  items: z.array(poItemSchema).min(1, 'PO must contain at least 1 item')
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(3, 'Invoice Number required'),
  poNumber: z.string().min(3, 'PO Reference Number required'),
  vendorId: z.string().uuid('Invalid Vendor ID format'),
  vendorName: z.string().min(1, 'Vendor Name required'),
  amount: z.number().positive('Invoice amount must be positive'),
  status: z.enum(['Draft', 'Pending Approval', 'Approved', 'Paid', 'Overdue', 'Rejected']),
  issueDate: z.string(),
  dueDate: z.string(),
  category: z.string().min(1, 'Category required'),
  fileName: z.string().optional()
});

export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor Name required'),
  code: z.string().min(3, 'Vendor Code required'),
  email: z.string().email('Invalid supplier email address'),
  contact: z.string().min(1, 'Contact number required'),
  performanceScore: z.number().int().min(0).max(100).optional(),
  deliveryScore: z.number().int().min(0).max(100).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  totalSpend: z.number().nonnegative().optional(),
  category: z.string().min(1, 'Category required'),
  status: z.enum(['Active', 'Under Review', 'Suspended'])
});
