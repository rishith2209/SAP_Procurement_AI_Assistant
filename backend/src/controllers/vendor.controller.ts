import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { vendorSchema } from '../validators/index.js';
import { logAudit } from '../utils/audit.js';

export const getVendors = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '15', search = '', category = '', sortBy = 'performanceScore', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [vendors, total] = await prisma.$transaction([
      prisma.vendor.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder }
      }),
      prisma.vendor.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        results: vendors,
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

export const getVendorById = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        purchaseOrders: { take: 5, orderBy: { createdAt: 'desc' } },
        invoices: { take: 5, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!vendor) {
      res.status(404).json({ status: 'error', message: 'Vendor not found.' });
      return;
    }

    res.status(200).json({ status: 'success', data: vendor });
  } catch (err) {
    next(err);
  }
};

export const createVendor = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = vendorSchema.parse(req.body);

    const newVendor = await prisma.vendor.create({
      data: validated
    });

    await logAudit(
      req.user.id,
      req.user.name,
      'Vendor Created',
      'Master Data',
      `New supplier ${newVendor.name} (${newVendor.code}) saved in master catalogs.`,
      req.ip
    );

    res.status(201).json({ status: 'success', data: newVendor });
  } catch (err) {
    next(err);
  }
};

export const updateVendor = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = vendorSchema.parse(req.body);

    const vendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!vendor) {
      res.status(404).json({ status: 'error', message: 'Vendor not found.' });
      return;
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: validated
    });

    await logAudit(
      req.user.id,
      req.user.name,
      'Vendor Master Updated',
      'Master Data',
      `Supplier ${vendor.name} (${vendor.code}) information modified. Status is now: ${validated.status}.`,
      req.ip
    );

    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};
export const deleteVendor = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!vendor) {
      res.status(404).json({ status: 'error', message: 'Vendor not found.' });
      return;
    }

    await prisma.vendor.delete({
      where: { id }
    });

    await logAudit(
      req.user.id,
      req.user.name,
      'Vendor Deleted',
      'Master Data',
      `Supplier ${vendor.name} (${vendor.code}) purged from master registers.`,
      req.ip
    );

    res.status(200).json({ status: 'success', message: 'Vendor removed.' });
  } catch (err) {
    next(err);
  }
};
