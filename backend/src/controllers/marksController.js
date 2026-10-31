const prisma = require('../config/prisma');

const MAX_INTERNAL = 40;
const MAX_EXTERNAL = 60;

// Total marks (out of 100) se grade aur grade point
const gradeFor = (total) => {
  if (total >= 90) return { grade: 'O', point: 10 };
  if (total >= 80) return { grade: 'A+', point: 9 };
  if (total >= 70) return { grade: 'A', point: 8 };
  if (total >= 60) return { grade: 'B', point: 7 };
  if (total >= 50) return { grade: 'C', point: 6 };
  if (total >= 40) return { grade: 'D', point: 5 };
  return { grade: 'F', point: 0 };
};

// Admin kisi bhi course ke, faculty sirf apne course ke marks daal sakta hai
const checkCourseAccess = async (user, courseId) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { status: 404, error: 'Course not found' };
  if (user.role === 'ADMIN') return { course };
  const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
  if (!faculty || course.facultyId !== faculty.id) {
    return { status: 403, error: 'You are not assigned to this course' };
  }
  return { course };
};

// POST /api/marks/enter
// body: { courseId, records: [{ studentId, internal, external }] }
const enterMarks = async (req, res) => {
  try {
    const { courseId, records } = req.body;
    if (!courseId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'courseId and records are required' });
    }

    const cid = parseInt(courseId);
    const access = await checkCourseAccess(req.user, cid);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const enrolled = new Set(
      (await prisma.enrollment.findMany({ where: { courseId: cid }, select: { studentId: true } })).map(
        (e) => e.studentId
      )
    );

    for (const r of records) {
      const internal = Number(r.internal);
      const external = Number(r.external);
      if (!enrolled.has(parseInt(r.studentId))) {
        return res.status(400).json({ message: `Student ${r.studentId} is not enrolled in this course` });
      }
      if (isNaN(internal) || internal < 0 || internal > MAX_INTERNAL) {
        return res.status(400).json({ message: `internal must be between 0 and ${MAX_INTERNAL}` });
      }
      if (isNaN(external) || external < 0 || external > MAX_EXTERNAL) {
        return res.status(400).json({ message: `external must be between 0 and ${MAX_EXTERNAL}` });
      }
    }

    // Dobara daalne par purane marks update ho jate hain
    await prisma.$transaction(
      records.map((r) => {
        const internal = Number(r.internal);
        const external = Number(r.external);
        const { grade } = gradeFor(internal + external);
        const studentId = parseInt(r.studentId);
        return prisma.marks.upsert({
          where: { studentId_courseId: { studentId, courseId: cid } },
          update: { internal, external, grade },
          create: { studentId, courseId: cid, internal, external, grade },
        });
      })
    );

    res.json({ message: 'Marks saved', count: records.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/marks/course/:courseId  (faculty/admin course ke marks dekhe)
const getCourseMarks = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const access = await checkCourseAccess(req.user, courseId);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { studentId: 'asc' },
    });
    const marks = await prisma.marks.findMany({ where: { courseId } });
    const byStudent = Object.fromEntries(marks.map((m) => [m.studentId, m]));

    res.json({
      course: { id: access.course.id, code: access.course.code, name: access.course.name },
      students: enrollments.map((e) => {
        const m = byStudent[e.studentId];
        return {
          studentId: e.studentId,
          rollNumber: e.student.rollNumber,
          name: e.student.user.name,
          internal: m ? m.internal : null,
          external: m ? m.external : null,
          total: m ? m.internal + m.external : null,
          grade: m ? m.grade : null,
        };
      }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/marks/my  (student ka report card + CGPA)
const getMyReport = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const marks = await prisma.marks.findMany({
      where: { studentId: student.id },
      include: { course: { select: { id: true, code: true, name: true, credits: true, semester: true } } },
      orderBy: { courseId: 'asc' },
    });

    let totalCredits = 0;
    let totalPoints = 0;

    const subjects = marks.map((m) => {
      const total = m.internal + m.external;
      const { grade, point } = gradeFor(total);
      totalCredits += m.course.credits;
      totalPoints += point * m.course.credits;
      return {
        course: m.course,
        internal: m.internal,
        external: m.external,
        total,
        grade,
        gradePoint: point,
        result: grade === 'F' ? 'FAIL' : 'PASS',
      };
    });

    const cgpa = totalCredits ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;

    res.json({
      student: { id: student.id, rollNumber: student.rollNumber, semester: student.semester },
      cgpa,
      overallResult: subjects.length === 0 ? null : subjects.some((s) => s.result === 'FAIL') ? 'FAIL' : 'PASS',
      subjects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { enterMarks, getCourseMarks, getMyReport };