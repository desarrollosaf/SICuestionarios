import { Request, Response } from "express"
import preguntas  from "../models/preguntas"

export const getpreguntas = async(req: Request, res: Response) =>{
    const pregunta = await preguntas.findAll()
    return res.json(pregunta);
}

