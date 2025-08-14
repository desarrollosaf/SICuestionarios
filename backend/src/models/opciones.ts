import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';

import sequelize from '../database/connection';

class opciones extends Model<
  InferAttributes<opciones>,
  InferCreationAttributes<opciones>
> {
    declare id: string;
    declare id_preguntas: string;
    declare texto_opcion?: string;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare deletedAt?: Date;
}

opciones.init(
    {
        id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
        },
        id_preguntas: {
            type: DataTypes.UUID,
            allowNull: false
        },
        texto_opcion: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
    },
    {
        sequelize,
        tableName: 'opciones',
        timestamps: false,
    }
)

export default opciones;