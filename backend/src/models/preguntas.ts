import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';

import sequelize from '../database/connection';

class preguntas extends Model<
  InferAttributes<preguntas>,
  InferCreationAttributes<preguntas>
> {
    declare id: string;
    declare id_cuestionario: string;
    declare id_seccion: string;
    declare texto_pregunta?: string;
    declare tipo?: string;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare deletedAt?: Date;
}

preguntas.init(
    {
        id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
        },
        id_cuestionario: {
            type: DataTypes.UUID,
            allowNull: false
        },
        id_seccion: {
            type: DataTypes.UUID,
            allowNull: false
        },
        texto_pregunta: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        tipo: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
    },
    {
        sequelize,
        tableName: 'preguntas',
        timestamps: false,
    }
)

export default preguntas;