import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { normalizeEmail } from "../src/lib/sales-policy";

async function main() {
  const email = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL);
  const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || "");
  const name = String(process.env.BOOTSTRAP_ADMIN_NAME || "Administrator").trim().slice(0, 120);
  if (password.length < 12 || password.length > 72) throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be 12-72 characters.");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("That account already exists; bootstrap never overwrites or promotes an existing account.");
  const admin = await prisma.user.create({
    data: { email, name, password: await bcrypt.hash(password, 12), role: "admin", active: true },
    select: { id: true, email: true },
  });
  console.log(`Created administrator ${admin.email} (${admin.id}).`);
}

main().finally(() => prisma.$disconnect());

