'use strict';

/**
 * Permite definir desde la base:
 *  - si una pregunta es obligatoria u opcional
 *  - si sólo se muestra cuando en otra pregunta se eligió alguna opción (pregunta condicional)
 * El tipo de respuesta ('unica' | 'multiple') se guarda en la columna `tipo`, que ya existía.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('preguntas', 'obligatoria', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'tipo',
    });
    await queryInterface.addColumn('preguntas', 'id_pregunta_condicion', {
      type: Sequelize.UUID,
      allowNull: true,
      after: 'obligatoria',
    });
    // Arreglo JSON con los ids de las opciones de la pregunta condición que hacen visible esta pregunta
    await queryInterface.addColumn('preguntas', 'opciones_condicion', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'id_pregunta_condicion',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('preguntas', 'opciones_condicion');
    await queryInterface.removeColumn('preguntas', 'id_pregunta_condicion');
    await queryInterface.removeColumn('preguntas', 'obligatoria');
  }
};
