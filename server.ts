import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import ClerkWebHook from "./controllers/clerk.js";

const app = express();

// Middleware
app.use(cors())

app.post("/api/clerk",express.raw({type: 'application/json'}), ClerkWebHook);
app.use(express.json());
app.use(clerkMiddleware());

const port = process.env.PORT || 8001;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});