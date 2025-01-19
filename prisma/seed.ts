// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // Import bcrypt for password hashing

const prisma = new PrismaClient();

async function main() {
  // Hashing a default password for the user
  const hashedPassword = await bcrypt.hash("defaultPassword123", 10);

  // Create a new user
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "johndoe@example.com",
      password: hashedPassword,
    },
  });

  console.log("User created:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
