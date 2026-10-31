const prisma = require('../config/prisma');

const include = { author: { select: { id: true, name: true, role: true } } };

// GET /api/notices?page=1&limit=10&search=exam
const getNotices = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const { search } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, notices] = await Promise.all([
      prisma.notice.count({ where }),
      prisma.notice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include,
      }),
    ]);

    res.json({ data: notices, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/notices
const createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'title and content are required' });

    const notice = await prisma.notice.create({
      data: { title, content, authorId: req.user.id },
      include,
    });
    res.status(201).json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin kisi bhi notice ko, faculty sirf apne notice ko badal/hata sakta hai
const findEditable = async (req, res) => {
  const notice = await prisma.notice.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!notice) {
    res.status(404).json({ message: 'Notice not found' });
    return null;
  }
  if (req.user.role !== 'ADMIN' && notice.authorId !== req.user.id) {
    res.status(403).json({ message: 'You can only change your own notices' });
    return null;
  }
  return notice;
};

// PUT /api/notices/:id
const updateNotice = async (req, res) => {
  try {
    const notice = await findEditable(req, res);
    if (!notice) return;

    const { title, content } = req.body;
    const data = {};
    if (title) data.title = title;
    if (content) data.content = content;

    const updated = await prisma.notice.update({ where: { id: notice.id }, data, include });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/notices/:id
const deleteNotice = async (req, res) => {
  try {
    const notice = await findEditable(req, res);
    if (!notice) return;

    await prisma.notice.delete({ where: { id: notice.id } });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotices, createNotice, updateNotice, deleteNotice };