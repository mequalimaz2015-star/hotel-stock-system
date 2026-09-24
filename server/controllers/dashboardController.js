const asyncHandler = require('express-async-handler');
const RawMaterial = require('../models/RawMaterial');
const Purchase = require('../models/Purchase');
const StockTransaction = require('../models/StockTransaction');
const Supplier = require('../models/Supplier');

const getSummary = asyncHandler(async (req, res) => {
  const materials = await RawMaterial.find({});
  const totalMaterials = materials.length;
  const lowStockCount = materials.filter((m) => m.currentStock > 0 && m.currentStock <= m.reorderLevel).length;
  const outOfStockCount = materials.filter((m) => m.currentStock <= 0).length;
  const stockValue = materials.reduce((sum, m) => sum + m.currentStock * (m.unitCost || 0), 0);

  const totalSuppliers = await Supplier.countDocuments({ isActive: true });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todaysPurchases = await Purchase.countDocuments({ purchaseDate: { $gte: startOfToday } });

  const todaysTransactions = await StockTransaction.find({ date: { $gte: startOfToday } });
  const todaysStockIn = todaysTransactions.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0);
  const todaysStockOut = todaysTransactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthPurchases = await Purchase.find({ purchaseDate: { $gte: startOfMonth } });
  const monthSpend = monthPurchases.reduce((s, p) => s + p.totalAmount, 0);

  // Movement trend for last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const dayTx = await StockTransaction.find({ date: { $gte: day, $lt: nextDay } });
    days.push({
      date: day.toISOString().slice(0, 10),
      stockIn: dayTx.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0),
      stockOut: dayTx.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0),
    });
  }

  const lowStockItems = materials
    .filter((m) => m.currentStock <= m.reorderLevel)
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 6);

  const recentTransactions = await StockTransaction.find({})
    .populate('material', 'name unit')
    .populate('performedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(6);

  res.json({
    totalMaterials,
    lowStockCount,
    outOfStockCount,
    stockValue,
    totalSuppliers,
    todaysPurchases,
    todaysStockIn,
    todaysStockOut,
    monthSpend,
    trend: days,
    lowStockItems,
    recentTransactions,
  });
});

module.exports = { getSummary };
