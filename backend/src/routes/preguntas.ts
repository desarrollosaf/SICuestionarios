import { Router } from "express";
import { getpreguntas, savecuestionario } from "../controllers/cuestionarios";


const router = Router();

router.get("/api/preguntas/getpreguntas", getpreguntas)
router.post('/api/preguntas/savecuestionario', savecuestionario);

export default router