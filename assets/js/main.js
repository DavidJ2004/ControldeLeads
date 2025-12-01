// Archivo principal - Inicialización y event listeners
import { AppState, initDOM } from './modules/config.js';
import { isValidFileType, showError, hideError } from './modules/utils.js';
import { processFiles } from './modules/fileProcessor.js';
import { changeRowsPerPage, showAllLeads, showForeignLeads } from './modules/previewManager.js';
import { distributeLeads } from './modules/distributionManager.js';
import { downloadAllFiles, downloadAllLeadsReport } from './modules/csvExporter.js';

// Verificar si estamos en un servidor HTTP
function checkServerProtocol() {
    if (window.location.protocol === 'file:') {
        const errorMsg = document.getElementById('errorMessage');
        const uploadBox = document.getElementById('uploadBox');
        
        if (errorMsg) {
            errorMsg.innerHTML = `
                <div style="padding: 20px;">
                    <h3 style="color: #c33; margin-bottom: 15px;">⚠️ Error: Se requiere un servidor HTTP</h3>
                    <p style="margin-bottom: 15px; line-height: 1.6;">
                        Este proyecto usa módulos ES6 que no funcionan cuando abres el archivo directamente desde el explorador.
                    </p>
                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <strong style="color: #667eea;">Solución rápida:</strong>
                        <ol style="margin-top: 10px; padding-left: 20px; line-height: 1.8;">
                            <li>Abre una terminal en esta carpeta</li>
                            <li>Ejecuta: <code style="background: #e0e0e0; padding: 2px 6px; border-radius: 4px;">npm install</code> (si no lo has hecho)</li>
                            <li>Ejecuta: <code style="background: #e0e0e0; padding: 2px 6px; border-radius: 4px;">npm run dev</code></li>
                            <li>El navegador se abrirá automáticamente en: <strong>http://localhost:8000</strong></li>
                        </ol>
                    </div>
                    <p style="font-size: 0.9em; color: #666;">
                        Consulta el archivo <strong>README.md</strong> para más información.
                    </p>
                </div>
            `;
            errorMsg.style.display = 'flex';
        }
        
        if (uploadBox) {
            uploadBox.style.display = 'none';
        }
        
        return false;
    }
    return true;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar protocolo primero
    if (!checkServerProtocol()) {
        return;
    }
    
    try {
        initDOM();
        setupEventListeners();
        
        // Hacer funciones globales para los onclick del HTML
        window.showAllLeads = showAllLeads;
        window.showForeignLeads = showForeignLeads;
        window.changeRowsPerPage = changeRowsPerPage;
        window.distributeLeads = distributeLeads;
        window.downloadAllFiles = downloadAllFiles;
        window.downloadAllLeadsReport = downloadAllLeadsReport;
        window.resetApp = resetApp;
        
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) {
            errorMsg.innerHTML = `Error al inicializar la aplicación: ${error.message}. Por favor, recarga la página.`;
            errorMsg.style.display = 'flex';
        }
    }
});

// Configurar event listeners
function setupEventListeners() {
    const csvFileInput = document.getElementById('csvFile');
    const uploadBox = document.getElementById('uploadBox');
    
    if (csvFileInput) {
        csvFileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadBox) {
        uploadBox.addEventListener('dragover', handleDragOver);
        uploadBox.addEventListener('dragleave', handleDragLeave);
        uploadBox.addEventListener('drop', handleDrop);
    }
}

// Función para manejar la selección de archivo
function handleFileSelect(event) {
    try {
        const files = Array.from(event.target.files);
        console.log('Archivos seleccionados:', files.length);
        
        if (files.length > 0) {
            processFiles(files);
        } else {
            showError('No se seleccionaron archivos.');
        }
    } catch (error) {
        console.error('Error al seleccionar archivos:', error);
        showError('Error al procesar la selección de archivos: ' + error.message);
    }
}

// Función para manejar el arrastre sobre el área
function handleDragOver(event) {
    event.preventDefault();
    const uploadBox = document.getElementById('uploadBox');
    if (uploadBox) {
        uploadBox.classList.add('dragover');
    }
}

// Función para manejar cuando se sale del área de arrastre
function handleDragLeave(event) {
    event.preventDefault();
    const uploadBox = document.getElementById('uploadBox');
    if (uploadBox) {
        uploadBox.classList.remove('dragover');
    }
}

// Función para manejar cuando se suelta el archivo
function handleDrop(event) {
    event.preventDefault();
    const uploadBox = document.getElementById('uploadBox');
    if (uploadBox) {
        uploadBox.classList.remove('dragover');
    }
    
    try {
        const files = Array.from(event.dataTransfer.files);
        console.log('Archivos arrastrados:', files.length);
        
        const validFiles = files.filter(file => isValidFileType(file));
        
        if (validFiles.length > 0) {
            processFiles(validFiles);
        } else {
            showError('Por favor, selecciona archivos CSV o Excel (XLSX) válidos.');
        }
    } catch (error) {
        console.error('Error al procesar archivos arrastrados:', error);
        showError('Error al procesar los archivos: ' + error.message);
    }
}

// Función para resetear la aplicación
function resetApp() {
    const csvFileInput = document.getElementById('csvFile');
    const resultsSection = document.getElementById('resultsSection');
    const distributionResults = document.getElementById('distributionResults');
    const uploadBox = document.getElementById('uploadBox');
    
    if (csvFileInput) {
        csvFileInput.value = '';
    }
    
    // Resetear estado
    AppState.csvData = null;
    AppState.fileName = '';
    AppState.fileNames = [];
    AppState.fileType = '';
    AppState.fileTypes = [];
    AppState.distributedData = null;
    AppState.originalHeaders = [];
    window.previewData = null;
    AppState.allLeadsData = null;
    AppState.currentPage = 1;
    AppState.showOnlyForeign = false;
    AppState.loadedFiles = [];
    
    // Limpiar información de archivos
    const filesInfoContainer = document.getElementById('filesInfoContainer');
    if (filesInfoContainer) {
        filesInfoContainer.innerHTML = '';
    }
    
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    if (distributionResults) {
        distributionResults.style.display = 'none';
    }
    if (uploadBox) {
        uploadBox.style.display = 'block';
    }
    
    hideError();
    
    // Resetear controles
    const sellerCount = document.getElementById('sellerCount');
    const csvSeparator = document.getElementById('csvSeparator');
    const previewRows = document.getElementById('previewRows');
    const btnAll = document.getElementById('btnViewAll');
    const btnForeign = document.getElementById('btnViewForeign');
    
    if (sellerCount) sellerCount.value = '2';
    if (csvSeparator) csvSeparator.value = ',';
    if (previewRows) previewRows.value = '5';
    if (btnAll && btnForeign) {
        btnAll.classList.add('active');
        btnForeign.classList.remove('active');
    }
}

