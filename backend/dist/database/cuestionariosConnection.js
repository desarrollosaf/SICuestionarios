"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
/* const sequelizeCuestionarios = new Sequelize('cuestionarios', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '-06:00', // hora del centro de México
    define: {
        freezeTableName: true
    }
}) */
const sequelizeCuestionarios = new sequelize_1.Sequelize('adminplem_generoCuestionario', 'usr_genero', 'XenCoItYEywGdD1', {
    host: '192.168.36.53',
    dialect: 'mysql',
    timezone: '-06:00', // hora del centro de México
    define: {
        freezeTableName: true
    }
});
exports.default = sequelizeCuestionarios;
