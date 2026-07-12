import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { router } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app: Application = express();

// Middleware — order is intentional
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.use(router);
app.use(errorHandler);

export { app };
