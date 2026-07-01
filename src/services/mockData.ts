import { Vendor, PurchaseOrder, Invoice, DocumentFile, ProcurementKPIs, ProcurementAlert, UserActivity, AIInsight, POStatus, InvoiceStatus } from '../types';

// Helper to simulate network latency
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const DEPARTMENTS = [
  'IT & Infrastructure',
  'Research & Development',
  'Operations & Logistics',
  'Marketing & Sales',
  'Human Resources',
  'Finance & Administration'
];

const CATEGORIES = [
  'IT Hardware & Software',
  'Office Supplies',
  'Logistics & Shipping',
  'Professional Services',
  'R&D Equipment',
  'Facilities & Utilities'
];

const VENDOR_NAMES = [
  'Global Technologies Corp', 'Apex Logistics Ltd', 'OfficeMax Solutions', 'Synergy Consulting Group',
  'Vertex Energy Services', 'Alpha Chemical Supply', 'Delta Hardware Co', 'Pacific Telecommunications',
  'InnoTech Software', 'EuroFreight Logistics', 'Prime Facilities Management', 'Aegis Security Solutions',
  'Integra Tech Staffing', 'Horizon Office Furniture', 'Pinnacle Electronics', 'Vanguard Consulting',
  'Matrix Printing Services', 'Starlight Media & Marketing', 'EcoCycle Waste Solutions', 'Core Industrial Supplies',
  'Optima Medical Supplies', 'Titan Logistics Services', 'Summit Catering Group', 'Zenith Travel Agency',
  'Helix BioResearch', 'Aurora Cloud Services', 'Quantum Manufacturing', 'Trident Industrial Safety',
  'Pioneer Translation Services', 'Spectra Lab Equipment'
];

const ITEM_DESCRIPTIONS: Record<string, string[]> = {
  'IT Hardware & Software': ['ThinkPad L14 Gen 4 Laptops', 'Dell UltraSharp 27" Monitors', 'Cisco Catalyst 9300 Switches', 'Azure Cloud Compute Package', 'Visual Studio Enterprise Licenses', 'Logitech MX Keys Keyboard & Mouse Combo'],
  'Office Supplies': ['Premium Copy Paper A4 (Box)', 'Pilot G2 Gel Pens (Pack of 12)', 'Ergonomic Desk Chairs', 'Whiteboards 4x3 ft', 'Filing Cabinets 4-Drawer', 'Office Supply Starter Kits'],
  'Logistics & Shipping': ['Expedited Air Freight - US to EU', 'Ocean Container Shipping 40ft', 'LTL Ground Transportation Service', 'Warehouse Storage & Pallet Handling', 'Courier Delivery Services', 'Customs Clearance & Duties Admin'],
  'Professional Services': ['SAP S/4HANA Consulting Support', 'Cybersecurity Vulnerability Audit', 'Tax Advisory & Compliance Review', 'Corporate Leadership Training Workshop', 'Legal Counsel Services - Q2', 'UX/UI Design Consulting Project'],
  'R&D Equipment': ['High-Performance Lab Microscope', 'Thermal Imaging Testing Camera', 'CNC Precision Milling Machine', 'Prototype 3D Printer (Industrial)', 'Oscilloscope 4-Channel 100MHz', 'Chemical Analyzer Centrifuge'],
  'Facilities & Utilities': ['HVAC Annual Maintenance Service', 'LED Office Lighting Upgrade', 'Janitorial Services - Q2 Contract', 'Commercial Building Gas Utility', 'Office Security System Installation', 'Waste Recycling & Disposal Service']
};

// Seed initial database
const getInitialVendors = (): Vendor[] => {
  return VENDOR_NAMES.map((name, i) => {
    const code = `VEND-${(i + 1).toString().padStart(4, '0')}`;
    const category = CATEGORIES[i % CATEGORIES.length];
    const performanceScore = Math.floor(Math.random() * 25) + 75; // 75-99
    const deliveryScore = Math.floor(Math.random() * 25) + 75;    // 75-99
    const riskScore = Math.floor(Math.random() * 40) + 10;        // 10-50 (lower is better)
    const totalSpend = Math.floor(Math.random() * 450000) + 15000;
    const status: Vendor['status'] = i % 15 === 0 ? 'Suspended' : i % 8 === 0 ? 'Under Review' : 'Active';

    return {
      id: code,
      name,
      code,
      email: `info@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      contact: `+1 (555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      performanceScore,
      deliveryScore,
      riskScore,
      totalSpend,
      category,
      status
    };
  });
};

const getInitialPOs = (vendors: Vendor[]): PurchaseOrder[] => {
  const list: PurchaseOrder[] = [];
  const poStatuses: POStatus[] = [
    'Draft', 'Manager Approval', 'Finance Approval', 'PO Generated',
    'Vendor Accepted', 'Delivered', 'Invoice Received', 'Closed'
  ];

  for (let i = 1; i <= 100; i++) {
    const poNumber = `PO-2026-${i.toString().padStart(4, '0')}`;
    const vendor = vendors[i % vendors.length];
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const statusIndex = i % 8; // Cyclic distribution
    const status = poStatuses[statusIndex];

    const itemsCount = Math.floor(Math.random() * 3) + 1;
    const items: PurchaseOrder['items'] = [];
    let amount = 0;

    const possibleItems = ITEM_DESCRIPTIONS[vendor.category] || ['General Supplies'];

    for (let j = 1; j <= itemsCount; j++) {
      const desc = possibleItems[j % possibleItems.length];
      const qty = Math.floor(Math.random() * 50) + 1;
      const price = Math.floor(Math.random() * 1200) + 100;
      const total = qty * price;
      amount += total;

      items.push({
        id: `${poNumber}-ITEM-${j}`,
        description: desc,
        quantity: qty,
        unitPrice: price,
        total
      });
    }

    // Adjust dates
    const orderDateObj = new Date();
    orderDateObj.setDate(orderDateObj.getDate() - (105 - i));
    const deliveryDateObj = new Date(orderDateObj);
    deliveryDateObj.setDate(deliveryDateObj.getDate() + 15);

    list.push({
      id: poNumber,
      poNumber,
      vendorId: vendor.id,
      vendorName: vendor.name,
      department,
      amount,
      status,
      orderDate: orderDateObj.toISOString().split('T')[0],
      deliveryDate: deliveryDateObj.toISOString().split('T')[0],
      items
    });
  }

  return list;
};

const getInitialInvoices = (vendors: Vendor[], pos: PurchaseOrder[]): Invoice[] => {
  const list: Invoice[] = [];
  const invoiceStatuses: InvoiceStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Paid', 'Overdue', 'Rejected'];

  for (let i = 1; i <= 100; i++) {
    const invoiceNumber = `INV-2026-${i.toString().padStart(4, '0')}`;
    // Associate first 80 invoices directly with a PO
    const hasPO = i <= 80;
    const po = hasPO ? pos[i - 1] : null;
    const vendor = po ? vendors.find(v => v.id === po.vendorId) || vendors[0] : vendors[i % vendors.length];

    const statusIndex = i % 6;
    const status = invoiceStatuses[statusIndex];
    const amount = po ? po.amount : Math.floor(Math.random() * 8500) + 500;
    const poNumber = po ? po.poNumber : `PO-MOCK-REQ-${1000 + i}`;

    const issueDateObj = new Date();
    issueDateObj.setDate(issueDateObj.getDate() - (100 - i));
    const dueDateObj = new Date(issueDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + 30);

    list.push({
      id: invoiceNumber,
      invoiceNumber,
      poNumber,
      vendorId: vendor.id,
      vendorName: vendor.name,
      amount,
      status,
      issueDate: issueDateObj.toISOString().split('T')[0],
      dueDate: dueDateObj.toISOString().split('T')[0],
      category: vendor.category,
      fileName: `invoice_${invoiceNumber.toLowerCase()}.pdf`
    });
  }

  return list;
};

const getInitialDocuments = (): DocumentFile[] => {
  return [
    { id: 'DOC-0001', name: 'Global_Tech_SLA_2026.pdf', size: '2.4 MB', type: 'application/pdf', uploadedAt: '2026-06-15', category: 'Vendors', status: 'Processed' },
    { id: 'DOC-0002', name: 'Apex_Q1_Shipping_Invoice.pdf', size: '840 KB', type: 'application/pdf', uploadedAt: '2026-06-20', category: 'Invoices', status: 'Processed' },
    { id: 'DOC-0003', name: 'Standard_OfficeMax_Catalog.pdf', size: '5.1 MB', type: 'application/pdf', uploadedAt: '2026-06-21', category: 'Vendors', status: 'Processed' },
    { id: 'DOC-0004', name: 'R&D_Precision_CNC_Quote.pdf', size: '1.2 MB', type: 'application/pdf', uploadedAt: '2026-06-28', category: 'Purchase Orders', status: 'Processed' },
    { id: 'DOC-0005', name: 'Procurement_Audit_Report_2025.pdf', size: '4.8 MB', type: 'application/pdf', uploadedAt: '2026-06-01', category: 'Reports', status: 'Processed' },
    { id: 'DOC-0006', name: 'IT_Hardware_ThinkPad_Config.pdf', size: '320 KB', type: 'application/pdf', uploadedAt: '2026-06-29', category: 'Purchase Orders', status: 'Processed' },
  ];
};

const getInitialAlerts = (): ProcurementAlert[] => {
  return [
    { id: 'ALT-0001', type: 'vendor', severity: 'error', message: 'Vendor "Global Technologies Corp" is now Suspended. 3 pending purchase orders affected.', timestamp: '2026-07-01T08:30:00Z', link: 'vendors' },
    { id: 'ALT-0002', type: 'invoice', severity: 'warning', message: 'Invoice INV-2026-0005 ($14,500) from Apex Logistics is Overdue by 12 days.', timestamp: '2026-07-01T09:15:00Z', link: 'invoices' },
    { id: 'ALT-0003', type: 'po', severity: 'info', message: 'Purchase Order PO-2026-0012 ($78,200) requires Manager Approval.', timestamp: '2026-07-01T10:00:00Z', link: 'purchase-orders' },
    { id: 'ALT-0004', type: 'vendor', severity: 'warning', message: 'Synergy Consulting Group risk score rose by 15% due to late delivery audits.', timestamp: '2026-06-30T16:45:00Z', link: 'vendors' },
    { id: 'ALT-0005', type: 'invoice', severity: 'error', message: 'Duplicate invoice detected: INV-2026-0018 shares identical PO references.', timestamp: '2026-07-01T12:00:00Z', link: 'invoices' }
  ];
};

const getInitialInsights = (): AIInsight[] => {
  return [
    {
      id: 'INS-0001',
      title: 'Bulk Discount Opportunity',
      description: 'Consolidate R&D equipment requests with Spectra Lab Equipment. Consolidating 3 pending requisitions can unlock a 12% bulk discount ($14,400 potential savings).',
      type: 'saving',
      impact: 'High Impact ($14,400)',
      details: 'Analyze pending items across R&D departments. Combining orders PO-2026-0091, PO-2026-0094, and PO-2026-0098 will trigger the tier-2 pricing contract.'
    },
    {
      id: 'INS-0002',
      title: 'Supplier Risk Advisory',
      description: 'Global Technologies Corp has been flagged due to compliance audit delays. We recommend shifting upcoming IT hardware orders to Pioneer Electronics.',
      type: 'risk',
      impact: 'Risk Mitigation',
      details: 'Global Technologies Corp performance score dropped from 94 to 78 due to delivery delays. Shift scheduled laptops sourcing to Vanguard or Apex for Q3.'
    },
    {
      id: 'INS-0003',
      title: 'Invoice Processing Bottleneck',
      description: 'Invoices under "IT Hardware & Software" average 18 days in "Pending Approval" status. Recommend automating approvals under $5,000 threshold.',
      type: 'process',
      impact: 'Cycle Time Reduction',
      details: 'Cycle audit shows IT hardware approvals stall at department level. Setting up automatic matching rules for verified POS would eliminate 40% of delays.'
    }
  ];
};

const getInitialActivities = (): UserActivity[] => {
  return [
    { id: 'ACT-0001', type: 'auth', description: 'User Admin (Procurement Director) logged in successfully.', timestamp: '2026-07-01T15:30:00Z', user: 'Admin' },
    { id: 'ACT-0002', type: 'po', description: 'Purchase Order PO-2026-0015 approved by Admin.', timestamp: '2026-07-01T14:22:00Z', user: 'Admin' },
    { id: 'ACT-0003', type: 'document', description: 'New document Apex_Q1_Shipping_Invoice.pdf uploaded and processed.', timestamp: '2026-07-01T13:05:00Z', user: 'System' },
    { id: 'ACT-0004', type: 'invoice', description: 'Invoice INV-2026-0044 status updated to Paid.', timestamp: '2026-07-01T11:40:00Z', user: 'Finance Bot' },
    { id: 'ACT-0005', type: 'vendor', description: 'Vendor Synergy Consulting Group status set to Under Review.', timestamp: '2026-06-30T17:10:00Z', user: 'Admin' }
  ];
};

// Initialize localStorage databases if not exists
const initializeLocalStorage = () => {
  if (!localStorage.getItem('sap_vendors')) {
    const vendors = getInitialVendors();
    const pos = getInitialPOs(vendors);
    const invoices = getInitialInvoices(vendors, pos);
    const documents = getInitialDocuments();
    const alerts = getInitialAlerts();
    const insights = getInitialInsights();
    const activities = getInitialActivities();

    localStorage.setItem('sap_vendors', JSON.stringify(vendors));
    localStorage.setItem('sap_pos', JSON.stringify(pos));
    localStorage.setItem('sap_invoices', JSON.stringify(invoices));
    localStorage.setItem('sap_documents', JSON.stringify(documents));
    localStorage.setItem('sap_alerts', JSON.stringify(alerts));
    localStorage.setItem('sap_insights', JSON.stringify(insights));
    localStorage.setItem('sap_activities', JSON.stringify(activities));
  }
};

// Initialize DB
initializeLocalStorage();

// Database Access helpers
const getStored = <T>(key: string): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : ([] as unknown as T);
};

const setStored = <T>(key: string, val: T): void => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Mock API implementations for use in TanStack Query custom hooks
export const MockDb = {
  getVendors: async (): Promise<Vendor[]> => {
    await delay(300);
    return getStored<Vendor[]>('sap_vendors');
  },

  updateVendor: async (updated: Vendor): Promise<Vendor> => {
    await delay(300);
    const list = getStored<Vendor[]>('sap_vendors');
    const index = list.findIndex(v => v.id === updated.id);
    if (index !== -1) {
      list[index] = updated;
      setStored('sap_vendors', list);
    }
    return updated;
  },

  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    await delay(400);
    return getStored<PurchaseOrder[]>('sap_pos');
  },

  updatePOStatus: async (id: string, status: POStatus): Promise<PurchaseOrder> => {
    await delay(400);
    const list = getStored<PurchaseOrder[]>('sap_pos');
    const index = list.findIndex(po => po.id === id);
    if (index === -1) throw new Error('Purchase Order not found');

    list[index].status = status;
    setStored('sap_pos', list);

    // Track activity
    const activities = getStored<UserActivity[]>('sap_activities');
    const newAct: UserActivity = {
      id: `ACT-${Date.now()}`,
      type: 'po',
      description: `Purchase Order ${list[index].poNumber} workflow progressed to ${status}.`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    };
    setStored('sap_activities', [newAct, ...activities]);

    return list[index];
  },

  createPurchaseOrder: async (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>): Promise<PurchaseOrder> => {
    await delay(500);
    const list = getStored<PurchaseOrder[]>('sap_pos');
    const id = `PO-2026-${(list.length + 1).toString().padStart(4, '0')}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id,
      poNumber: id
    };
    list.unshift(newPO);
    setStored('sap_pos', list);

    // Track activity
    const activities = getStored<UserActivity[]>('sap_activities');
    const newAct: UserActivity = {
      id: `ACT-${Date.now()}`,
      type: 'po',
      description: `New Purchase Order ${id} created in Draft.`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    };
    setStored('sap_activities', [newAct, ...activities]);

    return newPO;
  },

  getInvoices: async (): Promise<Invoice[]> => {
    await delay(300);
    return getStored<Invoice[]>('sap_invoices');
  },

  updateInvoiceStatus: async (id: string, status: InvoiceStatus): Promise<Invoice> => {
    await delay(300);
    const list = getStored<Invoice[]>('sap_invoices');
    const index = list.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');

    list[index].status = status;
    setStored('sap_invoices', list);

    // Track activity
    const activities = getStored<UserActivity[]>('sap_activities');
    const newAct: UserActivity = {
      id: `ACT-${Date.now()}`,
      type: 'invoice',
      description: `Invoice ${list[index].invoiceNumber} approved and set to ${status}.`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    };
    setStored('sap_activities', [newAct, ...activities]);

    return list[index];
  },

  uploadInvoiceFile: async (file: { name: string; size: string; type: string }): Promise<Invoice> => {
    await delay(1200); // Longer upload lag
    const list = getStored<Invoice[]>('sap_invoices');
    const number = `INV-2026-${(list.length + 1).toString().padStart(4, '0')}`;
    const amount = Math.floor(Math.random() * 45000) + 1200;
    const vendors = getStored<Vendor[]>('sap_vendors');
    const targetVendor = vendors[Math.floor(Math.random() * vendors.length)];

    const newInvoice: Invoice = {
      id: number,
      invoiceNumber: number,
      poNumber: `PO-2026-${Math.floor(Math.random() * 50 + 1).toString().padStart(4, '0')}`,
      vendorId: targetVendor.id,
      vendorName: targetVendor.name,
      amount,
      status: 'Pending Approval',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: targetVendor.category,
      fileName: file.name
    };

    list.unshift(newInvoice);
    setStored('sap_invoices', list);

    // Track document
    const docs = getStored<DocumentFile[]>('sap_documents');
    const newDoc: DocumentFile = {
      id: `DOC-${(docs.length + 1).toString().padStart(4, '0')}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString().split('T')[0],
      category: 'Invoices',
      status: 'Processed'
    };
    setStored('sap_documents', [newDoc, ...docs]);

    // Track activity
    const activities = getStored<UserActivity[]>('sap_activities');
    const newAct: UserActivity = {
      id: `ACT-${Date.now()}`,
      type: 'document',
      description: `Uploaded and parsed invoice document ${file.name}.`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    };
    setStored('sap_activities', [newAct, ...activities]);

    return newInvoice;
  },

  getDocuments: async (): Promise<DocumentFile[]> => {
    await delay(300);
    return getStored<DocumentFile[]>('sap_documents');
  },

  addDocument: async (file: { name: string; size: string; type: string; category: DocumentFile['category'] }): Promise<DocumentFile> => {
    await delay(800);
    const list = getStored<DocumentFile[]>('sap_documents');
    const id = `DOC-${(list.length + 1).toString().padStart(4, '0')}`;
    const newDoc: DocumentFile = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString().split('T')[0],
      category: file.category,
      status: 'Processed'
    };

    list.unshift(newDoc);
    setStored('sap_documents', list);

    // Track activity
    const activities = getStored<UserActivity[]>('sap_activities');
    const newAct: UserActivity = {
      id: `ACT-${Date.now()}`,
      type: 'document',
      description: `Document ${file.name} saved under ${file.category}.`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    };
    setStored('sap_activities', [newAct, ...activities]);

    return newDoc;
  },

  deleteDocument: async (id: string): Promise<string> => {
    await delay(300);
    const list = getStored<DocumentFile[]>('sap_documents');
    const filtered = list.filter(doc => doc.id !== id);
    setStored('sap_documents', filtered);
    return id;
  },

  renameDocument: async (id: string, newName: string): Promise<DocumentFile> => {
    await delay(300);
    const list = getStored<DocumentFile[]>('sap_documents');
    const index = list.findIndex(doc => doc.id === id);
    if (index === -1) throw new Error('Document not found');
    list[index].name = newName;
    setStored('sap_documents', list);
    return list[index];
  },


  getDashboardData: async () => {
    await delay(500);
    const pos = getStored<PurchaseOrder[]>('sap_pos');
    const invoices = getStored<Invoice[]>('sap_invoices');
    const alerts = getStored<ProcurementAlert[]>('sap_alerts');
    const insights = getStored<AIInsight[]>('sap_insights');
    const activities = getStored<UserActivity[]>('sap_activities');

    // Math for KPIs
    const totalSpend = pos
      .filter(po => ['PO Generated', 'Vendor Accepted', 'Delivered', 'Invoice Received', 'Closed'].includes(po.status))
      .reduce((sum, po) => sum + po.amount, 0);

    const pendingApprovalsCount = pos.filter(po => ['Manager Approval', 'Finance Approval'].includes(po.status)).length +
      invoices.filter(inv => inv.status === 'Pending Approval').length;

    const kpis: ProcurementKPIs = {
      totalSpend,
      poCount: pos.length,
      invoiceCount: invoices.length,
      pendingApprovalsCount,
      averageCycleTimeDays: 14.5,
      costSavings: totalSpend * 0.084, // 8.4% cost savings simulated
      savingsRate: 8.4
    };

    return {
      kpis,
      alerts,
      insights,
      activities
    };
  }
};
