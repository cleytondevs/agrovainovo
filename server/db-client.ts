import { db } from "./db";
import { accessLinks, type AccessLink } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function createAccessLink(code: string, email?: string): Promise<AccessLink[]> {
  return await db.insert(accessLinks).values({
    linkCode: code,
    usesRemaining: 1,
    email
  }).returning();
}

export async function checkAccessLink(code: string): Promise<AccessLink | null> {
  const result = await db.select().from(accessLinks).where(
    eq(accessLinks.linkCode, code)
  ).limit(1);
  return result[0] || null;
}

export async function decrementAccessLink(code: string): Promise<AccessLink[]> {
  return await db.update(accessLinks)
    .set({ usesRemaining: 0 })
    .where(eq(accessLinks.linkCode, code))
    .returning();
}
