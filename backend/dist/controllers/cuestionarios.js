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
exports.gettotalesdep = exports.getcuestionariosdep = exports.getcuestionarios = exports.savecuestionario = exports.getpreguntas = void 0;
const preguntas_1 = __importDefault(require("../models/preguntas"));
const opciones_1 = __importDefault(require("../models/opciones"));
const secciones_1 = __importDefault(require("../models/secciones"));
const sesion_cuestionario_1 = __importDefault(require("../models/sesion_cuestionario"));
const respuesta_1 = __importDefault(require("../models/respuesta"));
const connection_1 = __importDefault(require("../database/connection"));
const t_dependencia_1 = __importDefault(require("../models/saf/t_dependencia"));
const s_usuario_1 = __importDefault(require("../models/saf/s_usuario"));
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
            const idSesion = yield sesion_cuestionario_1.default.create({
                "id_usuario": id,
                "fecha_registro": new Date,
                "comentarios": body.comentarios
            });
            const respuestasArr = arrayPreguntas.flatMap((subarray) => subarray.flatMap(obj => {
                if (Array.isArray(obj.respuesta)) {
                    return obj.respuesta.map(rsp => ({
                        id_pregunta: obj.idPregunta,
                        id_opcion: rsp,
                        valor_texto: obj.otroValor,
                        id_sesion: idSesion.id
                    }));
                }
                else {
                    return [{
                            id_pregunta: obj.idPregunta,
                            id_opcion: obj.respuesta,
                            valor_texto: obj.otroValor,
                            id_sesion: idSesion.id
                        }];
                }
            }));
            yield connection_1.default.transaction((t) => __awaiter(void 0, void 0, void 0, function* () {
                const respuestasSave = yield respuesta_1.default.bulkCreate(respuestasArr);
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
    const resultado = pregunta.map(sec => ({
        idSeccion: sec.id,
        nombreSeccion: sec.titulo,
        ordenSeccion: sec.orden,
        preguntas: sec.m_preguntas.map(preg => ({
            idPregunta: preg.id,
            nombrePregunta: preg.texto_pregunta,
            ordenPregunta: preg.orden,
            opciones: preg.m_opciones.map(opc => {
                var _a;
                return ({
                    idOpcion: opc.id,
                    nombreOpcion: opc.texto_opcion,
                    ordenOpcion: opc.orden,
                    totalRespuestas: (((_a = opc.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0)
                });
            })
        }))
    }));
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
            const resultado = pregunta.map(sec => ({
                idSeccion: sec.id,
                nombreSeccion: sec.titulo,
                ordenSeccion: sec.orden,
                preguntas: sec.m_preguntas.map(preg => ({
                    idPregunta: preg.id,
                    nombrePregunta: preg.texto_pregunta,
                    ordenPregunta: preg.orden,
                    opciones: preg.m_opciones.map(opc => {
                        var _a;
                        return ({
                            idOpcion: opc.id,
                            nombreOpcion: opc.texto_opcion,
                            ordenOpcion: opc.orden,
                            totalRespuestas: (((_a = opc.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0)
                        });
                    })
                }))
            }));
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
            const ids = genero.map(pre => ({
                idPregunta: pre.id,
                nombrePregunta: pre.texto_pregunta,
                opciones: pre.m_preguntas.map(opc => ({
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
                preguntas: sec.m_preguntas.map(preg => ({
                    idPregunta: preg.id,
                    nombrePregunta: preg.texto_pregunta,
                    ordenPregunta: preg.orden,
                    opciones: preg.m_opciones.map(opc => {
                        var _a;
                        return ({
                            idOpcion: opc.id,
                            nombreOpcion: opc.texto_opcion,
                            ordenOpcion: opc.orden,
                            totalRespuestas: (((_a = opc.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0)
                        });
                    })
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
            const ids = genero.map(pre => ({
                idPregunta: pre.id,
                nombrePregunta: pre.texto_pregunta,
                opciones: pre.m_preguntas.map(opc => ({
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
            const resultado = pregunta.map(sec => ({
                idSeccion: sec.id,
                nombreSeccion: sec.titulo,
                ordenSeccion: sec.orden,
                preguntas: sec.m_preguntas.map(preg => ({
                    idPregunta: preg.id,
                    nombrePregunta: preg.texto_pregunta,
                    ordenPregunta: preg.orden,
                    opciones: preg.m_opciones.map(opc => {
                        var _a;
                        return ({
                            idOpcion: opc.id,
                            nombreOpcion: opc.texto_opcion,
                            ordenOpcion: opc.orden,
                            totalRespuestas: (((_a = opc.m_respuestas) === null || _a === void 0 ? void 0 : _a.length) || 0)
                        });
                    })
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
        const deps = dependencias.map(dep => ({
            idDependencia: dep.id_Dependencia,
            nombreDep: dep.nombre_completo,
            usuarios: dep.m_usuarios.map(us => us.N_Usuario)
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
        const idsMujeres = mujer.map(mj => ({
            idPregunta: mj.id,
            opciones: mj.m_preguntas.map(opc => ({
                idOpcion: opc.id,
            }))
        }));
        const idsHombres = hombre.map(hs => ({
            idPregunta: hs.id,
            opciones: hs.m_preguntas.map(opc => ({
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
