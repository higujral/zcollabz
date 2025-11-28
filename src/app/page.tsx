'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  clientName: string;
  serviceName: string;
  amount: number;
  paymentLinkUrl: string;
  status: string;
  createdAt: string;
  invoiceId?: string | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    clientEmail: string | null;
    pdfUrl: string | null;
    receiptPdfUrl: string | null;
    stripeReceiptUrl: string | null;
    status: string;
  } | null;
}

export default function Home() {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [invoicePdfUrl, setInvoicePdfUrl] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [sendingReceiptId, setSendingReceiptId] = useState('');
  const [receiptStatus, setReceiptStatus] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPaymentLink('');
    setInvoicePdfUrl('');
    setInvoiceId('');
    setInvoiceNumber('');

    try {
      const res = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          serviceName,
          amount: parseFloat(amount),
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      setPaymentLink(data.paymentLink);
      setInvoicePdfUrl(data.invoice?.pdfUrl || '');
      setInvoiceId(data.invoice?.id || '');
      setInvoiceNumber(data.invoice?.invoiceNumber || '');
      setShowInvoiceModal(true);
      setClientName('');
      setClientEmail('');
      setServiceName('');
      setAmount('');
      setNotes('');
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoiceEmail = async () => {
    if (!invoiceId) return;
    setSendingEmail(true);
    setEmailStatus('');
    try {
      const res = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          message: emailMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email');
      }
      setEmailStatus('Invoice email sent');
      setEmailMessage('');
      setShowInvoiceModal(false);
      setToast({ message: 'Invoice email sent', type: 'success' });
    } catch (err: any) {
      setEmailStatus(err.message || 'Failed to send email');
      setToast({ message: err.message || 'Failed to send invoice email', type: 'error' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendReceiptEmail = async (invoiceId?: string | null) => {
    if (!invoiceId) return;
    setSendingReceiptId(invoiceId);
    setReceiptStatus((prev) => ({ ...prev, [invoiceId]: '' }));
    try {
      const res = await fetch('/api/send-receipt-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send receipt email');
      }
      setReceiptStatus((prev) => ({ ...prev, [invoiceId]: 'Receipt email sent' }));
      setToast({ message: 'Receipt email sent', type: 'success' });
    } catch (err: any) {
      setReceiptStatus((prev) => ({ ...prev, [invoiceId]: err.message || 'Failed to send receipt email' }));
      setToast({ message: err.message || 'Failed to send receipt email', type: 'error' });
    } finally {
      setSendingReceiptId('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink);
    alert('Payment link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#2560ff' }}>
              ZCollabz
            </h1>
            <p className="text-slate-600 text-lg">
              Create secure payment links for your clients
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8" style={{ borderWidth: '1px', borderColor: '#2560ff20' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ '--tw-ring-color': '#2560ff' } as any}
                  placeholder="e.g., Acme Corp"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Client Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ '--tw-ring-color': '#2560ff' } as any}
                  placeholder="e.g., client@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ '--tw-ring-color': '#2560ff' } as any}
                  placeholder="e.g., Web Design Consultation"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ '--tw-ring-color': '#2560ff' } as any}
                  placeholder="e.g., 500.00"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ '--tw-ring-color': '#2560ff' } as any}
                  placeholder="Add any special instructions or notes"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  backgroundColor: '#2560ff',
                  backgroundImage: 'linear-gradient(135deg, #2560ff 0%, #1a4acc 100%)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #1a4acc 0%, #0f3399 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #2560ff 0%, #1a4acc 100%)';
                }}
              >
                {loading ? 'Generating...' : 'Generate Invoice'}
              </button>
            </form>

            {paymentLink && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium mb-2">
                  Invoice Created!
                </p>
                <p className="text-sm text-slate-700 mb-2">Invoice #: {invoiceNumber}</p>
                <p className="text-sm text-slate-700 mb-2">Payment Link:</p>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={paymentLink}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
                  >
                    Copy
                  </button>
                  {invoicePdfUrl && (
                    <a
                      href={invoicePdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition text-center"
                    >
                      View Invoice PDF
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8" style={{ borderWidth: '1px', borderColor: '#2560ff20' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#2560ff' }}>
              Recent Transactions
            </h2>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-slate-600 text-center py-8">
                  No transactions yet
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition"
                    style={{
                      '--hover-border-color': '#2560ff40'
                    } as any}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2560ff40';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(226, 232, 240)';
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-slate-800 font-semibold">
                          {transaction.clientName}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          {transaction.serviceName}
                        </p>
                        {transaction.invoice?.invoiceNumber && (
                          <p className="text-slate-500 text-xs">
                            Invoice #{transaction.invoice.invoiceNumber}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-slate-800 font-bold text-lg">
                          ${transaction.amount.toFixed(2)}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${transaction.status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}
                        >
                          {transaction.status === 'PAID' ? '🟢 Paid' : '🟡 Pending'}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                    {transaction.status === 'PAID' && (
                      <div className="mt-2 flex gap-3 flex-wrap text-sm items-center">
                        {transaction.invoice?.receiptPdfUrl && (
                          <a
                            href={transaction.invoice.receiptPdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            Receipt PDF
                          </a>
                        )}
                        {transaction.invoice?.stripeReceiptUrl && (
                          <a
                            href={transaction.invoice.stripeReceiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            Stripe Receipt
                          </a>
                        )}
                        {transaction.invoice?.pdfUrl && (
                          <a
                            href={transaction.invoice.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            Invoice PDF
                          </a>
                        )}
                        {transaction.invoice?.id && (
                          <button
                            onClick={() => handleSendReceiptEmail(transaction.invoice?.id)}
                            disabled={sendingReceiptId === transaction.invoice.id}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingReceiptId === transaction.invoice.id ? 'Sending...' : 'Email Receipt'}
                          </button>
                        )}
                        {transaction.invoice?.id && receiptStatus[transaction.invoice.id] && (
                          <span className="text-slate-600 text-xs">
                            {receiptStatus[transaction.invoice.id]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold" style={{ color: '#2560ff' }}>
                  Invoice Preview
                </h3>
                <p className="text-slate-600">Invoice #{invoiceNumber}</p>
              </div>
              <button
                className="text-slate-500 hover:text-slate-700 text-xl"
                onClick={() => setShowInvoiceModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {invoicePdfUrl ? (
                  <iframe src={invoicePdfUrl} className="w-full h-[400px]" />
                ) : (
                  <div className="p-6 text-center text-slate-500">PDF not available</div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Email message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                    style={{ '--tw-ring-color': '#2560ff' } as any}
                    placeholder="Optional message to include with the invoice email"
                    rows={6}
                  />
                </div>
                <button
                  onClick={handleSendInvoiceEmail}
                  disabled={sendingEmail || !invoiceId}
                  className="w-full text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  style={{
                    backgroundColor: '#2560ff',
                    backgroundImage: 'linear-gradient(135deg, #2560ff 0%, #1a4acc 100%)'
                  }}
                >
                  {sendingEmail ? 'Sending...' : 'Email Invoice'}
                </button>
                {emailStatus && (
                  <div className="text-sm text-slate-700">{emailStatus}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
