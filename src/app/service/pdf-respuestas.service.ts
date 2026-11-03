import { Injectable } from '@angular/core';

export interface RespuestasUsuario {
  anio?: number;
  usuario: {
    nombre: string | null;
    rfc: string;
    dependencia: string | null;
    direccion: string | null;
    departamento: string | null;
  };
  fechaRegistro: string;
  comentarios: string | null;
  secciones: {
    nombreSeccion: string;
    preguntas: { nombrePregunta: string; respuestas: string[]; aplica?: boolean }[];
  }[];
}

const VINO: [number, number, number] = [150, 19, 75];
const GRIS: [number, number, number] = [90, 90, 90];
const GRIS_CLARO: [number, number, number] = [245, 243, 244];
const LOGO_URL = 'images/congreso.svg';
const LOGO_PROPORCION = 685.73 / 255.75;

@Injectable({
  providedIn: 'root'
})
export class PdfRespuestasService {
  private logoPng?: Promise<string | null>;

  async generar(datos: RespuestasUsuario): Promise<void> {
    // Se cargan bajo demanda para no aumentar el peso inicial de la app
    const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
      this.cargarLogo(),
    ]);

    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const margen = 16;
    const inicioContenido = 40;
    const generado = new Date();

    const encabezado = () => {
      if (logo) {
        const h = 15;
        doc.addImage(logo, 'PNG', margen, 10, h * LOGO_PROPORCION, h);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...VINO);
      doc.text(`DIAGNÓSTICO PARA CONTRIBUIR A LA IGUALDAD DE GÉNERO${datos.anio ? ' ' + datos.anio : ''}`, ancho - margen, 15, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...GRIS);
      doc.text('Poder Legislativo del Estado de México', ancho - margen, 20, { align: 'right' });
      doc.text('Respuestas individuales', ancho - margen, 24.5, { align: 'right' });
      doc.setDrawColor(...VINO);
      doc.setLineWidth(0.8);
      doc.line(margen, 30, ancho - margen, 30);
    };

    const pie = (pagina: number, total: number) => {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(margen, alto - 14, ancho - margen, alto - 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRIS);
      doc.text(
        `Documento confidencial · Generado el ${this.formatoFecha(generado, true)}`,
        margen, alto - 9
      );
      doc.text(`Página ${pagina} de ${total}`, ancho - margen, alto - 9, { align: 'right' });
    };

    // ---------- Datos del servidor público ----------
    let y = inicioContenido;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 30, 30);
    doc.text(`Respuestas del cuestionario${datos.anio ? ' ' + datos.anio : ''}`, margen, y);
    y += 5;

    const u = datos.usuario;
    autoTable(doc, {
      startY: y,
      margin: { left: margen, right: margen, top: inicioContenido },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 1.6, bottom: 1.6, left: 3, right: 3 }, textColor: [40, 40, 40] },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: GRIS, cellWidth: 46 },
      },
      body: [
        ['Servidor(a) público(a)', u.nombre || '—'],
        ['RFC', u.rfc],
        ['Dependencia', u.dependencia || '—'],
        ['Dirección', u.direccion || '—'],
        ['Departamento', u.departamento || '—'],
        ['Fecha de registro', datos.fechaRegistro ? this.formatoFecha(new Date(datos.fechaRegistro), true) : '—'],
      ],
      tableLineColor: [225, 225, 225],
      tableLineWidth: 0.2,
      alternateRowStyles: { fillColor: GRIS_CLARO },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ---------- Secciones ----------
    let numero = 0;
    datos.secciones.forEach((seccion, si) => {
      const filas = seccion.preguntas.map(p => {
        // Misma numeración que el cuestionario: la primera sección no se numera
        const num = si === 0 ? '•' : String(++numero);
        const respuesta = p.respuestas.length
          ? p.respuestas.join('\n')
          : p.aplica === false ? 'No aplica' : 'Sin respuesta';
        return [num, p.nombrePregunta, respuesta];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: margen, right: margen, top: inicioContenido, bottom: 20 },
        theme: 'grid',
        head: [
          [{ content: `${si + 1}. ${seccion.nombreSeccion.trim()}`, colSpan: 3, styles: { halign: 'left', fillColor: VINO, textColor: 255, fontSize: 10 } }],
          ['#', 'Pregunta', 'Respuesta'],
        ],
        body: filas,
        headStyles: { fillColor: [242, 230, 236], textColor: VINO, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8.8, cellPadding: 2.4, lineColor: [225, 225, 225], lineWidth: 0.2, textColor: [40, 40, 40], valign: 'middle' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', textColor: VINO, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 62, fontStyle: 'bold' },
        },
        rowPageBreak: 'avoid',
        showHead: 'everyPage',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    });

    // ---------- Comentarios ----------
    autoTable(doc, {
      startY: y,
      margin: { left: margen, right: margen, top: inicioContenido, bottom: 20 },
      theme: 'grid',
      head: [[`${numero + 1}. Comentarios adicionales`]],
      body: [[datos.comentarios?.trim() || 'Sin comentarios.']],
      headStyles: { fillColor: VINO, textColor: 255, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3, lineColor: [225, 225, 225], lineWidth: 0.2, textColor: [40, 40, 40] },
    });

    // Encabezado y pie en todas las páginas
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      encabezado();
      pie(i, total);
    }

    doc.save(`respuestas_${u.rfc}${datos.anio ? '_' + datos.anio : ''}.pdf`);
  }

  // jsPDF no dibuja SVG: se convierte el logo a PNG en un canvas (una sola vez)
  private cargarLogo(): Promise<string | null> {
    if (!this.logoPng) {
      this.logoPng = (async () => {
        try {
          const svg = await (await fetch(LOGO_URL)).text();
          const anchoPx = 1200;
          const altoPx = Math.round(anchoPx / LOGO_PROPORCION);
          // El SVG sólo trae viewBox; sin tamaño explícito algunos navegadores no lo dibujan
          const conTamano = svg.replace('<svg ', `<svg width="${anchoPx}" height="${altoPx}" `);
          const url = URL.createObjectURL(new Blob([conTamano], { type: 'image/svg+xml' }));
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = url;
          });
          const canvas = document.createElement('canvas');
          canvas.width = anchoPx;
          canvas.height = altoPx;
          canvas.getContext('2d')!.drawImage(img, 0, 0, anchoPx, altoPx);
          URL.revokeObjectURL(url);
          return canvas.toDataURL('image/png');
        } catch (e) {
          console.error('No se pudo cargar el logo para el PDF', e);
          return null;
        }
      })();
    }
    return this.logoPng;
  }

  private formatoFecha(fecha: Date, conHora = false): string {
    return fecha.toLocaleString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  }
}
