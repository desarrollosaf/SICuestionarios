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
const sesion_cuestionario_1 = __importDefault(require("../models/sesion_cuestionario"));
const opciones_1 = __importDefault(require("../models/opciones"));
const getpreguntas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pregunta = yield sesion_cuestionario_1.default.findAll({
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
});
exports.getpreguntas = getpreguntas;
const savecuestionario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
exports.savecuestionario = savecuestionario;
