const asyncHandler = require('express-async-handler');
const StockTransaction = require('../models/StockTransaction');
const Purchase = require('../models/Purchase');
const RawMaterial = require('../models/RawMaterial');

// ── helpers ──────────────────────────────────────────────────────────
const dayRange = (dateParam) => {
  const start = new Date(dateParam || Date.now());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
};

const rangeFilter = (from, to) => {
  const f = {};
  if (from) f.$gte = new Date(from);
  if (to)   f.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  return Object.keys(f).length ? f : null;
};

const populateTxn = (q) =>
  q.populate('items.material', 'name unit unitCost')
   .populate('material', 'name unit')
   .populate('supplier', 'name')
   .populate('performedBy', 'name')
   .sort({ date: -1 });

// ── GET /api/reports/daily ────────────────────────────────────────────
const getDailyReport = asyncHandler(async (req, res) => {
  const { start, end } = dayRange(req.query.date);

  const transactions = await populateTxn(
    StockTransaction.find({ date: { $gte: start, $lt: end } })
  );

  const purchases = await Purchase.find({ purchaseDate: { $gte: start, $lt: end } })
    .populate('supplier', 'name')
    .populate('items.material', 'name unit');

  const stockIn  = transactions.filter(t => t.type === 'in').reduce((s, t) => s + (t.quantity || 0), 0);
  const stockOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + (t.quantity || 0), 0);
  const purchaseTotal = purchases.reduce((s, p) => s + p.totalAmount, 0);

  // Breakdown by voucher type for the day
  const byVoucher = {};
  for (const t of transactions) {
    const vt = t.voucherType || (t.type === 'in' ? 'pos_adjustment' : 'neg_adjustment');
    if (!byVoucher[vt]) byVoucher[vt] = { count: 0, totalAmount: 0, transactions: [] };
    byVoucher[vt].count++;
    byVoucher[vt].totalAmount += t.totalAmount || 0;
    byVoucher[vt].transactions.push(t);
  }

  res.json({ date: start.toISOString().slice(0, 10), stockIn, stockOut, purchaseTotal, transactions, purchases, byVoucher });
});

// ── GET /api/reports/voucher ──────────────────────────────────────────
// Generic per-voucher-type report with date range
// Query: voucherType, from, to
const getVoucherReport = asyncHandler(async (req, res) => {
  const { voucherType, from, to } = req.query;

  const filter = {};
  if (voucherType) filter.voucherType = voucherType;
  const df = rangeFilter(from, to);
  if (df) filter.date = df;

  const transactions = await populateTxn(StockTransaction.find(filter));

  const totalAmount = transactions.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const totalQty    = transactions.reduce((s, t) => s + (t.quantity   || 0), 0);

  // Item-level breakdown: which materials were moved
  const materialMap = {};
  for (const txn of transactions) {
    const lineItems = txn.items?.length ? txn.items : [{ material: txn.material, quantity: txn.quantity, unitCost: txn.unitCost, totalCost: (txn.unitCost || 0) * (txn.quantity || 0) }];
    for (const li of lineItems) {
      if (!li.material) continue;
      const id = li.material._id?.toString() ?? li.material.toString();
      if (!materialMap[id]) materialMap[id] = { name: li.material.name ?? '—', unit: li.material.unit ?? '', totalQty: 0, totalCost: 0 };
      materialMap[id].totalQty  += li.quantity  || 0;
      materialMap[id].totalCost += li.totalCost || 0;
    }
  }

  res.json({
    voucherType: voucherType || 'all',
    from: from || null,
    to:   to   || null,
    count: transactions.length,
    totalAmount,
    totalQty,
    materialBreakdown: Object.values(materialMap).sort((a, b) => b.totalCost - a.totalCost),
    transactions,
  });
});

// ── GET /api/reports/cash-grv ─────────────────────────────────────────
const getCashGRVReport = asyncHandler(async (req, res) => {
  req.query.voucherType = 'cash_grv';
  return getVoucherReport(req, res);
});

// ── GET /api/reports/credit-grv ───────────────────────────────────────
const getCreditGRVReport = asyncHandler(async (req, res) => {
  req.query.voucherType = 'credit_grv';
  return getVoucherReport(req, res);
});

// ── GET /api/reports/disposal ─────────────────────────────────────────
const getDisposalReport = asyncHandler(async (req, res) => {
  req.query.voucherType = 'disposal';
  return getVoucherReport(req, res);
});

// ── GET /api/reports/neg-adjustment ──────────────────────────────────
const getNegAdjReport = asyncHandler(async (req, res) => {
  req.query.voucherType = 'neg_adjustment';
  return getVoucherReport(req, res);
});

// ── GET /api/reports/pos-adjustment ──────────────────────────────────
const getPosAdjReport = asyncHandler(async (req, res) => {
  req.query.voucherType = 'pos_adjustment';
  return getVoucherReport(req, res);
});

// ── GET /api/reports/fresh-bazaar ────────────────────────────────────
const getFreshBazaarReport = asyncHandler(async (req, res) => {
  req.query.voucherType = 'fresh_bazaar';
  return getVoucherReport(req, res);
});

// ── GET /api/reports/stock-levels ────────────────────────────────────
const getStockLevelReport = asyncHandler(async (req, res) => {
  const materials = await RawMaterial.find({}).sort({ name: 1 });
  const totalValue = materials.reduce((s, m) => s + m.currentStock * (m.unitCost || 0), 0);
  res.json({ materials, totalValue, count: materials.length });
});

// ── GET /api/reports/purchases ────────────────────────────────────────
const getPurchaseReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  const df = rangeFilter(from, to);
  if (df) filter.purchaseDate = df;

  const purchases = await Purchase.find(filter)
    .populate('supplier', 'name')
    .populate('items.material', 'name unit')
    .sort({ purchaseDate: -1 });

  const totalAmount = purchases.reduce((s, p) => s + p.totalAmount, 0);
  res.json({ purchases, totalAmount, count: purchases.length });
});

// ── GET /api/reports/summary ──────────────────────────────────────────
// Cross-voucher summary for dashboard / overview
const getSummaryReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = {};
  const df = rangeFilter(from, to);
  if (df) match.date = df;

  const agg = await StockTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id:         '$voucherType',
        count:       { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const labels = {
    cash_grv:       'Cash GRV',
    credit_grv:     'Credit GRV',
    disposal:       'Goods Disposal',
    neg_adjustment: 'Negative Adjustment',
    pos_adjustment: 'Positive Adjustment',
    fresh_bazaar:   'Fresh Bazaar GRV',
  };

  const result = agg.map(r => ({ ...r, label: labels[r._id] ?? r._id }));
  res.json({ from: from || null, to: to || null, summary: result });
});

module.exports = {
  getDailyReport,
  getVoucherReport,
  getCashGRVReport,
  getCreditGRVReport,
  getDisposalReport,
  getNegAdjReport,
  getPosAdjReport,
  getFreshBazaarReport,
  getStockLevelReport,
  getPurchaseReport,
  getSummaryReport,
};
