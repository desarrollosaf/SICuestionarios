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
exports.getRespuestasUsuario = exports.getExcel = exports.getExcelFaltantes = exports.getcuestionariosus = exports.gettotalesdep = exports.getcuestionariosdep = exports.getcuestionarios = exports.getanios = exports.savecuestionario = exports.getpreguntas = void 0;
const sequelize_1 = require("sequelize");
const preguntas_1 = __importDefault(require("../models/preguntas"));
const opciones_1 = __importDefault(require("../models/opciones"));
const secciones_1 = __importDefault(require("../models/secciones"));
const sesion_cuestionario_1 = __importDefault(require("../models/sesion_cuestionario"));
const respuesta_1 = __importDefault(require("../models/respuesta"));
const cuestionario_1 = __importDefault(require("../models/cuestionario"));
const t_dependencia_1 = __importDefault(require("../models/saf/t_dependencia"));
const s_usuario_1 = __importDefault(require("../models/saf/s_usuario"));
const t_direccion_1 = __importDefault(require("../models/saf/t_direccion"));
const t_departamento_1 = __importDefault(require("../models/saf/t_departamento"));
const cuestionariosConnection_1 = __importDefault(require("../database/cuestionariosConnection"));
const ExcelJS = require('exceljs');
const MAX_COMENTARIOS = 3000;
const MAX_OTRO = 255;
const PREGUNTA_SEXO = 'Sexo asignado al nacer';
// ---------- Utilidades por año ----------
/**
 * Cuestionario del año indicado; sin año, el activo (el que contestan las personas).
 * Los reportes reciben `anio` para consultar años anteriores.
 */
const obtenerCuestionario = (anio) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const n = Number(anio);
    if (anio !== undefined && anio !== null && anio !== '' && Number.isInteger(n)) {
        return cuestionario_1.default.findOne({ where: { anio: n } });
    }
    return (_a = (yield cuestionario_1.default.findOne({ where: { activo: true }, order: [['anio', 'DESC']] }))) !== null && _a !== void 0 ? _a : cuestionario_1.default.findOne({ order: [['anio', 'DESC']] });
});
const sinCuestionario = (res, anio) => res.status(404).json({ msg: anio ? `No existe un cuestionario del año ${anio}.` : 'No hay un cuestionario activo.' });
// Secciones, preguntas y opciones de un cuestionario, en orden
const estructuraCuestionario = (idCuestionario) => secciones_1.default.findAll({
    where: { id_cuestionario: idCuestionario },
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
        [{ model: preguntas_1.default, as: "m_preguntas" }, { model: opciones_1.default, as: "m_opciones" }, 'orden', 'asc'],
    ]
});
/**
 * Cuántas veces se eligió cada opción en un cuestionario, opcionalmente sólo entre ciertas
 * personas (RFC) y/o sólo entre quienes respondieron cierto sexo asignado al nacer.
 */
const conteoPorOpcion = (idCuestionario_1, ...args_1) => __awaiter(void 0, [idCuestionario_1, ...args_1], void 0, function* (idCuestionario, filtros = {}) {
    if (filtros.rfcs && !filtros.rfcs.length)
        return new Map();
    const condiciones = ['s.id_cuestionario = :id'];
    const replacements = { id: idCuestionario, preguntaSexo: PREGUNTA_SEXO };
    if (filtros.rfcs) {
        condiciones.push('s.id_usuario IN (:rfcs)');
        replacements.rfcs = filtros.rfcs;
    }
    if (filtros.genero) {
        condiciones.push(`s.id IN (
            SELECT r2.id_sesion FROM respuesta r2
            JOIN preguntas p2 ON p2.id = r2.id_pregunta
            JOIN opciones o2 ON o2.id = r2.id_opcion
            WHERE p2.id_cuestionario = :id AND p2.texto_pregunta = :preguntaSexo AND o2.texto_opcion = :genero
        )`);
        replacements.genero = filtros.genero;
    }
    const filas = yield cuestionariosConnection_1.default.query(`
        SELECT r.id_opcion, COUNT(*) AS total
        FROM respuesta r
        JOIN sesion_cuestionarios s ON s.id = r.id_sesion
        WHERE ${condiciones.join(' AND ')}
        GROUP BY r.id_opcion
    `, { replacements, type: sequelize_1.QueryTypes.SELECT });
    return new Map(filas.map(f => [f.id_opcion, Number(f.total)]));
});
// Mismo formato que consumen los reportes: secciones > preguntas > opciones con totalRespuestas
const resultadosCuestionario = (idCuestionario_1, ...args_1) => __awaiter(void 0, [idCuestionario_1, ...args_1], void 0, function* (idCuestionario, filtros = {}) {
    const [secciones, conteos] = yield Promise.all([
        estructuraCuestionario(idCuestionario),
        conteoPorOpcion(idCuestionario, filtros),
    ]);
    return secciones.map((sec) => ({
        idSeccion: sec.id,
        nombreSeccion: sec.titulo,
        ordenSeccion: sec.orden,
        preguntas: (sec.m_preguntas || []).map((preg) => ({
            idPregunta: preg.id,
            nombrePregunta: preg.texto_pregunta,
            ordenPregunta: preg.orden,
            tipo: preg.tipo,
            opciones: (preg.m_opciones || []).map((opc) => ({
                idOpcion: opc.id,
                nombreOpcion: opc.texto_opcion,
                ordenOpcion: opc.orden,
                totalRespuestas: conteos.get(opc.id) || 0
            }))
        }))
    }));
});
const rfcsDeDependencia = (idDependencia) => __awaiter(void 0, void 0, void 0, function* () {
    const usuarios = yield s_usuario_1.default.findAll({
        where: { id_Dependencia: idDependencia, Estado: 1 },
        attributes: ['N_Usuario'],
    });
    return usuarios.map(u => u.N_Usuario).filter(Boolean);
});
// ---------- Contestar el cuestionario (siempre el activo) ----------
const getpreguntas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const activo = yield obtenerCuestionario();
        if (!activo)
            return sinCuestionario(res);
        const registrado = yield sesion_cuestionario_1.default.findOne({
            where: { id_usuario: id, id_cuestionario: activo.id }
        });
        if (registrado) {
            return res.json({
                status: 300,
                fecha: registrado.fecha_registro
            });
        }
        const pregunta = yield estructuraCuestionario(activo.id);
        return res.json({
            data: pregunta,
            anio: activo.anio,
            titulo: activo.titulo,
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
        const { id } = req.params;
        const arrayPreguntas = body.resultados || [];
        const activo = yield obtenerCuestionario();
        if (!activo)
            return sinCuestionario(res);
        const registrado = yield sesion_cuestionario_1.default.findOne({
            where: { id_usuario: id, id_cuestionario: activo.id }
        });
        if (registrado) {
            return res.json({
                status: 300,
                fecha: registrado.fecha_registro
            });
        }
        const comentarios = (body.comentarios || '').trim();
        if (comentarios.length > MAX_COMENTARIOS) {
            return res.status(400).json({ msg: `Los comentarios no pueden pasar de ${MAX_COMENTARIOS} caracteres.` });
        }
        const otroLargo = arrayPreguntas.flat().some((obj) => ((obj === null || obj === void 0 ? void 0 : obj.otroValor) || '').length > MAX_OTRO);
        if (otroLargo) {
            return res.status(400).json({ msg: `El texto de "Otro" no puede pasar de ${MAX_OTRO} caracteres.` });
        }
        // Sólo se aceptan preguntas y opciones del cuestionario activo
        const validas = yield preguntas_1.default.findAll({
            where: { id_cuestionario: activo.id },
            attributes: ['id'],
            include: [{ model: opciones_1.default, as: 'm_preguntas', attributes: ['id'] }],
        });
        const opcionesValidas = new Map(validas.map((p) => [p.id, new Set((p.m_preguntas || []).map((o) => o.id))]));
        // Sesión y respuestas se guardan juntas: si algo falla no queda una sesión vacía
        // que impida a la persona volver a intentarlo
        yield cuestionariosConnection_1.default.transaction((t) => __awaiter(void 0, void 0, void 0, function* () {
            const idSesion = yield sesion_cuestionario_1.default.create({
                "id_cuestionario": activo.id,
                "id_usuario": id,
                "fecha_registro": new Date,
                "comentarios": comentarios || null
            }, { transaction: t });
            const respuestasArr = arrayPreguntas.flatMap((subarray) => subarray.flatMap(obj => {
                const elegidas = Array.isArray(obj.respuesta) ? obj.respuesta : obj.respuesta ? [obj.respuesta] : [];
                // Pregunta opcional o condicional sin responder: no se guarda nada
                return elegidas.map(rsp => {
                    var _a;
                    if (!((_a = opcionesValidas.get(obj.idPregunta)) === null || _a === void 0 ? void 0 : _a.has(rsp))) {
                        throw new Error(`Respuesta inválida para la pregunta ${obj.idPregunta}`);
                    }
                    return {
                        id_pregunta: obj.idPregunta,
                        id_opcion: rsp,
                        valor_texto: obj.otroValor,
                        id_sesion: idSesion.id
                    };
                });
            }));
            yield respuesta_1.default.bulkCreate(respuestasArr, { transaction: t });
        }));
        return res.json({
            status: 200
        });
    }
    catch (error) {
        console.error('Error al guardar respuestas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.savecuestionario = savecuestionario;
// ---------- Reportes (por año) ----------
// Años disponibles para los reportes, del más reciente al más antiguo
const getanios = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filas = yield cuestionariosConnection_1.default.query(`
            SELECT c.anio, c.titulo, c.activo, COUNT(DISTINCT s.id_usuario) AS personas
            FROM cuestionarios c
            LEFT JOIN sesion_cuestionarios s ON s.id_cuestionario = c.id
            WHERE c.anio IS NOT NULL AND c.deletedAt IS NULL
            GROUP BY c.id
            ORDER BY c.anio DESC
        `, { type: sequelize_1.QueryTypes.SELECT });
        return res.json({
            data: filas.map((f) => ({ anio: f.anio, titulo: f.titulo, activo: !!f.activo, personas: Number(f.personas) }))
        });
    }
    catch (error) {
        console.error('Error al consultar años:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getanios = getanios;
const getcuestionarios = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cuestionario = yield obtenerCuestionario(req.query.anio);
        if (!cuestionario)
            return sinCuestionario(res, req.query.anio);
        return res.json({
            data: yield resultadosCuestionario(cuestionario.id),
            anio: cuestionario.anio,
        });
    }
    catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getcuestionarios = getcuestionarios;
const getcuestionariosdep = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { body } = req;
        const cuestionario = yield obtenerCuestionario(body.anio);
        if (!cuestionario)
            return sinCuestionario(res, body.anio);
        const filtros = { genero: body.genero || null };
        if (body.id_dependencia != null) {
            filtros.rfcs = yield rfcsDeDependencia(body.id_dependencia);
        }
        return res.json({
            data: yield resultadosCuestionario(cuestionario.id, filtros),
            anio: cuestionario.anio,
        });
    }
    catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getcuestionariosdep = getcuestionariosdep;
// Personas que contestaron por dependencia y sexo asignado al nacer
const gettotalesdep = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cuestionario = yield obtenerCuestionario(req.query.anio);
        if (!cuestionario)
            return sinCuestionario(res, req.query.anio);
        const dependencias = yield t_dependencia_1.default.findAll({
            include: [
                {
                    "model": s_usuario_1.default,
                    "as": "m_usuarios",
                    attributes: ['N_Usuario'],
                    where: {
                        'Estado': 1
                    },
                }
            ]
        });
        // Sexo asignado al nacer de cada persona que contestó este cuestionario
        const sexos = yield cuestionariosConnection_1.default.query(`
            SELECT s.id_usuario, o.texto_opcion AS sexo
            FROM sesion_cuestionarios s
            JOIN respuesta r ON r.id_sesion = s.id
            JOIN preguntas p ON p.id = r.id_pregunta
            JOIN opciones o ON o.id = r.id_opcion
            WHERE s.id_cuestionario = :id AND p.texto_pregunta = :preguntaSexo
        `, { replacements: { id: cuestionario.id, preguntaSexo: PREGUNTA_SEXO }, type: sequelize_1.QueryTypes.SELECT });
        // Se cuentan registros (como siempre se ha hecho), para que coincida con los conteos por pregunta
        const data = dependencias.map((dep) => {
            const rfcs = new Set((dep.m_usuarios || []).map((us) => us.N_Usuario));
            const deLaDependencia = sexos.filter(s => rfcs.has(s.id_usuario));
            return {
                dependencia: dep.nombre_completo,
                mujeres: deLaDependencia.filter(s => s.sexo === 'Mujer').length,
                hombres: deLaDependencia.filter(s => s.sexo === 'Hombre').length,
            };
        });
        return res.json({
            data,
            anio: cuestionario.anio,
        });
    }
    catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.gettotalesdep = gettotalesdep;
// Servidores públicos que contestaron el cuestionario del año
const getcuestionariosus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cuestionario = yield obtenerCuestionario(req.query.anio);
        if (!cuestionario)
            return sinCuestionario(res, req.query.anio);
        const sesiones = yield sesion_cuestionario_1.default.findAll({
            where: { id_cuestionario: cuestionario.id },
            attributes: ['id_usuario'],
        });
        const rfcs = [...new Set(sesiones.map(rf => rf.id_usuario))];
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
            data: usuarios,
            anio: cuestionario.anio,
        });
    }
    catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
});
exports.getcuestionariosus = getcuestionariosus;
// Excel con el personal de una dependencia y si ya contestó el cuestionario del año
const getExcelFaltantes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { body } = req;
        const cuestionario = yield obtenerCuestionario(body.anio);
        if (!cuestionario)
            return sinCuestionario(res, body.anio);
        const usuarioCuestionario = yield sesion_cuestionario_1.default.findAll({
            where: { id_cuestionario: cuestionario.id },
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
        const usuariosConEstado = usuarioSaf.map(usuario => {
            var _a, _b;
            return ({
                N_usuario: usuario.N_Usuario,
                Nombre: usuario.Nombre,
                Respondio: idsRespondieron.has(usuario.N_Usuario) ? 'Sí' : 'No',
                Direccion: (_a = usuario.direccion) === null || _a === void 0 ? void 0 : _a.nombre_completo,
                Departamento: (_b = usuario.departamento) === null || _b === void 0 ? void 0 : _b.nombre_completo,
            });
        });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Usuarios ${cuestionario.anio}`);
        worksheet.columns = [
            { header: 'RFC', key: 'N_usuario', width: 20 },
            { header: 'Nombre', key: 'Nombre', width: 30 },
            { header: 'Direccion', key: 'Direccion', width: 30 },
            { header: 'Departamento', key: 'Departamento', width: 30 },
            { header: `Respondió ${cuestionario.anio}`, key: 'Respondio', width: 15 }
        ];
        usuariosConEstado.forEach(usuario => worksheet.addRow(usuario));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=usuarios_respondieron_${cuestionario.anio}.xlsx`);
        yield workbook.xlsx.write(res);
        res.end();
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error al generar el Excel');
    }
});
exports.getExcelFaltantes = getExcelFaltantes;
// Excel con el total de respuestas por opción del año
const getExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cuestionario = yield obtenerCuestionario(req.query.anio);
        if (!cuestionario)
            return sinCuestionario(res, req.query.anio);
        const resultado = yield resultadosCuestionario(cuestionario.id);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Datos ${cuestionario.anio}`);
        worksheet.columns = [
            { header: 'Sección', key: 'seccion', width: 30 },
            { header: 'Pregunta', key: 'pregunta', width: 30 },
            { header: 'Respuestas', key: 'respuesta', width: 30 },
            { header: 'Totales', key: 'total', width: 30 },
        ];
        resultado.forEach(sec => {
            sec.preguntas.forEach((preg) => {
                preg.opciones.forEach((opc) => {
                    worksheet.addRow({
                        seccion: sec.nombreSeccion,
                        pregunta: preg.nombrePregunta,
                        respuesta: opc.nombreOpcion,
                        total: opc.totalRespuestas
                    });
                });
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=datos_${cuestionario.anio}.xlsx`);
        yield workbook.xlsx.write(res);
        res.end();
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error al generar el Excel');
    }
});
exports.getExcel = getExcel;
// Respuestas de una persona en el cuestionario del año (para el PDF)
const getRespuestasUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { rfc } = req.params;
        const cuestionario = yield obtenerCuestionario(req.query.anio);
        if (!cuestionario)
            return sinCuestionario(res, req.query.anio);
        // Si quedó registrada más de una vez, se toma su primer registro
        const sesionUsuario = yield sesion_cuestionario_1.default.findOne({
            where: { id_usuario: rfc, id_cuestionario: cuestionario.id },
            order: [['fecha_registro', 'ASC']],
        });
        if (!sesionUsuario) {
            return res.status(404).json({ msg: `El usuario no contestó el cuestionario ${cuestionario.anio}` });
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
        const secciones = yield estructuraCuestionario(cuestionario.id);
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
                anio: cuestionario.anio,
                usuario: {
                    nombre: (_a = usuario === null || usuario === void 0 ? void 0 : usuario.Nombre) !== null && _a !== void 0 ? _a : null,
                    rfc,
                    dependencia: (_c = (_b = usuario === null || usuario === void 0 ? void 0 : usuario.dependencia) === null || _b === void 0 ? void 0 : _b.nombre_completo) !== null && _c !== void 0 ? _c : null,
                    direccion: (_e = (_d = usuario === null || usuario === void 0 ? void 0 : usuario.direccion) === null || _d === void 0 ? void 0 : _d.nombre_completo) !== null && _e !== void 0 ? _e : null,
                    departamento: (_g = (_f = usuario === null || usuario === void 0 ? void 0 : usuario.departamento) === null || _f === void 0 ? void 0 : _f.nombre_completo) !== null && _g !== void 0 ? _g : null,
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
