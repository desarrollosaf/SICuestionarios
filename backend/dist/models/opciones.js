"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../database/connection"));
class opciones extends sequelize_1.Model {
}
opciones.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    },
    id_preguntas: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    texto_opcion: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
}, {
    sequelize: connection_1.default,
    tableName: 'opciones',
    timestamps: false,
});
exports.default = opciones;
