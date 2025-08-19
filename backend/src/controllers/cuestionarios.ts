import { Request, Response } from "express"
import preguntas  from "../models/preguntas"
import opciones from "../models/opciones"
import seccion from "../models/secciones"
import sesion from "../models/sesion_cuestionario"
import respuestas from "../models/respuesta"
import sequelize from "../database/connection"
import { strict } from "assert"

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
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor'});
    }
}