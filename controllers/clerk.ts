import { verifyWebhook } from "@clerk/express/webhooks";
import { Request, Response } from "express";
import { prisma } from "../configs/prisma.js";

const ClerkWebHook = async (req: Request, res: Response) => {
    try {
        const evt: any = await verifyWebhook(req)

        const { data, type } = evt;

        switch (type) {
            case "user.created": {
                await prisma.user.create({
                    data: {
                        id: data.id,
                        email: data.email_addresses[0].email_address,
                        name: data.first_name + " " + data.last_name,
                        image: data.image_url,
                    }
                })
                break;
            }

            case "user.updated": {
                await prisma.user.update({
                    where: {
                        id: data.id
                    },
                    data: {
                        email: data.email_addresses[0].email_address,
                        name: data.first_name + " " + data.last_name,
                        image: data.image_url,
                    }
                })
                break;
            }

            case "user.deleted": {
                await prisma.user.delete({
                    where: {
                        id: data.id
                    }
                })
                break;
            }

            case "paymentAttempt.updated": {
                console.log(data);
                if ((data.charge_type === "recurring" || data.charge_type === "checkout") && data.status === "paid") {
                    
                    const planAllocations: Record<string, { image: number, video: number }> = {
                        "pro_user": {
                            image: 999999, // Massive number represents 'Unlimited'
                            video: 10      
                        }
                    };

                    const clerkUserId = data?.payer?.user_id;
                    const planId = data?.subscription_items?.[0]?.plan?.slug as string;
                    
                    const allocation = planAllocations[planId];

                    if (!allocation) {
                        return res.status(400).json({ message: "Invalid plan or plan slug not found" });
                    }

                    console.log("Processing PlanID:", planId);

                    await prisma.user.update({
                        where: {
                            id: clerkUserId
                        },
                        data: {
                            ImageCredits: {
                                increment: allocation.image
                            },
                            VideoCredits: {
                                increment: allocation.video
                            }
                        }
                    });
                }
                break;
            }

            default:
                break;
        }

        res.json({message: "Webhook received"});
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

export default ClerkWebHook;