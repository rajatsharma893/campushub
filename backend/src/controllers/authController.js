const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
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
    if (!name || !email || !password || !rollNumber || !departmentId) {
      return res.status(400).json({ message: 'name, email, password, rollNumber and departmentId are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const sem = semester ? parseInt(semester) : 1;
    if (isNaN(sem) || sem < 1 || sem > 8) {
      return res.status(400).json({ message: 'Semester must be between 1 and 8' });
    }

    const deptId = parseInt(departmentId);
    const hash = await bcrypt.hash(String(password), 10);

    const student = await prisma.student.create({
      data: {
        rollNumber: String(rollNumber).trim().toUpperCase(),
        semester: sem,
        department: { connect: { id: deptId } },
        user: {
          create: {
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            password: hash,
            role: 'STUDENT',
          },
        },
      },
      include: { user: true },
    });

    // Student ke department aur semester ke courses mein apne aap enroll karo
    const courses = await prisma.course.findMany({
      where: { departmentId: deptId, semester: sem },
      select: { id: true },
    });
    if (courses.length) {
      await prisma.enrollment.createMany({
        data: courses.map((c) => ({ studentId: student.id, courseId: c.id })),
        skipDuplicates: true,
      });
    }

    res.status(201).json({ token: signToken(student.user), user: publicUser(student.user) });
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
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current one' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, me, register, changePassword, getPublicDepartments };
