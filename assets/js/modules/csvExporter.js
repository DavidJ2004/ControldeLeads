// Módulo para exportación de archivos CSV compatibles con Bitrix24
import { AppState } from './config.js';
import { showError } from './utils.js';

// Función para escapar valores CSV correctamente
function escapeCSVValue(value, separator) {
    if (value === null || value === undefined) {
        return '';
    }
    
    const stringValue = String(value);
    
    if (stringValue.includes(separator) || 
        stringValue.includes('"') || 
        stringValue.includes('\n') || 
        stringValue.includes('\r') ||
        stringValue.trim() !== stringValue) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
}

// Función para crear CSV compatible con Bitrix24
function createBitrix24CSV(headers, leads, separator) {
    // UTF-8 BOM (Byte Order Mark) para compatibilidad con Bitrix24
    const BOM = '\uFEFF';
    
    // Crear encabezados
    let csvContent = BOM + headers.map(h => escapeCSVValue(h, separator)).join(separator) + '\n';
    
    // Agregar filas de datos
    leads.forEach(lead => {
        const row = headers.map(header => {
            const value = lead[header] || '';
            return escapeCSVValue(value, separator);
        });
        csvContent += row.join(separator) + '\n';
    });
    
    return csvContent;
}

// Función para descargar CSV de un vendedor específico
export function downloadSellerCSV(sellerNumber) {
    const seller = AppState.distributedData.find(s => s.sellerNumber === sellerNumber);
    if (!seller) return;
    
    // Obtener el separador seleccionado
    const separator = document.getElementById('csvSeparator').value;
    
    // Crear contenido CSV compatible con Bitrix24
    const csvContent = createBitrix24CSV(AppState.originalHeaders, seller.leads, separator);
    
    // Crear blob con codificación UTF-8
    const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Nombre del archivo sin extensión original para evitar duplicados
    const baseFileName = AppState.fileName.replace(/\.csv$/i, '').replace(/\.xlsx$/i, '').replace(/\.xls$/i, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `Leads_Vendedor_${sellerNumber}_${baseFileName}.csv`);
    link.style.visibility = 'hidden';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    // Usar requestAnimationFrame para asegurar que el click se procese antes de revocar
    requestAnimationFrame(() => {
        link.click();
        
        // Liberar la URL del objeto después de un breve delay
        // Nota: La advertencia de seguridad sobre Blob URLs en HTTP es normal en desarrollo local
        // y no afecta la funcionalidad. En producción con HTTPS, esta advertencia no aparecerá.
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    });
}

// Función para descargar todos los archivos CSV
export function downloadAllFiles() {
    if (!AppState.distributedData || AppState.distributedData.length === 0) {
        showError('No hay datos distribuidos para descargar.');
        return;
    }
    
    // Descargar cada archivo con un pequeño delay para evitar problemas del navegador
    AppState.distributedData.forEach((seller, index) => {
        setTimeout(() => {
            downloadSellerCSV(seller.sellerNumber);
        }, index * 300);
    });
}

// Función para descargar todos los leads cargados (reporte completo)
export function downloadAllLeadsReport() {
    if (!AppState.csvData || AppState.csvData.length === 0) {
        showError('No hay leads cargados para descargar.');
        return;
    }
    
    // Obtener el separador seleccionado
    const separator = document.getElementById('csvSeparator')?.value || ',';
    
    // Crear contenido CSV compatible con Bitrix24
    const csvContent = createBitrix24CSV(AppState.originalHeaders, AppState.csvData, separator);
    
    // Crear blob con codificación UTF-8
    const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generar nombre del archivo con fecha
    const now = new Date();
    // Formato de fecha: DD-MM-YYYY
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const fileName = `reporte de leads ${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    // Usar requestAnimationFrame para asegurar que el click se procese antes de revocar
    requestAnimationFrame(() => {
        link.click();
        
        // Liberar la URL del objeto después de un breve delay
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    });
}

