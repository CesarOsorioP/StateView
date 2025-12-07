const PDFDocument = require('pdfkit');
const Pelicula = require('../models/Pelicula');
const Serie = require('../models/Serie');
const Videojuego = require('../models/Videojuego');
const Album = require('../models/Album');
const Review = require('../models/Review');

async function exportContent(req, res) {
  console.log('Iniciando exportación de contenido...');
  
  try {
    // Crear un nuevo documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
    console.log('Documento PDF creado');
    
    // Configurar la respuesta para que sea un PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=contenido.pdf');
    console.log('Headers configurados');
    
    // Pipe el PDF directamente a la respuesta
    doc.pipe(res);
    console.log('PDF pipe configurado');

    // Definir colores
    const colors = {
      primary: '#4A148C', // Morado oscuro
      secondary: '#7B1FA2', // Morado medio
      accent: '#9C27B0', // Morado claro
      text: '#333333', // Texto oscuro
      lightGray: '#F5F5F5', // Gris claro para filas alternadas
      border: '#CCCCCC', // Color de bordes
      white: '#FFFFFF'
    };

    // Función mejorada para dibujar una tabla con bordes
    const drawTable = (data, startY, title) => {
      const tableTop = startY;
      const tableLeft = 50;
      const tableWidth = 495;
      const rowHeight = 35;
      const cellPadding = 8;
      
      // Definir anchos de columnas
      const col1Width = tableWidth * 0.5; // 50% para título
      const col2Width = tableWidth * 0.25; // 25% para calificación
      const col3Width = tableWidth * 0.25; // 25% para año

      let currentY = tableTop;

      // Función para dibujar bordes de celda
      const drawCellBorder = (x, y, width, height) => {
        doc.strokeColor(colors.border)
           .lineWidth(1)
           .rect(x, y, width, height)
           .stroke();
      };

      // Función para truncar texto si es muy largo
      const truncateText = (text, maxWidth) => {
        if (!text) return '';
        const testWidth = doc.widthOfString(text);
        if (testWidth <= maxWidth) return text;
        
        let truncated = text;
        while (doc.widthOfString(truncated + '...') > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
      };

      // Dibujar título de la tabla (ya no es necesario aquí)
      // El título ya se agregó antes en la función principal
      
      // Dibujar encabezado de la tabla
      doc.fillColor(colors.primary);
      doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill();
      
      // Bordes del encabezado
      drawCellBorder(tableLeft, currentY, col1Width, rowHeight);
      drawCellBorder(tableLeft + col1Width, currentY, col2Width, rowHeight);
      drawCellBorder(tableLeft + col1Width + col2Width, currentY, col3Width, rowHeight);
      
      // Texto del encabezado
      doc.fillColor(colors.white)
         .fontSize(12)
         .font('Helvetica-Bold');
      
      doc.text('Título', tableLeft + cellPadding, currentY + 12, { 
        width: col1Width - cellPadding * 2,
        align: 'left'
      });
      doc.text('Calificación', tableLeft + col1Width + cellPadding, currentY + 12, { 
        width: col2Width - cellPadding * 2,
        align: 'center'
      });
      doc.text('Año', tableLeft + col1Width + col2Width + cellPadding, currentY + 12, { 
        width: col3Width - cellPadding * 2,
        align: 'center'
      });

      currentY += rowHeight;

      // Dibujar filas de datos
      data.forEach((item, index) => {
        // Verificar si necesitamos una nueva página
        if (currentY + rowHeight > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
          
          // Redibujar encabezado en la nueva página
          doc.fillColor(colors.primary);
          doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill();
          
          drawCellBorder(tableLeft, currentY, col1Width, rowHeight);
          drawCellBorder(tableLeft + col1Width, currentY, col2Width, rowHeight);
          drawCellBorder(tableLeft + col1Width + col2Width, currentY, col3Width, rowHeight);
          
          doc.fillColor(colors.white)
             .fontSize(12)
             .font('Helvetica-Bold');
          
          doc.text('Título', tableLeft + cellPadding, currentY + 12, { 
            width: col1Width - cellPadding * 2,
            align: 'left'
          });
          doc.text('Calificación', tableLeft + col1Width + cellPadding, currentY + 12, { 
            width: col2Width - cellPadding * 2,
            align: 'center'
          });
          doc.text('Año', tableLeft + col1Width + col2Width + cellPadding, currentY + 12, { 
            width: col3Width - cellPadding * 2,
            align: 'center'
          });

          currentY += rowHeight;
        }

        // Fondo alternado para las filas
        if (index % 2 === 0) {
          doc.fillColor(colors.lightGray);
          doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill();
        }

        // Dibujar bordes de las celdas
        drawCellBorder(tableLeft, currentY, col1Width, rowHeight);
        drawCellBorder(tableLeft + col1Width, currentY, col2Width, rowHeight);
        drawCellBorder(tableLeft + col1Width + col2Width, currentY, col3Width, rowHeight);

        // Contenido de las celdas
        doc.fillColor(colors.text)
           .fontSize(10)
           .font('Helvetica');

        // Título (truncado si es necesario)
        const titulo = item.titulo || item.nombre || 'Sin título';
        const tituloTruncado = truncateText(titulo, col1Width - cellPadding * 2);
        doc.text(tituloTruncado, tableLeft + cellPadding, currentY + 12, {
          width: col1Width - cellPadding * 2,
          align: 'left'
        });

        // Calificación
        const rating = item.rating ? item.rating.toFixed(1) : 'N/A';
        doc.text(rating, tableLeft + col1Width + cellPadding, currentY + 12, {
          width: col2Width - cellPadding * 2,
          align: 'center'
        });

        // Año
        const year = item.year || 'N/A';
        doc.text(year, tableLeft + col1Width + col2Width + cellPadding, currentY + 12, {
          width: col3Width - cellPadding * 2,
          align: 'center'
        });

        currentY += rowHeight;
      });

      return currentY + 30; // Retornar posición Y después de la tabla
    };

    // Función para agregar estadísticas en recuadros
    const addStatsBox = (stats, startY) => {
      const boxWidth = 200;
      const boxHeight = 80;
      const boxX = 350; // Movido a la derecha para no interferir con títulos
      
      // Fondo del recuadro
      doc.fillColor(colors.accent)
         .rect(boxX, startY, boxWidth, boxHeight)
         .fill();
      
      // Borde del recuadro
      doc.strokeColor(colors.primary)
         .lineWidth(2)
         .rect(boxX, startY, boxWidth, boxHeight)
         .stroke();
      
      // Contenido del recuadro
      doc.fillColor(colors.white)
         .fontSize(12)
         .font('Helvetica-Bold');
      
      doc.text('ESTADÍSTICAS', boxX + 10, startY + 10);
      doc.font('Helvetica')
         .fontSize(10);
      
      doc.text(`Total de elementos: ${stats.total}`, boxX + 10, startY + 30);
      doc.text(`Calificación promedio: ${stats.promedio}`, boxX + 10, startY + 45);
      doc.text(`Con calificación: ${stats.conCalificacion}`, boxX + 10, startY + 60);
      
      return Math.max(startY + boxHeight + 20, startY + 40); // Asegurar espacio mínimo
    };
    
    // Agregar título principal y fecha
    doc.fillColor(colors.primary)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('REPORTE DE CONTENIDO', { align: 'center' });
    
    doc.moveDown();
    
    // Agregar fecha y hora en un recuadro
    const now = new Date();
    const fechaY = doc.y;
    doc.fillColor(colors.secondary)
       .rect(50, fechaY, 495, 30)
       .fill();
    
    doc.strokeColor(colors.primary)
       .lineWidth(1)
       .rect(50, fechaY, 495, 30)
       .stroke();
    
    doc.fillColor(colors.white)
       .fontSize(12)
       .font('Helvetica')
       .text(`Generado el ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}`, 
             60, fechaY + 10);
    
    doc.moveDown(3);
    
    // Función auxiliar para agregar contenido al PDF
    const addContentToPDF = async (model, modelType, title, emoji) => {
      console.log(`Procesando ${title}...`);
      try {
        const items = await model.find().lean();
        console.log(`Encontrados ${items.length} ${title}`);
        
        const reviews = await Review.find({ onModel: modelType }).lean();
        console.log(`Encontradas ${reviews.length} reviews para ${title}`);
        
        // Calcular estadísticas
        const promedioCalificaciones = reviews.length > 0
          ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
          : 0;
        
        const itemsConCalificacion = items.filter(item => 
          reviews.some(r => r.itemId && r.itemId.toString() === item._id.toString())
        ).length;
        
        // Verificar si necesitamos una nueva página
        if (doc.y > doc.page.height - 300) { // Más espacio para evitar cortes
          doc.addPage();
        }
        
        // Agregar título de la sección primero
        doc.fillColor(colors.primary)
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(title.toUpperCase(), 50, doc.y);
        
        doc.moveDown(0.5);
        
        // Agregar recuadro de estadísticas (a la derecha del título)
        const stats = {
          total: items.length,
          promedio: promedioCalificaciones.toFixed(2),
          conCalificacion: itemsConCalificacion
        };
        
        const statsY = doc.y - 25; // Alinear con el título
        addStatsBox(stats, statsY);
        
        // Agregar espacio adicional antes de la tabla
        doc.moveDown(2);
        
        // Preparar datos para la tabla
        const tableData = items.map(item => {
          const calificacion = reviews.find(r => r.itemId && r.itemId.toString() === item._id.toString());
          const year = item.fecha_estreno || item.fechaInicio || item.fecha_lanzamiento;
          return {
            titulo: item.titulo || item.nombre || 'Sin título',
            rating: calificacion ? calificacion.rating : null,
            year: year ? year.toString().match(/\d{4}/)?.[0] : null
          };
        });
        
        // Ordenar por calificación (descendente) y luego por título
        tableData.sort((a, b) => {
          if (a.rating && b.rating) {
            return b.rating - a.rating;
          } else if (a.rating) {
            return -1;
          } else if (b.rating) {
            return 1;
          } else {
            return (a.titulo || '').localeCompare(b.titulo || '');
          }
        });
        
        // Dibujar tabla (sin título ya que se agregó arriba)
        const finalY = drawTable(tableData, doc.y, '');
        doc.y = finalY;
        
        console.log(`${title} procesado exitosamente`);
      } catch (error) {
        console.error(`Error procesando ${title}:`, error);
        throw error;
      }
    };
    
    // Agregar cada tipo de contenido con su modelo correspondiente
    console.log('Iniciando procesamiento de contenido...');
    await addContentToPDF(Pelicula, 'Pelicula', 'Películas', '');
    await addContentToPDF(Serie, 'Serie', 'Series', '');
    await addContentToPDF(Videojuego, 'Videojuego', 'Videojuegos', '');
    await addContentToPDF(Album, 'Album', 'Álbumes', '');
    
    // Agregar pie de página profesional
    const footerY = doc.page.height - 50;
    doc.fillColor(colors.primary)
       .rect(50, footerY - 10, 495, 30)
       .fill();
    
    doc.fillColor(colors.white)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('StateView - Sistema de Gestión de Contenido Multimedia', 
             60, footerY, { align: 'center', width: 475 });
    
    // Finalizar el PDF
    console.log('Finalizando PDF...');
    doc.end();
    console.log('PDF finalizado exitosamente');
    
  } catch (error) {
    console.error('Error detallado al exportar contenido:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Error al generar el PDF de contenido',
        details: error.message,
        stack: error.stack
      });
    }
  }
}

module.exports = {
  exportContent
};