import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';

import sequelize from '../database/cuestionariosConnection';

class cuestionarios extends Model<
  InferAttributes<cuestionarios>,
  InferCreationAttributes<cuestionarios>
> {
    declare id: string;
    declare titulo: string;
    declare descripcion?: string;
    declare anio: number;
    declare activo: boolean; // el que contestan las personas
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare deletedAt?: Date;
}

cuestionarios.init(
    {
        id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
        },
        titulo: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        descripcion: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        anio: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
    },
    {
        sequelize,
        tableName: 'cuestionarios',
        timestamps: false,
    }
)

export default cuestionarios;