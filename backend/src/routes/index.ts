import { Router } from 'express';
import multer from 'multer';

// Controllers
import * as authController from '../controllers/auth.controller.js';
import * as poController from '../controllers/po.controller.js';
import * as invoiceController from '../controllers/invoice.controller.js';
import * as vendorController from '../controllers/vendor.controller.js';
import * as docController from '../controllers/document.controller.js';
import * as chatController from '../controllers/chat.controller.js';
import * as reportController from '../controllers/report.controller.js';

// Middleware
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// ==========================================
// 1. Authentication Routes
// ==========================================
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);
router.post('/auth/logout', authenticateToken, authController.logout);

// ==========================================
// 2. Purchase Order Routes
// ==========================================
router.get('/purchase-orders', authenticateToken, poController.getPurchaseOrders);
router.get('/purchase-orders/:id', authenticateToken, poController.getPurchaseOrderById);
router.post(
  '/purchase-orders',
  authenticateToken,
  authorizeRoles('Admin', 'Procurement Manager'),
  poController.createPurchaseOrder
);
router.patch('/purchase-orders/:id/status', authenticateToken, poController.updatePOStatus);

// ==========================================
// 3. Invoice Routes
// ==========================================
router.get('/invoices', authenticateToken, invoiceController.getInvoices);
router.get('/invoices/:id', authenticateToken, invoiceController.getInvoiceById);
router.post('/invoices', authenticateToken, invoiceController.createInvoice);
router.patch('/invoices/:id/status', authenticateToken, invoiceController.updateInvoiceStatus);
router.post('/invoices/upload', authenticateToken, upload.single('file'), invoiceController.uploadInvoiceFile);

// ==========================================
// 4. Vendor Routes
// ==========================================
router.get('/vendors', authenticateToken, vendorController.getVendors);
router.get('/vendors/:id', authenticateToken, vendorController.getVendorById);
router.post('/vendors', authenticateToken, authorizeRoles('Admin'), vendorController.createVendor);
router.put('/vendors/:id', authenticateToken, authorizeRoles('Admin', 'Procurement Manager'), vendorController.updateVendor);
router.delete('/vendors/:id', authenticateToken, authorizeRoles('Admin'), vendorController.deleteVendor);

// ==========================================
// 5. Document Center Routes
// ==========================================
router.get('/documents', authenticateToken, docController.getDocuments);
router.post('/documents', authenticateToken, upload.single('file'), docController.uploadDocument);
router.patch('/documents/:id/rename', authenticateToken, docController.renameDocument);
router.delete('/documents/:id', authenticateToken, docController.deleteDocument);
router.post('/documents/:id/reindex', authenticateToken, docController.reindexDocument);

// ==========================================
// 6. Co-pilot Assistant Chat Routes
// ==========================================
router.get('/chats/conversations', authenticateToken, chatController.getConversations);
router.post('/chats/conversations', authenticateToken, chatController.createConversation);
router.post('/chats/conversations/:id/messages', authenticateToken, chatController.sendMessage);

// ==========================================
// 7. Analytics & Audit Log Routes
// ==========================================
router.get('/reports', authenticateToken, reportController.getReports);
router.post('/reports', authenticateToken, reportController.createReport);
router.get('/reports/dashboard', authenticateToken, reportController.getDashboardData);
router.get(
  '/reports/audit-logs',
  authenticateToken,
  authorizeRoles('Admin'),
  reportController.getAuditLogs
);

export default router;
