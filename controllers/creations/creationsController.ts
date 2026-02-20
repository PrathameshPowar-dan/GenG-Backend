import { Request, Response } from "express";
import { prisma } from "../../configs/prisma.js";

// Controller to create image
export const createImageCreation = async (req: Request, res: Response) => {
    let tempProjectId: string;
    const { userId } = req.auth();
    let isImageCreditDeducted = false;

    const { name = "PRo1", aspectRatio, userPrompt, productName, targetLength = 5 } = req.body;

    const images: any = req.files;

    if (images.length < 2 || !productName) {
        return res.status(400).json({ error: "At least 2 images and product name are required" });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user || user.ImageCredits < 1) {
        return res.status(400).json({ error: "Insufficient image credits" });
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: { ImageCredits: { decrement: 1 } }
        }).then(() => { isImageCreditDeducted = true });
    };

    try {

    } catch (error: any) {
        console.error("Error creating image creation:", error);
        res.status(500).json({ error: "Failed to create image creation" });
    }
};

// Controller to create video
export const createVideoCreation = async (req: Request, res: Response) => {
    try {

    } catch (error: any) {
        console.error("Error creating video creation:", error);
        res.status(500).json({ error: "Failed to create video creation" });
    }
};

// Controller to delete creation
export const deleteCreation = async (req: Request, res: Response) => {
    try {

    } catch (error: any) {
        console.error("Error deleting creation:", error);
        res.status(500).json({ error: "Failed to delete creation" });
    }
};