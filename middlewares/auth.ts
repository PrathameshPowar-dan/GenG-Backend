import { Request, Response, NextFunction } from "express";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Check if the token is even arriving
        // console.log("Auth Header:", req.headers.authorization);
        
        // 2. Check what Clerk parsed
        // console.log("Clerk Auth Object:", req.auth());
        const {userId} = req.auth();
        // console.log(userId)

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        next();
    } catch (error: any) {
        console.error("Auth Middleware Error:", error);
        res.status(401).json({ message: error.message || "Internal server error" });
    }
};