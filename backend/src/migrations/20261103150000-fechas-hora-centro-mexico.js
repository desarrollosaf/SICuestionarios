'use strict';

/**
 * Hasta ahora Sequelize guardaba las fechas en UTC (6 horas adelante de la hora del centro de México).
 * Desde esta versión las conexiones usan timezone '-06:00', así que las fechas ya guardadas
 * se recorren 6 horas para que queden en hora del centro de México.
 * (México dejó el horario de verano en octubre de 2022, así que la diferencia es fija.)
 */
const columnasFecha = async (queryInterface) => {
  const [columnas] = await queryInterface.sequelize.query(`
    SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND DATA_TYPE IN ('datetime', 'timestamp')
      AND TABLE_NAME <> 'SequelizeMeta'
  `);
  return columnas;
};

const recorrer = async (queryInterface, horas) => {
  const columnas = await columnasFecha(queryInterface);
  const porTabla = {};
  for (const { tabla, columna } of columnas) (porTabla[tabla] ||= []).push(columna);

  await queryInterface.sequelize.transaction(async (transaction) => {
    for (const [tabla, cols] of Object.entries(porTabla)) {
      const sets = cols.map((c) => `\`${c}\` = \`${c}\` + INTERVAL ${horas} HOUR`).join(', ');
      await queryInterface.sequelize.query(`UPDATE \`${tabla}\` SET ${sets}`, { transaction });
    }
  });
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await recorrer(queryInterface, -6);
  },
  async down(queryInterface) {
    await recorrer(queryInterface, 6);
  },
};
