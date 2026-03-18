const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const ExpenseCategory = require('../models/ExpenseCategory');
const Department = require('../models/Department');
const { USER_ROLES, MASTER_CATEGORIES, SUB_CATEGORIES, DEPARTMENTS } = require('../config/constants');

dotenv.config({ path: './.env' });

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

// Sample data
const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Employee.deleteMany();
        await ExpenseCategory.deleteMany();
        await Department.deleteMany();
        
        console.log('🗑️  Existing data cleared');
        
        // Create admin user
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@dermaapparel.com',
            password: 'Admin123!',
            role: USER_ROLES.ADMIN,
            isActive: true
        });
        
        console.log('👤 Admin user created');
        
        // Create departments
        const departments = await Department.insertMany(
            DEPARTMENTS.map(name => ({
                name,
                code: name.substring(0, 3).toUpperCase(),
                description: `${name} Department`,
                createdBy: adminUser._id
            }))
        );
        
        console.log('🏢 Departments created');
        
        // Create master categories
        const masterCategories = await ExpenseCategory.insertMany(
            MASTER_CATEGORIES.map(name => ({
                name,
                type: 'master',
                description: `${name} category`,
                createdBy: adminUser._id,
                isActive: true
            }))
        );
        
        console.log('📁 Master categories created');
        
        // Create sub categories
        const subCategories = [];
        for (const [masterName, subs] of Object.entries(SUB_CATEGORIES)) {
            const master = masterCategories.find(cat => cat.name === masterName);
            
            if (master) {
                for (const subName of subs) {
                    subCategories.push({
                        name: subName,
                        type: 'sub',
                        parentCategory: master._id,
                        description: `${subName} sub-category`,
                        createdBy: adminUser._id,
                        isActive: true
                    });
                }
            }
        }
        
        if (subCategories.length > 0) {
            await ExpenseCategory.insertMany(subCategories);
        }
        
        console.log('📂 Sub categories created');
        
        // Create manager
        await User.create({
            name: 'Manager User',
            email: 'manager@dermaapparel.com',
            password: 'Manager123!',
            role: USER_ROLES.MANAGER,
            department: 'Production',
            createdBy: adminUser._id
        });
        
        // Create HR
        await User.create({
            name: 'HR User',
            email: 'hr@dermaapparel.com',
            password: 'Hr123!',
            role: USER_ROLES.HR,
            department: 'HR',
            createdBy: adminUser._id
        });
        
        // Create Accountant
        await User.create({
            name: 'Accountant User',
            email: 'accountant@dermaapparel.com',
            password: 'Accountant123!',
            role: USER_ROLES.ACCOUNTANT,
            department: 'Accounts',
            createdBy: adminUser._id
        });
        
        // Create Employee
        const employeeUser = await User.create({
            name: 'Employee User',
            email: 'employee@dermaapparel.com',
            password: 'Employee123!',
            role: USER_ROLES.EMPLOYEE,
            department: 'Production',
            createdBy: adminUser._id
        });

        const employeeProfile = await Employee.create({
            userId: employeeUser._id,
            employeeCode: 'EMP001',
            firstName: 'Employee',
            lastName: 'User',
            email: employeeUser.email,
            phone: '0770000000',
            department: 'Production',
            designation: 'Production Staff',
            joiningDate: new Date(),
            salary: 35000,
            createdBy: adminUser._id
        });

        await User.findByIdAndUpdate(employeeUser._id, {
            employeeId: employeeProfile._id
        });
        
        console.log('👥 Additional users created');
        console.log('✅ Database seeded successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('Admin: admin@dermaapparel.com / Admin123!');
        console.log('Manager: manager@dermaapparel.com / Manager123!');
        console.log('HR: hr@dermaapparel.com / Hr123!');
        console.log('Accountant: accountant@dermaapparel.com / Accountant123!');
        console.log('Employee: employee@dermaapparel.com / Employee123!');
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
    } finally {
        mongoose.disconnect();
    }
};

seedData();