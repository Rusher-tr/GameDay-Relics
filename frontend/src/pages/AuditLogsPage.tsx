import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AuditLog {
  _id: string;
  action: string | null | "null";
  amount: number | null | "null";
  sellerId: {
    _id: string;
    username: string;
    email: string;
    role: string;
  } | null | "null";
  userId: {
    _id: string;
    username: string;
    email: string;
    role: string;
  } | null | "null";
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalLogs: number;
  logsPerPage: number;
}

interface AuditLogsPageProps {
  onBack: () => void;
}

export default function AuditLogsPage({ onBack }: AuditLogsPageProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const logsPerPage = 10;
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAuditLogs(currentPage);
  }, [currentPage]);

  const fetchAuditLogs = async (page: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/admins/audit-logs?page=${page}&limit=${logsPerPage}`);
      const data = (response.data as any).data;
      setAuditLogs(data.auditLogs);
      setPagination(data.pagination);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to load audit logs';
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 });
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'null') return 'null';
    return new Date(dateString).toLocaleString();
  };

  const renderValue = (value: any) => {
    if (value === null || value === undefined || value === 'null') {
      return <span className="text-slate-400">null</span>;
    }
    if (typeof value === 'object') {
      return (
        <div className="text-sm">
          <p className="font-semibold">{value.username || 'N/A'}</p>
          <p className="text-slate-500">{value.email || 'N/A'}</p>
          <p className="text-xs text-slate-400">{value.role || 'N/A'}</p>
        </div>
      );
    }
    return <span>{value}</span>;
  };

  const downloadPDF = async () => {
    if (!tableRef.current) return;
    
    try {
      setDownloadingPdf(true);
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      pdf.save(`audit-logs-${timestamp}.pdf`);
      
      toast.success('PDF downloaded successfully!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', { position: 'top-right', autoClose: 3000 });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 p-6 border-b border-slate-200 shadow-sm bg-white">
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Back to Admin Panel"
            >
              <ArrowLeft className="h-6 w-6 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Audit Logs</h1>
              <p className="text-slate-600 text-sm mt-1">View all system activities</p>
            </div>
          </div>
          <button
            onClick={downloadPDF}
            disabled={downloadingPdf || auditLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download audit logs as PDF"
          >
            <Download className="h-5 w-5" />
            <span className="text-sm">{downloadingPdf ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">{loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading audit logs...</p>
            </div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-lg text-slate-600">No audit logs found</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" ref={tableRef}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-bold text-slate-900">Action</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-900">Amount</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-900">Seller</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-900">Admin/User</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-900 whitespace-nowrap">Created At</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-900 whitespace-nowrap">Updated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr
                        key={log._id}
                        className={`border-b border-slate-200 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          } hover:bg-amber-50`}
                      >
                        <td className="px-4 py-3 text-slate-900 font-semibold">
                          {renderValue(log.action)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {!log.amount || log.amount === 'null' ? (
                            <span className="text-slate-400">null</span>
                          ) : (
                            <span className="font-semibold text-amber-700">PKR {Number(log.amount).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {!log.sellerId || log.sellerId === 'null' ? (
                            <span className="text-slate-400">null</span>
                          ) : (
                            <div>
                              <p className="font-semibold text-slate-900">{(log.sellerId as any)?.username}</p>
                              <p className="text-slate-500">{(log.sellerId as any)?.email}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {!log.userId || log.userId === 'null' ? (
                            <span className="text-slate-400">null</span>
                          ) : (
                            <div>
                              <p className="font-semibold text-slate-900">{(log.userId as any)?.username}</p>
                              <p className="text-slate-500">{(log.userId as any)?.email}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                                {(log.userId as any)?.role}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                          {formatDate(log.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                <div className="text-xs text-slate-600">
                  Showing{' '}
                  <span className="font-semibold text-slate-900">
                    {(pagination.currentPage - 1) * pagination.logsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.min(pagination.currentPage * pagination.logsPerPage, pagination.totalLogs)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-900">{pagination.totalLogs}</span> logs
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={pagination.currentPage === 1}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                  </button>

                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let page;
                      if (pagination.totalPages <= 5) {
                        page = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        page = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        page = pagination.totalPages - 4 + i;
                      } else {
                        page = pagination.currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${pagination.currentPage === page
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
