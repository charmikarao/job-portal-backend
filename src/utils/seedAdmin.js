const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * There is no public "register as Admin" endpoint by design (see spec:
 * only Job Seeker and Employer self-register). Run this script once to
 * create the first platform Admin account:
 *   npm run seed:admin
 */
const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`An admin account already exists: ${existingAdmin.email}`);
      process.exit(0);
    }

    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email: process.env.ADMIN_EMAIL || 'admin@jobportal.com',
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'admin',
    });

    console.log(`Admin account created successfully: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding admin account: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
