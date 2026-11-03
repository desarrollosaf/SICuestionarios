import { Request, Response } from "express"
import { QueryTypes } from "sequelize"
import preguntas from "../models/preguntas"
import opciones from "../models/opciones"
import seccion from "../models/secciones"
import sesion from "../models/sesion_cuestionario"
import respuestas from "../models/respuesta"
import cuestionarios from "../models/cuestionario"
import Dependencia from "../models/saf/t_dependencia"
import SUsuario from "../models/saf/s_usuario"
import Direccion from "../models/saf/t_direccion"
import Departamento from "../models/saf/t_departamento"
import sequelizeCuestionarios from "../database/cuestionariosConnection"
const ExcelJS = require('exceljs');

const MAX_COMENTARIOS = 3000;
const MAX_OTRO = 255;
const PREGUNTA_SEXO = 'Sexo asignado al nacer';

// ---------- Utilidades por año ----------

/**
 * Cuestionario del año indicado; sin año, el activo (el que contestan las personas).
 * Los reportes reciben `anio` para consultar años anteriores.
 */
const obtenerCuestionario = async (anio?: unknown) => {
    const n = Number(anio);
    if (anio !== undefined && anio !== null && anio !== '' && Number.isInteger(n)) {
        return cuestionarios.findOne({ where: { anio: n } });
    }
    return (await cuestionarios.findOne({ where: { activo: true }, order: [['anio', 'DESC']] }))
        ?? cuestionarios.findOne({ order: [['anio', 'DESC']] });
};

const sinCuestionario = (res: Response, anio?: unknown) =>
    res.status(404).json({ msg: anio ? `No existe un cuestionario del año ${anio}.` : 'No hay un cuestionario activo.' });

// Secciones, preguntas y opciones de un cuestionario, en orden
const estructuraCuestionario = (idCuestionario: string) => seccion.findAll({
    where: { id_cuestionario: idCuestionario },
    include: [
        {
            model: preguntas,
            as: "m_preguntas",
            include: [{ model: opciones, as: 'm_opciones' }],
        },
    ],
    order: [
        ['orden', 'asc'],
        [{ model: preguntas, as: "m_preguntas" }, 'orden', 'asc'],
        [{ model: preguntas, as: "m_preguntas" }, { model: opciones, as: "m_opciones" }, 'orden', 'asc'],
    ]
});

/**
 * Cuántas veces se eligió cada opción en un cuestionario, opcionalmente sólo entre ciertas
 * personas (RFC) y/o sólo entre quienes respondieron cierto sexo asignado al nacer.
 */
const conteoPorOpcion = async (idCuestionario: string, filtros: { rfcs?: string[]; genero?: string | null } = {}) => {
    if (filtros.rfcs && !filtros.rfcs.length) return new Map<string, number>();
    const condiciones = ['s.id_cuestionario = :id'];
    const replacements: any = { id: idCuestionario, preguntaSexo: PREGUNTA_SEXO };
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
    const filas = await sequelizeCuestionarios.query<{ id_opcion: string; total: number }>(`
        SELECT r.id_opcion, COUNT(*) AS total
        FROM respuesta r
        JOIN sesion_cuestionarios s ON s.id = r.id_sesion
        WHERE ${condiciones.join(' AND ')}
        GROUP BY r.id_opcion
    `, { replacements, type: QueryTypes.SELECT });
    return new Map(filas.map(f => [f.id_opcion, Number(f.total)]));
};

// Mismo formato que consumen los reportes: secciones > preguntas > opciones con totalRespuestas
const resultadosCuestionario = async (idCuestionario: string, filtros: { rfcs?: string[]; genero?: string | null } = {}) => {
    const [secciones, conteos] = await Promise.all([
        estructuraCuestionario(idCuestionario),
        conteoPorOpcion(idCuestionario, filtros),
    ]);
    return secciones.map((sec: any) => ({
        idSeccion: sec.id,
        nombreSeccion: sec.titulo,
        ordenSeccion: sec.orden,
        preguntas: (sec.m_preguntas || []).map((preg: any) => ({
            idPregunta: preg.id,
            nombrePregunta: preg.texto_pregunta,
            ordenPregunta: preg.orden,
            tipo: preg.tipo,
            opciones: (preg.m_opciones || []).map((opc: any) => ({
                idOpcion: opc.id,
                nombreOpcion: opc.texto_opcion,
                ordenOpcion: opc.orden,
                totalRespuestas: conteos.get(opc.id) || 0
            }))
        }))
    }));
};

const rfcsDeDependencia = async (idDependencia: unknown): Promise<string[]> => {
    const usuarios = await SUsuario.findAll({
        where: { id_Dependencia: idDependencia as any, Estado: 1 },
        attributes: ['N_Usuario'],
    });
    return usuarios.map(u => u.N_Usuario).filter(Boolean) as string[];
};

// ---------- Contestar el cuestionario (siempre el activo) ----------

export const getpreguntas = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params
        const activo = await obtenerCuestionario();
        if (!activo) return sinCuestionario(res);

        const registrado = await sesion.findOne({
            where: { id_usuario: id, id_cuestionario: activo.id }
        })
        if (registrado) {
            return res.json({
                status: 300,
                fecha: registrado.fecha_registro
            });
        }

        const pregunta = await estructuraCuestionario(activo.id);
        return res.json({
            data: pregunta,
            anio: activo.anio,
            titulo: activo.titulo,
        });
    } catch (error) {
        console.error('Error al obtener preguntas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

export const savecuestionario = async (req: Request, res: Response): Promise<any> => {
    try {
        const { body } = req
        const { id } = req.params
        const arrayPreguntas = body.resultados || [];
        const activo = await obtenerCuestionario();
        if (!activo) return sinCuestionario(res);

        const registrado = await sesion.findOne({
            where: { id_usuario: id, id_cuestionario: activo.id }
        })
        if (registrado) {
            return res.json({
                status: 300,
                fecha: registrado.fecha_registro
            });
        }

        const comentarios: string = (body.comentarios || '').trim();
        if (comentarios.length > MAX_COMENTARIOS) {
            return res.status(400).json({ msg: `Los comentarios no pueden pasar de ${MAX_COMENTARIOS} caracteres.` });
        }
        const otroLargo = arrayPreguntas.flat().some((obj: any) => (obj?.otroValor || '').length > MAX_OTRO);
        if (otroLargo) {
            return res.status(400).json({ msg: `El texto de "Otro" no puede pasar de ${MAX_OTRO} caracteres.` });
        }

        // Sólo se aceptan preguntas y opciones del cuestionario activo
        const validas = await preguntas.findAll({
            where: { id_cuestionario: activo.id },
            attributes: ['id'],
            include: [{ model: opciones, as: 'm_preguntas', attributes: ['id'] }],
        });
        const opcionesValidas = new Map(validas.map((p: any) => [p.id, new Set((p.m_preguntas || []).map((o: any) => o.id))]));

        // Sesión y respuestas se guardan juntas: si algo falla no queda una sesión vacía
        // que impida a la persona volver a intentarlo
        await sequelizeCuestionarios.transaction(async (t) => {
            const idSesion = await sesion.create({
                "id_cuestionario": activo.id,
                "id_usuario": id,
                "fecha_registro": new Date,
                "comentarios": comentarios || null
            }, { transaction: t });

            const respuestasArr = arrayPreguntas.flatMap((subarray: { idPregunta: string, respuesta: string | string[], otroValor: string }[]) =>
                subarray.flatMap(obj => {
                    const elegidas = Array.isArray(obj.respuesta) ? obj.respuesta : obj.respuesta ? [obj.respuesta] : [];
                    // Pregunta opcional o condicional sin responder: no se guarda nada
                    return elegidas.map(rsp => {
                        if (!opcionesValidas.get(obj.idPregunta)?.has(rsp)) {
                            throw new Error(`Respuesta inválida para la pregunta ${obj.idPregunta}`);
                        }
                        return {
                            id_pregunta: obj.idPregunta,
                            id_opcion: rsp,
                            valor_texto: obj.otroValor,
                            id_sesion: idSesion.id
                        };
                    });
                }))

            await respuestas.bulkCreate(respuestasArr, { transaction: t });
        });

        return res.json({
            status: 200
        });
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

// ---------- Reportes (por año) ----------

// Años disponibles para los reportes, del más reciente al más antiguo
export const getanios = async (req: Request, res: Response): Promise<any> => {
    try {
        const filas = await sequelizeCuestionarios.query(`
            SELECT c.anio, c.titulo, c.activo, COUNT(DISTINCT s.id_usuario) AS personas
            FROM cuestionarios c
            LEFT JOIN sesion_cuestionarios s ON s.id_cuestionario = c.id
            WHERE c.anio IS NOT NULL AND c.deletedAt IS NULL
            GROUP BY c.id
            ORDER BY c.anio DESC
        `, { type: QueryTypes.SELECT });
        return res.json({
            data: filas.map((f: any) => ({ anio: f.anio, titulo: f.titulo, activo: !!f.activo, personas: Number(f.personas) }))
        });
    } catch (error) {
        console.error('Error al consultar años:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

export const getcuestionarios = async (req: Request, res: Response): Promise<any> => {
    try {
        const cuestionario = await obtenerCuestionario(req.query.anio);
        if (!cuestionario) return sinCuestionario(res, req.query.anio);
        return res.json({
            data: await resultadosCuestionario(cuestionario.id),
            anio: cuestionario.anio,
        });
    } catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

export const getcuestionariosdep = async (req: Request, res: Response): Promise<any> => {
    try {
        const { body } = req
        const cuestionario = await obtenerCuestionario(body.anio);
        if (!cuestionario) return sinCuestionario(res, body.anio);

        const filtros: { rfcs?: string[]; genero?: string | null } = { genero: body.genero || null };
        if (body.id_dependencia != null) {
            filtros.rfcs = await rfcsDeDependencia(body.id_dependencia);
        }
        return res.json({
            data: await resultadosCuestionario(cuestionario.id, filtros),
            anio: cuestionario.anio,
        });
    } catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

// Personas que contestaron por dependencia y sexo asignado al nacer
export const gettotalesdep = async (req: Request, res: Response): Promise<any> => {
    try {
        const cuestionario = await obtenerCuestionario(req.query.anio);
        if (!cuestionario) return sinCuestionario(res, req.query.anio);

        const dependencias = await Dependencia.findAll({
            include: [
                {
                    "model": SUsuario,
                    "as": "m_usuarios",
                    attributes: ['N_Usuario'],
                    where: {
                        'Estado': 1
                    },
                }
            ]
        });

        // Sexo asignado al nacer de cada persona que contestó este cuestionario
        const sexos = await sequelizeCuestionarios.query<{ id_usuario: string; sexo: string }>(`
            SELECT s.id_usuario, o.texto_opcion AS sexo
            FROM sesion_cuestionarios s
            JOIN respuesta r ON r.id_sesion = s.id
            JOIN preguntas p ON p.id = r.id_pregunta
            JOIN opciones o ON o.id = r.id_opcion
            WHERE s.id_cuestionario = :id AND p.texto_pregunta = :preguntaSexo
        `, { replacements: { id: cuestionario.id, preguntaSexo: PREGUNTA_SEXO }, type: QueryTypes.SELECT });
        // Se cuentan registros (como siempre se ha hecho), para que coincida con los conteos por pregunta
        const data = dependencias.map((dep: any) => {
            const rfcs = new Set<string>((dep.m_usuarios || []).map((us: any) => us.N_Usuario));
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
    } catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

// Servidores públicos que contestaron el cuestionario del año
export const getcuestionariosus = async (req: Request, res: Response): Promise<any> => {
    try {
        const cuestionario = await obtenerCuestionario(req.query.anio);
        if (!cuestionario) return sinCuestionario(res, req.query.anio);

        const sesiones = await sesion.findAll({
            where: { id_cuestionario: cuestionario.id },
            attributes: ['id_usuario'],
        })
        const rfcs = [...new Set(sesiones.map(rf => rf.id_usuario))];

        const usuarios = await SUsuario.findAll({
            where: {
                'N_Usuario': rfcs,
            },
            attributes: [
                'Nombre', 'N_Usuario'
            ],
            include: [
                {
                    "model": Dependencia,
                    "as": "dependencia",
                    attributes: [
                        'nombre_completo'
                    ],
                },
                {
                    "model": Direccion,
                    "as": "direccion",
                    attributes: [
                        'nombre_completo'
                    ],
                },
                {
                    "model": Departamento,
                    "as": "departamento",
                    attributes: [
                        'nombre_completo'
                    ]
                }
            ]
        })

        return res.json({
            data: usuarios,
            anio: cuestionario.anio,
        });
    } catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

// Excel con el personal de una dependencia y si ya contestó el cuestionario del año
export const getExcelFaltantes = async (req: Request, res: Response): Promise<any> => {
    try {
        const { body } = req
        const cuestionario = await obtenerCuestionario(body.anio);
        if (!cuestionario) return sinCuestionario(res, body.anio);

        const usuarioCuestionario = await sesion.findAll({
            where: { id_cuestionario: cuestionario.id },
            attributes: [
                'id_usuario',
            ],
            raw: true
        });

        const usuarioSaf = await SUsuario.findAll({
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
                    "model": Dependencia,
                    "as": "dependencia",
                    attributes: [
                        'nombre_completo'
                    ],
                },
                {
                    "model": Direccion,
                    "as": "direccion",
                    attributes: [
                        'nombre_completo'
                    ],
                },
                {
                    "model": Departamento,
                    "as": "departamento",
                    attributes: [
                        'nombre_completo'
                    ]
                }
            ],
        });

        const idsRespondieron = new Set(usuarioCuestionario.map(u => u.id_usuario));
        const usuariosConEstado = usuarioSaf.map(usuario => ({
            N_usuario: usuario.N_Usuario,
            Nombre: usuario.Nombre,
            Respondio: idsRespondieron.has(usuario.N_Usuario as string) ? 'Sí' : 'No',
            Direccion: usuario.direccion?.nombre_completo,
            Departamento: usuario.departamento?.nombre_completo,
        }));

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

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=usuarios_respondieron_${cuestionario.anio}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al generar el Excel');
    }
}

// Excel con el total de respuestas por opción del año
export const getExcel = async (req: Request, res: Response): Promise<any> => {
    try {
        const cuestionario = await obtenerCuestionario(req.query.anio);
        if (!cuestionario) return sinCuestionario(res, req.query.anio);

        const resultado = await resultadosCuestionario(cuestionario.id);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Datos ${cuestionario.anio}`);

        worksheet.columns = [
            { header: 'Sección', key: 'seccion', width: 30 },
            { header: 'Pregunta', key: 'pregunta', width: 30 },
            { header: 'Respuestas', key: 'respuesta', width: 30 },
            { header: 'Totales', key: 'total', width: 30 },
        ];

        resultado.forEach(sec => {
            sec.preguntas.forEach((preg: any) => {
                preg.opciones.forEach((opc: any) => {
                    worksheet.addRow({
                        seccion: sec.nombreSeccion,
                        pregunta: preg.nombrePregunta,
                        respuesta: opc.nombreOpcion,
                        total: opc.totalRespuestas
                    });
                });
            });
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename=datos_${cuestionario.anio}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al generar el Excel');
    }
}

// Respuestas de una persona en el cuestionario del año (para el PDF)
export const getRespuestasUsuario = async (req: Request, res: Response): Promise<any> => {
    try {
        const { rfc } = req.params
        const cuestionario = await obtenerCuestionario(req.query.anio);
        if (!cuestionario) return sinCuestionario(res, req.query.anio);

        // Si quedó registrada más de una vez, se toma su primer registro
        const sesionUsuario = await sesion.findOne({
            where: { id_usuario: rfc, id_cuestionario: cuestionario.id },
            order: [['fecha_registro', 'ASC']],
        })
        if (!sesionUsuario) {
            return res.status(404).json({ msg: `El usuario no contestó el cuestionario ${cuestionario.anio}` });
        }

        const usuario = await SUsuario.findOne({
            where: { N_Usuario: rfc },
            attributes: ['Nombre', 'N_Usuario'],
            include: [
                { model: Dependencia, as: "dependencia", attributes: ['nombre_completo'] },
                { model: Direccion, as: "direccion", attributes: ['nombre_completo'] },
                { model: Departamento, as: "departamento", attributes: ['nombre_completo'] },
            ]
        }) as any

        const respuestasUsuario = await respuestas.findAll({
            where: { id_sesion: sesionUsuario.id },
            attributes: ['id_pregunta', 'id_opcion', 'valor_texto'],
        })

        const secciones = await estructuraCuestionario(cuestionario.id);

        const resultado = secciones.map(sec => {
            const s = sec as any;
            return {
                nombreSeccion: sec.titulo,
                preguntas: (s.m_preguntas || []).map((preg: any) => {
                    const delaPregunta = respuestasUsuario.filter(r => r.id_pregunta === preg.id);
                    const elegidas = (preg.m_opciones || []).filter((opc: any) =>
                        delaPregunta.some(r => r.id_opcion === opc.id)
                    );
                    // Una pregunta condicional no aplica si no se eligió ninguna de las opciones que la activan
                    let aplica = true;
                    if (preg.id_pregunta_condicion) {
                        const activadoras: string[] = JSON.parse(preg.opciones_condicion || '[]');
                        aplica = respuestasUsuario.some(r =>
                            r.id_pregunta === preg.id_pregunta_condicion && activadoras.includes(r.id_opcion)
                        );
                    }
                    return {
                        nombrePregunta: preg.texto_pregunta,
                        aplica,
                        respuestas: elegidas.map((opc: any) => {
                            // El texto libre sólo aplica a la opción "Otro"/"Otra"
                            const otro = /^otr[oa]$/i.test(opc.texto_opcion?.trim() || '')
                                ? delaPregunta.find(r => r.id_opcion === opc.id)?.valor_texto
                                : null;
                            return otro ? `${opc.texto_opcion}: ${otro}` : opc.texto_opcion;
                        }),
                    };
                })
            }
        });

        return res.json({
            data: {
                anio: cuestionario.anio,
                usuario: {
                    nombre: usuario?.Nombre ?? null,
                    rfc,
                    dependencia: usuario?.dependencia?.nombre_completo ?? null,
                    direccion: usuario?.direccion?.nombre_completo ?? null,
                    departamento: usuario?.departamento?.nombre_completo ?? null,
                },
                fechaRegistro: sesionUsuario.fecha_registro,
                comentarios: sesionUsuario.comentarios,
                secciones: resultado,
            }
        });
    } catch (error) {
        console.error('Error al consultar respuestas del usuario:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}
