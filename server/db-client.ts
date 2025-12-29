import { db } from "./db";
import { accessLinks, soilAnalysis, type AccessLink, type SoilAnalysis, type InsertSoilAnalysis } from "@shared/schema";
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

export async function createSoilAnalysis(analysis: InsertSoilAnalysis): Promise<SoilAnalysis> {
  const result = await db.insert(soilAnalysis).values(analysis).returning();
  return result[0];
}

export async function getSoilAnalysisByEmail(userEmail: string): Promise<SoilAnalysis[]> {
  return await db.select().from(soilAnalysis).where(eq(soilAnalysis.userEmail, userEmail));
}

export async function getAllSoilAnalysis(): Promise<SoilAnalysis[]> {
  return await db.select().from(soilAnalysis);
}

export async function updateSoilAnalysisStatus(id: number, status: string): Promise<SoilAnalysis> {
  const result = await db.update(soilAnalysis)
    .set({ status })
    .where(eq(soilAnalysis.id, id))
    .returning();
  return result[0];
}

export async function updateSoilAnalysisWithComments(
  id: number,
  status: string,
  adminComments: string,
  adminFileUrls: string
): Promise<SoilAnalysis> {
  const result = await db.update(soilAnalysis)
    .set({ status, adminComments, adminFileUrls, updatedAt: new Date() })
    .where(eq(soilAnalysis.id, id))
    .returning();
  return result[0];
}
