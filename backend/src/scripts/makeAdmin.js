const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  const email = emailArg?.trim().toLowerCase();
  const password = passwordArg?.trim();

  if (!email || !password) {
    throw new Error("Use: npm run make-admin -- your@email.com NewPassword123");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  await connectDB();

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { email },
    {
      role: "Admin",
      status: "Active",
      password: hashedPassword
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new Error(`No account found for ${email}`);
  }

  console.log(`Admin account ready: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
