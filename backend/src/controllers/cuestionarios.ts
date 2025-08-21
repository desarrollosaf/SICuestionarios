import { Request, Response } from "express"
import preguntas  from "../models/preguntas"
import opciones from "../models/opciones"
import seccion from "../models/secciones"
import sesion from "../models/sesion_cuestionario"
import respuestas from "../models/respuesta"
import sequelize from "../database/connection"
import { strict } from "assert"
import { col, fn, NUMBER, where } from "sequelize"
import Dependencia from "../models/saf/t_dependencia"
import SUsuario from "../models/saf/s_usuario"

export const getpreguntas = async(req: Request, res: Response) : Promise<any> =>{
  try {
    const { id } = req.params

    const registrado = await sesion.findOne({
        where: {
            id_usuario: id
        }
    })
        if(registrado){
            return res.json({
                status: 300,
                fecha: registrado.fecha_registro
            });
        }else{
                const pregunta = await seccion.findAll({
                include:[
                    {
                        model: preguntas,
                        as:"m_preguntas",
                        include: [
                            {
                            model: opciones,
                            as: 'm_opciones'
                            }, 
                        ],
                    },
                ], 
                order:[
                    ['orden', 'asc'], 
                    [{model:preguntas, as: "m_preguntas"}, 'orden', 'asc'],
                    [{model:preguntas, as: "m_preguntas"},
                    {model:opciones, as: "m_opciones"}, 'orden', 'asc'],
                ]
            })

            return res.json({
            data: pregunta
            });
        }
    } catch (error) {
        console.error('Error al obtener preguntas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

export const savecuestionario = async(req: Request, res: Response) : Promise<any> => {
    try {
        const { body } = req
        const { id } = req.params
        const arrayPreguntas = body.resultados; 
// console.log(arrayPreguntas);
        const registrado = await sesion.findOne({
                where: {
                    id_usuario: id
                }
            })
        if(registrado){
            return res.json({
                status: 300,
                fecha: registrado.fecha_registro
            });
        }else{
            const idSesion = await sesion.create({
                "id_usuario": id,
                "fecha_registro": new Date,
                "comentarios": body.comentarios 
            });

            const respuestasArr = arrayPreguntas.flatMap((subarray: [item:{idPregunta: string,respuesta: string, otroValor: string}])  =>
                subarray.flatMap(obj => {
                    if(Array.isArray(obj.respuesta)){
                        return obj.respuesta.map(rsp => ({
                            id_pregunta: obj.idPregunta,
                            id_opcion: rsp, 
                            valor_texto: obj.otroValor,
                            id_sesion: idSesion.id
                        }));
                    }else{
                        return [{
                            id_pregunta: obj.idPregunta,
                            id_opcion: obj.respuesta, 
                            valor_texto: obj.otroValor,
                        id_sesion: idSesion.id
                        }];
                    }
                }))

            await sequelize.transaction(async (t) => {
                const respuestasSave = await respuestas.bulkCreate(respuestasArr);
            })

            return res.json({
            status: 200
            });
        }
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor'});
    }
}

export const getcuestionarios = async(req: Request, res: Response) : Promise<any> => {
    const pregunta = await seccion.findAll({
        include:[
            {
                model: preguntas,
                as: "m_preguntas",
                include: [
                    {
                        model: opciones,
                        as: 'm_opciones',
                        include: [
                            {
                            model: respuestas,
                            as: 'm_respuestas',
                            }
                        ], 
                    }, 
                ],
            },
        ], 
        order:[
            ['orden', 'asc'], 
            [{model:preguntas, as: "m_preguntas"}, 'orden', 'asc'],
            [{model:preguntas, as: "m_preguntas"},
            {model:opciones, as: "m_opciones"}, 'orden', 'asc'],
        ]
    })
    
    const resultado = pregunta.map(sec => {
        const seccion = sec as any; 

        return {
            idSeccion: sec.id,
            nombreSeccion: sec.titulo,
            ordenSeccion: sec.orden,
            preguntas: (seccion.m_preguntas || []).map((preg: any) => ({
                idPregunta: preg.id,
                nombrePregunta: preg.texto_pregunta,
                ordenPregunta: preg.orden,
                opciones: (preg.m_opciones || []).map((opc: any) => ({
                    idOpcion: opc.id,
                    nombreOpcion: opc.texto_opcion,
                    ordenOpcion: opc.orden,
                    totalRespuestas: (opc.m_respuestas?.length || 0)
                }))
            }))
        }
    });

    return res.json({
        data: resultado
    });
}


export const getcuestionariosdep = async(req: Request, res: Response) : Promise<any> => {
    try {
        const { body } = req
        if( body.id_dependencia != null && body.genero == null){
            console.log("eentra uf  body.id_dependencia != null && body.genero == null ")
            const usersdep = await SUsuario.findAll({
                where: {
                    id_Dependencia: body.id_dependencia, 
                    Estado: 1
                },
                attributes: [
                    'N_Usuario'
                ],
            })
        
            const rfcs = usersdep.map(us =>  us.N_Usuario);
            
            const pregunta = await seccion.findAll({
                include:[
                    {
                        model: preguntas,
                        as:"m_preguntas",
                        include: [
                            {
                                model: opciones,
                                as: 'm_opciones',
                                include: [
                                    {
                                    model: respuestas,
                                    as: 'm_respuestas',
                                    include: [
                                        {
                                            model: sesion,
                                            as: 'm_sesion',
                                            where:{
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
                order:[
                    ['orden', 'asc'], 
                    [{model:preguntas, as: "m_preguntas"}, 'orden', 'asc'],
                    [{model:preguntas, as: "m_preguntas"},
                    {model:opciones, as: "m_opciones"}, 'orden', 'asc'],
                ]
            })

            const resultado = pregunta.map(sec => {
                const seccion = sec as any; 

                return {
                    idSeccion: sec.id,
                    nombreSeccion: sec.titulo,
                    ordenSeccion: sec.orden,
                    preguntas: (seccion.m_preguntas || []).map((preg: any) => ({
                    idPregunta: preg.id,
                    nombrePregunta: preg.texto_pregunta,
                    ordenPregunta: preg.orden,
                        opciones: (preg.m_opciones || []).map((opc: any) => ({
                            idOpcion: opc.id,
                            nombreOpcion: opc.texto_opcion,
                            ordenOpcion: opc.orden,
                            totalRespuestas: (opc.m_respuestas?.length || 0)
                        }))
                    }))
                }
            });
            
            return res.json({
                data: resultado
            });
        
        }else if( body.id_dependencia != null && body.genero != null){
            const usersdep = await SUsuario.findAll({
                where: {
                    id_Dependencia: body.id_dependencia, 
                    Estado: 1
                },
                attributes: [
                    'N_Usuario'
                ],
            })
        
            const rfcs = usersdep.map(us =>  us.N_Usuario);

            const genero = await preguntas.findAll({
                where:{
                    'texto_pregunta': 'Sexo asignado al nacer'
                },
                include: [
                    {
                        model: opciones,
                        as: "m_preguntas",
                        where:{
                            'texto_opcion': body.genero
                        }
                    }
                ],
            })

            const ids = genero.map((pre: preguntas) => {
                return {
                    idPregunta: pre.id,
                    nombrePregunta: pre.texto_pregunta,
                    opciones: (pre.m_preguntas || []).map((opc: any) => ({
                        idOpcion: opc.id,
                        nombreOpcion: opc.texto_opcio
                    }))
                }
            });


            const cuestionariosvalidos = respuestas.findAll({
                where:{
                    'id_pregunta': ids[0].idPregunta, 
                    'id_opcion': ids[0].opciones[0].idOpcion
                },
            })
        const idssesion = (await cuestionariosvalidos).map(cus =>  cus.id_sesion);

            const pregunta = await seccion.findAll({
                include:[
                    {
                        model: preguntas,
                        as:"m_preguntas",
                        include: [
                            {
                                model: opciones,
                                as: 'm_opciones',
                                include: [
                                    {
                                    model: respuestas,
                                    as: 'm_respuestas',
                                    include: [
                                        {
                                            model: sesion,
                                            as: 'm_sesion',
                                            where:{
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
                order:[
                    ['orden', 'asc'], 
                    [{model:preguntas, as: "m_preguntas"}, 'orden', 'asc'],
                    [{model:preguntas, as: "m_preguntas"},
                    {model:opciones, as: "m_opciones"}, 'orden', 'asc'],
                ]
            })

    
            const resultado = pregunta.map(sec => ({
                idSeccion: sec.id,
                nombreSeccion: sec.titulo,
                ordenSeccion: sec.orden,
                preguntas: (sec.m_preguntas || []).map((preg: any) => ({
                    idPregunta: preg.id,
                    nombrePregunta: preg.texto_pregunta,
                    ordenPregunta: preg.orden,
                opciones: (preg.m_opciones || []).map((opc: any) => ({
                    idOpcion: opc.id,
                    nombreOpcion: opc.texto_opcion,
                    ordenOpcion: opc.orden,
                    totalRespuestas: (opc.m_respuestas?.length || 0)
                    }))
                }))
            }));

            return res.json({
                data: resultado
            });
        }else if( body.id_dependencia == null && body.genero != null){
        
            const genero = await preguntas.findAll({
                where:{
                    'texto_pregunta': 'Sexo asignado al nacer'
                },
                include: [
                    {
                        model: opciones,
                        as: "m_preguntas",
                        where:{
                            'texto_opcion': body.genero
                        }
                    }
                ],
            })

            const ids = genero.map((pre: any) =>  ({
                idPregunta: pre.id,
                nombrePregunta: pre.texto_pregunta,
                opciones: pre.m_preguntas.map((opc: any) => ({
                        idOpcion: opc.id,
                        nombreOpcion: opc.texto_opcion
                }))
            }));

            const cuestionariosvalidos = respuestas.findAll({
                where:{
                    'id_pregunta': ids[0].idPregunta, 
                    'id_opcion': ids[0].opciones[0].idOpcion
                },
            })
            const idssesion = (await cuestionariosvalidos).map(cus =>  cus.id_sesion);

            const pregunta = await seccion.findAll({
                include:[
                    {
                        model: preguntas,
                        as:"m_preguntas",
                        include: [
                            {
                                model: opciones,
                                as: 'm_opciones',
                                include: [
                                    {
                                    model: respuestas,
                                    as: 'm_respuestas',
                                    include: [
                                        {
                                            model: sesion,
                                            as: 'm_sesion',
                                            where:{
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
                order:[
                    ['orden', 'asc'], 
                    [{model:preguntas, as: "m_preguntas"}, 'orden', 'asc'],
                    [{model:preguntas, as: "m_preguntas"},
                    {model:opciones, as: "m_opciones"}, 'orden', 'asc'],
                ]
            })

    
            const resultado = pregunta.map((sec: any) => ({
            idSeccion: sec.id,
            nombreSeccion: sec.titulo,
            ordenSeccion: sec.orden,
            preguntas: sec.m_preguntas.map((preg: any) => ({
                idPregunta: preg.id,
                nombrePregunta: preg.texto_pregunta,
                ordenPregunta: preg.orden,
                opciones: preg.m_opciones.map((opc: any) => ({
                    idOpcion: opc.id,
                    nombreOpcion: opc.texto_opcion,
                    ordenOpcion: opc.orden,
                    totalRespuestas: (opc.m_respuestas?.length || 0)
                    }))
                }))
            }));

            return res.json({
                data: resultado
            });
        }
    } catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor'});
    }
}

export const gettotalesdep = async(req: Request, res: Response) : Promise<any> => {
    try {
        const dependencias = await Dependencia.findAll({
            include:[
                {
                    "model": SUsuario,
                    "as": "m_usuarios",
                    where:{
                        'Estado': 1
                    },
                }
            ]
        });

        const deps = dependencias.map((dep: any) => ({
            idDependencia: dep.id_Dependencia,
            nombreDep: dep.nombre_completo,
            usuarios:dep.m_usuarios.map((us: any) => us.N_Usuario)
        }))

    
        const mujer = await preguntas.findAll({
            where:{
                'texto_pregunta': 'Sexo asignado al nacer'
            },
            include: [
                {
                    model: opciones,
                    as: "m_preguntas",
                    where:{
                        'texto_opcion': "Mujer"
                    }
                }
            ],
        })

        const hombre = await preguntas.findAll({
            where:{
                'texto_pregunta': 'Sexo asignado al nacer'
            },
            include: [
                {
                    model: opciones,
                    as: "m_preguntas",
                    where:{
                        'texto_opcion': "Hombre"
                    }
                }
            ],
        })

        const idsMujeres = mujer.map((mj: any) =>  ({
            idPregunta: mj.id,
            opciones: mj.m_preguntas.map((opc: any) => ({
                    idOpcion: opc.id,
            }))
        }));

        const idsHombres = hombre.map((hs: any) =>  ({
            idPregunta: hs.id,
            opciones: hs.m_preguntas.map((opc: any) => ({
                    idOpcion: opc.id,
            }))
        }));

        let data = []; // Declaro fuera del ciclo

        for (const dep of deps) {
            if(dep.idDependencia == 1){
                const safMujeres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsMujeres[0].idPregunta, 
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const safHombres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsHombres[0].idPregunta, 
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const totm = safMujeres.map((saf: any) =>{
                    totalMujeres: (saf.m_sesion?.length || 0)
                })

                const toth = safHombres.map(saf =>{
                    totalHombres: (saf.m_sesion?.length || 0)
                })

                data.push(
                    {
                    dependencia: dep.nombreDep,
                    mujeres: totm.length  || 0,
                    hombres: toth.length || 0
                    }
                );
            }
            if(dep.idDependencia == 2){
                const safMujeres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsMujeres[0].idPregunta, 
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const safHombres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsHombres[0].idPregunta, 
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const totm = safMujeres.map(saf =>{
                    totalMujeres: (saf.m_sesion?.length || 0)
                })

                const toth = safHombres.map(saf =>{
                    totalHombres: (saf.m_sesion?.length || 0)
                })

                data.push(
                    {
                    dependencia: dep.nombreDep,
                    mujeres: totm.length  || 0,
                    hombres: toth.length || 0
                    }
                );
            }
            if(dep.idDependencia == 3){
                const safMujeres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsMujeres[0].idPregunta, 
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const safHombres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsHombres[0].idPregunta, 
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const totm = safMujeres.map(saf =>{
                    totalMujeres: (saf.m_sesion?.length || 0)
                })

                const toth = safHombres.map(saf =>{
                    totalHombres: (saf.m_sesion?.length || 0)
                })

                data.push(
                    {
                    dependencia: dep.nombreDep,
                    mujeres: totm.length  || 0,
                    hombres: toth.length || 0
                    }
                );
            }
            if(dep.idDependencia == 4){
                const safMujeres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsMujeres[0].idPregunta, 
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const safHombres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsHombres[0].idPregunta, 
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const totm = safMujeres.map(saf =>{
                    totalMujeres: (saf.m_sesion?.length || 0)
                })

                const toth = safHombres.map(saf =>{
                    totalHombres: (saf.m_sesion?.length || 0)
                })

               data.push(
                    {
                    dependencia: dep.nombreDep,
                    mujeres: totm.length  || 0,
                    hombres: toth.length || 0
                    }
                )
            }
            if(dep.idDependencia == 5){
                const safMujeres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsMujeres[0].idPregunta, 
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const safHombres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsHombres[0].idPregunta, 
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const totm = safMujeres.map(saf =>{
                    totalMujeres: (saf.m_sesion?.length || 0)
                })

                const toth = safHombres.map(saf =>{
                    totalHombres: (saf.m_sesion?.length || 0)
                })

                data.push(
                    {
                    dependencia: dep.nombreDep,
                    mujeres: totm.length  || 0,
                    hombres: toth.length || 0
                    }
                );
            }
            if(dep.idDependencia == 6){
                const safMujeres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsMujeres[0].idPregunta, 
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const safHombres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsHombres[0].idPregunta, 
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const totm = safMujeres.map(saf =>{
                    totalMujeres: (saf.m_sesion?.length || 0)
                })

                const toth = safHombres.map(saf =>{
                    totalHombres: (saf.m_sesion?.length || 0)
                })

                data.push(
                    {
                    dependencia: dep.nombreDep,
                    mujeres: totm.length  || 0,
                    hombres: toth.length || 0
                    }
                );
            }
            if(dep.idDependencia == 7){
                const safMujeres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsMujeres[0].idPregunta, 
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const safHombres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsHombres[0].idPregunta, 
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const totm = safMujeres.map(saf =>{
                    totalMujeres: (saf.m_sesion?.length || 0)
                })

                const toth = safHombres.map(saf =>{
                    totalHombres: (saf.m_sesion?.length || 0)
                })

                data.push(
                    {
                    dependencia: dep.nombreDep,
                    mujeres: totm.length  || 0,
                    hombres: toth.length || 0
                    }
                );
            }
            if(dep.idDependencia == 8){
                const safMujeres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsMujeres[0].idPregunta, 
                        'id_opcion': idsMujeres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const safHombres = await respuestas.findAll({
                    where:{
                        'id_pregunta': idsHombres[0].idPregunta, 
                        'id_opcion': idsHombres[0].opciones[0].idOpcion
                    },
                    include: [
                        {
                            model: sesion,
                            as: 'm_sesion',
                            where:{
                                "id_usuario": dep.usuarios
                            }
                        },
                    ],
                })

                const totm = safMujeres.map(saf =>{
                    totalMujeres: (saf.m_sesion?.length || 0)
                })

                const toth = safHombres.map(saf =>{
                    totalHombres: (saf.m_sesion?.length || 0)
                })

                data.push(
                    {
                    dependencia: dep.nombreDep,
                    mujeres: totm.length  || 0,
                    hombres: toth.length || 0
                    }
                );
            }
        }
        return res.json({
            data: data
        });
    } catch (error) {
        console.error('Error al generar consulta:', error);
        return res.status(500).json({ msg: 'Error interno del servidor'});
    }
}