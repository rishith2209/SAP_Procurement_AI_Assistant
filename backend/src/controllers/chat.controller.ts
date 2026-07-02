import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { coPilotServiceInstance } from '../services/copilot.service.js';
import { ragServiceInstance } from '../services/rag.service.js';
import { logAudit } from '../utils/audit.js';

export const getConversations = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversations = await prisma.chatConversation.findMany({
      where: { userId: req.user.id },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    res.status(200).json({ status: 'success', data: conversations });
  } catch (err) {
    next(err);
  }
};

export const createConversation = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title = 'New Inquiry' } = req.body;

    const newConv = await prisma.chatConversation.create({
      data: {
        userId: req.user.id,
        title,
        lastMessageAt: new Date()
      },
      include: { messages: true }
    });

    res.status(201).json({ status: 'success', data: newConv });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: conversationId } = req.params;
    const { content, attachments } = req.body;

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { timestamp: 'asc' } } }
    });

    if (!conversation) {
      res.status(404).json({ status: 'error', message: 'Conversation not found.' });
      return;
    }

    const userMsg = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'user',
        content,
        attachments: attachments ? JSON.parse(JSON.stringify(attachments)) : null
      }
    });

    // Auto-update title if it's default
    if (conversation.title === 'New Inquiry') {
      const parsedTitle = content.length > 28 ? content.slice(0, 25) + '...' : content;
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title: parsedTitle }
      });
    }

    // 2. Classify and gather S/4HANA DB Context
    let erpContext = '';
    const cleanContent = content.toLowerCase();
    let suggestions = ['Show pending purchase orders', 'Compare vendors', 'Summarize invoice'];

    if (cleanContent.includes('purchase order') || cleanContent.includes('pending po') || cleanContent.includes('po-')) {
      const pos = await prisma.purchaseOrder.findMany({ take: 6, include: { items: true } });
      erpContext = JSON.stringify(pos, null, 2);
      suggestions = ['List overdue deliveries', 'Explain approval limits', 'Audit PO-2026-0012'];
    } else if (cleanContent.includes('invoice') || cleanContent.includes('inv-') || cleanContent.includes('matching')) {
      const invoices = await prisma.invoice.findMany({ take: 5 });
      const pos = await prisma.purchaseOrder.findMany({ take: 3 });
      erpContext = `Invoices:\n${JSON.stringify(invoices, null, 2)}\n\nPOs:\n${JSON.stringify(pos, null, 2)}`;
      suggestions = ['Approve invoice INV-2026-0005', 'Explain 3-way match exceptions', 'List overdue Invoices'];
    } else if (cleanContent.includes('compare') || cleanContent.includes('vendor') || cleanContent.includes('supplier')) {
      const vendors = await prisma.vendor.findMany({ take: 8 });
      erpContext = JSON.stringify(vendors, null, 2);
      suggestions = ['Show supplier risk ratings', 'Find alternatives for Logistics', 'Export vendor scores'];
    } else if (cleanContent.includes('report') || cleanContent.includes('analytics') || cleanContent.includes('spend')) {
      const pos = await prisma.purchaseOrder.findMany({ take: 5 });
      const invoices = await prisma.invoice.findMany({ take: 5 });
      erpContext = `POs:\n${JSON.stringify(pos, null, 2)}\n\nInvoices:\n${JSON.stringify(invoices, null, 2)}`;
      suggestions = ['Breakdown spend by department', 'Show unrealized savings', 'Export Q2 spend report'];
    } else if (cleanContent.includes('policy') || cleanContent.includes('limit') || cleanContent.includes('sign') || cleanContent.includes('threshold')) {
      suggestions = ['Explain SOX controls', 'What is the Director approval limit?', 'Vetting process guidelines'];
    }

    // 3. Search Retrieval Document indexes from database chunks
    const matches = await ragServiceInstance.searchIndex(content, 3);
    
    // 4. Build prompt
    let assembledPrompt = `
You are the SAP Procurement Co-pilot, an expert assistant integrated into a Fortune 500 company's S/4HANA ERP instance.

Format all responses using professional Markdown with clear lists, headings, and tables. Highlight alerts using emojis.
`;

    if (matches.length > 0) {
      assembledPrompt += `\n### 📄 RETRIEVED DOCUMENT CONTEXT:\n`;
      matches.forEach((m, idx) => {
        assembledPrompt += `SOURCE [${idx + 1}]: "${m.chunk.filename}" (Page ${m.chunk.pageNumber}, Section: "${m.chunk.section}", Confidence: ${(m.score * 100).toFixed(0)}%)\n"""\n${m.chunk.text}\n"""\n\n`;
      });
    }

    if (erpContext) {
      assembledPrompt += `\n### 📊 S/4HANA ERP DATABASE RECORDS CONTEXT:\n${erpContext}\n\n`;
    }

    assembledPrompt += `\nAnswer the user inquiry using the contexts provided above.
USER INQUIRY:
"${content}"`;

    // 5. Build conversation history logs
    const history = conversation.messages.map(msg => ({
      role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model' | 'system',
      content: msg.content
    }));

    // 6. Query model
    const responseText = await coPilotServiceInstance.sendMessage(
      assembledPrompt,
      history,
      'You are the SAP Procurement Co-pilot assistant.'
    );

    // 7. Format matched citations into response markdown
    let finalContent = responseText;
    if (matches.length > 0) {
      finalContent += `\n\n---\n### 📚 Referenced S/4HANA Document Sources:\n`;
      matches.forEach((m, idx) => {
        const fileLink = `/documents?search=${encodeURIComponent(m.chunk.filename)}`;
        finalContent += `\n${idx + 1}. **[${m.chunk.filename}](${fileLink})** (Page ${m.chunk.pageNumber}, Section: "${m.chunk.section}", Confidence: **${(m.score * 100).toFixed(0)}%**)
   > *"${m.chunk.text.slice(0, 240)}..."* \n`;
      });
    }

    // 8. Save response to DB
    const aiMsg = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: finalContent,
        suggestions
      }
    });

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    await logAudit(
      req.user.id,
      req.user.name,
      'Co-pilot Assistant Inquiry',
      'Co-pilot',
      `User queried co-pilot thread: "${content.slice(0, 45)}...". Returned ${matches.length} citations.`,
      req.ip
    );

    res.status(200).json({ status: 'success', data: aiMsg });
  } catch (err) {
    next(err);
  }
};
