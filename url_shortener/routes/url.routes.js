import express from "express";
import {
  createShortUrl,
  redirectToOriginalUrl,
} from "../controller/url.controller.js";

const urlRouter = express.Router();

urlRouter.post("/", createShortUrl);
urlRouter.get("/:code", redirectToOriginalUrl);

export default urlRouter;
