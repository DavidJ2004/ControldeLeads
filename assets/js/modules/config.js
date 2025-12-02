// Variables globales y configuración
export const AppState = {
    csvData: null,
    fileName: '', // Nombre combinado o del primer archivo
    fileNames: [], // Array de nombres de archivos cargados
    fileType: '', // 'csv' o 'xlsx' o 'mixed'
    fileTypes: [], // Array de tipos de archivos
    distributedData: null,
    originalHeaders: [],
    currentPage: 1,
    showOnlyForeign: false,
    allLeadsData: null,
    loadedFiles: [], // Información de archivos cargados
    supabaseSaveResult: null // Resultados del guardado en Supabase
};

// Referencias a elementos del DOM
export const DOM = {
    csvFileInput: null,
    uploadBox: null,
    resultsSection: null,
    errorMessage: null,
    distributionResults: null
};

// Inicializar referencias DOM
export function initDOM() {
    DOM.csvFileInput = document.getElementById('csvFile');
    DOM.uploadBox = document.getElementById('uploadBox');
    DOM.resultsSection = document.getElementById('resultsSection');
    DOM.errorMessage = document.getElementById('errorMessage');
    DOM.distributionResults = document.getElementById('distributionResults');
}

