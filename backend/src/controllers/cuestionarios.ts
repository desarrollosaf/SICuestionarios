import { Request, Response } from "express"
import preguntas  from "../models/preguntas"
import opciones from "../models/opciones"
import seccion from "../models/secciones"
import sesion from "../models/sesion_cuestionario"
import respuestas from "../models/respuesta"

export const getpreguntas = async(req: Request, res: Response) =>{

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
    return res.json(pregunta);
    } catch (error) {
            console.error('Error al obtener preguntas:', error);
            return res.status(500).json({ msg: 'Error interno del servidor' });
        }
}

export const savecuestionario = async(req: Request, res: Request) => {
    const { body } = req
    // console.log(body);
    const fechaActual = new Date();
    const fecha = fechaActual.toISOString().split('T')[0];
    const arrayPreguntas = body.preguntas; 

    // const idSesion = await sesion.create({
    //     "id_usuario": body.rfc,
    //     "fecha_registro": fecha
    // });
// console.log(idSesion)

//     const respuestas = arrayPreguntas.map((item:{id_pregunta: string,id_respuesta: string}) => ({
//             id_pregunta: item.id_pregunta,
//             id_opcion: item.id_respuesta, 
//             id_sesion: idSesion.id
//           }))
// console.log(respuestas)
//           await respuestas.bulkCreate(respuestas);

       




    // body.preguntas.forEach((pregunta, indice)=> {
         // await respuestas.create({
    //     "id_sesion": idSesion.id,
    //     "id_pregunta": body.id_pregunta,
    //     "id_opcion": body.id_opcion,
    //     "valor_texto": body.valor_texto
    // })
    // });
   
    return 1;
}