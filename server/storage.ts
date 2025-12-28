import { type User, type InsertUser, type SoilAnalysis, type InsertSoilAnalysis } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSoilAnalysis(analysis: InsertSoilAnalysis): Promise<SoilAnalysis>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private soilAnalyses: Map<number, SoilAnalysis>;
  private currentId: number;
  private currentAnalysisId: number;

  constructor() {
    this.users = new Map();
    this.soilAnalyses = new Map();
    this.currentId = 1;
    this.currentAnalysisId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    // @ts-ignore
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async createSoilAnalysis(analysis: InsertSoilAnalysis): Promise<SoilAnalysis> {
    const id = this.currentAnalysisId++;
    // @ts-ignore
    const newAnalysis: SoilAnalysis = { ...analysis, id, createdAt: new Date() };
    this.soilAnalyses.set(id, newAnalysis);
    return newAnalysis;
  }
}

export const storage = new MemStorage();
