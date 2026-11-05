const express = require('express');
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', getDepartments);
router.post('/', authorize('ADMIN'), validate(schemas.departmentCreate), createDepartment);
router.put('/:id', authorize('ADMIN'), validate(schemas.departmentUpdate), updateDepartment);
router.delete('/:id', authorize('ADMIN'), deleteDepartment);

module.exports = router;
