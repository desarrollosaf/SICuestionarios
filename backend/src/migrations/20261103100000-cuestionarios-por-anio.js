'use strict';

/**
 * Permite tener un cuestionario por año y conservar los anteriores para los reportes:
 *  - cuestionarios.anio   año del diagnóstico (único)
 *  - cuestionarios.activo el que contestan las personas (sólo uno)
 *  - sesion_cuestionarios.id_cuestionario  a qué cuestionario pertenece cada respuesta
 *
 * Los datos existentes se conservan: el año se toma de la descripción ("GENERO 2025")
 * o, si no la trae, del año de creación; cada sesión se liga al cuestionario de sus respuestas.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const q = queryInterface.sequelize;

    await queryInterface.addColumn('cuestionarios', 'anio', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'descripcion',
    });
    await queryInterface.addColumn('cuestionarios', 'activo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'anio',
    });
    await q.query(`
      UPDATE cuestionarios
      SET anio = COALESCE(CAST(REGEXP_SUBSTR(descripcion, '[0-9]{4}') AS UNSIGNED), YEAR(createdAt))
      WHERE anio IS NULL
    `);
    // El más reciente queda como activo
    await q.query(`
      UPDATE cuestionarios c
      JOIN (SELECT MAX(anio) AS anio FROM cuestionarios) m ON m.anio = c.anio
      SET c.activo = 1
    `);
    await queryInterface.addIndex('cuestionarios', ['anio'], { unique: true, name: 'cuestionarios_anio_unico' });

    await queryInterface.addColumn('sesion_cuestionarios', 'id_cuestionario', {
      type: Sequelize.UUID,
      allowNull: true,
      after: 'id',
    });
    // Cada sesión pertenece al cuestionario de las preguntas que respondió
    await q.query(`
      UPDATE sesion_cuestionarios s
      JOIN (
        SELECT r.id_sesion, MIN(p.id_cuestionario) AS id_cuestionario
        FROM respuesta r
        JOIN preguntas p ON p.id = r.id_pregunta
        GROUP BY r.id_sesion
      ) x ON x.id_sesion = s.id
      SET s.id_cuestionario = x.id_cuestionario
      WHERE s.id_cuestionario IS NULL
    `);
    // Sesiones sin respuestas: al cuestionario del año en que se registraron (o al más antiguo)
    await q.query(`
      UPDATE sesion_cuestionarios s
      SET s.id_cuestionario = COALESCE(
        (SELECT c.id FROM cuestionarios c WHERE c.anio = YEAR(s.fecha_registro) LIMIT 1),
        (SELECT c.id FROM cuestionarios c ORDER BY c.anio LIMIT 1)
      )
      WHERE s.id_cuestionario IS NULL
    `);
    await queryInterface.addIndex('sesion_cuestionarios', ['id_cuestionario', 'id_usuario'], {
      name: 'sesion_cuestionario_usuario',
    });

    // Preguntas existentes: tipo explícito. Las "Si la respuesta de la pregunta anterior..."
    // eran de selección múltiple y opcionales.
    await q.query(`
      UPDATE preguntas SET tipo = 'multiple', obligatoria = 0
      WHERE texto_pregunta LIKE 'Si la respuesta de la pregunta anterior%'
    `);
    await q.query(`
      UPDATE preguntas SET tipo = 'unica'
      WHERE tipo IS NULL OR tipo NOT IN ('unica', 'multiple')
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('sesion_cuestionarios', 'sesion_cuestionario_usuario');
    await queryInterface.removeColumn('sesion_cuestionarios', 'id_cuestionario');
    await queryInterface.removeIndex('cuestionarios', 'cuestionarios_anio_unico');
    await queryInterface.removeColumn('cuestionarios', 'activo');
    await queryInterface.removeColumn('cuestionarios', 'anio');
  }
};
