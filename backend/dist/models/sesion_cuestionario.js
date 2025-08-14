"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../database/connection"));
const preguntas_1 = __importDefault(require("./preguntas"));
class sesion extends sequelize_1.Model {
}
sesion.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    },
    id_cuestionario: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    titulo: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
}, {
    sequelize: connection_1.default,
    tableName: 'seccions',
    timestamps: false,
});
sesion.hasMany(preguntas_1.default, {
    foreignKey: "id_seccion", as: "m_preguntas"
});
exports.default = sesion;
