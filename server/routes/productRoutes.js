const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  exportProductsExcel,
  importProductsExcel,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

// Excel import/export
router.get('/export/excel', authorize('admin', 'manager'), exportProductsExcel);
router.post('/import/excel', authorize('admin', 'manager'), upload.single('file'), importProductsExcel);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('admin', 'manager'), createProduct);
router.put('/:id', authorize('admin', 'manager'), updateProduct);
router.delete('/bulk', authorize('admin', 'manager'), bulkDeleteProducts);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
