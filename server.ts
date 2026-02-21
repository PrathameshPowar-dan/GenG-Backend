import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import ClerkWebHook from "./controllers/clerk.js";
import userRoutes from "./routes/userRoutes.js";
import creationRoutes from "./routes/creationRoutes.js";

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

app.post("/api/clerk",express.raw({type: 'application/json'}), ClerkWebHook);
app.use(express.json());
app.use(clerkMiddleware());

const port = process.env.PORT || 8001;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user', userRoutes);
app.use('/api/create', creationRoutes);


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});