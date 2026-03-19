import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database.js";
import { UserModel } from "../models/user.model.js";

async function seed() {
  await connectDatabase();
  await UserModel.deleteMany({});
  const passwordHash = await bcrypt.hash("Password123!", 10);
  await UserModel.create([
    {
      fullName: "Demo User",
      email: "demo@ott.local",
      passwordHash,
      referralCode: "demo-user",
      profiles: [{ name: "Main Profile", isKids: false }],
      emailVerified: true
    },
    {
      fullName: "Kids Viewer",
      email: "kids@ott.local",
      passwordHash,
      referralCode: "kids-viewer",
      profiles: [{ name: "Kids", isKids: true }],
      emailVerified: true
    }
  ]);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    process.stderr.write(`Seed failed: ${String(error)}\n`);
    process.exit(1);
  });
