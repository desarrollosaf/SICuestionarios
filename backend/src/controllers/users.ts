import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import  User  from '../models/saf/users'
import  UserBase  from '../models/user'
import SUsuario from '../models/saf/s_usuario'
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

export const ReadUser = async (req: Request, res: Response): Promise<any> => {
    const listUser = await User.findAll();
    return res.json({
        msg: `List de categoría encontrada exitosamenteeeee`,
        data: listUser
    });
}



export const LoginUser = async (req: Request, res: Response, next: NextFunction):  Promise<any> => {
    const { rfc, password } = req.body;
    let passwordValid = false;
    let user: any = null;
    let bandera = true;

    if (rfc.startsWith('GEN25')) {
        console.log('admin admin');
        bandera = false;
        user = await UserBase.findOne({ 
            where: { name: rfc },
        })
        if (!user) {
            return res.status(400).json({
                msg: `Usuario no existe con el rfc ${rfc}`
            })
        }
        passwordValid = await bcrypt.compare(password, user.password);
       

    }else{

        user = await User.findOne({ 
            where: { rfc: rfc },
        })
        if (!user) {
            return res.status(400).json({
                msg: `Usuario no existe con el rfc ${rfc}`
            })
        }

        const hash = user.password.replace(/^\$2y\$/, '$2b$');
        passwordValid = await bcrypt.compare(password, hash);

    }



    if (!passwordValid) {
        return res.status(402).json({
            msg: `Password Incorrecto => ${password}`
        })
    }

    const accessToken = jwt.sign(
        { rfc: rfc },
        process.env.SECRET_KEY || 'TSE-Poder-legislativo',
        { expiresIn: '2h' }
    );

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000,
        path: '/',
    });

    // Sólo se envían datos públicos, nunca el hash de la contraseña
    const userData = {
        rfc,
        nombre: await buscarNombre(rfc),
        email: user.email ?? null,
    };

    return res.json({ user: userData, bandera })
}

export const getCurrentUser = async (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
        rfc: user.rfc,
        nombre: await buscarNombre(user.rfc),
    });
};

// El nombre vive en s_usuario del SAF; los administradores usan su RFC sin el prefijo GEN25
const buscarNombre = async (rfc: string): Promise<string | null> => {
    if (!rfc) return null;
    const usuarioSaf = await SUsuario.findOne({
        where: { N_Usuario: rfc.replace(/^GEN25/, '') },
        attributes: ['Nombre'],
    });
    return usuarioSaf?.Nombre ?? null;
};

export const cerrarsesion = async (req: Request, res: Response):  Promise<any> => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return res.status(200).json({ message: 'Sesión cerrada' });
};








