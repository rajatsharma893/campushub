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
