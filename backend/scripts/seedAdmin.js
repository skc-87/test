const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "..", ".env") });
const User = require("../models/User");
const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) { console.error("❌ MONGO_URI is not set in .env file"); process.exit(1); }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@edutrack.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@1234";
    const adminName = process.env.ADMIN_NAME || "Admin";
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`⚠️  User with email ${adminEmail} already exists (role: ${existing.role}, status: ${existing.status})`);
      if (existing.role !== "admin") {
        existing.role = "admin"; existing.status = "approved"; await existing.save();
        console.log(`✅ Updated existing user to admin role`);
      } else { console.log(`ℹ️  Admin account already set up. No changes needed.`); }
    } else {
      await User.create({ name: adminName, email: adminEmail, password: adminPassword, role: "admin", status: "approved" });
      console.log(`✅ Admin user created successfully!`);
      console.log(`   Email:    ${adminEmail}`);
      console.log(`   Password: ${'*'.repeat(adminPassword.length)} (set via ADMIN_PASSWORD env var or default)`);
      console.log(`   ⚠️  Change the default password after first login!`);
    }
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) { console.error("❌ Seed error:", error.message); process.exit(1); }
};
seedAdmin();
