import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';

import sequelize from '../database/cuestionariosConnection';
import preguntas from './preguntas';
import opciones from './opciones';

class sesion extends Model<
  InferAttributes<sesion>,
  InferCreationAttributes<sesion>
> {
    declare id: string;
    declare id_usuario: string;
    declare fecha_registro: string;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare deletedAt?: Date;
}

sesion.init(
    {
        id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: true,
        primaryKey: true
        },
        id_usuario: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        fecha_registro: {
            type: DataTypes.DATE,
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: 'sesion_cuestionarios',
        timestamps: false,
    }
);



export default sesion;