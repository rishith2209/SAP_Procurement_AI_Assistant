import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { logAudit } from '../utils/audit.js';

export const getReports = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const list = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    next(err);
  }
};

export const createReport = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, type, department, format = 'PDF' } = req.body;

    const newReport = await prisma.report.create({
      data: {
        name,
        type,
        department,
        format,
        size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        createdBy: req.user.name,
        url: `/reports/${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format.toLowerCase()}`
      }
    });

    await logAudit(
      req.user.id,
      req.user.name,
      'Report Generated',
      'Reports',
      `Procurement Report "${name}" of type "${type}" generated successfully for ${department}.`,
      req.ip
    );

    res.status(201).json({ status: 'success', data: newReport });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    res.status(200).json({ status: 'success', data: logs });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns aggregated S/4HANA indicators and audit summaries
 */
export const getDashboardData = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Calculate indicators
    const pos = await prisma.purchaseOrder.findMany();
    const invoices = await prisma.invoice.findMany();
    const vendors = await prisma.vendor.findMany();
    
    const totalSpend = pos
      .filter(po => ['PO Generated', 'Vendor Accepted', 'Delivered', 'Invoice Received', 'Closed'].includes(po.status))
      .reduce((sum, po) => sum + po.amount, 0);

    const activePOs = pos.filter(po => !['Closed', 'Draft'].includes(po.status)).length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending Approval').length;
    
    const riskVendorsCount = vendors.filter(v => v.riskScore > 30).length;
    const riskVendorRatio = vendors.length > 0 
      ? Math.round((riskVendorsCount / vendors.length) * 100) 
      : 0;

    // 2. Fetch recent S/4HANA audit logs as activity feeds
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 6
    });

    const recentActivity = logs.map(log => ({
      id: log.id,
      type: log.category.toLowerCase().includes('document') ? 'document' : 'workflow',
      description: log.details,
      timestamp: log.timestamp.toISOString(),
      user: log.username
    }));

    res.status(200).json({
      status: 'success',
      data: {
        kpis: {
          totalSpend,
          activePOs,
          pendingInvoices,
          riskVendorRatio
        },
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
};
