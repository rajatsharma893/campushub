const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { execSync } = require('child_process')

const root = __dirname
const backendDir = path.join(root, 'backend')
const frontendDir = path.join(root, 'frontend')

if (!fs.existsSync(backendDir) || !fs.existsSync(frontendDir)) {
  console.log('backend ya frontend folder nahi mila. Ye script project ke root folder (college-management) mein honi chahiye.')
  process.exit(1)
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('Apna Render backend link paste karo (jaise https://campushub-api.onrender.com): ', (answer) => {
  rl.close()
  const renderUrl = answer.trim().replace(/\/+$/, '').replace(/\/api$/, '')
  if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(renderUrl)) {
    console.log('Ye link sahi nahi lag raha. https:// se shuru hona chahiye, jaise https://campushub-api.onrender.com')
    process.exit(1)
  }
  run(renderUrl)
})

function run(renderUrl) {
  // 1. Packages
  console.log('Installing zod and cookie-parser...')
  execSync('npm install zod cookie-parser', { cwd: backendDir, stdio: 'inherit' })

  // 2. Bundle files
  const text = fs.readFileSync(__filename, 'utf8')
  const open = '/' + '*BUNDLE'
  const close = '*' + '/'
  const body = text.slice(text.indexOf(open) + open.length, text.lastIndexOf(close))
  const parts = body.split(/^=====FILE: (.+?)=====\r?$/m)
  for (let i = 1; i < parts.length; i += 2) {
    const rel = parts[i].trim()
    const content = parts[i + 1].replace(/^\r?\n/, '').replace(/\s+$/, '') + '\n'
    const full = path.join(root, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content)
    console.log('Written: ' + rel)
  }

  // 3. vercel.json: /api calls Render ko proxy hongi (cookie isi se first-party rehti hai)
  const vercel = {
    rewrites: [
      { source: '/api/:path*', destination: renderUrl + '/api/:path*' },
      { source: '/(.*)', destination: '/index.html' },
    ],
  }
  fs.writeFileSync(path.join(frontendDir, 'vercel.json'), JSON.stringify(vercel, null, 2) + '\n')
  console.log('Written: frontend/vercel.json (proxy to ' + renderUrl + ')')

  // 4. Prisma: directUrl (migrations ke liye)
  const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma')
  if (fs.existsSync(schemaPath)) {
    const s = fs.readFileSync(schemaPath, 'utf8')
    if (s.includes('directUrl')) {
      console.log('No change: schema.prisma already has directUrl')
    } else {
      const n = s.replace(/(url\s*=\s*env\("DATABASE_URL"\))/, '$1\n  directUrl = env("DIRECT_URL")')
      if (n !== s) {
        fs.writeFileSync(schemaPath, n)
        console.log('Updated: backend/prisma/schema.prisma (directUrl added)')
      } else {
        console.log('Could not find the datasource url line in schema.prisma, add directUrl manually.')
      }
    }
  }

  // 5. .env: DIRECT_URL (pooler wale host se "-pooler" hata ke)
  const envPath = path.join(backendDir, '.env')
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8')
    if (/^DIRECT_URL=/m.test(env)) {
      console.log('No change: .env already has DIRECT_URL')
    } else {
      const m = env.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)
      if (m) {
        const direct = m[1].replace('-pooler', '')
        fs.appendFileSync(envPath, (env.endsWith('\n') ? '' : '\n') + 'DIRECT_URL="' + direct + '"\n')
        console.log('Updated: backend/.env (DIRECT_URL added)')
      }
    }
  }

  // 6. README: admin ka demo login hatao
  const readmePath = path.join(root, 'README.md')
  if (fs.existsSync(readmePath)) {
    const t = fs.readFileSync(readmePath, 'utf8')
    const n = t
      .replace(/^- Admin: `admin@college.com`\r?\n/m, '')
      .replace('Password for all demo accounts', 'Password for the demo faculty and student accounts')
    if (n !== t) {
      fs.writeFileSync(readmePath, n)
      console.log('Updated: README.md (admin demo login removed)')
    }
  }

  console.log('Done')
}

/*BUNDLE
=====FILE: backend/src/validation/schemas.js=====
const { z } = require('zod');

const id = z.coerce.number().int().positive();
const text = (max) => z.string().trim().min(1, 'is required').max(max, `must be at most ${max} characters`);
const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(120);
const newPassword = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password must be at most 72 characters');
const semester = z.coerce.number().int().min(1, 'Semester must be 1 to 8').max(8, 'Semester must be 1 to 8');
const phone = z.string().trim().max(20).optional();

const login = z.object({
  email,
  password: z.string().min(1, 'is required').max(72),
});

const register = z.object({
  name: text(80),
  email,
  password: newPassword,
  rollNumber: text(30),
  departmentId: id,
  semester: semester.optional(),
});

const changePassword = z.object({
  currentPassword: z.string().min(1, 'is required').max(72),
  newPassword,
});

const studentCreate = z.object({
  name: text(80),
  email,
  rollNumber: text(30),
  departmentId: id,
  semester: semester.optional(),
  phone,
  password: newPassword.optional(),
});
const studentUpdate = studentCreate.partial();

const facultyCreate = z.object({
  name: text(80),
  email,
  employeeId: text(30),
  departmentId: id,
  phone,
  password: newPassword.optional(),
});
const facultyUpdate = facultyCreate.partial();

const departmentCreate = z.object({ name: text(80), code: text(10) });
const departmentUpdate = departmentCreate.partial();

const courseCreate = z.object({
  code: text(20),
  name: text(120),
  credits: z.coerce.number().int().min(1).max(10),
  semester,
  departmentId: id,
  facultyId: id.nullable().optional(),
});
const courseUpdate = courseCreate.partial();

const attendanceMark = z.object({
  courseId: id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be in YYYY-MM-DD format'),
  records: z
    .array(z.object({ studentId: id, status: z.enum(['PRESENT', 'ABSENT', 'LATE']) }))
    .min(1, 'At least one record is required')
    .max(2000),
});

const marksEnter = z.object({
  courseId: id,
  records: z
    .array(
      z.object({
        studentId: id,
        internal: z.coerce.number().min(0, 'Internal must be 0 to 40').max(40, 'Internal must be 0 to 40'),
        external: z.coerce.number().min(0, 'External must be 0 to 60').max(60, 'External must be 0 to 60'),
      })
    )
    .min(1, 'At least one record is required')
    .max(2000),
});

const noticeCreate = z.object({ title: text(150), content: text(5000) });
const noticeUpdate = noticeCreate.partial();

module.exports = {
  login,
  register,
  changePassword,
  studentCreate,
  studentUpdate,
  facultyCreate,
  facultyUpdate,
  departmentCreate,
  departmentUpdate,
  courseCreate,
  courseUpdate,
  attendanceMark,
  marksEnter,
  noticeCreate,
  noticeUpdate,
};
=====FILE: backend/src/middleware/validate.js=====
// Request body ko schema se check karta hai. Galat data controller tak pahunchta hi nahi.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body === undefined ? {} : req.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    const first = errors[0];
    return res.status(400).json({
      message: first.field ? `${first.field}: ${first.message}` : first.message,
      errors,
    });
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
=====FILE: backend/src/middleware/rateLimiters.js=====
const rateLimit = require('express-rate-limit');

const make = (windowMinutes, limit, message, options = {}) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
    ...options,
  });

// Poori API par: ek IP se 15 minute mein 1000 requests
const apiLimiter = make(15, 1000, 'Too many requests. Please slow down and try again shortly.');

// Login: ek email par 15 minute mein 10 galat koshish (sahi login count nahi hote)
const loginLimiter = make(15, 10, 'Too many login attempts. Please try again in 15 minutes.', {
  skipSuccessfulRequests: true,
  keyGenerator: (req) => String((req.body && req.body.email) || 'unknown').toLowerCase().slice(0, 120),
});

// Sign up: ek ghante mein 5 naye account ek IP se
const registerLimiter = make(60, 5, 'Too many sign-ups from this network. Please try again later.');

// Password change: 15 minute mein 10 koshish
const passwordLimiter = make(15, 10, 'Too many attempts. Please try again in 15 minutes.');

module.exports = { apiLimiter, loginLimiter, registerLimiter, passwordLimiter };
=====FILE: backend/src/controllers/authController.js=====
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
=====FILE: backend/src/routes/authRoutes.js=====
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
=====FILE: backend/src/routes/studentRoutes.js=====
const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'FACULTY'), getStudents);
router.get('/:id', authorize('ADMIN', 'FACULTY'), getStudent);
router.post('/', authorize('ADMIN'), validate(schemas.studentCreate), createStudent);
router.put('/:id', authorize('ADMIN'), validate(schemas.studentUpdate), updateStudent);
router.delete('/:id', authorize('ADMIN'), deleteStudent);

module.exports = router;
=====FILE: backend/src/routes/facultyRoutes.js=====
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
=====FILE: backend/src/routes/departmentRoutes.js=====
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
=====FILE: backend/src/routes/courseRoutes.js=====
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
=====FILE: backend/src/routes/attendanceRoutes.js=====
const express = require('express');
const {
  getCourseStudents,
  markAttendance,
  getMyAttendance,
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/my', authorize('STUDENT'), getMyAttendance);
router.get('/course/:courseId/students', authorize('ADMIN', 'FACULTY'), getCourseStudents);
router.post('/mark', authorize('ADMIN', 'FACULTY'), validate(schemas.attendanceMark), markAttendance);

module.exports = router;
=====FILE: backend/src/routes/marksRoutes.js=====
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
=====FILE: backend/src/routes/noticeRoutes.js=====
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
=====FILE: backend/src/server.js=====
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { apiLimiter, loginLimiter, registerLimiter, passwordLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const marksRoutes = require('./routes/marksRoutes');
const noticeRoutes = require('./routes/noticeRoutes');

// Zaroori settings ke bina server start hi nahi hoga
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Set it in .env (local) or in the Render environment.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Set it in .env (local) or in the Render environment.');
  process.exit(1);
}

const app = express();

// Render aur Vercel proxy ke peeche asli user ka IP nikalne ke liye (rate limit ke kaam aata hai)
app.set('trust proxy', parseInt(process.env.TRUST_PROXY_HOPS || '2', 10));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Sirf apni site (aur local development) ko API use karne do
const allowedOrigins = (process.env.FRONTEND_URLS || 'https://campushub-erp.vercel.app,http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // origin nahi hota jab Thunder Client ya server-to-server request ho
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/', (req, res) => res.json({ message: 'CampusHub API is running' }));

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/change-password', passwordLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/notices', noticeRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
=====FILE: backend/.env.example=====
# Copy this file to .env and fill in your own values. Never commit .env.

# Neon pooled connection string (used by the app)
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require"

# Neon direct connection string, same as above but without "-pooler" (used for migrations)
DIRECT_URL="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/neondb?sslmode=require"

# Long random secrets
JWT_SECRET="change-me-to-a-long-random-string"
JWT_REFRESH_SECRET="change-me-to-a-different-long-random-string"

# Comma separated list of allowed frontend origins (no trailing slash)
FRONTEND_URLS="https://campushub-erp.vercel.app,http://localhost:5173"

# Number of proxies in front of the server (Vercel + Render = 2)
TRUST_PROXY_HOPS=2
=====FILE: frontend/vite.config.js=====
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local mein bhi /api backend (localhost:5000) tak jata hai, bilkul live site jaisa
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
})
=====FILE: frontend/src/api.js=====
import axios from 'axios'

// Access token sirf memory mein rehta hai (localStorage mein nahi)
let accessToken = null
export const setAccessToken = (token) => {
  accessToken = token
}

const api = axios.create({ baseURL: '/api', withCredentials: true })
const bare = axios.create({ baseURL: '/api', withCredentials: true })

// Ek saath kai requests fail hon to refresh sirf ek baar chalta hai
let refreshing = null
export const refreshSession = () => {
  if (!refreshing) {
    refreshing = bare
      .post('/auth/refresh')
      .then((res) => {
        accessToken = res.data.accessToken
        return res.data
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

const AUTH_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response && error.response.status
    const isAuthCall = original && AUTH_URLS.some((u) => (original.url || '').includes(u))

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        await refreshSession()
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (e) {
        accessToken = null
        window.dispatchEvent(new Event('auth:logout'))
      }
    }
    return Promise.reject(error)
  }
)

export default api
=====FILE: frontend/src/context/AuthContext.jsx=====
import { createContext, useContext, useEffect, useState } from 'react'
import api, { refreshSession, setAccessToken } from '../api'

const AuthContext = createContext(null)

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Free server so raha ho to thodi der baad dobara koshish karta hai
async function restoreSession() {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await refreshSession()
    } catch (err) {
      const status = err.response && err.response.status
      if (status === 401) throw err
      await wait(4000)
    }
  }
  throw new Error('Server unreachable')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    // Purane version ke localStorage tokens hata do
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    let alive = true
    const timer = setTimeout(() => alive && setSlow(true), 4000)

    restoreSession()
      .then((data) => alive && setUser(data.user))
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer)
        if (alive) setBooting(false)
      })

    const onForcedLogout = () => setUser(null)
    window.addEventListener('auth:logout', onForcedLogout)
    return () => {
      alive = false
      clearTimeout(timer)
      window.removeEventListener('auth:logout', onForcedLogout)
    }
  }, [])

  const startSession = (data) => {
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return startSession(data)
  }

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form)
    return startSession(data)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // cookie server par hi hatni thi, fail ho to bhi local session band karo
    }
    setAccessToken(null)
    setUser(null)
  }

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-600 text-sm px-4 text-center">
        <p className="font-medium">Loading CampusHub...</p>
        {slow && (
          <p className="mt-2 max-w-sm">
            The free server is waking up. This can take up to a minute on the first visit.
          </p>
        )}
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
*/