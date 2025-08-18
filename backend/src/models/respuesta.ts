import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';

import sequelize from '../database/cuestionariosConnection';

class respuestas extends Model<
  InferAttributes<respuestas>,
  InferCreationAttributes<respuestas>
> {
    declare id: CreationOptional<string>;
    declare id_sesion: string;
    declare id_pregunta: string;
    declare id_opcion: string;
    declare valor_texto?: string;
    declare valor_numero?: string;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare deletedAt?: Date;
}

respuestas.init(
    {
        id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
        },
        id_sesion: {
            type: DataTypes.UUID,
            allowNull: false
        },
        id_pregunta: {
            type: DataTypes.UUID,
            allowNull: false
        },
        id_opcion: {
            type: DataTypes.UUID,
            allowNull: false
        },
        valor_texto: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        valor_numero: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
    },
    {
        sequelize,
        tableName: 'respuesta',
        timestamps: false,
    }
)

export default respuestas;