const express = require('express');
const {
  login,
  refresh,
  logout,
  me,
  register,
  changePassword,
  getPublicDepartments,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.get('/departments', getPublicDepartments);
router.post('/login', validate(schemas.login), login);
router.post('/register', validate(schemas.register), register);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, validate(schemas.changePassword), changePassword);

module.exports = router;
