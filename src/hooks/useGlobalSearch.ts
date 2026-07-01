import { usePurchaseOrders, useVendors, useInvoices, useDocuments } from './useQueries';
import { useData } from '../contexts/DataContext';
import { useDebounce } from './useDebounce';
import { PurchaseOrder, Vendor, Invoice, DocumentFile } from '../types';

export interface SearchResults {
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  invoices: Invoice[];
  documents: DocumentFile[];
  totalResults: number;
}

export const useGlobalSearch = () => {
  const { globalSearchQuery } = useData();
  const debouncedQuery = useDebounce(globalSearchQuery, 250);

  const { data: pos = [], isLoading: poLoading } = usePurchaseOrders();
  const { data: vendors = [], isLoading: vendorLoading } = useVendors();
  const { data: invoices = [], isLoading: invoiceLoading } = useInvoices();
  const { data: docs = [], isLoading: docLoading } = useDocuments();

  const isLoading = poLoading || vendorLoading || invoiceLoading || docLoading;

  const query = debouncedQuery.trim().toLowerCase();

  if (!query) {
    return {
      results: { purchaseOrders: [], vendors: [], invoices: [], documents: [], totalResults: 0 },
      isLoading: false
    };
  }

  // Search POs
  const matchedPOs = pos.filter(po => 
    po.poNumber.toLowerCase().includes(query) ||
    po.vendorName.toLowerCase().includes(query) ||
    po.department.toLowerCase().includes(query) ||
    po.status.toLowerCase().includes(query)
  ).slice(0, 5);

  // Search Vendors
  const matchedVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(query) ||
    v.code.toLowerCase().includes(query) ||
    v.category.toLowerCase().includes(query)
  ).slice(0, 5);

  // Search Invoices
  const matchedInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(query) ||
    inv.poNumber.toLowerCase().includes(query) ||
    inv.vendorName.toLowerCase().includes(query) ||
    inv.status.toLowerCase().includes(query)
  ).slice(0, 5);

  // Search Documents
  const matchedDocs = docs.filter(doc =>
    doc.name.toLowerCase().includes(query) ||
    doc.category.toLowerCase().includes(query)
  ).slice(0, 5);

  const totalResults = matchedPOs.length + matchedVendors.length + matchedInvoices.length + matchedDocs.length;

  const results: SearchResults = {
    purchaseOrders: matchedPOs,
    vendors: matchedVendors,
    invoices: matchedInvoices,
    documents: matchedDocs,
    totalResults
  };

  return { results, isLoading };
};
