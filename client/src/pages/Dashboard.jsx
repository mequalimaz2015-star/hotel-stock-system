import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Boxes, AlertTriangle, Truck, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const currency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-ink-400">Loading dashboard…</div>;
  }

  if (!data) {
    return <div className="text-ink-400">Could not load dashboard data.</div>;
  }

  const trendData = data.trend.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Raw materials tracked" value={data.totalMaterials} icon={Boxes} tone="ink" />
        <StatCard
          label="Low / out of stock"
          value={data.lowStockCount + data.outOfStockCount}
          sub={`${data.outOfStockCount} completely out`}
          icon={AlertTriangle}
          tone="brass"
        />
        <StatCard label="Active suppliers" value={data.totalSuppliers} icon={Truck} />
        <StatCard label="Stock value on hand" value={currency(data.stockValue)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-ink-900">Stock movement, last 7 days</h3>
              <p className="text-sm text-ink-400">Quantity moved in and out of the store</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="stockIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c89b3c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#c89b3c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="stockOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#212e4a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#212e4a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8393b6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8393b6' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #eef1f6', fontSize: 13 }} />
              <Area type="monotone" dataKey="stockIn" name="Stock in" stroke="#c89b3c" fill="url(#stockIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="stockOut" name="Stock out" stroke="#212e4a" fill="url(#stockOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-6 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><ArrowDownCircle size={14} className="text-brass-500" /> Stock in today: <strong className="tabular text-ink-800">{data.todaysStockIn}</strong></span>
            <span className="flex items-center gap-1.5"><ArrowUpCircle size={14} className="text-ink-700" /> Stock out today: <strong className="tabular text-ink-800">{data.todaysStockOut}</strong></span>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg text-ink-900">Needs reordering</h3>
          <div className="space-y-3">
            {data.lowStockItems.length === 0 && (
              <p className="text-sm text-ink-400">Everything is well stocked. Nice work.</p>
            )}
            {data.lowStockItems.map((m) => (
              <div key={m._id} className="flex items-center justify-between border-b border-ink-50 pb-2.5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-800">{m.name}</p>
                  <p className="text-xs text-ink-400">Reorder at {m.reorderLevel} {m.unit}</p>
                </div>
                <Badge color={m.currentStock <= 0 ? 'red' : 'amber'}>
                  {m.currentStock} {m.unit}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 font-display text-lg text-ink-900">Recent stock activity</h3>
        <div className="space-y-3">
          {data.recentTransactions.length === 0 && (
            <p className="text-sm text-ink-400">No transactions recorded yet.</p>
          )}
          {data.recentTransactions.map((t) => (
            <div key={t._id} className="flex items-center justify-between border-b border-ink-50 pb-2.5 last:border-0">
              <div className="flex items-center gap-3">
                {t.type === 'in' ? (
                  <ArrowDownCircle size={18} className="text-brass-500" />
                ) : (
                  <ArrowUpCircle size={18} className="text-ink-700" />
                )}
                <div>
                  <p className="text-sm font-medium text-ink-800">
                    {t.material?.name || 'Unknown material'} — {t.quantity} {t.material?.unit}
                  </p>
                  <p className="text-xs capitalize text-ink-400">
                    {t.reason?.replace('_', ' ')} · by {t.performedBy?.name || 'system'}
                  </p>
                </div>
              </div>
              <span className="text-xs text-ink-400">{new Date(t.date).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
