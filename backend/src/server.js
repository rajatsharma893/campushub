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
