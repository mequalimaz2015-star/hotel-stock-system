const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  exportMaterialsExcel,
  importMaterialsExcel,
} = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

// Excel import/export (before /:id to avoid conflict)
router.get('/export/excel', authorize('admin', 'manager'), exportMaterialsExcel);
router.post('/import/excel', authorize('admin', 'manager'), upload.single('file'), importMaterialsExcel);

router.get('/', getMaterials);
router.get('/:id', getMaterialById);
router.post('/', authorize('admin', 'manager'), createMaterial);
router.put('/:id', authorize('admin', 'manager'), updateMaterial);
router.delete('/:id', authorize('admin'), deleteMaterial);

module.exports = router;
