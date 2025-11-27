// Módulo para gestión de vista previa y paginación
import { AppState } from './config.js';
import { detectPhoneColumns, hasForeignPhone, filterForeignLeads } from './phoneNormalizer.js';

// Función para mostrar la vista previa de la tabla
export function displayPreviewTable(data) {
    // Guardar todos los datos originales
    AppState.allLeadsData = data;
    
    // Resetear a vista de todos por defecto
    AppState.showOnlyForeign = false;
    
    // Actualizar estados de los botones
    const btnAll = document.getElementById('btnViewAll');
    const btnForeign = document.getElementById('btnViewForeign');
    
    if (btnAll && btnForeign) {
        btnAll.classList.add('active');
        btnForeign.classList.remove('active');
    }
    
    // Aplicar el filtro según el estado actual
    if (AppState.showOnlyForeign) {
        window.previewData = filterForeignLeads(data);
    } else {
        window.previewData = data;
    }
    
    // Actualizar la vista con el valor seleccionado
    updatePreview();
}

// Función para cambiar la cantidad de filas por página
export function changeRowsPerPage() {
    AppState.currentPage = 1;
    updatePreview(1);
}

// Función para mostrar todos los leads
export function showAllLeads() {
    AppState.showOnlyForeign = false;
    
    const btnAll = document.getElementById('btnViewAll');
    const btnForeign = document.getElementById('btnViewForeign');
    
    btnAll.classList.add('active');
    btnForeign.classList.remove('active');
    
    applyViewFilter();
}

// Función para mostrar solo leads extranjeros
export function showForeignLeads() {
    AppState.showOnlyForeign = true;
    
    const btnAll = document.getElementById('btnViewAll');
    const btnForeign = document.getElementById('btnViewForeign');
    
    btnAll.classList.remove('active');
    btnForeign.classList.add('active');
    
    applyViewFilter();
}

// Función para aplicar el filtro de vista
function applyViewFilter() {
    if (!AppState.allLeadsData || AppState.allLeadsData.length === 0) {
        return;
    }
    
    if (AppState.showOnlyForeign) {
        window.previewData = filterForeignLeads(AppState.allLeadsData);
    } else {
        window.previewData = AppState.allLeadsData;
    }
    
    AppState.currentPage = 1;
    updatePreview(1);
}

// Función para actualizar la vista previa según la selección
export function updatePreview(page = 1) {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const previewRowsSelect = document.getElementById('previewRows');
    const paginationContainer = document.getElementById('paginationContainer');
    
    // Limpiar contenido anterior
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    if (!window.previewData || window.previewData.length === 0) {
        return;
    }
    
    const data = window.previewData;
    const totalRows = data.length;
    
    // Obtener el número de filas a mostrar por página
    const selectedValue = previewRowsSelect.value;
    let rowsPerPage;
    
    if (selectedValue === 'all') {
        rowsPerPage = totalRows;
        AppState.currentPage = 1;
    } else {
        rowsPerPage = parseInt(selectedValue);
        AppState.currentPage = page;
    }
    
    // Calcular el número total de páginas
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    
    // Asegurar que la página actual sea válida
    if (AppState.currentPage > totalPages) {
        AppState.currentPage = totalPages;
    }
    if (AppState.currentPage < 1) {
        AppState.currentPage = 1;
    }
    
    // Calcular el rango de filas a mostrar
    const startIndex = (AppState.currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    
    // Obtener encabezados
    const headers = Object.keys(data[0]);
    
    // Crear encabezados de la tabla
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);
    
    // Crear filas de datos para la página actual
    for (let i = startIndex; i < endIndex; i++) {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            const value = data[i][header];
            td.textContent = value !== null && value !== undefined && value !== '' ? value : '-';
            row.appendChild(td);
        });
        tableBody.appendChild(row);
    }
    
    // Crear paginación solo si hay más de una página y no es "all"
    if (selectedValue !== 'all' && totalPages > 1) {
        createPagination(totalPages, AppState.currentPage);
    }
}

// Función para crear las pestañas de paginación
function createPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('paginationContainer');
    
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';
    
    // Botón Anterior
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn';
    prevButton.textContent = '« Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            updatePreview(currentPage - 1);
        }
    };
    paginationDiv.appendChild(prevButton);
    
    // Pestañas numeradas
    const pageNumbers = document.createElement('div');
    pageNumbers.className = 'pagination-numbers';
    
    // Mostrar máximo 7 pestañas a la vez
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, currentPage + 3);
    
    // Ajustar si estamos cerca del inicio o final
    if (endPage - startPage < 6) {
        if (startPage === 1) {
            endPage = Math.min(7, totalPages);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, totalPages - 6);
        }
    }
    
    // Primera página si no está visible
    if (startPage > 1) {
        const firstBtn = createPageButton(1, currentPage);
        pageNumbers.appendChild(firstBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
    }
    
    // Páginas visibles
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPageButton(i, currentPage);
        pageNumbers.appendChild(pageBtn);
    }
    
    // Última página si no está visible
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
        
        const lastBtn = createPageButton(totalPages, currentPage);
        pageNumbers.appendChild(lastBtn);
    }
    
    paginationDiv.appendChild(pageNumbers);
    
    // Botón Siguiente
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn';
    nextButton.textContent = 'Siguiente »';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            updatePreview(currentPage + 1);
        }
    };
    paginationDiv.appendChild(nextButton);
    
    paginationContainer.appendChild(paginationDiv);
}

// Función para crear un botón de página
function createPageButton(pageNumber, currentPage) {
    const button = document.createElement('button');
    button.className = 'pagination-page';
    if (pageNumber === currentPage) {
        button.classList.add('active');
    }
    button.textContent = pageNumber;
    button.onclick = () => updatePreview(pageNumber);
    return button;
}

