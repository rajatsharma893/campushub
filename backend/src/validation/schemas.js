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
