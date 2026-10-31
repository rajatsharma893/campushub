const express = require('express');
const { enterMarks, getCourseMarks, getMyReport } = require('../controllers/marksController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/my', authorize('STUDENT'), getMyReport);
router.get('/course/:courseId', authorize('ADMIN', 'FACULTY'), getCourseMarks);
router.post('/enter', authorize('ADMIN', 'FACULTY'), enterMarks);

module.exports = router;