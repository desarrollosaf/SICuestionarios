'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Crea el cuestionario "VF Diagnóstico 2026" como un cuestionario NUEVO (año 2026) y lo deja activo.
 * Los cuestionarios de otros años y sus respuestas NO se tocan: siguen disponibles en los reportes.
 *
 * Se puede volver a correr para corregir textos mientras nadie haya contestado el 2026:
 * si el 2026 ya existe y no tiene respuestas, se reemplazan sus secciones, preguntas y opciones.
 * Si ya tiene respuestas, se niega a correr.
 *
 * tipo: 'unica' (una opción) | 'multiple' (varias opciones)
 * Una opción llamada "Otro"/"Otra" muestra un campo de texto para especificar.
 */

const FRECUENCIA = ['Siempre', 'Frecuentemente', 'Algunas veces', 'Nunca'];
const FRECUENCIA_INV = ['Nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'];
const SI_NO = ['Sí', 'No'];
const NO_SI = ['No', 'Sí'];
const ANTIGUEDAD = ['Menos de 6 meses', 'De 6 meses a 1 año', 'De 1 a 3 años', 'De 3 a 6 años', 'De 6 a 10 años', 'Más de 10 años'];

// `clave` sólo sirve para referenciar condiciones dentro de este archivo
const SECCIONES = [
  {
    titulo: 'DATOS GENERALES',
    preguntas: [
      { texto: 'Sexo asignado al nacer', opciones: ['Mujer', 'Hombre'] },
      { texto: 'Identidad de género (opcional)', opciones: ['Mujer', 'Hombre', 'No binario / género neutro'], obligatoria: false },
      { texto: 'Edad', opciones: ['18 a 20 años', '21 a 30 años', '31 a 40 años', '41 a 50 años', '51 a 65 años', '66 años o más'] },
      { texto: 'Estado civil', opciones: ['Soltera(o)', 'Casada(o)', 'Concubinato', 'Viuda(o)'] },
      { texto: 'Antigüedad en el Poder Legislativo', opciones: ANTIGUEDAD },
      { texto: 'Antigüedad en su puesto actual', opciones: ANTIGUEDAD },
    ],
  },
  {
    titulo: 'AMBIENTE DE TRABAJO',
    preguntas: [
      { texto: '¿Considera que existe un ambiente de trabajo respetuoso y cordial en su espacio laboral?', opciones: FRECUENCIA },
      { texto: '¿Su jefa o jefe directo promueve la igualdad entre hombres y mujeres?', opciones: FRECUENCIA },
      { texto: '¿El trato entre personas de distinto sexo y cargo es respetuoso?', opciones: FRECUENCIA },
      { clave: 'discriminada', texto: '¿Ha sido discriminada(o) en su espacio de trabajo?', opciones: FRECUENCIA_INV },
      {
        texto: 'Si la respuesta de la pregunta anterior es frecuentemente o siempre, seleccione la causa que le represente: (Opcional)',
        opciones: ['Sexo', 'Edad', 'Discapacidad', 'Embarazo', 'Estado civil', 'Apariencia física', 'Orientación sexual', 'Identidad de género', 'Condición de salud', 'Otra'],
        tipo: 'multiple',
        obligatoria: false,
        condicion: { clave: 'discriminada', opciones: ['Frecuentemente', 'Siempre'] },
      },
      { texto: '¿Ha observado expresiones, prácticas o actitudes que favorezcan en mayor medida a un sexo en detrimento del otro?', opciones: FRECUENCIA_INV },
      { texto: '¿Se toma en cuenta por igual la opinión de hombres y mujeres?', opciones: FRECUENCIA },
      { texto: '¿Las responsabilidades laborales son asignadas con equidad entre hombres y mujeres?', opciones: FRECUENCIA },
      { texto: '¿Ha experimentado discriminación, violencia, hostigamiento laboral o acoso laboral en su espacio de trabajo?', opciones: FRECUENCIA_INV },
      { texto: '¿La autoridad de hombres y mujeres se respeta por igual?', opciones: FRECUENCIA },
    ],
  },
  {
    titulo: 'CONDICIONES LABORALES',
    preguntas: [
      { texto: '¿Conoce sus derechos y prestaciones laborales?', opciones: SI_NO },
      { texto: '¿Considera que en su lugar de trabajo se respetan sus derechos y prestaciones laborales?', opciones: SI_NO },
      { texto: '¿Considera que hombres y mujeres tienen las mismas condiciones laborales?', opciones: SI_NO },
      { texto: 'En su experiencia, ¿se toman en cuenta estereotipos de género al distribuir las actividades?', opciones: FRECUENCIA_INV },
    ],
  },
  {
    titulo: 'PERMANENCIA Y PROMOCIÓN',
    preguntas: [
      { texto: '¿Considera que el género influye en la posibilidad de ascender?', opciones: SI_NO },
      { texto: '¿Ha percibido que condiciones personales como: embarazo, tener hijas/os, o discapacidad han afectado la posibilidad de ascender?', opciones: FRECUENCIA_INV },
      { texto: '¿Ha tenido oportunidades de crecimiento o ascenso?', opciones: SI_NO },
      { texto: '¿Considera que la rotación de personal se da más en mujeres?', opciones: NO_SI },
    ],
  },
  {
    titulo: 'SENSIBILIZACIÓN Y CAPACITACIÓN',
    preguntas: [
      { texto: '¿La capacitación se ofrece por igual a hombres y mujeres?', opciones: FRECUENCIA },
      { texto: '¿Ha recibido formación en temas de igualdad de género?', opciones: SI_NO },
      { texto: '¿Las capacitaciones que ha recibido le han permitido reflexionar sobre sus actitudes?', opciones: ['Sí', 'Parcialmente', 'No'] },
      { texto: '¿Le interesa capacitarse en temas de derechos humanos y género?', opciones: SI_NO },
      { texto: '¿Cree que los temas de género son exclusivos para mujeres?', opciones: NO_SI },
    ],
  },
  {
    titulo: 'CORRESPONSABILIDAD ENTRE VIDA PERSONAL, FAMILIAR Y LABORAL',
    preguntas: [
      { clave: 'dependientes', texto: '¿Tiene bajo su cuidado a personas dependientes?', opciones: NO_SI },
      {
        texto: 'Si la respuesta de la pregunta anterior es Sí, seleccione la opción que le represente: (Opcional)',
        opciones: ['Niñas/os', 'Personas adultas mayores', 'Personas con discapacidad', 'Otro'],
        tipo: 'multiple',
        obligatoria: false,
        condicion: { clave: 'dependientes', opciones: ['Sí'] },
      },
      { texto: '¿En su trabajo le brindan las facilidades para atender asuntos personales, familiares o en su caso, de cuidado de personas dependientes?', opciones: SI_NO },
      { texto: '¿Ha faltado al trabajo porque se le negó permiso para atender asuntos personales?', opciones: SI_NO },
    ],
  },
];

const ANIO = 2026;
const TITULO = 'DIAGNÓSTICO PARA CONTRIBUIR A LA IGUALDAD DE GÉNERO EN EL PODER LEGISLATIVO DEL ESTADO DE MÉXICO 2026';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const ahora = new Date();

    await sequelize.transaction(async (transaction) => {
      const opts = { transaction };
      const [existentes] = await sequelize.query('SELECT id FROM cuestionarios WHERE anio = :anio', { replacements: { anio: ANIO }, ...opts });
      let idCuestionario;

      if (existentes.length) {
        idCuestionario = existentes[0].id;
        const [[{ total }]] = await sequelize.query(
          'SELECT COUNT(*) AS total FROM sesion_cuestionarios WHERE id_cuestionario = :id',
          { replacements: { id: idCuestionario }, ...opts }
        );
        if (Number(total) > 0) {
          throw new Error(`El cuestionario ${ANIO} ya tiene ${total} respuesta(s); no se puede reemplazar.`);
        }
        // Reemplaza sólo el contenido del 2026
        await sequelize.query(
          'DELETE o FROM opciones o JOIN preguntas p ON p.id = o.id_preguntas WHERE p.id_cuestionario = :id',
          { replacements: { id: idCuestionario }, ...opts }
        );
        await queryInterface.bulkDelete('preguntas', { id_cuestionario: idCuestionario }, opts);
        await queryInterface.bulkDelete('seccions', { id_cuestionario: idCuestionario }, opts);
        await queryInterface.bulkUpdate('cuestionarios', { titulo: TITULO, updatedAt: ahora }, { id: idCuestionario }, opts);
      } else {
        idCuestionario = uuidv4();
        await queryInterface.bulkInsert('cuestionarios', [{
          id: idCuestionario, titulo: TITULO, descripcion: `GENERO ${ANIO}`, anio: ANIO, activo: false, createdAt: ahora, updatedAt: ahora,
        }], opts);
      }

      // Sólo un cuestionario activo: el que contestan las personas
      await sequelize.query('UPDATE cuestionarios SET activo = (id = :id)', { replacements: { id: idCuestionario }, ...opts });

      const seccionesRows = [];
      const preguntasRows = [];
      const opcionesRows = [];
      // clave -> { id, opciones: { texto: id } } para resolver condiciones
      const porClave = {};

      SECCIONES.forEach((seccion, si) => {
        const idSeccion = uuidv4();
        seccionesRows.push({ id: idSeccion, id_cuestionario: idCuestionario, titulo: seccion.titulo, orden: si + 1, createdAt: ahora, updatedAt: ahora });

        seccion.preguntas.forEach((p, pi) => {
          const idPregunta = uuidv4();
          const idsOpciones = {};
          p.opciones.forEach((texto, oi) => {
            const idOpcion = uuidv4();
            idsOpciones[texto] = idOpcion;
            opcionesRows.push({ id: idOpcion, id_preguntas: idPregunta, texto_opcion: texto, orden: oi + 1, createdAt: ahora, updatedAt: ahora });
          });
          if (p.clave) porClave[p.clave] = { id: idPregunta, opciones: idsOpciones };

          let idCondicion = null;
          let opcionesCondicion = null;
          if (p.condicion) {
            const ref = porClave[p.condicion.clave];
            if (!ref) throw new Error(`Condición inválida: ${p.condicion.clave}`);
            idCondicion = ref.id;
            opcionesCondicion = JSON.stringify(p.condicion.opciones.map(t => {
              if (!ref.opciones[t]) throw new Error(`Opción "${t}" no existe en ${p.condicion.clave}`);
              return ref.opciones[t];
            }));
          }

          preguntasRows.push({
            id: idPregunta,
            id_cuestionario: idCuestionario,
            id_seccion: idSeccion,
            texto_pregunta: p.texto,
            tipo: p.tipo || 'unica',
            obligatoria: p.obligatoria !== false,
            id_pregunta_condicion: idCondicion,
            opciones_condicion: opcionesCondicion,
            orden: pi + 1,
            createdAt: ahora,
            updatedAt: ahora,
          });
        });
      });

      await queryInterface.bulkInsert('seccions', seccionesRows, opts);
      await queryInterface.bulkInsert('preguntas', preguntasRows, opts);
      await queryInterface.bulkInsert('opciones', opcionesRows, opts);
    });
  },

  async down(queryInterface) {
    // Quita el 2026 sólo si nadie lo ha contestado y reactiva el año anterior
    const sequelize = queryInterface.sequelize;
    await sequelize.transaction(async (transaction) => {
      const opts = { transaction };
      const [existentes] = await sequelize.query('SELECT id FROM cuestionarios WHERE anio = :anio', { replacements: { anio: ANIO }, ...opts });
      if (!existentes.length) return;
      const id = existentes[0].id;
      const [[{ total }]] = await sequelize.query('SELECT COUNT(*) AS total FROM sesion_cuestionarios WHERE id_cuestionario = :id', { replacements: { id }, ...opts });
      if (Number(total) > 0) throw new Error(`El cuestionario ${ANIO} ya tiene respuestas; no se elimina.`);
      await sequelize.query('DELETE o FROM opciones o JOIN preguntas p ON p.id = o.id_preguntas WHERE p.id_cuestionario = :id', { replacements: { id }, ...opts });
      await queryInterface.bulkDelete('preguntas', { id_cuestionario: id }, opts);
      await queryInterface.bulkDelete('seccions', { id_cuestionario: id }, opts);
      await queryInterface.bulkDelete('cuestionarios', { id }, opts);
      await sequelize.query('UPDATE cuestionarios SET activo = (anio = (SELECT m.anio FROM (SELECT MAX(anio) AS anio FROM cuestionarios) m))', opts);
    });
  }
};
