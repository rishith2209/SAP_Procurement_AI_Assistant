import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

async function main() {
  console.log('Seeding S/4HANA Database...');

  // 1. Create standard users with hashed credentials
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sap-procurement.corp' },
    update: {},
    create: {
      email: 'admin@sap-procurement.corp',
      password: passwordHash,
      name: 'Michael Chen',
      role: 'Admin',
      department: 'Finance & Administration',
      approvalLimit: 250000
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@sap-procurement.corp' },
    update: {},
    create: {
      email: 'manager@sap-procurement.corp',
      password: passwordHash,
      name: 'Sarah Jenkins',
      role: 'Procurement Manager',
      department: 'IT & Infrastructure',
      approvalLimit: 100000
    }
  });

  const finance = await prisma.user.upsert({
    where: { email: 'finance@sap-procurement.corp' },
    update: {},
    create: {
      email: 'finance@sap-procurement.corp',
      password: passwordHash,
      name: 'David Vance',
      role: 'Finance Manager',
      department: 'Finance & Administration',
      approvalLimit: 150000
    }
  });

  console.log('Seeded Users: Admin, Procurement Manager, Finance Manager');

  // 2. Create 30 Vendors
  const vendors = [];
  for (let i = 0; i < VENDOR_NAMES.length; i++) {
    const name = VENDOR_NAMES[i];
    const code = `VEND-${(i + 1).toString().padStart(4, '0')}`;
    const category = CATEGORIES[i % CATEGORIES.length];
    const performanceScore = Math.floor(Math.random() * 25) + 75; // 75-99
    const deliveryScore = Math.floor(Math.random() * 25) + 75;    // 75-99
    const riskScore = Math.floor(Math.random() * 40) + 10;        // 10-50
    const totalSpend = Math.floor(Math.random() * 450000) + 15000;
    const status = i % 15 === 0 ? 'Suspended' : i % 8 === 0 ? 'Under Review' : 'Active';

    const vendor = await prisma.vendor.upsert({
      where: { code },
      update: {},
      create: {
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
      }
    });
    vendors.push(vendor);
  }
  console.log(`Seeded ${vendors.length} Vendors.`);

  // 3. Create 100 Purchase Orders with line items
  const poStatuses = [
    'Draft', 'Manager Approval', 'Finance Approval', 'PO Generated',
    'Vendor Accepted', 'Delivered', 'Invoice Received', 'Closed'
  ];

  for (let i = 1; i <= 100; i++) {
    const poNumber = `PO-2026-${i.toString().padStart(4, '0')}`;
    const vendor = vendors[i % vendors.length];
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const status = poStatuses[i % 8];

    const itemsCount = Math.floor(Math.random() * 3) + 1;
    let amount = 0;
    const itemsData = [];

    const possibleItems = ITEM_DESCRIPTIONS[vendor.category] || ['General Supplies'];

    for (let j = 1; j <= itemsCount; j++) {
      const desc = possibleItems[j % possibleItems.length];
      const qty = Math.floor(Math.random() * 50) + 1;
      const price = Math.floor(Math.random() * 1200) + 100;
      const total = qty * price;
      amount += total;

      itemsData.push({
        description: desc,
        quantity: qty,
        unitPrice: price,
        total
      });
    }

    const orderDateObj = new Date();
    orderDateObj.setDate(orderDateObj.getDate() - (105 - i));
    const deliveryDateObj = new Date(orderDateObj);
    deliveryDateObj.setDate(deliveryDateObj.getDate() + 15);

    await prisma.purchaseOrder.upsert({
      where: { poNumber },
      update: {},
      create: {
        poNumber,
        vendorId: vendor.id,
        vendorName: vendor.name,
        department,
        amount,
        status,
        orderDate: orderDateObj.toISOString().split('T')[0],
        deliveryDate: deliveryDateObj.toISOString().split('T')[0],
        items: {
          create: itemsData
        }
      }
    });
  }
  console.log('Seeded 100 Purchase Orders with line items.');

  // 4. Create 100 Invoices
  const invoiceStatuses = ['Draft', 'Pending Approval', 'Approved', 'Paid', 'Overdue', 'Rejected'];

  for (let i = 1; i <= 100; i++) {
    const invoiceNumber = `INV-2026-${i.toString().padStart(4, '0')}`;
    const vendor = vendors[i % vendors.length];
    const status = invoiceStatuses[i % 6];
    const amount = Math.floor(Math.random() * 8500) + 500;
    const poNumber = `PO-2026-${i.toString().padStart(4, '0')}`;

    const issueDateObj = new Date();
    issueDateObj.setDate(issueDateObj.getDate() - (100 - i));
    const dueDateObj = new Date(issueDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + 30);

    await prisma.invoice.upsert({
      where: { invoiceNumber },
      update: {},
      create: {
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
      }
    });
  }
  console.log('Seeded 100 Invoices.');

  // 5. Create default documents
  const defaultDocs = [
    { name: 'Global_Tech_SLA_2026.pdf', size: '2.4 MB', type: 'application/pdf', uploadedAt: '2026-06-15', category: 'Vendors', status: 'Processed' },
    { name: 'Apex_Q1_Shipping_Invoice.pdf', size: '840 KB', type: 'application/pdf', uploadedAt: '2026-06-20', category: 'Invoices', status: 'Processed' },
    { name: 'Standard_OfficeMax_Catalog.pdf', size: '5.1 MB', type: 'application/pdf', uploadedAt: '2026-06-21', category: 'Vendors', status: 'Processed' }
  ];

  for (const d of defaultDocs) {
    await prisma.document.create({
      data: d
    });
  }

  // 6. Seed first AuditLog
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      username: admin.name,
      action: 'Database Seeding',
      category: 'System',
      details: 'PostgreSQL database seeded with base procurement datasets successfully.',
      ipAddress: '127.0.0.1'
    }
  });

  console.log('Database Seeding Completed Successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
