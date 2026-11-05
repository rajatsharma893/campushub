const notFound = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

// Ek hi jagah saare unexpected errors: stack trace bahar kabhi nahi jati
const errorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

module.exports = { notFound, errorHandler };
