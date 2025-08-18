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

    const idSexo = uuidv4();
    const idGenero = uuidv4();
    const idEdad = uuidv4();
    const idEstadoCivil = uuidv4();
    const idDependientes = uuidv4();
    const idDiscapacidad = uuidv4();
    const idAntigPL = uuidv4();
    const idNivelPuesto = uuidv4();
    const idContratacion = uuidv4();

    const idDiscriminacionSeccion2 = uuidv4();

    await queryInterface.bulkInsert('cuestionarios', [{
      id: cuestionarioId,
      titulo: 'DIAGNÓSTICO PARA CONTRIBUIR A LA IGUALDAD DE GÉNERO EN EL PODER LEGISLATIVO DEL ESTADO DE MÉXICO',
      descripcion: 'GENERO 2025',
      createdAt: new Date(), 
      updatedAt: new Date()
    }], {});

    await queryInterface.bulkInsert('seccions', [
      { id: seccion1, titulo: 'DATOS GENERALES ', id_cuestionario: cuestionarioId, orden: 1, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion2, titulo: 'AMBIENTE DE TRABAJO Y NO DISCRIMINACIÓN', id_cuestionario: cuestionarioId, orden: 2, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion3, titulo: 'CONDICIONES LABORALES Y DERECHOS', id_cuestionario: cuestionarioId, orden: 3, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion4, titulo: 'PERMANENCIA Y PROMOCIÓN ', id_cuestionario: cuestionarioId, orden: 4, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion5, titulo: 'CAPACITACIÓN Y SENSIBILIZACIÓN EN IGUALDAD', id_cuestionario: cuestionarioId, orden: 5, createdAt: new Date(), updatedAt: new Date()},
      { id: seccion6, titulo: 'CORRESPONSABILIDAD ENTRE VIDA PERSONAL, FAMILIAR Y LABORAL', id_cuestionario: cuestionarioId, orden: 6, createdAt: new Date(), updatedAt: new Date()}
    ], {});


    await queryInterface.bulkInsert('preguntas', [
      { id: idSexo, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Sexo asignado al nacer', tipo: '1', orden: 1, createdAt: new Date(), updatedAt: new Date()},
      { id: idGenero, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Identidad de género', tipo: '1', orden: 2, createdAt: new Date(), updatedAt: new Date()},
      { id: idEdad, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Edad', tipo: '1', orden: 3, createdAt: new Date(), updatedAt: new Date()},
      { id: idEstadoCivil, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Estado civil o situación conyugal', tipo: '1', orden: 4, createdAt: new Date(), updatedAt: new Date()},
      { id: idDependientes, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: '¿Vive con hijas/os o personas dependientes?', tipo: '1', orden: 5, createdAt: new Date(), updatedAt: new Date()},
      { id: idDiscapacidad, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: '¿Tiene alguna discapacidad?', tipo: '1', orden: 6, createdAt: new Date(), updatedAt: new Date()},
      { id: idAntigPL, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Antigüedad en el Poder Legislativo', tipo: '1', orden: 7, createdAt: new Date(), updatedAt: new Date()},
      { id: idNivelPuesto, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Nivel de puesto', tipo: '1', orden: 8, createdAt: new Date(), updatedAt: new Date()},
      { id: idContratacion, id_cuestionario: cuestionarioId, id_seccion: seccion1, texto_pregunta: 'Tipo de contratación', tipo: '1', orden: 9, createdAt: new Date(), updatedAt: new Date()},
      { id: idDiscriminacionSeccion2, id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Ha sido discriminada(o) por alguna de las siguientes razones? (marque todas las que apliquen)', tipo: '1', createdAt: new Date(), updatedAt: new Date()},

    ], {});

    const preguntasBase = [
      { id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Considera que existe un ambiente de trabajo respetuoso y cordial en su espacio laboral?', orden: 1},
      { id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Se jefa o jefe directo promueve la igualdad entre mujeres y hombres?', orden: 2},
      { id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿El trato entre personas de distinto sexo o nivel jerárquico es equitativo y respetuoso?', orden: 3},
      { id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Detecta expresiones, prácticas o actitudes que refuercen estereotipos de género?', orden: 4},
      { id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Se toma en cuenta por igual la opinión de mujeres y hombres?', orden: 5},
      { id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Las responsabilidades laborales son asignadas con equidad entre mujeres y hombres?', orden: 6},
      { id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿Ha experimentado maltrato, acoso o intimidación por razón de género?', orden: 7},
      { id_cuestionario: cuestionarioId, id_seccion: seccion2, texto_pregunta: '¿La autoridad de mujeres y hombres se respeta por igual?', orden: 8},

      { id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Conoce sus derechos laborales?', orden: 1 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Conoce sus prestaciones laborales?', orden: 2 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Percibe que las prestaciones se otorgan equitativamente entre mujeres y hombres?', orden: 3 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Las condiciones laborales son equitativas para ambos sexos?', orden: 4 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Percibe que características personales (edad, apariencia, etc.) influyen en el acceso a mejores condiciones?', orden: 5 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion3, texto_pregunta: '¿Se asignan funciones con base en estereotipos de género?', orden: 6 },

      { id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Considera que el género influye en la posibilidad de ascender?', orden: 1 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Ha notado mayor rotación o salida del personal femenino?', orden: 2 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Su estado civil, embarazo o maternidad/paternidad han afectado su crecimiento profesional?', orden: 3 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Se promueve la participación igualitaria para ocupar puestos de dirección?', orden: 4 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion4, texto_pregunta: '¿Ha enfrentado obstáculos por motivos personales (embarazo, hijos/as, discapacidad, etc.) para ascender?', orden: 5 },

      { id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Ha recibido formación básica en temas de igualdad de género?', orden: 1 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿La capacitación se ofrece por igual a mujeres y hombres?', orden: 2 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Le interesa capacitarse en temas de género y derechos humanos?', orden: 3 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Cree que los temas de género son exclusivos para mujeres?', orden: 4 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Ha participado en cursos que promuevan la igualdad de género?', orden: 5 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion5, texto_pregunta: '¿Las capacitaciones que ha recibido le han permitido reflexionar sobre sus actitudes?', orden: 6 },

      { id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Tiene bajo su cuidado a personas dependientes (niñas/os, adultos mayores, personas con discapacidad)?', orden: 1 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Existe flexibilidad en su unidad administrativa para atender asuntos personales o familiares?', orden: 2 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Ha faltado al trabajo porque se le negó un permiso por razones familiares?', orden: 3 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Su horario laboral le permite equilibrar su vida personal y familiar?', orden: 4 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Se le ha permitido realizar trabajo remoto o flexible para atender cuidados familiares?', orden: 5 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Se agendan reuniones fuera del horario laboral?', orden: 6 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Se le ha respetado su incapacidad por maternidad o licencia de paternidad?', orden: 7 },
      { id_cuestionario: cuestionarioId, id_seccion: seccion6, texto_pregunta: '¿Ha participado con su familia en actividades recreativas organizadas por el Poder Legislativo?', orden: 8 },
    ];

    const opcionesFijas = ["Nunca", "Algunas veces", "Frecuentemente", "Siempre"];

    const preguntas = preguntasBase.map(p => ({
      id: uuidv4(),
      ...p,
      tipo: "1",
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const opciones = preguntas.flatMap(p =>
      opcionesFijas.map((opcion, index) => ({
        id: uuidv4(),
        id_preguntas: p.id,
        texto_opcion: opcion,
        orden: index + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );

        
    await queryInterface.bulkInsert('preguntas', preguntas, {});
    await queryInterface.bulkInsert('opciones', opciones, {});


    const opcionesRaw = [

      { id_preguntas: idSexo, texto_opcion: "Mujer" },
      { id_preguntas: idSexo, texto_opcion: "Hombre" },

      { id_preguntas: idGenero, texto_opcion: "Mujer" },
      { id_preguntas: idGenero, texto_opcion: "Hombre" },
      { id_preguntas: idGenero, texto_opcion: "No binario / género no conforme" },
      { id_preguntas: idGenero, texto_opcion: "Prefiero no decirlo" },


      { id_preguntas: idEdad, texto_opcion: "18 a 20 años" },
      { id_preguntas: idEdad, texto_opcion: "21 a 30 años" },
      { id_preguntas: idEdad, texto_opcion: "31 a 40 años" },
      { id_preguntas: idEdad, texto_opcion: "41 a 50 años" },
      { id_preguntas: idEdad, texto_opcion: "51 a 65 años" },
      { id_preguntas: idEdad, texto_opcion: "66 años o más" },

      { id_preguntas: idEstadoCivil, texto_opcion: "Soltera(o)" },
      { id_preguntas: idEstadoCivil, texto_opcion: "Casada(o)" },
      { id_preguntas: idEstadoCivil, texto_opcion: "Unión libre" },
      { id_preguntas: idEstadoCivil, texto_opcion: "Separada(o)/Divorciada(o)" },
      { id_preguntas: idEstadoCivil, texto_opcion: "Viuda(o)" },

      { id_preguntas: idDependientes, texto_opcion: "Sí" },
      { id_preguntas: idDependientes, texto_opcion: "No" },

      { id_preguntas: idDiscapacidad, texto_opcion: "No" },
      { id_preguntas: idDiscapacidad, texto_opcion: "Sí - Motriz" },
      { id_preguntas: idDiscapacidad, texto_opcion: "Sí - Visual" },
      { id_preguntas: idDiscapacidad, texto_opcion: "Sí - Auditiva" },
      { id_preguntas: idDiscapacidad, texto_opcion: "Sí - Intelectual" },
      { id_preguntas: idDiscapacidad, texto_opcion: "Sí - Psicosocial" },
      { id_preguntas: idDiscapacidad, texto_opcion: "Sí - Otra" },

      { id_preguntas: idAntigPL, texto_opcion: "Menos de 6 meses" },
      { id_preguntas: idAntigPL, texto_opcion: "De 6 meses a 1 año" },
      { id_preguntas: idAntigPL, texto_opcion: "De 1 a 3 años" },
      { id_preguntas: idAntigPL, texto_opcion: "De 3 a 6 años" },
      { id_preguntas: idAntigPL, texto_opcion: "De 6 a 10 años" },
      { id_preguntas: idAntigPL, texto_opcion: "Más de 10 años" },

      { id_preguntas: idNivelPuesto, texto_opcion: "Mando superior" },
      { id_preguntas: idNivelPuesto, texto_opcion: "Mando medio" },
      { id_preguntas: idNivelPuesto, texto_opcion: "Personal operativo" },

      { id_preguntas: idContratacion, texto_opcion: "Base" },
      { id_preguntas: idContratacion, texto_opcion: "Confianza" },
      { id_preguntas: idContratacion, texto_opcion: "Honorarios" },
      { id_preguntas: idContratacion, texto_opcion: "Otro" },


      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Sexo" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Edad" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Discapacidad" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Embarazo" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Estado civil" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Apariencia física" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Orientación sexual" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Identidad de género" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Condición de salud" },
      { id_preguntas: idDiscriminacionSeccion2, texto_opcion: "Ninguna" },
    ];

    const opcionesConOrden = opcionesRaw.map((op, index, arr) => {
      const orden = arr.filter(o => o.id_preguntas === op.id_preguntas).indexOf(op) + 1;
      return {
        id: uuidv4(),
        id_preguntas: op.id_preguntas,
        texto_opcion: op.texto_opcion,
        orden,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    await queryInterface.bulkInsert("opciones", opcionesConOrden, {});

    

    
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
