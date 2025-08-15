import { Request, Response } from "express"
import preguntas  from "../models/preguntas"
import sesiones  from "../models/sesion_cuestionario"
import opciones from "../models/opciones"


export const getpreguntas = async(req: Request, res: Response) : Promise<any> =>{
    const pregunta = await sesiones.findAll({
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

export const savecuestionario = async(req: Request, res:Request) => {
    
}