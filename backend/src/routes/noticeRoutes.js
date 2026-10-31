const express = require('express');
const {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getNotices);
router.post('/', authorize('ADMIN', 'FACULTY'), createNotice);
router.put('/:id', authorize('ADMIN', 'FACULTY'), updateNotice);
router.delete('/:id', authorize('ADMIN', 'FACULTY'), deleteNotice);

module.exports = router;