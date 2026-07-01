import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { purchaseOrderSchema } from '../validators/index.js';
import { logAudit } from '../utils/audit.js';

/**
 * Returns filtered list of Purchase Orders with pagination
 */
export const getPurchaseOrders = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '15', search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { poNumber: { contains: search as string, mode: 'insensitive' } },
        { vendorName: { contains: search as string, mode: 'insensitive' } },
        { department: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [pos, total] = await prisma.$transaction([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: { items: true }
      }),
      prisma.purchaseOrder.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        results: pos,
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

export const getPurchaseOrderById = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!po) {
      res.status(404).json({ status: 'error', message: 'Purchase Order not found.' });
      return;
    }

    res.status(200).json({ status: 'success', data: po });
  } catch (err) {
    next(err);
  }
};

export const createPurchaseOrder = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = purchaseOrderSchema.parse(req.body);

    const newPO = await prisma.purchaseOrder.create({
      data: {
        poNumber: validated.poNumber,
        vendorId: validated.vendorId,
        vendorName: validated.vendorName,
        department: validated.department,
        amount: validated.amount,
        status: validated.status,
        deliveryDate: validated.deliveryDate,
        orderDate: validated.orderDate,
        items: {
          create: validated.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          }))
        }
      },
      include: { items: true }
    });

    // Write audit log
    await logAudit(
      req.user.id,
      req.user.name,
      'Purchase Order Created',
      'Transaction',
      `PO ${newPO.poNumber} created for supplier ${newPO.vendorName} with amount $${newPO.amount.toLocaleString()}.`,
      req.ip
    );

    res.status(201).json({ status: 'success', data: newPO });
  } catch (err) {
    next(err);
  }
};

export const updatePOStatus = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!po) {
      res.status(404).json({ status: 'error', message: 'Purchase Order not found.' });
      return;
    }

    // Business rule: Check cost center approval thresholds!
    if (status.includes('Approved') && po.amount > req.user.approvalLimit) {
      res.status(403).json({
        status: 'error',
        message: `Forbidden. Document amount $${po.amount.toLocaleString()} exceeds your signing approval limit ($${req.user.approvalLimit.toLocaleString()}).`
      });
      return;
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { items: true }
    });

    // Write audit log
    await logAudit(
      req.user.id,
      req.user.name,
      'Purchase Order Updated',
      'Transaction',
      `PO ${po.poNumber} status updated to: '${status}'.`,
      req.ip
    );

    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};
