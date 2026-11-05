const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authorize('ADMIN'), validate(schemas.courseCreate), createCourse);
router.put('/:id', authorize('ADMIN'), validate(schemas.courseUpdate), updateCourse);
router.delete('/:id', authorize('ADMIN'), deleteCourse);

module.exports = router;
