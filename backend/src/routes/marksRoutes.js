const express = require('express');
const { enterMarks, getCourseMarks, getMyReport } = require('../controllers/marksController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/my', authorize('STUDENT'), getMyReport);
router.get('/course/:courseId', authorize('ADMIN', 'FACULTY'), getCourseMarks);
router.post('/enter', authorize('ADMIN', 'FACULTY'), validate(schemas.marksEnter), enterMarks);

module.exports = router;
