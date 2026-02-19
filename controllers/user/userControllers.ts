import { Request, Response } from "express";

export const getUserCredits = async (req: Request, res: Response) => {
    try {
        
        
    } catch (error: any) {
        console.error("Error fetching user credits:", error);
        res.status(500).json({ error: "Failed to fetch user credits" });
    }
};