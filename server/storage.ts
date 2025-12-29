import { type User, type InsertUser, type SoilAnalysis, type InsertSoilAnalysis } from "@shared/schema";
import * as dbClient from "./db-client";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSoilAnalysis(analysis: InsertSoilAnalysis): Promise<SoilAnalysis>;
  getAllSoilAnalysis(): Promise<SoilAnalysis[]>;
  getUserSoilAnalysis(userEmail: string): Promise<SoilAnalysis[]>;
  updateSoilAnalysisStatus(id: number, status: string): Promise<SoilAnalysis>;
  updateSoilAnalysisWithComments(id: number, status: string, adminComments: string, adminFileUrls: string): Promise<SoilAnalysis>;
  getAllUsers(): Promise<User[]>;
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

  async getAllUsers(): Promise<User[]> {
    try {
      return await dbClient.getAllUsers();
    } catch (error) {
      console.warn("Failed to fetch all users from database, returning memory storage", error);
      return Array.from(this.users.values());
    }
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
    try {
      // Try to save to database first
      return await dbClient.createSoilAnalysis(analysis);
    } catch (error) {
      // Fallback to memory storage if database is not available
      console.warn("Database connection failed, using memory storage for soil analysis", error);
      const id = this.currentAnalysisId++;
      // @ts-ignore
      const newAnalysis: SoilAnalysis = { ...analysis, id, createdAt: new Date() };
      this.soilAnalyses.set(id, newAnalysis);
      return newAnalysis;
    }
  }

  async getAllSoilAnalysis(): Promise<SoilAnalysis[]> {
    try {
      return await dbClient.getAllSoilAnalysis();
    } catch (error) {
      console.warn("Failed to fetch all analyses from database, returning memory storage", error);
      return Array.from(this.soilAnalyses.values());
    }
  }

  async getUserSoilAnalysis(userEmail: string): Promise<SoilAnalysis[]> {
    try {
      const analyses = await dbClient.getAllSoilAnalysis();
      return analyses.filter(a => a.userEmail === userEmail);
    } catch (error) {
      console.warn("Failed to fetch user analyses from database", error);
      return Array.from(this.soilAnalyses.values()).filter(a => a.userEmail === userEmail);
    }
  }

  async updateSoilAnalysisStatus(id: number, status: string): Promise<SoilAnalysis> {
    try {
      return await dbClient.updateSoilAnalysisStatus(id, status);
    } catch (error) {
      console.warn("Failed to update analysis status in database", error);
      const analysis = this.soilAnalyses.get(id);
      if (!analysis) throw new Error("Analysis not found");
      const updated = { ...analysis, status };
      this.soilAnalyses.set(id, updated);
      return updated;
    }
  }

  async updateSoilAnalysisWithComments(id: number, status: string, adminComments: string, adminFileUrls: string): Promise<SoilAnalysis> {
    try {
      return await dbClient.updateSoilAnalysisWithComments(id, status, adminComments, adminFileUrls);
    } catch (error) {
      console.warn("Failed to update analysis with comments in database", error);
      const analysis = this.soilAnalyses.get(id);
      if (!analysis) throw new Error("Analysis not found");
      const updated = { ...analysis, status, adminComments, adminFileUrls };
      this.soilAnalyses.set(id, updated);
      return updated;
    }
  }
}

export const storage = new MemStorage();
