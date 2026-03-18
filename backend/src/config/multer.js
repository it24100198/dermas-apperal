const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        './uploads/receipts',
        './uploads/reimbursements',
        './uploads/profiles'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = './uploads/';
        
        if (req.baseUrl.includes('reimbursements')) {
            uploadPath += 'reimbursements/';
        } else if (req.baseUrl.includes('employees')) {
            uploadPath += 'profiles/';
        } else {
            uploadPath += 'receipts/';
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Invalid file type. Only JPEG, PNG and PDF are allowed!', 400), false);
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 // 5MB default
    }
});

module.exports = upload;
module.exports.uploadReceipt = upload.single('receipt');
module.exports.uploadProfile = upload.single('profile');
module.exports.uploadDocument = upload.single('document');