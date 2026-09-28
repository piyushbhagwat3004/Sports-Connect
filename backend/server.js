import express from 'express';

import cors from  'cors';

import dotenv from 'dotenv';

import mongoose from 'mongoose';

import postsRoutes from './routes/posts.routes.js';
import userRoutes from './routes/user.routes.js';
import teamRoutes from './routes/team.routes.js';
import eventRoutes from './routes/sportEvent.routes.js';

import path from 'path';
import { fileURLToPath } from 'url';


import fs from 'fs';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(postsRoutes);
app.use(userRoutes);
app.use(teamRoutes);
app.use(eventRoutes);
app.use('/uploads', express.static(uploadsDir));


const start = async () => {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/aim-gold";
    const PORT = process.env.PORT || 9000;
    console.log(`Connecting to MongoDB: ${mongoURI}`);
    await mongoose.connect(mongoURI);

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

start(); 