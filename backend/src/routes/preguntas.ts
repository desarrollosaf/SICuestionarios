import { Router } from "express";

import { getcuestionarios, getcuestionariosdep, getcuestionariosus,getExcel, getpreguntas, gettotalesdep, savecuestionario,getExcelFaltantes, getRespuestasUsuario, getanios } from "../controllers/cuestionarios";
import { verifyToken, soloAdmin } from "../middlewares/auth";

const router = Router();

router.get("/api/preguntas/getpreguntas/:id", getpreguntas)
router.post('/api/preguntas/savecuestionario/:id', savecuestionario)
router.get("/api/preguntas/getanios", getanios)
router.get("/api/preguntas/getcuestionarios", getcuestionarios)
router.post("/api/preguntas/getcuestionariosdep", getcuestionariosdep)
router.get("/api/preguntas/gettotalesdep", gettotalesdep)
router.get("/api/preguntas/getcuestionariosus", getcuestionariosus)
router.post("/api/preguntas/getExcelFaltantes", getExcelFaltantes)
router.get("/api/preguntas/getExcel", getExcel)
router.get("/api/preguntas/getrespuestasusuario/:rfc", verifyToken, soloAdmin, getRespuestasUsuario)

export default router