import express from "express";
const router = express.Router();
import { createQuery } from "../controllers/queryController.js";

router.post("/", createQuery);

export default router;
