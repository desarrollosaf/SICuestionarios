"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const cuestionariosConnection_1 = __importDefault(require("../database/cuestionariosConnection"));
class respuestas extends sequelize_1.Model {
}
respuestas.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    id_sesion: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    id_pregunta: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    id_opcion: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    valor_texto: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
    valor_numero: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize: cuestionariosConnection_1.default,
    tableName: 'respuesta',
    timestamps: false,
});
exports.default = respuestas;
