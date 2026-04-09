import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Receipt, User, MapPin, Calendar, CreditCard } from 'lucide-react';
import api from '../utils/api';

const money = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const InvoicePage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/bookings/${bookingId}/invoice`);
        setInvoice(response.data);
      } catch (fetchError) {
        setError(fetchError.response?.data?.detail || 'Unable to load invoice');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchInvoice();
    }
  }, [bookingId]);

  const downloadInvoiceFile = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/bookings/${bookingId}/invoice-file`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      alert(downloadError.response?.data?.detail || 'Unable to download invoice file');
    } finally {
      setDownloading(false);
    }
  };

  const lineItems = useMemo(() => {
    if (!invoice) return [];
    return [
      { label: 'Pool booking', value: invoice.pool_name },
      { label: 'Booking date', value: new Date(invoice.booking_date).toLocaleDateString() },
      { label: 'Time slot', value: `${invoice.start_time} - ${invoice.end_time}` },
      { label: 'Guests', value: `${invoice.number_of_people}` },
      { label: 'Duration', value: `${invoice.duration_minutes} minutes` },
    ];
  }, [invoice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-purple-500/20 bg-slate-900/60 p-8">
          Loading invoice...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-500/20 bg-slate-900/60 p-8">
          <p>{error || 'Invoice not found'}</p>
          <button
            type="button"
            onClick={() => navigate('/profile?tab=bookings')}
            className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 font-semibold"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <motion.div
        className="mx-auto max-w-4xl space-y-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile?tab=bookings')}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-500/20 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={downloadInvoiceFile}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Downloading...' : 'Download Invoice File'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-500/20 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-gray-100"
          >
            <Receipt className="h-4 w-4" />
            Print Invoice
          </button>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/30">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-purple-500/10 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <Receipt className="h-7 w-7 text-cyan-400" />
                <h1 className="text-3xl font-bold">Booking Invoice</h1>
              </div>
              <p className="mt-3 text-gray-300">Invoice #{invoice.invoice_number}</p>
              <p className="text-sm text-gray-400">
                Issued on {new Date(invoice.issue_date).toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-slate-800/50 px-4 py-3 text-right">
              <div className="text-sm text-gray-400">Status</div>
              <div className="text-lg font-semibold capitalize text-cyan-300">{invoice.booking_status}</div>
              <div className="mt-2 text-sm text-gray-400">Payment</div>
              <div className="text-sm capitalize text-gray-200">{invoice.payment_status || 'pending'}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-purple-500/10 bg-slate-800/40 p-5">
              <div className="mb-4 flex items-center gap-2 text-cyan-300">
                <User className="h-4 w-4" />
                Customer
              </div>
              <div className="space-y-2 text-sm text-gray-200">
                <div>{invoice.customer_name}</div>
                <div>{invoice.customer_email}</div>
                <div>{invoice.customer_phone || 'Phone not provided'}</div>
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/10 bg-slate-800/40 p-5">
              <div className="mb-4 flex items-center gap-2 text-cyan-300">
                <MapPin className="h-4 w-4" />
                Pool
              </div>
              <div className="space-y-2 text-sm text-gray-200">
                <div>{invoice.pool_name}</div>
                <div>{invoice.pool_address || 'Address not available'}</div>
                <div>{invoice.pool_city || 'City not available'}</div>
                <div>{invoice.owner_name || 'Owner'}{invoice.owner_email ? ` • ${invoice.owner_email}` : ''}</div>
                <div>{invoice.owner_phone || 'Owner phone not available'}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-purple-500/10 bg-slate-800/40 p-5">
              <div className="mb-4 flex items-center gap-2 text-cyan-300">
                <Calendar className="h-4 w-4" />
                Booking Details
              </div>
              <div className="space-y-3 text-sm">
                {lineItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 border-b border-purple-500/10 pb-3 text-gray-200 last:border-b-0 last:pb-0">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/10 bg-slate-800/40 p-5">
              <div className="mb-4 flex items-center gap-2 text-cyan-300">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </div>
              <div className="space-y-3 text-sm text-gray-200">
                <div className="flex items-center justify-between gap-4 border-b border-purple-500/10 pb-3">
                  <span className="text-gray-400">Method</span>
                  <span className="capitalize">{invoice.payment_method || 'Pending payment'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-purple-500/10 pb-3">
                  <span className="text-gray-400">Gateway</span>
                  <span className="capitalize">{invoice.gateway || 'Offline / pending'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-purple-500/10 pb-3">
                  <span className="text-gray-400">Transaction ID</span>
                  <span>{invoice.transaction_id || 'Will appear after payment'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-3 text-lg font-semibold">
                  <span>Total</span>
                  <span>{money(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoicePage;
