import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchaseOrder, POStatus, Invoice, InvoiceStatus, Vendor, DocumentFile } from '../types';

const BASE_URL = 'http://localhost:5000/api/v1';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('sap_auth_token');
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Standardized full-stack API fetch wrapper
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = { ...authHeaders };

  // Setup Content-Type only if it's not a multipart file upload Form data stream
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const json = await res.json();
  if (!res.ok || json.status === 'error') {
    throw new Error(json.message || 'REST API request failed.');
  }

  return json.data as T;
}

// Fetch all vendors
export const useVendors = () => {
  return useQuery<Vendor[], Error>({
    queryKey: ['vendors'],
    queryFn: () => apiFetch<{ results: Vendor[] }>('/vendors?limit=100').then(data => data.results),
    staleTime: 2 * 60 * 1000
  });
};

// Update vendor
export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation<Vendor, Error, Vendor>({
    mutationFn: (vendor) => 
      apiFetch<Vendor>(`/vendors/${vendor.id}`, {
        method: 'PUT',
        body: JSON.stringify(vendor)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

// Fetch all purchase orders
export const usePurchaseOrders = () => {
  return useQuery<PurchaseOrder[], Error>({
    queryKey: ['purchaseOrders'],
    queryFn: () => apiFetch<{ results: PurchaseOrder[] }>('/purchase-orders?limit=150').then(data => data.results),
    staleTime: 2 * 60 * 1000
  });
};

// Update Purchase Order Status
export const useUpdatePOStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<PurchaseOrder, Error, { id: string; status: POStatus }>({
    mutationFn: ({ id, status }) => 
      apiFetch<PurchaseOrder>(`/purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

// Create Purchase Order
export const useCreatePO = () => {
  const queryClient = useQueryClient();
  return useMutation<PurchaseOrder, Error, Omit<PurchaseOrder, 'id' | 'poNumber'>>({
    mutationFn: (newPo) => 
      apiFetch<PurchaseOrder>('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(newPo)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

// Fetch all invoices
export const useInvoices = () => {
  return useQuery<Invoice[], Error>({
    queryKey: ['invoices'],
    queryFn: () => apiFetch<{ results: Invoice[] }>('/invoices?limit=150').then(data => data.results),
    staleTime: 2 * 60 * 1000
  });
};

// Update invoice status
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Invoice, Error, { id: string; status: InvoiceStatus }>({
    mutationFn: ({ id, status }) => 
      apiFetch<Invoice>(`/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

// Upload invoice (multipart file stream)
export const useUploadInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation<Invoice, Error, File>({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch<Invoice>('/invoices/upload', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

// Fetch Document Center files
export const useDocuments = () => {
  return useQuery<DocumentFile[], Error>({
    queryKey: ['documents'],
    queryFn: () => apiFetch<{ results: DocumentFile[] }>('/documents?limit=100').then(data => data.results),
    staleTime: 2 * 60 * 1000
  });
};

// Upload standard document
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<DocumentFile, Error, { file: File; category: string }>({
    mutationFn: ({ file, category }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      return apiFetch<DocumentFile>('/documents', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

// Fetch Consolidated Dashboard Metrics
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<any>('/reports/dashboard'),
    staleTime: 1 * 60 * 1000
  });
};

// Delete standard document
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: (id) => 
      apiFetch<string>(`/documents/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

// Rename standard document
export const useRenameDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<DocumentFile, Error, { id: string; newName: string }>({
    mutationFn: ({ id, newName }) => 
      apiFetch<DocumentFile>(`/documents/${id}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ newName })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};
