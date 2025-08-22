import { Sequelize } from "sequelize"

const sequelize = new Sequelize('adminplem_saf', 'usr_genero', 'XenCoItYEywGdD1', {
    host: '192.168.36.53',
    dialect: 'mysql',
    define: {
        freezeTableName: true 
    }
})
export default sequelize 
 