import { Router } from "express";
import { getcuestionarios, getpreguntas, savecuestionario } from "../controllers/cuestionarios";


const router = Router();

router.get("/api/preguntas/getpreguntas/:id", getpreguntas)
router.post('/api/preguntas/savecuestionario/:id', savecuestionario)
router.get("/api/preguntas/getcuestionarios", getcuestionarios)

export default router