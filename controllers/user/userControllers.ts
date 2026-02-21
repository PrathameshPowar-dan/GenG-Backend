import { Request, Response } from "express";
import { prisma } from "../../configs/prisma.js";

export const getUserCredits = async (req: Request, res: Response) => {
    try {
        const { userId } = req.auth();
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where:{id: userId}
        })
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ ImageCredits: user?.ImageCredits, VideoCredits: user?.VideoCredits });

    } catch (error: any) {
        console.error("Error fetching user credits:", error);
        res.status(500).json({ error: "Failed to fetch user credits" });
    }
};

export const getAllUserCreations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.auth();
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const creations = await prisma.project.findMany({
            where: { userId: userId },
            orderBy: { createdAt: "desc" },
        });

        res.json({ creations });
    } catch (error: any) {
        console.error("Error fetching user credits:", error);
        res.status(500).json({ error: "Failed to fetch user credits" });
    }
};

export const getCreationById = async (req: Request, res: Response) => {
    try {
        
        const { userId } = req.auth();
        const { Projectid } = req.params;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        };

        const projectId = Array.isArray(Projectid) ? Projectid[0] : Projectid;

        const creation = await prisma.project.findUnique({
            where: { id: projectId, userId },
        });

        if (!creation) {
            return res.status(404).json({ error: "Creation not found" });
        }
        
        res.json({ creation });
    } catch (error: any) {
        console.error("Error fetching user credits:", error);
        res.status(500).json({ error: "Failed to fetch user credits" });
    }
};