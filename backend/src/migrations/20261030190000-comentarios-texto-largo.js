'use strict';

// Los comentarios adicionales pueden ser largos; varchar(255) no alcanzaba.
// Si la columna ya es de texto (text/mediumtext/longtext) no se toca, para no reducirla.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tabla = await queryInterface.describeTable('sesion_cuestionarios');
    const tipo = (tabla.comentarios?.type || '').toUpperCase();
    if (tipo.includes('TEXT')) return;
    await queryInterface.changeColumn('sesion_cuestionarios', 'comentarios', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down() {
    // No se regresa a varchar(255): truncaría comentarios existentes.
  }
};
