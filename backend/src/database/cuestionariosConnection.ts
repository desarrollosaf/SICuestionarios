import { Sequelize } from "sequelize"

const sequelizeCuestionarios = new Sequelize('adminplem_generoCuestionario', 'usr_genero', 'XenCoItYEywGdD1', {
    host: '192.168.36.53',
    dialect: 'mysql',
    define: {
        freezeTableName: true 
    }
})
export default sequelizeCuestionarios 
