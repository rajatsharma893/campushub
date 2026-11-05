const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');

const COOKIE_NAME = 'refreshToken';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + ':refresh';

// Password badalte hi purane refresh tokens apne aap invalid ho jate hain
const fingerprint = (user) => crypto.createHash('sha256').update(user.password).digest('hex').slice(0, 16);

const signAccess = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
const signRefresh = (user) =>
  jwt.sign({ id: user.id, pv: fingerprint(user) }, refreshSecret(), { expiresIn: REFRESH_TTL });

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

const cookieOptions = (req) => ({
  httpOnly: true,
  secure: req.secure,
  sameSite: 'lax',
  path: '/api/auth',
});

const setRefreshCookie = (req, res, user) =>
  res.cookie(COOKIE_NAME, signRefresh(user), { ...cookieOptions(req), maxAge: REFRESH_TTL_MS });

const sendSession = (req, res, user, status = 200) => {
  setRefreshCookie(req, res, user);
  const accessToken = signAccess(user);
  res.status(status).json({ accessToken, token: accessToken, user: publicUser(user) });
};

// Galat email par bhi bcrypt chalta hai, taaki response time se pata na chale ki email exist karta hai
const DUMMY_HASH = bcrypt.hashSync('campushub-dummy-password', 10);

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    sendSession(req, res, user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ message: 'Not signed in' });

    let payload;
    try {
      payload = jwt.verify(token, refreshSecret());
    } catch (e) {
      res.clearCookie(COOKIE_NAME, cookieOptions(req));
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || fingerprint(user) !== payload.pv) {
      res.clearCookie(COOKIE_NAME, cookieOptions(req));
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    sendSession(req, res, user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions(req));
  res.json({ message: 'Logged out' });
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Department list (sign up page ke liye, login ki zaroorat nahi)
const getPublicDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sirf STUDENT account bana sakte hain. Faculty aur admin sirf admin banata hai.
const register = async (req, res) => {
  try {
    const { name, email, password, rollNumber, departmentId, semester } = req.body;
    const sem = semester || 1;
    const hash = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        rollNumber: rollNumber.toUpperCase(),
        semester: sem,
        department: { connect: { id: departmentId } },
        user: { create: { name, email, password: hash, role: 'STUDENT' } },
      },
      include: { user: true },
    });

    // Student ke department aur semester ke courses mein apne aap enroll karo
    const courses = await prisma.course.findMany({
      where: { departmentId, semester: sem },
      select: { id: true },
    });
    if (courses.length) {
      await prisma.enrollment.createMany({
        data: courses.map((c) => ({ studentId: student.id, courseId: c.id })),
        skipDuplicates: true,
      });
    }

    sendSession(req, res, student.user, 201);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Email or roll number is already registered' });
    }
    if (err.code === 'P2025') {
      return res.status(400).json({ message: 'Department not found' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logged-in user apna password badal sakta hai
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current one' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({ where: { id: user.id }, data: { password: hash } });

    // Naye password ke hisaab se naya refresh cookie (purane saare sessions band ho jate hain)
    setRefreshCookie(req, res, updated);
    res.json({ message: 'Password changed successfully', accessToken: signAccess(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, refresh, logout, me, register, changePassword, getPublicDepartments };
