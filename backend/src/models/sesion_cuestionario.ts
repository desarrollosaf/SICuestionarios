import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';

import sequelize from '../database/connection';
import preguntas from './preguntas';
import opciones from './opciones';

class sesion extends Model<
  InferAttributes<sesion>,
  InferCreationAttributes<sesion>
> {
    declare id: string;
    declare id_cuestionario: string;
    declare titulo: string;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare deletedAt?: Date;
}

sesion.init(
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
         titulo: {
            type: DataTypes.STRING(255),
            allowNull: false
        }, 
    },
    {
        sequelize,
        tableName: 'seccions',
        timestamps: false,
    }
);

sesion.hasMany(preguntas,{
    foreignKey: "id_seccion", as: "m_preguntas"
});

preguntas.hasMany(opciones,{
    foreignKey: "id_preguntas", as: "m_opciones"
})



export default sesion;