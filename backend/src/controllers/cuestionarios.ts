import { Request, Response } from "express"
import preguntas  from "../models/preguntas"
import opciones from "../models/opciones"
import seccion from "../models/secciones"
import sesion from "../models/sesion_cuestionario"
import respuestas from "../models/respuesta"
import sequelize from "../database/connection"

export const getpreguntas = async(req: Request, res: Response) : Promise<any> =>{
  try {
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
    } catch (error) {
        console.error('Error al obtener preguntas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
}

export const savecuestionario = async(req: Request, res: Response) : Promise<any> => {
    try {
        const { body } = req
        const arrayPreguntas = body.preguntas; 

        const idSesion = await sesion.create({
            "id_usuario": body.rfc,
            "fecha_registro": new Date
        });

        const respuestasArr = arrayPreguntas.map((item:{id_pregunta: string,id_respuesta: string}) => ({
            id_pregunta: item.id_pregunta,
            id_opcion: item.id_respuesta, 
            id_sesion: idSesion.id
        }))

        await sequelize.transaction(async (t) => {
            const respuestasSave = await respuestas.bulkCreate(respuestasArr);
        })

        return res.json({
        status: 200,
        msg: "Respuestas guardadas correctamente"
        });
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
        return res.status(500).json({ msg: 'Error interno del servidor'});
    }
}