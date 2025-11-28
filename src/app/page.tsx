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
}

export default function Home() {
  const [clientName, setClientName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

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

    try {
      const res = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          serviceName,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }

      setPaymentLink(data.paymentLink);
      setClientName('');
      setServiceName('');
      setAmount('');
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
                {loading ? 'Generating...' : 'Generate Payment Link'}
              </button>
            </form>

            {paymentLink && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium mb-2">
                  Payment Link Created!
                </p>
                <div className="flex gap-2">
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
