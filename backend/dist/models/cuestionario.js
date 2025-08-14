"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../database/connection"));
class cuestionarios extends sequelize_1.Model {
}
cuestionarios.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    },
    titulo: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
    descripcion: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
}, {
    sequelize: connection_1.default,
    tableName: 'cuestionarios',
    timestamps: false,
});
exports.default = cuestionarios;
