import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/db.js';
import { logAudit } from '../utils/audit.js';
import { ragServiceInstance } from '../services/rag.service.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const getDocuments = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '15', search = '', category = '' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const [docs, total] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.document.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        results: docs,
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

export const uploadDocument = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No file provided.' });
      return;
    }

    const category = req.body.category || 'Unsorted';
    const sizeStr = req.file.size > 1024 * 1024
      ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(req.file.size / 1024).toFixed(0)} KB`;

    // Save file to uploads folder
    const fileId = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(UPLOADS_DIR, fileId);
    await fs.promises.writeFile(filePath, req.file.buffer);

    const newDoc = await prisma.document.create({
      data: {
        name: req.file.originalname,
        size: sizeStr,
        type: req.file.mimetype,
        category,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'Processing',
        url: `/uploads/${fileId}`
      }
    });

    // Run semantic parsing/indexing in the background
    ragServiceInstance.indexDocument(
      newDoc.id,
      newDoc.name,
      req.file.buffer,
      req.file.mimetype,
      category,
      newDoc.uploadedAt
    ).catch(err => {
      console.error('RAG Indexing background thread failed:', err);
      prisma.document.update({
        where: { id: newDoc.id },
        data: { status: 'Failed' }
      }).catch(e => console.error('Failed to update doc fail status:', e));
    });

    await logAudit(
      req.user?.id || null,
      req.user?.name || 'System',
      'Document Uploaded',
      'Documents',
      `Document "${newDoc.name}" uploaded to S/4HANA records. Category: ${category}.`,
      req.ip
    );

    res.status(201).json({ status: 'success', data: newDoc });
  } catch (err) {
    next(err);
  }
};

export const renameDocument = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      res.status(404).json({ status: 'error', message: 'Document not found.' });
      return;
    }

    const updated = await prisma.document.update({
      where: { id },
      data: { name: newName }
    });

    await logAudit(
      req.user.id,
      req.user.name,
      'Document Renamed',
      'Documents',
      `Document "${doc.name}" renamed to "${newName}".`,
      req.ip
    );

    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      res.status(404).json({ status: 'error', message: 'Document not found.' });
      return;
    }

    // Delete file from disk
    if (doc.url) {
      const fileName = path.basename(doc.url);
      const filePath = path.join(UPLOADS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }

    // Purge record & cascading document chunks from database
    await prisma.document.delete({ where: { id } });

    await logAudit(
      req.user.id,
      req.user.name,
      'Document Deleted',
      'Documents',
      `Document "${doc.name}" deleted from systems.`,
      req.ip
    );

    res.status(200).json({ status: 'success', message: 'Document removed successfully.' });
  } catch (err) {
    next(err);
  }
};

export const reindexDocument = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      res.status(404).json({ status: 'error', message: 'Document not found.' });
      return;
    }

    if (!doc.url) {
      res.status(400).json({ status: 'error', message: 'Document contains no local disk path.' });
      return;
    }

    const fileName = path.basename(doc.url);
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ status: 'error', message: 'Document file not found on disk.' });
      return;
    }

    const buffer = await fs.promises.readFile(filePath);

    // Trigger re-indexing
    await prisma.document.update({
      where: { id },
      data: { status: 'Processing' }
    });

    // Run indexing
    await ragServiceInstance.indexDocument(
      doc.id,
      doc.name,
      buffer,
      doc.type,
      doc.category,
      doc.uploadedAt
    );

    await logAudit(
      req.user.id,
      req.user.name,
      'Document Re-indexed',
      'Documents',
      `Document "${doc.name}" re-indexed. Vector mappings refreshed.`,
      req.ip
    );

    res.status(200).json({ status: 'success', message: 'Re-indexing completed.' });
  } catch (err) {
    next(err);
  }
};
