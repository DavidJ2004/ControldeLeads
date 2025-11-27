// Módulo para procesamiento de archivos CSV y Excel
import { AppState } from './config.js';
import { showError, hideError, formatFileSize } from './utils.js';
import { normalizePhoneNumbers } from './phoneNormalizer.js';
import { displayPreviewTable } from './previewManager.js';

// Función para procesar múltiples archivos
export function processFiles(files) {
    if (!files || files.length === 0) {
        showError('No se seleccionaron archivos.');
        return;
    }
    
    // Validar que todos los archivos sean válidos
    const validFiles = Array.from(files).filter(file => {
        if (!file) return false;
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    });
    
    if (validFiles.length === 0) {
        showError('Por favor, selecciona archivos CSV o Excel (XLSX) válidos.');
        return;
    }
    
    hideError();
    
    // Resetear estado
    AppState.fileNames = [];
    AppState.fileTypes = [];
    AppState.loadedFiles = [];
    
    // Procesar cada archivo
    const filePromises = validFiles.map(file => {
        try {
            return processSingleFile(file);
        } catch (error) {
            console.error('Error al procesar archivo:', file.name, error);
            return Promise.reject(error);
        }
    });
    
    // Esperar a que todos los archivos se procesen
    Promise.allSettled(filePromises)
        .then(results => {
            // Filtrar resultados válidos (solo los que se completaron exitosamente)
            const validResults = results
                .filter(r => r.status === 'fulfilled' && r.value && r.value.data && r.value.data.length > 0)
                .map(r => r.value);
            
            if (validResults.length === 0) {
                const failedCount = results.filter(r => r.status === 'rejected').length;
                if (failedCount > 0) {
                    showError(`No se pudieron procesar los archivos. ${failedCount} archivo(s) tuvieron errores. Verifica que contengan datos válidos.`);
                } else {
                    showError('No se pudieron procesar los archivos. Verifica que contengan datos válidos.');
                }
                return;
            }
            
            // Mostrar advertencia si algunos archivos fallaron
            const failedCount = results.filter(r => r.status === 'rejected').length;
            if (failedCount > 0) {
                console.warn(`${failedCount} archivo(s) no se pudieron procesar correctamente.`);
            }
            
            // Combinar todos los datos
            combineFilesData(validResults);
        })
        .catch(error => {
            showError('Error al procesar los archivos: ' + error.message);
            console.error('Error detallado:', error);
        });
}

// Función para procesar un solo archivo
function processSingleFile(file) {
    return new Promise((resolve, reject) => {
        const fileNameLower = file.name.toLowerCase();
        const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls');
        
        // Guardar información del archivo
        AppState.fileNames.push(file.name);
        AppState.fileTypes.push(isExcel ? 'xlsx' : 'csv');
        
        if (isExcel) {
            processExcelFilePromise(file)
                .then(data => resolve({ file, data, type: 'xlsx' }))
                .catch(reject);
        } else {
            processCSVFilePromise(file)
                .then(data => resolve({ file, data, type: 'csv' }))
                .catch(reject);
        }
    });
}

// Función para procesar archivo CSV (Promise)
function processCSVFilePromise(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Archivo no válido'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                if (!text || text.trim() === '') {
                    reject(new Error('El archivo está vacío: ' + file.name));
                    return;
                }
                const data = parseCSV(text, file.name);
                if (!data || data.length === 0) {
                    reject(new Error('El archivo no contiene datos válidos: ' + file.name));
                    return;
                }
                resolve(data);
            } catch (error) {
                reject(new Error('Error al parsear CSV: ' + error.message + ' - Archivo: ' + file.name));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo: ' + file.name));
        };
        
        reader.onabort = function() {
            reject(new Error('Lectura del archivo cancelada: ' + file.name));
        };
        
        try {
            reader.readAsText(file, 'UTF-8');
        } catch (error) {
            reject(new Error('No se pudo leer el archivo: ' + file.name + ' - ' + error.message));
        }
    });
}

// Función para procesar archivo Excel (Promise)
function processExcelFilePromise(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Archivo no válido'));
            return;
        }
        
        // Verificar que XLSX esté disponible
        if (typeof XLSX === 'undefined') {
            reject(new Error('La librería XLSX no está cargada. Por favor, recarga la página.'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                    reject(new Error('El archivo Excel no contiene hojas válidas: ' + file.name));
                    return;
                }
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                if (!worksheet) {
                    reject(new Error('El archivo Excel no contiene hojas válidas: ' + file.name));
                    return;
                }
                
                const parsedData = parseExcel(worksheet, file.name);
                if (!parsedData || parsedData.length === 0) {
                    reject(new Error('El archivo Excel no contiene datos válidos: ' + file.name));
                    return;
                }
                resolve(parsedData);
            } catch (error) {
                reject(new Error('Error al parsear Excel: ' + error.message + ' - Archivo: ' + file.name));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo: ' + file.name));
        };
        
        reader.onabort = function() {
            reject(new Error('Lectura del archivo cancelada: ' + file.name));
        };
        
        try {
            reader.readAsArrayBuffer(file);
        } catch (error) {
            reject(new Error('No se pudo leer el archivo: ' + file.name + ' - ' + error.message));
        }
    });
}

// Función para combinar datos de múltiples archivos
function combineFilesData(results) {
    if (results.length === 0) {
        return;
    }
    
    // Obtener todos los encabezados únicos de todos los archivos
    const allHeaders = new Set();
    results.forEach(result => {
        if (result.data && result.data.length > 0) {
            Object.keys(result.data[0]).forEach(header => allHeaders.add(header));
        }
    });
    
    // Convertir Set a Array y ordenar
    const unifiedHeaders = Array.from(allHeaders).sort();
    AppState.originalHeaders = unifiedHeaders;
    
    // Combinar todos los datos
    const combinedData = [];
    let totalSize = 0;
    
    results.forEach(result => {
        if (result.data && result.data.length > 0) {
            // Normalizar cada fila para que tenga todos los encabezados
            result.data.forEach(row => {
                const normalizedRow = {};
                unifiedHeaders.forEach(header => {
                    normalizedRow[header] = row[header] !== undefined ? row[header] : '';
                });
                combinedData.push(normalizedRow);
            });
            
            totalSize += result.file.size;
            
            // Guardar información del archivo
            AppState.loadedFiles.push({
                name: result.file.name,
                type: result.type,
                size: result.file.size,
                leads: result.data.length
            });
        }
    });
    
    // Determinar tipo de archivo combinado
    const uniqueTypes = [...new Set(AppState.fileTypes)];
    if (uniqueTypes.length > 1) {
        AppState.fileType = 'mixed';
    } else {
        AppState.fileType = uniqueTypes[0] || 'csv';
    }
    
    // Generar nombre combinado
    if (AppState.fileNames.length === 1) {
        AppState.fileName = AppState.fileNames[0];
    } else {
        AppState.fileName = `${AppState.fileNames.length} archivos combinados`;
    }
    
    // Normalizar números de teléfono
    AppState.csvData = normalizePhoneNumbers(combinedData);
    
    // Mostrar resultados
    displayCombinedResults(combinedData, totalSize);
}

// Función para mostrar resultados combinados
function displayCombinedResults(data, totalSize) {
    const totalLeads = data.length;
    const fileSize = formatFileSize(totalSize);
    const columnCount = AppState.originalHeaders.length;
    
    // Determinar el tipo de archivo para mostrar
    let fileTypeDisplay = '';
    if (AppState.fileType === 'mixed') {
        fileTypeDisplay = 'Mixto (CSV + Excel)';
    } else if (AppState.fileType === 'xlsx') {
        fileTypeDisplay = 'Excel (XLSX)';
    } else {
        fileTypeDisplay = 'CSV';
    }
    
    // Actualizar estadísticas
    document.getElementById('totalLeads').textContent = totalLeads.toLocaleString();
    document.getElementById('fileName').textContent = AppState.fileName;
    document.getElementById('fileType').textContent = fileTypeDisplay;
    document.getElementById('fileSize').textContent = fileSize;
    document.getElementById('columnCount').textContent = columnCount;
    
    // Mostrar información de archivos cargados
    displayLoadedFilesInfo();
    
    // Mostrar vista previa de la tabla
    displayPreviewTable(AppState.csvData);
    
    // Mostrar sección de resultados
    const resultsSection = document.getElementById('resultsSection');
    const uploadBox = document.getElementById('uploadBox');
    
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    if (uploadBox) {
        uploadBox.style.display = 'none';
    }
}

// Función para mostrar información de archivos cargados
function displayLoadedFilesInfo() {
    const filesInfoContainer = document.getElementById('filesInfoContainer');
    
    if (!filesInfoContainer) {
        // Crear contenedor si no existe
        const infoCard = document.querySelector('.info-card');
        if (infoCard) {
            const container = document.createElement('div');
            container.id = 'filesInfoContainer';
            container.className = 'files-info-container';
            infoCard.appendChild(container);
        }
    } else {
        filesInfoContainer.innerHTML = '';
    }
    
    if (AppState.loadedFiles.length > 1) {
        const container = document.getElementById('filesInfoContainer');
        if (container) {
            const title = document.createElement('h4');
            title.textContent = `Archivos cargados (${AppState.loadedFiles.length}):`;
            title.style.marginTop = '15px';
            title.style.marginBottom = '10px';
            title.style.color = '#333';
            container.appendChild(title);
            
            const filesList = document.createElement('div');
            filesList.className = 'files-list';
            
            AppState.loadedFiles.forEach((fileInfo, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span class="file-number">${index + 1}.</span>
                    <span class="file-name">${fileInfo.name}</span>
                    <span class="file-stats">${fileInfo.leads} leads • ${formatFileSize(fileInfo.size)}</span>
                `;
                filesList.appendChild(fileItem);
            });
            
            container.appendChild(filesList);
        }
    }
}

// Función para parsear archivo Excel
function parseExcel(worksheet, fileName = '') {
    // Convertir la hoja a JSON con encabezados en la primera fila
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false
    });
    
    if (jsonData.length === 0) {
        return [];
    }
    
    // La primera fila son los encabezados
    const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h !== '');
    
    if (headers.length === 0) {
        return [];
    }
    
    // Convertir las filas restantes a objetos
    const data = [];
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Crear objeto con los datos
        const rowObject = {};
        let hasData = false;
        
        headers.forEach((header, index) => {
            const value = row[index] !== undefined ? String(row[index]).trim() : '';
            rowObject[header] = value;
            if (value !== '') {
                hasData = true;
            }
        });
        
        // Solo agregar filas que tengan al menos un valor no vacío
        if (hasData) {
            data.push(rowObject);
        }
    }
    
    return data;
}

// Función para parsear el CSV
function parseCSV(text, fileName = '') {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        return [];
    }
    
    // Detectar el separador (coma o punto y coma)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    // Obtener los encabezados
    const headers = parseCSVLine(lines[0], separator).map(h => h.trim());
    
    // Parsear las filas de datos
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i], separator);
        
        // Crear objeto con los datos
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        
        // Solo agregar filas que tengan al menos un valor no vacío
        if (Object.values(row).some(val => val !== '')) {
            data.push(row);
        }
    }
    
    return data;
}

// Función para parsear una línea CSV (maneja comillas)
function parseCSVLine(line, separator) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}


