'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    
    const cuestionarioId = uuidv4();
    const seccion1 = uuidv4();
    const seccion2 = uuidv4();
    const seccion3 = uuidv4();
    const seccion4 = uuidv4();
    const seccion5 = uuidv4();
    const seccion6 = uuidv4();

    await queryInterface.bulkInsert('Cuestionarios', [{
      id: cuestionarioId,
      titulo: 'DIAGNÓSTICO PARA CONTRIBUIR A LA IGUALDAD DE GÉNERO EN EL PODER LEGISLATIVO DEL ESTADO DE MÉXICO',
      descripcion: 'GENERO 2025',
      createdAt: new Date(), 
      updatedAt: new Date()
    }], {});

    await queryInterface.bulkInsert('Seccions', [
      { id: seccion1, titulo: 'DATOS GENERALES ', id_cuestionario: cuestionarioId, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion2, titulo: 'AMBIENTE DE TRABAJO Y NO DISCRIMINACIÓN', id_cuestionario: cuestionarioId, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion3, titulo: 'CONDICIONES LABORALES Y DERECHOS', id_cuestionario: cuestionarioId, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion4, titulo: 'PERMANENCIA Y PROMOCIÓN ', id_cuestionario: cuestionarioId, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion5, titulo: 'CAPACITACIÓN Y SENSIBILIZACIÓN EN IGUALDAD', id_cuestionario: cuestionarioId, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion6, titulo: 'CORRESPONSABILIDAD ENTRE VIDA PERSONAL, FAMILIAR Y LABORAL', id_cuestionario: cuestionarioId, createdAt: new Date(), updatedAt: new Date()}
    ], {});


    await queryInterface.bulkInsert('Preguntas', [
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Sexo asignado al nacer', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Identidad de género', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Edad', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Estado civil o situación conyugal', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: '¿Vive con hijas/os o personas dependientes?', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: '¿Tiene alguna discapacidad?', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Antigüedad en el Poder Legislativo', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Nivel de puesto', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Tipo de contratación', tipo: '1', createdAt: new Date(), updatedAt: new Date()},

      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: 'Sexo asignado al nacer', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: 'Identidad de género', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: 'Edad', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: 'Estado civil o situación conyugal', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Vive con hijas/os o personas dependientes?', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Tiene alguna discapacidad?', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: 'Antigüedad en el Poder Legislativo', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: 'Nivel de puesto', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: 'Tipo de contratación', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
    ], {});

    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
