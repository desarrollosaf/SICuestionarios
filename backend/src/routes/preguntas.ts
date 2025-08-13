import { Router } from "express";
import { getpreguntas } from "../controllers/cuestionarios";


const router = Router();

router.get("/api/preguntas/getpreguntas", getpreguntas)

export default router