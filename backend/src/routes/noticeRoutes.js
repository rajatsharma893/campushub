const express = require('express');
const {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', getNotices);
router.post('/', authorize('ADMIN', 'FACULTY'), validate(schemas.noticeCreate), createNotice);
router.put('/:id', authorize('ADMIN', 'FACULTY'), validate(schemas.noticeUpdate), updateNotice);
router.delete('/:id', authorize('ADMIN', 'FACULTY'), deleteNotice);

module.exports = router;
