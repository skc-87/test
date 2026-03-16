const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "..", ".env") });
const User = require("../models/User");
const printUsage = () => {
  console.log(`
Usage:
  node scripts/changeAdmin.js --transfer <newAdminEmail>
  node scripts/changeAdmin.js --reset-password <adminEmail> <newPassword>
  node scripts/changeAdmin.js --replace <newEmail> <newPassword> [newName]
  node scripts/changeAdmin.js --list
  `);
};
const run = async () => {
  const args = process.argv.slice(2);
  if (args.length === 0) { printUsage(); process.exit(0); }
  if (!process.env.MONGO_URI) { console.error("❌ MONGO_URI is not set in .env file"); process.exit(1); }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");
  const command = args[0];
  try {
    switch (command) {
      case "--list": {
        const admins = await User.find({ role: "admin" }).select("-password").lean();
        if (admins.length === 0) { console.log("⚠️  No admin accounts found."); }
        else {
          console.log(`\nAdmin accounts (${admins.length}):`);
          admins.forEach((a) => console.log(`  • ${a.name} <${a.email}> (status: ${a.status}, created: ${a.createdAt.toISOString().slice(0, 10)})`));
        }
        break;
      }
      case "--transfer": {
        const newAdminEmail = args[1];
        if (!newAdminEmail) { console.error("❌ Please provide the email of the user to transfer admin to."); printUsage(); process.exit(1); }
        const newAdmin = await User.findOne({ email: newAdminEmail.toLowerCase() });
        if (!newAdmin) { console.error(`❌ No user found with email: ${newAdminEmail}`); process.exit(1); }
        if (newAdmin.role === "admin") { console.log(`ℹ️  ${newAdminEmail} is already an admin.`); break; }
        const oldAdmins = await User.find({ role: "admin" });
        for (const oldAdmin of oldAdmins) {
          oldAdmin.role = "teacher"; oldAdmin.status = "approved"; await oldAdmin.save();
          console.log(`  ↓ Demoted old admin: ${oldAdmin.email} → teacher`);
        }
        newAdmin.role = "admin"; newAdmin.status = "approved"; await newAdmin.save();
        console.log(`✅ Admin transferred to: ${newAdmin.name} <${newAdmin.email}>`);
        break;
      }
      case "--reset-password": {
        const email = args[1], newPassword = args[2];
        if (!email || !newPassword) { console.error("❌ Please provide email and new password."); printUsage(); process.exit(1); }
        if (newPassword.length < 8) { console.error("❌ Password must be at least 8 characters."); process.exit(1); }
        const admin = await User.findOne({ email: email.toLowerCase(), role: "admin" });
        if (!admin) { console.error(`❌ No admin account found with email: ${email}`); process.exit(1); }
        admin.password = newPassword;
        await admin.save();
        console.log(`✅ Password reset for admin: ${admin.email}`);
        break;
      }
      case "--replace": {
        const newEmail = args[1], newPassword = args[2], newName = args[3] || "Admin";
        if (!newEmail || !newPassword) { console.error("❌ Please provide new email and password."); printUsage(); process.exit(1); }
        if (newPassword.length < 8) { console.error("❌ Password must be at least 8 characters."); process.exit(1); }
        const removed = await User.deleteMany({ role: "admin" });
        if (removed.deletedCount > 0) console.log(`  🗑️  Removed ${removed.deletedCount} old admin account(s)`);
        const existing = await User.findOne({ email: newEmail.toLowerCase() });
        if (existing) {
          existing.role = "admin"; existing.status = "approved"; existing.password = newPassword; existing.name = newName;
          await existing.save();
          console.log(`✅ Existing user ${newEmail} promoted to admin`);
        } else {
          await User.create({ name: newName, email: newEmail, password: newPassword, role: "admin", status: "approved" });
          console.log(`✅ New admin created: ${newName} <${newEmail}>`);
        }
        break;
      }
      default:
        console.error(`❌ Unknown command: ${command}`); printUsage(); process.exit(1);
    }
  } catch (error) { console.error("❌ Error:", error.message); }
  finally { await mongoose.disconnect(); console.log("✅ Disconnected from MongoDB"); process.exit(0); }
};
run();
