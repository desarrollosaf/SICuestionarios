// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

 const SECRET_KEY = process.env.SECRET_KEY || 'TSE-Poder-legislativo';

export interface JwtPayload {
    id: number;
    role: string;
}

// export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
//     const token = req.header('Authorization')?.replace('Bearer ', '');

//     if (!token) {
//         res.status(401).json({ msg: 'Token no proporcionado' });
//         return;
//     }

//     try {
//         const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
//         (req as any).user = decoded;
//         next();
//     } catch (err) {
//         res.status(401).json({ msg: 'Token inválido' });
//         return;
//     }
// };

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.accessToken;
  if (!token) {
    res.status(401).json({ msg: 'Token no proporcionado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token inválido' });
  }
};

// Sólo administradores (RFC con prefijo GEN25); usar después de verifyToken
export const soloAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const rfc: string = (req as any).user?.rfc || '';
  if (!rfc.startsWith('GEN25')) {
    res.status(403).json({ msg: 'No autorizado' });
    return;
  }
  next();
};
