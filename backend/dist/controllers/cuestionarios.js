"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.savecuestionario = exports.getpreguntas = void 0;
const preguntas_1 = __importDefault(require("../models/preguntas"));
const opciones_1 = __importDefault(require("../models/opciones"));
const secciones_1 = __importDefault(require("../models/secciones"));
const sesion_cuestionario_1 = __importDefault(require("../models/sesion_cuestionario"));
const respuesta_1 = __importDefault(require("../models/respuesta"));
const connection_1 = __importDefault(require("../database/connection"));
const getpreguntas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pregunta = yield secciones_1.default.findAll({
            include: [
                {
                    model: preguntas_1.default,
                    as: "m_preguntas",
                    include: [
                        {
                            model: opciones_1.default,
                            as: 'm_opciones'
                        },
                    ],
                },
            ],
            order: [
                ['orden', 'asc'],
                [{ model: preguntas_1.default, as: "m_preguntas" }, 'orden', 'asc'],
                [{ model: preguntas_1.default, as: "m_preguntas" },
                    { model: opciones_1.default, as: "m_opciones" }, 'orden', 'asc'],
            ]
        });
        return res.json({
            data: pregunta
        });
    }
    catch (error) {
        console.error('Error al obtener preguntas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getpreguntas = getpreguntas;
const savecuestionario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { body } = req;
        const arrayPreguntas = body.preguntas;
        const idSesion = yield sesion_cuestionario_1.default.create({
            "id_usuario": body.rfc,
            "fecha_registro": new Date
        });
        const respuestasArr = arrayPreguntas.map((item) => ({
            id_pregunta: item.id_pregunta,
            id_opcion: item.id_respuesta,
            id_sesion: idSesion.id
        }));
        yield connection_1.default.transaction((t) => __awaiter(void 0, void 0, void 0, function* () {
            const respuestasSave = yield respuesta_1.default.bulkCreate(respuestasArr);
        }));
        return res.json({
            status: 200,
            msg: "Respuestas guardadas correctamente"
        });
    }
    catch (error) {
        console.error('Error al guardar respuestas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.savecuestionario = savecuestionario;
