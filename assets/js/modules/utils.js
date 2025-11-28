// Utilidades generales

// Función para formatear el tamaño del archivo
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Función para mostrar errores
export function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const resultsSection = document.getElementById('resultsSection');
    
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'flex';
    }
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
}

// Función para ocultar errores
export function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Función para validar el tipo de archivo
export function isValidFileType(file) {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const validMimeTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    return validExtensions.includes(fileExtension) || 
           validMimeTypes.includes(file.type);
}

// Función para detectar el tipo de columna según su nombre
function detectColumnType(columnName) {
    const name = columnName.toLowerCase().trim();
    
    // Detectar nombre
    if (name.includes('nombre') || name.includes('name') || name === 'nombres' || name === 'names') {
        return 'nombre';
    }
    
    // Detectar correo
    if (name.includes('correo') || name.includes('email') || name.includes('e-mail') || name.includes('mail')) {
        return 'correo';
    }
    
    // Detectar teléfono
    if (name.includes('telefono') || name.includes('teléfono') || name.includes('phone') || 
        name.includes('celular') || name.includes('movil') || name.includes('móvil') || 
        name.includes('contacto') || name.includes('whatsapp')) {
        return 'telefono';
    }
    
    // Detectar provincia
    if (name.includes('provincia') || name.includes('province') || name.includes('estado') || 
        name.includes('state') || name.includes('region') || name.includes('región')) {
        return 'provincia';
    }
    
    return null;
}

// Función para verificar si un valor está vacío
function isEmpty(value) {
    return value === null || 
           value === undefined || 
           value === '' || 
           (typeof value === 'string' && value.trim() === '');
}

// Función para llenar valores vacíos con valores por defecto
export function fillEmptyValues(data) {
    if (!data || data.length === 0) {
        return data;
    }
    
    const headers = Object.keys(data[0]);
    const columnTypes = {};
    
    // Detectar tipos de columnas
    headers.forEach(header => {
        const type = detectColumnType(header);
        if (type) {
            columnTypes[header] = type;
        }
    });
    
    // Valores por defecto según el tipo
    const defaultValues = {
        'nombre': 'sin nombre',
        'correo': 'sin correo',
        'telefono': 'sin telefono',
        'provincia': 'provincia o estado no especificado'
    };
    
    // Aplicar valores por defecto
    return data.map(row => {
        const newRow = { ...row };
        
        headers.forEach(header => {
            const columnType = columnTypes[header];
            if (columnType && isEmpty(newRow[header])) {
                newRow[header] = defaultValues[columnType];
            }
        });
        
        return newRow;
    });
}

