import bcrypt from "bcryptjs";
import { prisma } from "./configs/prisma.js";

const newPassword = "Test@12345";

const passwordHash = await bcrypt.hash(newPassword, 10);

const user = await prisma.user.update({
    where: {
        email: "testuser@gmail.com",
    },
    data: {
        passwordHash,
    },
});

console.log(`Password reset for ${user.email}`);
console.log(`New password: ${newPassword}`);

await prisma.$disconnect();