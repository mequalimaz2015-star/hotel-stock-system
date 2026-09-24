const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  advancePurchase,
  deletePurchase,
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/',    getPurchases);
router.get('/:id', getPurchaseById);
router.post('/',   authorize('admin', 'manager'), createPurchase);
// Advance workflow: check / approve / receive / cancel — roles checked inside controller
router.post('/:id/advance', advancePurchase);
router.delete('/:id', authorize('admin', 'manager'), deletePurchase);

module.exports = router;
