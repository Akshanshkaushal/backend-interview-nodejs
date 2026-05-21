import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";
import { connectDb } from "./config/db.js";
import urlRouter from "./routes/url.routes.js";

configDotenv();

const PORT = process.env.PORT || 4000;

const app = express();

connectDb(process.env.MONGO_URL);

app.use(express.json());

app.use(cors("*"));

app.use("/", urlRouter);

app.listen(PORT, () => {
  console.log(`server is running at port ${PORT}`);
});
