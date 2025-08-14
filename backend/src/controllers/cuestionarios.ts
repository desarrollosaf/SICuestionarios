import { Request, Response } from "express"
import preguntas  from "../models/preguntas"
import sesiones  from "../models/sesion_cuestionario"
import opciones from "../models/opciones"

export const getpreguntas = async(req: Request, res: Response) =>{
    const pregunta = await sesiones.findAll({
        include:[
            {
                model: preguntas,
                as:"m_preguntas"
            }
        ]
    })
    return res.json(pregunta);
}

