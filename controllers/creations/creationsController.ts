import { Request, Response } from "express";
import { prisma } from "../../configs/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import { GenerateContentConfig, HarmCategory, HarmBlockThreshold } from "@google/genai";
import fs from "fs";
import ai from "../../configs/ai.js";
import axios from "axios";
import path from "path";

const loadImage = (path: string, mimeType: string) => {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        }
    }
};

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

        let uploadedImages = await Promise.all(
            images.map(async (i: any) => {
                let res = await cloudinary.uploader.upload(i.path, {
                    resource_type: "image",
                });
                return res.secure_url;
            })
        )

        const creation = await prisma.project.create({
            data: {
                name,
                aspectRatio,
                userPrompt,
                productName,
                targetLength: parseInt(targetLength),
                userId,
                uploadedImages,
                isGenerating: true
            }
        });

        tempProjectId = creation.id;

        const model = "gemini-3-pro-image-preview";

        const generationConfig: GenerateContentConfig = {
            maxOutputTokens: 32768,
            temperature: 1,
            topP: 0.95,
            responseModalities: ["IMAGE"],
            imageConfig: {
                aspectRatio: aspectRatio || '9:16',
                imageSize: "1K"
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.OFF,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.OFF,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.OFF,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.OFF,
                },
            ]
        };

        // Images to base 64
        const image1base64 = loadImage(images[0].path, images[0].mimetype);
        const image2base64 = loadImage(images[1].path, images[1].mimetype);

        const prompt = {
            text: `Combine the person and product into a realistic photo.
            Make the person naturally wear or use the product in a natural way.
            Make lighting, shadows, scale and perspective consistent across the entire image.
            Make the person stand in a humanly natural pose. Do not make the person look like a cutout.
            Output ecommerce-quality photo realistic imagery.
            ${userPrompt ? `Incorporate this user prompt into the image: ${userPrompt}` : ""}`,
        }

        const response: any = await ai.models.generateContent({
            model,
            contents: [image1base64, image2base64, prompt],
            config: generationConfig,
        })

        if (!response?.candidates?.[0]?.content?.parts) {
            throw new Error("No content generated");
        }

        const parts = response.candidates[0].content.parts;

        let buffer: Buffer | null = null;

        for (const part of parts) {
            if (parts.inlineData) {
                buffer = Buffer.from(part.inlineData.data, 'base64');
            }
        }

        if (!buffer) {
            throw new Error("No image data found in response");
        }

        const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

        const uploadResponse = await cloudinary.uploader.upload(base64Image, {
            resource_type: "image",
        });

        await prisma.project.update({
            where: { id: creation.id },
            data: {
                generatedImage: uploadResponse.secure_url,
                isGenerating: false
            }
        });

        res.json({ creationId: creation.id });

    } catch (error: any) {
        if (tempProjectId!) {
            await prisma.project.update({
                where: { id: tempProjectId },
                data: {
                    isGenerating: false,
                    error: error.message || "Failed to generate image"
                }
            })
        }

        if (isImageCreditDeducted) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    ImageCredits: { increment: 1 }
                }
            })
        }

        console.error("Error creating image creation:", error);
        res.status(500).json({ error: "Failed to create image creation" });
    }
};

// Controller to create video
export const createVideoCreation = async (req: Request, res: Response) => {
    const { userId } = req.auth();
    const { projectId } = req.body;
    let isVideoCreditDeducted = false;

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user || user.VideoCredits < 1) {
        return res.status(400).json({ error: "Insufficient video credits" });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { VideoCredits: { decrement: 1 } }
    }).then(() => { isVideoCreditDeducted = true });

    try {
        const creation = await prisma.project.findUnique({
            where: { id: projectId, userId: userId },
            include: {
                user: true
            }
        });

        if (!creation || creation.isGenerating) {
            return res.status(400).json({ error: "Project is already generating" });
        }

        if (creation.generatedVideo) {
            return res.status(400).json({ error: "Video already generated" });
        }

        await prisma.project.update({
            where: { id: projectId },
            data: { isGenerating: true }
        });

        const prompt = `Make the person showcase the product which is ${creation.productName} and do it in a natural and humanly way. Make the video look like a real person is showcasing the product in a real environment. The video should be of ecommerce-quality. ${creation.userPrompt ? `Incorporate this user prompt into the video: ${creation.userPrompt}` : ""}`;

        const model = "veo-3.1-generate-preview";

        if (!creation.generatedImage) {
            throw new Error("No generated image found for video creation");
        }

        const image = await axios.get(creation.generatedImage, { responseType: 'arraybuffer' });

        const imageBytes: any = Buffer.from(image.data)

        let operation: any = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: imageBytes.toString('base64'),
                mimeType: "image/png"
            },
            config: {
                aspectRatio: creation?.aspectRatio || '9:16',
                numberOfVideos: 1,
                resolution: "720p",
            }
        });

        while (!operation.done) {
            console.log("Waiting for video generation to complete...")
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({
                operation: operation,
            })
        }

        const filename = `${userId}-${Date.now()}.mp4`;
        const filePath = path.join("videos", filename);

        fs.mkdirSync("videos", { recursive: true });

        if (!operation.response.generatedVideos) {
            throw new Error(operation.response.raiMediaFilteredReason[0] || "No video generated");
        };

        await ai.files.download({
            file: operation.response.generatedVideos[0].video,
            downloadPath: filePath
        })

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            resource_type: "video",
        });


        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedVideo: uploadResult.secure_url,
                isGenerating: false
            }
        });

        fs.unlinkSync(filePath);

        res.json({ message: "Video generation successful", videoUrl: uploadResult.secure_url });

    } catch (error: any) {
            await prisma.project.update({
                where: { id: projectId, userId: userId },
                data: {
                    isGenerating: false,
                    error: error.message || "Failed to generate video"
                }
            })

        if (isVideoCreditDeducted) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    VideoCredits: { increment: 1 }
                }
            })
        }

        console.error("Error creating video creation:", error);
        res.status(500).json({ error: "Failed to create video creation" });
    }
};

// Controller to delete creation
export const deleteCreation = async (req: Request, res: Response) => {
    try {

        const { userId } = req.auth();
        const { ProjectId } = req.params;

        const projectId = Array.isArray(ProjectId) ? ProjectId[0] : ProjectId;

        const creation = await prisma.project.findUnique({
            where: { id: projectId, userId: userId }
        });

        if (!creation) {
            return res.status(404).json({ error: "Creation not found" });
        }

        await prisma.project.delete({
            where: { id: projectId }
        });


        res.json({ message: "Creation deleted successfully" });
        
    } catch (error: any) {
        console.error("Error deleting creation:", error);
        res.status(500).json({ error: "Failed to delete creation" });
    }
};