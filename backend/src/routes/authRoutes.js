const express = require('express');
const {
  login,
  me,
  register,
  changePassword,
  getPublicDepartments,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/departments', getPublicDepartments);
router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
