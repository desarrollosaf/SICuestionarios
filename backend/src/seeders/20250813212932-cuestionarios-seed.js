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


      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Considera que existe un ambiente de trabajo respetuoso y cordial en su espacio laboral?', tipo: '2', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Se jefa o jefe directo promueve la igualdad entre mujeres y hombres?', tipo: '2', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿El trato entre personas de distinto sexo o nivel jerárquico es equitativo y respetuoso?', tipo: '2', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Ha sido discriminada(o) por alguna de las siguientes razones? (marque todas las que apliquen)', tipo: '1', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Detecta expresiones, prácticas o actitudes que refuercen estereotipos de género?', tipo: '2', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Se toma en cuenta por igual la opinión de mujeres y hombres?', tipo: '2', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Las responsabilidades laborales son asignadas con equidad entre mujeres y hombres?', tipo: '2', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Ha experimentado maltrato, acoso o intimidación por razón de género?', tipo: '2', createdAt: new Date(), updatedAt: new Date()},
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿La autoridad de mujeres y hombres se respeta por igual?', tipo: '2', createdAt: new Date(), updatedAt: new Date()},


      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Conoce sus derechos laborales?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Conoce sus prestaciones laborales?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Percibe que las prestaciones se otorgan equitativamente entre mujeres y hombres?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Las condiciones laborales son equitativas para ambos sexos?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Percibe que características personales (edad, apariencia, etc.) influyen en el acceso a mejores condiciones?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Se asignan funciones con base en estereotipos de género?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },


      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Considera que el género influye en la posibilidad de ascender?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Ha notado mayor rotación o salida del personal femenino?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Su estado civil, embarazo o maternidad/paternidad han afectado su crecimiento profesional?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Se promueve la participación igualitaria para ocupar puestos de dirección?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Ha enfrentado obstáculos por motivos personales (embarazo, hijos/as, discapacidad, etc.) para ascender?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },

      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Ha recibido formación básica en temas de igualdad de género?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿La capacitación se ofrece por igual a mujeres y hombres?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Le interesa capacitarse en temas de género y derechos humanos?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Cree que los temas de género son exclusivos para mujeres?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Ha participado en cursos que promuevan la igualdad de género?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Las capacitaciones que ha recibido le han permitido reflexionar sobre sus actitudes?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },



      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Tiene bajo su cuidado a personas dependientes (niñas/os, adultos mayores, personas con discapacidad)?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Existe flexibilidad en su unidad administrativa para atender asuntos personales o familiares?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Ha faltado al trabajo porque se le negó un permiso por razones familiares?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Su horario laboral le permite equilibrar su vida personal y familiar?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Se le ha permitido realizar trabajo remoto o flexible para atender cuidados familiares?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Se agendan reuniones fuera del horario laboral?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Se le ha respetado su incapacidad por maternidad o licencia de paternidad?', tipo: '2', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Ha participado con su familia en actividades recreativas organizadas por el Poder Legislativo?', tipo: '2', createdAt: new Date(), updatedAt: new Date() }
      
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
