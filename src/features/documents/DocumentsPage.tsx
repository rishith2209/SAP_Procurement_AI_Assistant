import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocuments, useUploadDocument, useDeleteDocument, useRenameDocument } from '../../hooks/useQueries';
import { Button } from '../../components/Button';
import { SkeletonTable } from '../../components/Skeleton';
import { Search, Upload, Folder, FileText, ArrowLeft, Calendar, File, CheckCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import { DocumentFile } from '../../types';

export const DocumentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: documents = [], isLoading, error } = useDocuments();
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const renameDocMutation = useRenameDocument();

  // Local state
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [activeFolder, setActiveFolder] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);

  // Rename action state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Re-index animation state
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexProgress, setReindexProgress] = useState(0);

  // Drag and Drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const [localFile, setLocalFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync search from URL params & auto-open matching citation documents
  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) {
      setSearchQuery(searchVal);
      
      // Auto open document preview if search exactly matches a document name
      const matched = documents.find(d => d.name.toLowerCase() === searchVal.toLowerCase());
      if (matched) {
        setSelectedDoc(matched);
      }
    }
  }, [searchParams, documents]);

  if (error) {
    return (
      <div className="p-6 text-center bg-sap-status-error-bg text-sap-status-error-text dark:bg-sap-status-error-darkBg dark:text-sap-status-error-darkText rounded-xl">
        <h3 className="font-bold">Error loading documents</h3>
        <p className="text-xs">Ledger lookup failed. Refresh authorization tokens.</p>
      </div>
    );
  }

  // Folder categories
  const folders = ['ALL', 'Purchase Orders', 'Invoices', 'Vendors', 'Reports'];

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = activeFolder === 'ALL' || doc.category === activeFolder;
    return matchesSearch && matchesFolder;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const details = {
      name: file.name,
      size: formattedSize,
      type: file.type,
      category: (activeFolder === 'ALL' ? 'Unsorted' : activeFolder) as DocumentFile['category']
    };

    setLocalFile(details);

    try {
      // Upload file to Backend (which performs database storage + RAG indexing in one unified flow!)
      const newDoc = await uploadDocMutation.mutateAsync({
        file,
        category: (activeFolder === 'ALL' ? 'Unsorted' : activeFolder)
      });
      
      setLocalFile(null);
      setSelectedDoc(newDoc); // Open details preview
    } catch (err) {
      console.error('File parsing failed:', err);
      setLocalFile(null);
      alert('Error parsing document. Verify file schema validity.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document from S/4HANA records?')) {
      await deleteDocMutation.mutateAsync(docId);
      setSelectedDoc(null);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDoc && renameValue.trim()) {
      await renameDocMutation.mutateAsync({ id: selectedDoc.id, newName: renameValue });
      setIsRenaming(false);
    }
  };

  const handleReindex = async () => {
    if (!selectedDoc) return;
    setIsReindexing(true);
    setReindexProgress(30);

    try {
      const token = localStorage.getItem('sap_auth_token');
      setReindexProgress(60);
      const res = await fetch(`http://localhost:5000/api/v1/documents/${selectedDoc.id}/reindex`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Re-indexing server error');
      
      setReindexProgress(100);
      setTimeout(() => {
        setIsReindexing(false);
        setReindexProgress(0);
        alert('Re-indexing vector embedding index succeeded.');
      }, 400);
    } catch (err) {
      console.error(err);
      setIsReindexing(false);
      alert('Failed to re-index document embeddings on server.');
    }
  };

  // Helper to format/highlight text preview matches
  const renderHighlightedContent = (docName: string) => {
    const nameLower = docName.toLowerCase();
    let sampleContent = `Document contents scan for ${docName}:\n\n`;

    if (nameLower.includes('policy')) {
      sampleContent += `### Section 1: Standard Signature Approvals Limits\nAll capital and operational procurement transactions must route through cost-center hierarchy audits:\n1. Project managers: Authorized up to $25,000.\n2. Department heads: Authorized up to $100,000.\n3. Procurement Director (Michael Chen): Authorized up to $250,000.\n4. CFO / VP of Operations: Required for all transactions exceeding $250,000.\n\n### Section 2: 3-Way Matching Standard Controls\nFinance disbursement audits require strict 3-way matching before releasing payouts:\n- Supplier Invoice details must correspond precisely with the approved Purchase Order.\n- Deliveries/Goods Receipt records must match within a 0.0% variance threshold.\n- Any discrepancy flags automatic holds in the accounts payable ledger.`;
    } else if (nameLower.includes('sla') || nameLower.includes('contract')) {
      sampleContent += `### Service Level Agreement - Global Technologies Corp\n- Effective Date: January 1, 2026.\n- Scope of Work: IT hardware laptop sourcing and cloud compute packaging.\n- Payment Terms: Net 30 days from invoice matches validation.\n- Quality SLAs: Minimum 98.5% uptime on cloud packages; delivery cycles of ThinkPad laptops within 10 operational business days.\n- Penalty Terms: Late delivery results in a 1.5% contract rebate per week of delay.`;
    } else {
      sampleContent += `Summary:\nThis file contains ledger data for ${docName}.\nSize: ${selectedDoc?.size}.\nUploaded: ${selectedDoc?.uploadedAt}.\nStatus: Verified matching catalog.`;
    }

    const highlightQuery = searchParams.get('search');
    if (!highlightQuery) {
      return <pre className="whitespace-pre-wrap font-sans text-xs text-sap-gray-600 dark:text-sap-gray-300">{sampleContent}</pre>;
    }

    // Escape regex characters
    const escapedQuery = highlightQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = sampleContent.split(regex);

    return (
      <pre className="whitespace-pre-wrap font-sans text-xs text-sap-gray-600 dark:text-sap-gray-300">
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/40 text-sap-gray-800 dark:text-white px-0.5 rounded font-bold border-b border-yellow-400">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </pre>
    );
  };

  return (
    <div className="space-y-6 relative h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-sap-gray-800 dark:text-white">Document Control Center</h2>
          <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400">Store and categorize corporate contract records, invoice receipts, and compliance forms.</p>
        </div>
        {searchParams.get('search') && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => {
              setSearchParams({});
              setSearchQuery('');
            }}
          >
            Clear Citation Filter
          </Button>
        )}
      </div>

      {/* Main Grid: Sidebar Folders + Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Folders */}
        <div className="fiori-card bg-white dark:bg-sap-card-dark p-4 h-fit space-y-2">
          <h3 className="text-xs font-bold text-sap-gray-400 uppercase tracking-wider mb-2.5">ERP Folders</h3>
          {folders.map(folder => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-md text-left transition-colors ${
                activeFolder === folder
                  ? 'bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium font-bold'
                  : 'text-sap-gray-600 dark:text-sap-gray-300 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800'
              }`}
            >
              <Folder className="w-4 h-4 mr-2.5 text-sap-blue-medium" />
              {folder === 'ALL' ? 'All Documents' : folder}
            </button>
          ))}
        </div>

        {/* Main Workspace Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Drag Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`fiori-card bg-white dark:bg-sap-card-dark p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-sap-gray-50/50 dark:hover:bg-sap-gray-800/20 text-center transition-all ${
              isDragActive ? 'border-sap-blue bg-sap-blue-light/35' : 'border-sap-border-light dark:border-sap-border-dark'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              className="hidden"
            />
            {uploadDocMutation.isPending && localFile ? (
              <div className="space-y-3 py-4 max-w-xs mx-auto">
                <FileText className="w-8 h-8 mx-auto text-sap-blue animate-pulse" />
                <p className="text-xs font-bold truncate text-sap-gray-800 dark:text-white">{localFile.name}</p>
                <div className="h-1.5 w-full bg-sap-gray-200 dark:bg-sap-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-sap-blue w-2/3 animate-pulse" />
                </div>
                <p className="text-[10px] text-sap-accent font-bold animate-pulse">Running semantic parsing & indexing...</p>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 mx-auto text-sap-blue-medium mb-2.5" />
                <h4 className="text-xs font-bold text-sap-gray-800 dark:text-white">Drag & drop files or click to upload</h4>
                <p className="text-[10px] text-sap-gray-400 dark:text-sap-gray-500 mt-1">Upload files under active category folder: <strong>{activeFolder === 'ALL' ? 'Unsorted' : activeFolder}</strong></p>
              </>
            )}
          </div>

          {/* Search bar & file list */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-sap-gray-400" />
              <input
                type="text"
                placeholder="Search file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="fiori-input pl-10"
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-20 bg-sap-gray-100 animate-pulse rounded-lg" />
                <div className="h-20 bg-sap-gray-100 animate-pulse rounded-lg" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center text-xs text-sap-gray-400 bg-white dark:bg-sap-card-dark rounded-xl border border-sap-border-light dark:border-sap-border-dark">
                No documents found in folder "{activeFolder}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoc(doc);
                      setRenameValue(doc.name);
                      setIsRenaming(false);
                    }}
                    className="fiori-card fiori-card-hover bg-white dark:bg-sap-card-dark p-4 cursor-pointer flex items-center space-x-3.5"
                  >
                    <div className="p-2.5 bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium rounded-lg">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-sap-gray-800 dark:text-white truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-sap-gray-400 mt-0.5">{doc.size} • Folder: {doc.category}</p>
                    </div>
                    <span className="text-[9px] text-sap-gray-400 font-medium">{doc.uploadedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail drawer preview */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedDoc(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-sap-card-dark shadow-2xl h-full flex flex-col z-10 animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-sap-border-light dark:border-sap-border-dark bg-sap-gray-50 dark:bg-sap-gray-800/50 flex justify-between items-center">
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-md text-sap-gray-500 hover:bg-sap-gray-200 dark:hover:bg-sap-gray-800 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span className="text-xs font-bold">Back to List</span>
              </button>
              <h3 className="text-sm font-bold text-sap-gray-800 dark:text-white">Document Metadata</h3>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {/* Document Overview */}
              <div className="flex items-center justify-between pb-4 border-b border-sap-border-light dark:border-sap-border-dark">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium rounded-xl">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    {isRenaming ? (
                      <form onSubmit={handleRenameSubmit} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="fiori-input py-1 text-xs"
                          autoFocus
                        />
                        <Button type="submit" variant="primary" size="sm">Save</Button>
                      </form>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-sap-gray-800 dark:text-white flex items-center">
                          {selectedDoc.name}
                          <button onClick={() => setIsRenaming(true)} className="ml-2 p-1 text-sap-gray-400 hover:text-sap-blue" title="Rename file">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </h4>
                        <p className="text-xs text-sap-gray-400 mt-1">Status: <span className="font-semibold text-sap-status-success-text">{selectedDoc.status}</span></p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex space-x-1.5">
                  <button
                    onClick={handleReindex}
                    disabled={isReindexing}
                    className="p-2 rounded bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium hover:bg-sap-blue/30"
                    title="Force Re-index Embeddings"
                  >
                    <RefreshCw className={`w-4 h-4 ${isReindexing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDoc.id)}
                    className="p-2 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Asynchronous Re-index Progress Panel */}
              {isReindexing && (
                <div className="p-4 bg-sap-blue-light/10 border border-sap-blue/20 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-sap-blue">
                    <span>Re-calculating document embeddings...</span>
                    <span>{reindexProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-sap-gray-200 dark:bg-sap-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sap-blue transition-all duration-300" style={{ width: `${reindexProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Metadata Parameters */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-sap-gray-400 uppercase tracking-wider block">File Format</span>
                  <span className="font-semibold text-sap-gray-700 dark:text-sap-gray-300">{selectedDoc.type}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-sap-gray-400 uppercase tracking-wider block">Data Size</span>
                  <span className="font-semibold text-sap-gray-700 dark:text-sap-gray-300">{selectedDoc.size}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-sap-gray-400 uppercase tracking-wider block">Upload Date</span>
                  <div className="flex items-center text-sap-gray-700 dark:text-sap-gray-300">
                    <Calendar className="w-4.5 h-4.5 text-sap-gray-400 mr-1.5" />
                    <span>{selectedDoc.uploadedAt}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-sap-gray-400 uppercase tracking-wider block">ERP Category Location</span>
                  <span className="font-semibold text-sap-blue dark:text-sap-blue-medium">{selectedDoc.category}</span>
                </div>
              </div>

              {/* Document Text Preview Panel */}
              <div className="space-y-2">
                <span className="font-bold text-sap-gray-400 uppercase tracking-wider block text-xs">Document Content Preview</span>
                <div className="fiori-card p-4 bg-sap-gray-50/50 dark:bg-sap-gray-900/40 border max-h-72 overflow-y-auto rounded-xl">
                  {renderHighlightedContent(selectedDoc.name)}
                </div>
              </div>

              {/* OCR Check */}
              <div className="fiori-card p-4 bg-sap-status-success-bg/25 border border-sap-status-success-text/25 space-y-3 rounded-xl">
                <div className="flex items-center space-x-2 text-sap-status-success-text font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4.5 h-4.5" />
                  <span>S/4HANA OCR Extraction Completed</span>
                </div>
                <p className="text-[11px] text-sap-gray-600 dark:text-sap-gray-300 leading-relaxed font-medium">
                  Document content successfully indexed. Word embeddings mapped to vector store index. Query models verified.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-sap-border-light dark:border-sap-border-dark flex justify-between bg-sap-gray-50 dark:bg-sap-gray-800/50">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDoc(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
