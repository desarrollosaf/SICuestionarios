"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cuestionarios_1 = require("../controllers/cuestionarios");
const router = (0, express_1.Router)();
router.get("/api/preguntas/getpreguntas", cuestionarios_1.getpreguntas);
router.post('/api/preguntas/savecuestionario/:id', cuestionarios_1.savecuestionario);
exports.default = router;
