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

