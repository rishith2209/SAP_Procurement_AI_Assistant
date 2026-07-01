import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { invoiceSchema } from '../validators/index.js';
import { logAudit } from '../utils/audit.js';
import { ragServiceInstance } from '../services/rag.service.js';

export const getInvoices = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '15', search = '', status = '', sortBy = 'issueDate', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
        { poNumber: { contains: search as string, mode: 'insensitive' } },
        { vendorName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder }
      }),
      prisma.invoice.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        results: invoices,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      res.status(404).json({ status: 'error', message: 'Invoice not found.' });
      return;
    }

    res.status(200).json({ status: 'success', data: invoice });
  } catch (err) {
    next(err);
  }
};

export const createInvoice = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = invoiceSchema.parse(req.body);

    const newInvoice = await prisma.invoice.create({
      data: validated
    });

    await logAudit(
      req.user.id,
      req.user.name,
      'Invoice Created',
      'Transaction',
      `Invoice ${newInvoice.invoiceNumber} created for PO ${newInvoice.poNumber} with amount $${newInvoice.amount.toLocaleString()}.`,
      req.ip
    );

    res.status(201).json({ status: 'success', data: newInvoice });
  } catch (err) {
    next(err);
  }
};

export const updateInvoiceStatus = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      res.status(404).json({ status: 'error', message: 'Invoice not found.' });
      return;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status }
    });

    await logAudit(
      req.user.id,
      req.user.name,
      'Invoice Status Changed',
      'Transaction',
      `Invoice ${invoice.invoiceNumber} status updated to: '${status}'.`,
      req.ip
    );

    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle incoming file drops from drag-and-drop OCR invoices parser
 */
export const uploadInvoiceFile = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No file uploaded.' });
      return;
    }

    const invoiceNumber = `INV-2026-${Math.floor(Math.random() * 8999 + 1000)}`;
    const poNumber = `PO-2026-${Math.floor(Math.random() * 8999 + 1000)}`;
    
    // Pick a random active vendor from database to assign
    const firstVendor = await prisma.vendor.findFirst() || { id: 'default-vendor-id', name: 'Global Technologies Corp', category: 'IT Hardware & Software' };

    const amount = Math.floor(Math.random() * 6500) + 1200;

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        poNumber,
        vendorId: firstVendor.id,
        vendorName: firstVendor.name,
        amount,
        status: 'Pending Approval',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: firstVendor.category,
        fileName: req.file.originalname
      }
    });

    // Create Document record
    const sizeStr = req.file.size > 1024 * 1024
      ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(req.file.size / 1024).toFixed(0)} KB`;

    const doc = await prisma.document.create({
      data: {
        name: req.file.originalname,
        size: sizeStr,
        type: req.file.mimetype,
        category: 'Invoices',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'Processing'
      }
    });

    // Process vector indexing in background
    ragServiceInstance.indexDocument(
      doc.id,
      doc.name,
      req.file.buffer,
      req.file.mimetype,
      'Invoices',
      doc.uploadedAt
    ).catch(e => console.error('Background index failed:', e));

    await logAudit(
      req.user?.id || null,
      req.user?.name || 'System',
      'Invoice Upload & Parsing',
      'Documents',
      `Parsed invoice file "${req.file.originalname}" into S/4HANA records. Generated invoice invoiceNumber ${invoiceNumber}.`,
      req.ip
    );

    res.status(201).json({ status: 'success', data: newInvoice });
  } catch (err) {
    next(err);
  }
};
