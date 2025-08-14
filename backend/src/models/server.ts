import express, {Application} from 'express'
import cors from 'cors'
import UsersSafs from '../models/saf/users';

class Server {

    private app: Application
    private port: string
    

    constructor(){
        this.app = express()
        this.port = process.env.PORT || '3003'
        this.listen();
        this.midlewares();
        this.router();
        this.DBconnetc();
        
    }

    listen(){
        this.app.listen(this.port, () => {
            console.log("La aplicación se esta corriendo exitosamente en el puerto => "+ this.port)           
        })
    }

    router(){

    }

    
    midlewares(){
        this.app.use(express.json())
        this.app.use(cors())
    }

    async DBconnetc(){
        try {
            await UsersSafs.sync();
            console.log("Conexion de DB exitoso");

        } catch (error) {
            console.log("Conexion de DB errorena => "+error);
            
        }
    }

    
}


export default Server