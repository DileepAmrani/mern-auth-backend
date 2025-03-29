import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import { errorMiddleware, ErrorHandler } from "./middlewares/errorMiddleware.js";
import logger from "./utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/users", userRoutes);

// 404 Route Handler
app.use("*", (req, res, next) => {
  next(new ErrorHandler("Route Not Found", 404));
});

// Global Error Handling - should be after all routes
app.use(errorMiddleware);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
