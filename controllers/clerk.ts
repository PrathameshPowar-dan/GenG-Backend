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
                if ((data.charge_type === "recurring"))
                break;
            }

            default:
                break;
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

export default ClerkWebHook;