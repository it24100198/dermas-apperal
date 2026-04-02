export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : req.query;
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => ({ path: d.path.join('.'), message: d.message })),
      });
    }
    if (source === 'body') req.body = value;
    else req.query = value;
    next();
  };
}
