import { Router } from "express";
import { getcuestionarios, getcuestionariosdep, getpreguntas, savecuestionario } from "../controllers/cuestionarios";


const router = Router();

router.get("/api/preguntas/getpreguntas/:id", getpreguntas)
router.post('/api/preguntas/savecuestionario/:id', savecuestionario)
router.get("/api/preguntas/getcuestionarios", getcuestionarios)
router.post("/api/preguntas/getcuestionariosdep", getcuestionariosdep)
export default router