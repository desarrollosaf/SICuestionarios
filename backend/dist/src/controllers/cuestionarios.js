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
exports.getRespuestasUsuario = exports.getExcel = exports.getExcelFaltantes = exports.getcuestionariosus = exports.gettotalesdep = exports.getcuestionariosdep = exports.getcuestionarios = exports.savecuestionario = exports.getpreguntas = void 0;
const preguntas_1 = __importDefault(require("../models/preguntas"));
const opciones_1 = __importDefault(require("../models/opciones"));
const secciones_1 = __importDefault(require("../models/secciones"));
const sesion_cuestionario_1 = __importDefault(require("../models/sesion_cuestionario"));
const respuesta_1 = __importDefault(require("../models/respuesta"));
const t_dependencia_1 = __importDefault(require("../models/saf/t_dependencia"));
const s_usuario_1 = __importDefault(require("../models/saf/s_usuario"));
const t_direccion_1 = __importDefault(require("../models/saf/t_direccion"));
const t_departamento_1 = __importDefault(require("../models/saf/t_departamento"));
const cuestionariosConnection_1 = __importDefault(require("../database/cuestionariosConnection"));
const { Sequelize } = require('sequelize');
const ExcelJS = require('exceljs');
const getpreguntas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const registrado = yield sesion_cuestionario_1.default.findOne({
            where: {
                id_usuario: id
            }
        });
        if (registrado) {
            return res.json({
                status: 300,
                fecha: registrado.fecha_registro
            });
        }
        else {
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
    }
    catch (error) {
        console.error('Error al obtener preguntas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getpreguntas = getpreguntas;
const MAX_COMENTARIOS = 1000;
const MAX_OTRO = 255;
const savecuestionario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { body } = req;
        const { id } = req.params;
        const arrayPreguntas = body.resultados;
        // console.log(arrayPreguntas);
        const registrado = yield sesion_cuestionario_1.default.findOne({
            where: {
                id_usuario: id
            }
        });
        if (registrado) {
            return res.json({
                status: 300,
                fecha: registrado.fecha_registro
            });
        }
        else {
            const comentarios = (body.comentarios || '').trim();
            if (comentarios.length > MAX_COMENTARIOS) {
                return res.status(400).json({ msg: `Los comentarios no pueden pasar de ${MAX_COMENTARIOS} caracteres.` });
            }
            const otroLargo = arrayPreguntas.flat().some((obj) => ((obj === null || obj === void 0 ? void 0 : obj.otroValor) || '').length > MAX_OTRO);
            if (otroLargo) {
                return res.status(400).json({ msg: `El texto de "Otro" no puede pasar de ${MAX_OTRO} caracteres.` });
            }
            // Sesión y respuestas se guardan juntas: si algo falla no queda una sesión vacía
            // que impida a la persona volver a intentarlo
            yield cuestionariosConnection_1.default.transaction((t) => __awaiter(void 0, void 0, void 0, function* () {
                const idSesion = yield sesion_cuestionario_1.default.create({
                    "id_usuario": id,
                    "fecha_registro": new Date,
                    "comentarios": comentarios || null
                }, { transaction: t });
                const respuestasArr = arrayPreguntas.flatMap((subarray) => subarray.flatMap(obj => {
                    if (Array.isArray(obj.respuesta)) {
                        return obj.respuesta.map(rsp => ({
                            id_pregunta: obj.idPregunta,
                            id_opcion: rsp,
                            valor_texto: obj.otroValor,
                            id_sesion: idSesion.id
                        }));
                    }
                    else if (obj.respuesta) {
                        return [{
                                id_pregunta: obj.idPregunta,
                                id_opcion: obj.respuesta,
                                valor_texto: obj.otroValor,
                                id_sesion: idSesion.id
                            }];
                    }
                    // Pregunta opcional o condicional sin responder: no se guarda nada
                    return [];
                }));
                yield respuesta_1.default.bulkCreate(respuestasArr, { transaction: t });
            }));
            return res.json({
                status: 200
            });
        }
    }
    catch (error) {
        console.error('Error al guardar respuestas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.savecuestionario = savecuestionario;
const getcuestionarios = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pregunta = yield secciones_1.default.findAll({
        include: [
            {
                model: preguntas_1.default,
                as: "m_preguntas",
                include: [
                    {
                        model: opciones_1.default,
                        as: 'm_opciones',
                        include: [
                            {
                                model: respuesta_1.default,
                                as: 'm_respuestas',
                            }
                        ],
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
    const resultado = pregunta.map(sec => {
        const seccion = sec;
        return {
            idSeccion: sec.id,
            nombreSeccion: sec.titulo,
            ordenSeccion: sec.orden,
            preguntas: (seccion.m_preguntas || []).map((preg) => ({
                idPregunta: preg.id,
                nombrePregunta: preg.texto_pregunta,
                ordenPregunta: preg.orden,
                opciones: (preg.m_opciones || []).map((opc) => { var _a; return ({
                    idOpcion: opc.id,
                    nombreOpcion: opc.texto_opcion,
                    ordenOpcion: opc.orden,
                    totalRespuestas: (((_a = opc.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0)
                }); })
            }))
        };
    });
    return res.json({
        data: resultado
    });
});
exports.getcuestionarios = getcuestionarios;
const getcuestionariosdep = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { body } = req;
        if (body.id_dependencia != null && body.genero == null) {
            console.log("eentra uf  body.id_dependencia != null && body.genero == null ");
            const usersdep = yield s_usuario_1.default.findAll({
                where: {
                    id_Dependencia: body.id_dependencia,
                    Estado: 1
                },
                attributes: [
                    'N_Usuario'
                ],
            });
            const rfcs = usersdep.map(us => us.N_Usuario);
            const pregunta = yield secciones_1.default.findAll({
                include: [
                    {
                        model: preguntas_1.default,
                        as: "m_preguntas",
                        include: [
                            {
                                model: opciones_1.default,
                                as: 'm_opciones',
                                include: [
                                    {
                                        model: respuesta_1.default,
                                        as: 'm_respuestas',
                                        include: [
                                            {
                                                model: sesion_cuestionario_1.default,
                                                as: 'm_sesion',
                                                where: {
                                                    "id_usuario": rfcs
                                                }
                                            },
                                        ],
                                    },
                                ],
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
            const resultado = pregunta.map(sec => {
                const seccion = sec;
                return {
                    idSeccion: sec.id,
                    nombreSeccion: sec.titulo,
                    ordenSeccion: sec.orden,
                    preguntas: (seccion.m_preguntas || []).map((preg) => ({
                        idPregunta: preg.id,
                        nombrePregunta: preg.texto_pregunta,
                        ordenPregunta: preg.orden,
                        opciones: (preg.m_opciones || []).map((opc) => { var _a; return ({
                            idOpcion: opc.id,
                            nombreOpcion: opc.texto_opcion,
                            ordenOpcion: opc.orden,
                            totalRespuestas: (((_a = opc.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0)
                        }); })
                    }))
                };
            });
            return res.json({
                data: resultado
            });
        }
        else if (body.id_dependencia != null && body.genero != null) {
            const usersdep = yield s_usuario_1.default.findAll({
                where: {
                    id_Dependencia: body.id_dependencia,
                    Estado: 1
                },
                attributes: [
                    'N_Usuario'
                ],
            });
            const rfcs = usersdep.map(us => us.N_Usuario);
            const genero = yield preguntas_1.default.findAll({
                where: {
                    'texto_pregunta': 'Sexo asignado al nacer'
                },
                include: [
                    {
                        model: opciones_1.default,
                        as: "m_preguntas",
                        where: {
                            'texto_opcion': body.genero
                        }
                    }
                ],
            });
            const ids = genero.map((pre) => {
                return {
                    idPregunta: pre.id,
                    nombrePregunta: pre.texto_pregunta,
                    opciones: (pre.m_preguntas || []).map((opc) => ({
                        idOpcion: opc.id,
                        nombreOpcion: opc.texto_opcio
                    }))
                };
            });
            const cuestionariosvalidos = respuesta_1.default.findAll({
                where: {
                    'id_pregunta': ids[0].idPregunta,
                    'id_opcion': ids[0].opciones[0].idOpcion
                },
            });
            const idssesion = (yield cuestionariosvalidos).map(cus => cus.id_sesion);
            const pregunta = yield secciones_1.default.findAll({
                include: [
                    {
                        model: preguntas_1.default,
                        as: "m_preguntas",
                        include: [
                            {
                                model: opciones_1.default,
                                as: 'm_opciones',
                                include: [
                                    {
                                        model: respuesta_1.default,
                                        as: 'm_respuestas',
                                        include: [
                                            {
                                                model: sesion_cuestionario_1.default,
                                                as: 'm_sesion',
                                                where: {
                                                    "id_usuario": rfcs,
                                                    "id": idssesion
                                                }
                                            },
                                        ],
                                    },
                                ],
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
            const resultado = pregunta.map(sec => ({
                idSeccion: sec.id,
                nombreSeccion: sec.titulo,
                ordenSeccion: sec.orden,
                preguntas: (sec.m_preguntas || []).map((preg) => ({
                    idPregunta: preg.id,
                    nombrePregunta: preg.texto_pregunta,
                    ordenPregunta: preg.orden,
                    opciones: (preg.m_opciones || []).map((opc) => { var _a; return ({
                        idOpcion: opc.id,
                        nombreOpcion: opc.texto_opcion,
                        ordenOpcion: opc.orden,
                        totalRespuestas: (((_a = opc.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0)
                    }); })
                }))
            }));
            return res.json({
                data: resultado
            });
        }
        else if (body.id_dependencia == null && body.genero != null) {
            const genero = yield preguntas_1.default.findAll({
                where: {
                    'texto_pregunta': 'Sexo asignado al nacer'
                },
                include: [
                    {
                        model: opciones_1.default,
                        as: "m_preguntas",
                        where: {
                            'texto_opcion': body.genero
                        }
                    }
                ],
            });
            const ids = genero.map((pre) => ({
                idPregunta: pre.id,
                nombrePregunta: pre.texto_pregunta,
                opciones: pre.m_preguntas.map((opc) => ({
                    idOpcion: opc.id,
                    nombreOpcion: opc.texto_opcion
                }))
            }));
            const cuestionariosvalidos = respuesta_1.default.findAll({
                where: {
                    'id_pregunta': ids[0].idPregunta,
                    'id_opcion': ids[0].opciones[0].idOpcion
                },
            });
            const idssesion = (yield cuestionariosvalidos).map(cus => cus.id_sesion);
            const pregunta = yield secciones_1.default.findAll({
                include: [
                    {
                        model: preguntas_1.default,
                        as: "m_preguntas",
                        include: [
                            {
                                model: opciones_1.default,
                                as: 'm_opciones',
                                include: [
                                    {
                                        model: respuesta_1.default,
                                        as: 'm_respuestas',
                                        include: [
                                            {
                                                model: sesion_cuestionario_1.default,
                                                as: 'm_sesion',
                                                where: {
                                                    "id": idssesion
                                                }
                                            },
                                        ],
                                    },
                                ],
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
            const resultado = pregunta.map((sec) => ({
                idSeccion: sec.id,
                nombreSeccion: sec.titulo,
                ordenSeccion: sec.orden,
                preguntas: sec.m_preguntas.map((preg) => ({
                    idPregunta: preg.id,
                    nombrePregunta: preg.texto_pregunta,
                    ordenPregunta: preg.orden,
                    opciones: preg.m_opciones.map((opc) => { var _a; return ({
                        idOpcion: opc.id,
                        nombreOpcion: opc.texto_opcion,
                        ordenOpcion: opc.orden,
                        totalRespuestas: (((_a = opc.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0)
                    }); })
                }))
            }));
            return res.json({
                data: resultado
            });
        }
    }
    catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getcuestionariosdep = getcuestionariosdep;
const gettotalesdep = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dependencias = yield t_dependencia_1.default.findAll({
            include: [
                {
                    "model": s_usuario_1.default,
                    "as": "m_usuarios",
                    where: {
                        'Estado': 1
                    },
                }
            ]
        });
        const deps = dependencias.map((dep) => ({
            idDependencia: dep.id_Dependencia,
            nombreDep: dep.nombre_completo,
            usuarios: dep.m_usuarios.map((us) => us.N_Usuario)
        }));
        const mujer = yield preguntas_1.default.findAll({
            where: {
                'texto_pregunta': 'Sexo asignado al nacer'
            },
            include: [
                {
                    model: opciones_1.default,
                    as: "m_preguntas",
                    where: {
                        'texto_opcion': "Mujer"
                    }
                }
            ],
        });
        const hombre = yield preguntas_1.default.findAll({
            where: {
                'texto_pregunta': 'Sexo asignado al nacer'
            },
            include: [
                {
                    model: opciones_1.default,
                    as: "m_preguntas",
                    where: {
                        'texto_opcion': "Hombre"
                    }
                }
            ],
        });
        const idsMujeres = mujer.map((mj) => ({
            idPregunta: mj.id,
            opciones: mj.m_preguntas.map((opc) => ({
                idOpcion: opc.id,
            }))
        }));
        const idsHombres = hombre.map((hs) => ({
            idPregunta: hs.id,
            opciones: hs.m_preguntas.map((opc) => ({
                idOpcion: opc.id,
            }))
        }));
        let data = []; // Declaro fuera del ciclo
        for (const dep of deps) {
            if (dep.idDependencia == 1) {
                const safMujeres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsMujeres[0].idPregunta,
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const safHombres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsHombres[0].idPregunta,
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const totm = safMujeres.map((saf) => {
                    var _a;
                    totalMujeres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                const toth = safHombres.map(saf => {
                    var _a;
                    totalHombres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                data.push({
                    dependencia: dep.nombreDep,
                    mujeres: totm.length || 0,
                    hombres: toth.length || 0
                });
            }
            if (dep.idDependencia == 2) {
                const safMujeres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsMujeres[0].idPregunta,
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const safHombres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsHombres[0].idPregunta,
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const totm = safMujeres.map(saf => {
                    var _a;
                    totalMujeres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                const toth = safHombres.map(saf => {
                    var _a;
                    totalHombres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                data.push({
                    dependencia: dep.nombreDep,
                    mujeres: totm.length || 0,
                    hombres: toth.length || 0
                });
            }
            if (dep.idDependencia == 3) {
                const safMujeres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsMujeres[0].idPregunta,
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const safHombres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsHombres[0].idPregunta,
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const totm = safMujeres.map(saf => {
                    var _a;
                    totalMujeres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                const toth = safHombres.map(saf => {
                    var _a;
                    totalHombres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                data.push({
                    dependencia: dep.nombreDep,
                    mujeres: totm.length || 0,
                    hombres: toth.length || 0
                });
            }
            if (dep.idDependencia == 4) {
                const safMujeres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsMujeres[0].idPregunta,
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const safHombres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsHombres[0].idPregunta,
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const totm = safMujeres.map(saf => {
                    var _a;
                    totalMujeres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                const toth = safHombres.map(saf => {
                    var _a;
                    totalHombres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                data.push({
                    dependencia: dep.nombreDep,
                    mujeres: totm.length || 0,
                    hombres: toth.length || 0
                });
            }
            if (dep.idDependencia == 5) {
                const safMujeres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsMujeres[0].idPregunta,
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const safHombres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsHombres[0].idPregunta,
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const totm = safMujeres.map(saf => {
                    var _a;
                    totalMujeres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                const toth = safHombres.map(saf => {
                    var _a;
                    totalHombres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                data.push({
                    dependencia: dep.nombreDep,
                    mujeres: totm.length || 0,
                    hombres: toth.length || 0
                });
            }
            if (dep.idDependencia == 6) {
                const safMujeres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsMujeres[0].idPregunta,
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const safHombres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsHombres[0].idPregunta,
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const totm = safMujeres.map(saf => {
                    var _a;
                    totalMujeres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                const toth = safHombres.map(saf => {
                    var _a;
                    totalHombres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                data.push({
                    dependencia: dep.nombreDep,
                    mujeres: totm.length || 0,
                    hombres: toth.length || 0
                });
            }
            if (dep.idDependencia == 7) {
                const safMujeres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsMujeres[0].idPregunta,
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const safHombres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsHombres[0].idPregunta,
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const totm = safMujeres.map(saf => {
                    var _a;
                    totalMujeres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                const toth = safHombres.map(saf => {
                    var _a;
                    totalHombres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                data.push({
                    dependencia: dep.nombreDep,
                    mujeres: totm.length || 0,
                    hombres: toth.length || 0
                });
            }
            if (dep.idDependencia == 8) {
                const safMujeres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsMujeres[0].idPregunta,
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const safHombres = yield respuesta_1.default.findAll({
                    where: {
                        'id_pregunta': idsHombres[0].idPregunta,
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion_cuestionario_1.default,
                            as: 'm_sesion',
                            where: {
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                });
                const totm = safMujeres.map(saf => {
                    var _a;
                    totalMujeres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                const toth = safHombres.map(saf => {
                    var _a;
                    totalHombres: (((_a = saf.m_sesion) === null || _a === void 0 ? void 0 : _a.length) || 0);
                });
                data.push({
                    dependencia: dep.nombreDep,
                    mujeres: totm.length || 0,
                    hombres: toth.length || 0
                });
            }
        }
        return res.json({
            data: data
        });
    }
    catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.gettotalesdep = gettotalesdep;
const getcuestionariosus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cuestionarios = yield sesion_cuestionario_1.default.findAll();
        const rfcs = cuestionarios.map(rf => rf.id_usuario);
        const usuarios = yield s_usuario_1.default.findAll({
            where: {
                'N_Usuario': rfcs,
            },
            attributes: [
                'Nombre', 'N_Usuario'
            ],
            include: [
                {
                    "model": t_dependencia_1.default,
                    "as": "dependencia",
                    attributes: [
                        'nombre_completo'
                    ],
                },
                {
                    "model": t_direccion_1.default,
                    "as": "direccion",
                    attributes: [
                        'nombre_completo'
                    ],
                },
                {
                    "model": t_departamento_1.default,
                    "as": "departamento",
                    attributes: [
                        'nombre_completo'
                    ]
                }
            ]
        });
        return res.json({
            data: usuarios
        });
    }
    catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getcuestionariosus = getcuestionariosus;
const getExcelFaltantes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { body } = req;
        const usuarioCuestionario = yield sesion_cuestionario_1.default.findAll({
            attributes: [
                'id_usuario',
            ],
            raw: true
        });
        const usuarioSaf = yield s_usuario_1.default.findAll({
            where: {
                'id_Dependencia': body.id_dependencia,
                'Estado': 1
            },
            attributes: [
                'N_Usuario',
                'Nombre',
                'id_Dependencia',
                'id_Direccion',
                'Estado',
            ],
            include: [
                {
                    "model": t_dependencia_1.default,
                    "as": "dependencia",
                    attributes: [
                        'nombre_completo'
                    ],
                },
                {
                    "model": t_direccion_1.default,
                    "as": "direccion",
                    attributes: [
                        'nombre_completo'
                    ],
                },
                {
                    "model": t_departamento_1.default,
                    "as": "departamento",
                    attributes: [
                        'nombre_completo'
                    ]
                }
            ],
        });
        const idsRespondieron = new Set(usuarioCuestionario.map(u => u.id_usuario));
        const usuariosConEstado = usuarioSaf.map(usuario => { var _a, _b; return ({
            N_usuario: usuario.N_Usuario,
            Nombre: usuario.Nombre,
            Respondio: idsRespondieron.has(usuario.N_Usuario) ? 'Sí' : 'No',
            Direccion: (_a = usuario.direccion) === null || _a === void 0 ? void 0 : _a.nombre_completo,
            Departamento: (_b = usuario.departamento) === null || _b === void 0 ? void 0 : _b.nombre_completo,
        }); });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Usuarios');
        worksheet.columns = [
            { header: 'RFC', key: 'N_usuario', width: 20 },
            { header: 'Nombre', key: 'Nombre', width: 30 },
            { header: 'Direccion', key: 'Direccion', width: 30 },
            { header: 'Departamento', key: 'Departamento', width: 30 },
            { header: 'Respondió', key: 'Respondio', width: 15 }
        ];
        usuariosConEstado.forEach(usuario => worksheet.addRow(usuario));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=usuarios_no_respondieron.xlsx');
        yield workbook.xlsx.write(res);
        res.end();
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error al generar el Excel');
    }
});
exports.getExcelFaltantes = getExcelFaltantes;
const getExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Datos');
    const pregunta = yield secciones_1.default.findAll({
        include: [
            {
                model: preguntas_1.default,
                as: "m_preguntas",
                include: [
                    {
                        model: opciones_1.default,
                        as: 'm_opciones',
                        include: [
                            {
                                model: respuesta_1.default,
                                as: 'm_respuestas',
                            }
                        ],
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
    // Encabezados
    worksheet.columns = [
        { header: 'Sección', key: 'seccion', width: 30 },
        { header: 'Pregunta', key: 'pregunta', width: 30 },
        { header: 'Respuestas', key: 'respuesta', width: 30 },
        { header: 'Totales', key: 'total', width: 30 },
    ];
    pregunta.forEach((seccion) => {
        const nombreSeccion = seccion.titulo;
        (seccion.m_preguntas || []).forEach((pregunta) => {
            const nombrePregunta = pregunta.texto_pregunta;
            (pregunta.m_opciones || []).forEach((opcion) => {
                var _a;
                const nombreOpcion = opcion.texto_opcion;
                const totalRespuestas = ((_a = opcion.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0;
                // Agregar fila al Excel
                worksheet.addRow({
                    seccion: nombreSeccion,
                    pregunta: nombrePregunta,
                    respuesta: nombreOpcion,
                    total: totalRespuestas
                });
            });
        });
    });
    // Enviar el archivo como descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=datos.xlsx');
    yield workbook.xlsx.write(res);
    res.end();
    module.exports = { getExcel: exports.getExcel };
});
exports.getExcel = getExcel;
const getRespuestasUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    var _d, _e, _f, _g;
    try {
        const { rfc } = req.params;
        const sesionUsuario = yield sesion_cuestionario_1.default.findOne({
            where: { id_usuario: rfc }
        });
        if (!sesionUsuario) {
            return res.status(404).json({ msg: 'El usuario no ha contestado el cuestionario' });
        }
        const usuario = yield s_usuario_1.default.findOne({
            where: { N_Usuario: rfc },
            attributes: ['Nombre', 'N_Usuario'],
            include: [
                { model: t_dependencia_1.default, as: "dependencia", attributes: ['nombre_completo'] },
                { model: t_direccion_1.default, as: "direccion", attributes: ['nombre_completo'] },
                { model: t_departamento_1.default, as: "departamento", attributes: ['nombre_completo'] },
            ]
        });
        const respuestasUsuario = yield respuesta_1.default.findAll({
            where: { id_sesion: sesionUsuario.id },
            attributes: ['id_pregunta', 'id_opcion', 'valor_texto'],
        });
        const secciones = yield secciones_1.default.findAll({
            include: [
                {
                    model: preguntas_1.default,
                    as: "m_preguntas",
                    include: [{ model: opciones_1.default, as: 'm_opciones' }],
                },
            ],
            order: [
                ['orden', 'asc'],
                [{ model: preguntas_1.default, as: "m_preguntas" }, 'orden', 'asc'],
                [{ model: preguntas_1.default, as: "m_preguntas" },
                    { model: opciones_1.default, as: "m_opciones" }, 'orden', 'asc'],
            ]
        });
        const resultado = secciones.map(sec => {
            const s = sec;
            return {
                nombreSeccion: sec.titulo,
                preguntas: (s.m_preguntas || []).map((preg) => {
                    const delaPregunta = respuestasUsuario.filter(r => r.id_pregunta === preg.id);
                    const elegidas = (preg.m_opciones || []).filter((opc) => delaPregunta.some(r => r.id_opcion === opc.id));
                    // Una pregunta condicional no aplica si no se eligió ninguna de las opciones que la activan
                    let aplica = true;
                    if (preg.id_pregunta_condicion) {
                        const activadoras = JSON.parse(preg.opciones_condicion || '[]');
                        aplica = respuestasUsuario.some(r => r.id_pregunta === preg.id_pregunta_condicion && activadoras.includes(r.id_opcion));
                    }
                    return {
                        nombrePregunta: preg.texto_pregunta,
                        aplica,
                        respuestas: elegidas.map((opc) => {
                            var _a, _b;
                            // El texto libre sólo aplica a la opción "Otro"/"Otra"
                            const otro = /^otr[oa]$/i.test(((_a = opc.texto_opcion) === null || _a === void 0 ? void 0 : _a.trim()) || '')
                                ? (_b = delaPregunta.find(r => r.id_opcion === opc.id)) === null || _b === void 0 ? void 0 : _b.valor_texto
                                : null;
                            return otro ? `${opc.texto_opcion}: ${otro}` : opc.texto_opcion;
                        }),
                    };
                })
            };
        });
        return res.json({
            data: {
                usuario: {
                    nombre: (_d = usuario === null || usuario === void 0 ? void 0 : usuario.Nombre) !== null && _d !== void 0 ? _d : null,
                    rfc,
                    dependencia: (_e = (_a = usuario === null || usuario === void 0 ? void 0 : usuario.dependencia) === null || _a === void 0 ? void 0 : _a.nombre_completo) !== null && _e !== void 0 ? _e : null,
                    direccion: (_f = (_b = usuario === null || usuario === void 0 ? void 0 : usuario.direccion) === null || _b === void 0 ? void 0 : _b.nombre_completo) !== null && _f !== void 0 ? _f : null,
                    departamento: (_g = (_c = usuario === null || usuario === void 0 ? void 0 : usuario.departamento) === null || _c === void 0 ? void 0 : _c.nombre_completo) !== null && _g !== void 0 ? _g : null,
                },
                fechaRegistro: sesionUsuario.fecha_registro,
                comentarios: sesionUsuario.comentarios,
                secciones: resultado,
            }
        });
    }
    catch (error) {
        console.error('Error al consultar respuestas del usuario:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getRespuestasUsuario = getRespuestasUsuario;
