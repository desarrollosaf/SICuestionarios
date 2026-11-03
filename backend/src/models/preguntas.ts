import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';

import sequelize from '../database/cuestionariosConnection';
import opciones from './opciones';
import respuestas from './respuesta';

class preguntas extends Model<
  InferAttributes<preguntas>,
  InferCreationAttributes<preguntas>
> {
    declare id: string;
    declare id_cuestionario: string;
    declare id_seccion: string;
    declare texto_pregunta?: string;
    declare tipo?: string; // 'unica' | 'multiple'
    declare obligatoria?: boolean;
    declare id_pregunta_condicion?: string | null;
    declare opciones_condicion?: string | null; // JSON con ids de opciones
    declare orden?: number;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare deletedAt?: Date;

    declare m_preguntas?: opciones[];
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
        obligatoria: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        // Pregunta que debe responderse con alguna de `opciones_condicion` para mostrar ésta
        id_pregunta_condicion: {
            type: DataTypes.UUID,
            allowNull: true
        },
        opciones_condicion: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        orden: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    },
    {
        sequelize,
        tableName: 'preguntas',
        timestamps: false,
    }
)

preguntas.hasMany(opciones,{
    foreignKey: "id_preguntas", as: "m_preguntas"
})


export default preguntas;