const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendNonApiError = (err, req, res, includeDebug = false) => {
    const hasViewEngine = Boolean(req.app && req.app.get('view engine'));

    if (hasViewEngine) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }

    const payload = {
        status: err.status,
        message: err.message,
        path: req.originalUrl
    };

    if (includeDebug) {
        payload.error = err;
        payload.stack = err.stack;
    }

    return res.status(err.statusCode).json(payload);
};

const sendErrorDev = (err, req, res) => {
    // API error
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    
    // Non-API fallback
    console.error('ERROR 💥', err);
    return sendNonApiError(err, req, res, true);
};

const sendErrorProd = (err, req, res) => {
    // API error
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
    
    if (err.isOperational) {
        return sendNonApiError(err, req, res);
    }
    
    console.error('ERROR 💥', err);
    return sendNonApiError(
        new AppError('Please try again later.', err.statusCode || 500),
        req,
        res
    );
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err };
        error.message = err.message;
        
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        
        sendErrorProd(error, req, res);
    }
};