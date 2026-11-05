const express = require('express');
const {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require('../controllers/facultyController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'FACULTY'), getFaculty);
router.get('/:id', authorize('ADMIN', 'FACULTY'), getFacultyById);
router.post('/', authorize('ADMIN'), validate(schemas.facultyCreate), createFaculty);
router.put('/:id', authorize('ADMIN'), validate(schemas.facultyUpdate), updateFaculty);
router.delete('/:id', authorize('ADMIN'), deleteFaculty);

module.exports = router;
