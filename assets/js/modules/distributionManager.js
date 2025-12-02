// Módulo para gestión de distribución de leads entre vendedores
import { AppState } from './config.js';
import { showError } from './utils.js';
import { downloadSellerCSV } from './csvExporter.js';
import { saveLeadsToSupabase, isSupabaseConfigured, checkDuplicatePhone } from './supabaseManager.js';
import { detectPhoneColumns } from './phoneNormalizer.js';

// Función para dividir los leads entre vendedores
export async function distributeLeads() {
    const sellerCountInput = document.getElementById('sellerCount');
    const sellerCount = parseInt(sellerCountInput.value);
    
    if (!AppState.csvData || AppState.csvData.length === 0) {
        showError('No hay datos para distribuir. Por favor, carga un archivo CSV primero.');
        return;
    }
    
    if (isNaN(sellerCount) || sellerCount < 2 || sellerCount > 100) {
        showError('Por favor, ingresa un número válido de vendedores (entre 2 y 100).');
        return;
    }
    
    if (sellerCount > AppState.csvData.length) {
        showError(`No puedes dividir ${AppState.csvData.length} leads entre ${sellerCount} vendedores. El número de vendedores debe ser menor o igual al número de leads.`);
        return;
    }
    
    // Mezclar los datos aleatoriamente para una distribución más justa
    const shuffledData = [...AppState.csvData].sort(() => Math.random() - 0.5);
    
    // Calcular cuántos leads por vendedor
    const leadsPerSeller = Math.floor(shuffledData.length / sellerCount);
    const remainder = shuffledData.length % sellerCount;
    
    // Verificar duplicados ANTES de distribuir si Supabase está configurado
    if (isSupabaseConfigured()) {
        console.log('🔵 Verificando duplicados antes de distribuir...');
        await checkAndDisplayDuplicates();
    }
    
    // Distribuir los leads
    AppState.distributedData = [];
    let currentIndex = 0;
    
    for (let i = 0; i < sellerCount; i++) {
        // Los primeros vendedores reciben un lead extra si hay resto
        const leadsForThisSeller = leadsPerSeller + (i < remainder ? 1 : 0);
        const sellerLeads = shuffledData.slice(currentIndex, currentIndex + leadsForThisSeller);
        
        AppState.distributedData.push({
            sellerNumber: i + 1,
            leads: sellerLeads,
            count: sellerLeads.length
        });
        
        currentIndex += leadsForThisSeller;
    }
    
    displayDistribution(AppState.distributedData);
    
    // Guardar automáticamente en Supabase si está configurado
    if (isSupabaseConfigured()) {
        console.log('🔵 Supabase configurado, iniciando guardado automático...');
        saveLeadsToSupabaseAutomatically();
    } else {
        console.warn('⚠️ Supabase no está configurado. Los leads no se guardarán en la base de datos.');
    }
}

// Función para guardar leads automáticamente en Supabase
async function saveLeadsToSupabaseAutomatically() {
    console.log('🔵 Iniciando guardado automático en Supabase...');
    
    if (!AppState.csvData || AppState.csvData.length === 0) {
        console.warn('⚠️ No hay datos para guardar en Supabase.');
        return;
    }
    
    try {
        // Detectar columna de teléfono
        const headers = Object.keys(AppState.csvData[0]);
        console.log('📋 Headers detectados:', headers);
        
        const phoneColumns = detectPhoneColumns(headers, AppState.csvData);
        console.log('📞 Columnas de teléfono detectadas:', phoneColumns);
        
        if (phoneColumns.length === 0) {
            console.warn('⚠️ No se encontró una columna de teléfono para guardar en Supabase.');
            return;
        }
        
        const phoneColumn = phoneColumns[0];
        console.log('📞 Usando columna de teléfono:', phoneColumn);
        
        // Preparar leads para guardar
        const leadsToSave = AppState.csvData.map(lead => ({
            telefono: lead[phoneColumn] || '',
            nombre: lead.nombre || lead.Nombre || lead.NOMBRE || 'sin nombre',
            correo: lead.correo || lead.Correo || lead.CORREO || lead.email || lead.Email || 'sin correo',
            provincia: lead.provincia || lead.Provincia || lead.PROVINCIA || lead.estado || lead.Estado || 'provincia o estado no especificado'
        })).filter(lead => lead.telefono && lead.telefono !== 'sin telefono');
        
        console.log(`📊 Leads preparados para guardar: ${leadsToSave.length} de ${AppState.csvData.length}`);
        
        if (leadsToSave.length === 0) {
            console.warn('⚠️ No hay leads válidos para guardar en Supabase.');
            return;
        }
        
        // Guardar en Supabase
        console.log('💾 Guardando leads en Supabase...');
        const result = await saveLeadsToSupabase(leadsToSave);
        
        if (result && result.success !== undefined) {
            console.log(`✅ Supabase: ${result.saved} leads guardados, ${result.duplicates} duplicados, ${result.errors} errores`);
            
            // Guardar detalles de leads no agregados en AppState
            AppState.supabaseSaveResult = result;
            
            // Mostrar mensaje discreto en la interfaz
            showSupabaseSaveMessage(result);
            
            // Mostrar leads no agregados
            displayNotAddedLeads(result, AppState.csvData, phoneColumn);
        } else if (result && result.error) {
            console.error('❌ Error al guardar en Supabase:', result.error);
            showSupabaseSaveMessage({ saved: 0, duplicates: 0, errors: leadsToSave.length, error: result.error });
        } else {
            console.error('❌ Error desconocido al guardar en Supabase:', result);
        }
    } catch (error) {
        console.error('❌ Excepción al guardar leads en Supabase:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Función para mostrar mensaje discreto de guardado
function showSupabaseSaveMessage(result) {
    const distributionResults = document.getElementById('distributionResults');
    if (!distributionResults) return;
    
    // Buscar si ya existe un mensaje de Supabase
    let supabaseMessage = document.getElementById('supabaseSaveMessage');
    
    if (!supabaseMessage) {
        supabaseMessage = document.createElement('div');
        supabaseMessage.id = 'supabaseSaveMessage';
        supabaseMessage.style.cssText = 'margin-top: 15px; padding: 12px; background: #e8f5e9; border-left: 4px solid #28a745; border-radius: 6px; font-size: 0.9em;';
        distributionResults.insertBefore(supabaseMessage, distributionResults.firstChild);
    }
    
    const savedText = result.saved > 0 ? `<strong style="color: #28a745;">✓ ${result.saved} guardados</strong>` : '';
    const duplicateText = result.duplicates > 0 ? `<span style="color: #ff9800;">⚠ ${result.duplicates} duplicados</span>` : '';
    const errorText = result.errors > 0 ? `<span style="color: #f44336;">✗ ${result.errors} errores</span>` : '';
    
    supabaseMessage.innerHTML = `
        <span style="color: #28a745;">💾 Guardado en Supabase:</span> 
        ${savedText} ${duplicateText} ${errorText}
    `;
}

// Función para mostrar leads no agregados (duplicados y errores)
function displayNotAddedLeads(result, allLeads, phoneColumn) {
    // Solo mostrar si hay duplicados o errores
    if (result.duplicates === 0 && result.errors === 0) {
        return;
    }
    
    const distributionResults = document.getElementById('distributionResults');
    if (!distributionResults) return;
    
    // Eliminar sección anterior si existe
    const existingSection = document.getElementById('notAddedLeadsSection');
    if (existingSection) {
        existingSection.remove();
    }
    
    // Crear contenedor para leads no agregados
    const section = document.createElement('div');
    section.id = 'notAddedLeadsSection';
    section.style.cssText = 'margin-top: 30px; padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;';
    
    // Crear mapa de teléfonos para buscar los leads completos
    const phoneToLeadMap = new Map();
    allLeads.forEach(lead => {
        const phone = lead[phoneColumn] || '';
        if (phone && phone !== 'sin telefono') {
            phoneToLeadMap.set(phone, lead);
        }
    });
    
    // Separar duplicados y errores
    const duplicateLeads = [];
    const errorLeads = [];
    
    result.details.forEach(detail => {
        const lead = phoneToLeadMap.get(detail.telefono);
        if (lead) {
            if (detail.status === 'duplicate') {
                duplicateLeads.push(lead);
            } else if (detail.status === 'error') {
                errorLeads.push({ lead, error: detail.error });
            }
        }
    });
    
    // Construir HTML
    let html = '<h4 style="margin-top: 0; color: #856404;">📋 Leads No Agregados a Supabase</h4>';
    
    // Mostrar duplicados
    if (duplicateLeads.length > 0) {
        html += `<div style="margin-bottom: 20px;">
            <h5 style="color: #ff9800; margin-bottom: 10px;">⚠️ Duplicados (${duplicateLeads.length})</h5>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #f5f5f5; position: sticky; top: 0;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Teléfono</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Nombre</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Correo</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Provincia</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        duplicateLeads.forEach(lead => {
            const phone = lead[phoneColumn] || 'sin telefono';
            const nombre = lead.nombre || lead.Nombre || lead.NOMBRE || 'sin nombre';
            const correo = lead.correo || lead.Correo || lead.CORREO || lead.email || lead.Email || 'sin correo';
            const provincia = lead.provincia || lead.Provincia || lead.PROVINCIA || lead.estado || lead.Estado || 'provincia o estado no especificado';
            
            html += `<tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${phone}</td>
                <td style="padding: 8px;">${nombre}</td>
                <td style="padding: 8px;">${correo}</td>
                <td style="padding: 8px;">${provincia}</td>
            </tr>`;
        });
        
        html += `</tbody></table></div>
            <p style="margin-top: 10px; font-size: 0.85em; color: #666;">Estos leads ya existen en la base de datos.</p>
        </div>`;
    }
    
    // Mostrar errores
    if (errorLeads.length > 0) {
        html += `<div>
            <h5 style="color: #f44336; margin-bottom: 10px;">❌ Errores (${errorLeads.length})</h5>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #f5f5f5; position: sticky; top: 0;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Teléfono</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Nombre</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Correo</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Provincia</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Error</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        errorLeads.forEach(({ lead, error }) => {
            const phone = lead[phoneColumn] || 'sin telefono';
            const nombre = lead.nombre || lead.Nombre || lead.NOMBRE || 'sin nombre';
            const correo = lead.correo || lead.Correo || lead.CORREO || lead.email || lead.Email || 'sin correo';
            const provincia = lead.provincia || lead.Provincia || lead.PROVINCIA || lead.estado || lead.Estado || 'provincia o estado no especificado';
            const errorMsg = error || 'Error desconocido';
            
            html += `<tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${phone}</td>
                <td style="padding: 8px;">${nombre}</td>
                <td style="padding: 8px;">${correo}</td>
                <td style="padding: 8px;">${provincia}</td>
                <td style="padding: 8px; color: #f44336; font-size: 0.85em;">${errorMsg}</td>
            </tr>`;
        });
        
        html += `</tbody></table></div>
            <p style="margin-top: 10px; font-size: 0.85em; color: #666;">Estos leads no se pudieron guardar debido a errores.</p>
        </div>`;
    }
    
    section.innerHTML = html;
    
    // Insertar después de los botones de descarga
    const downloadSection = distributionResults.querySelector('.download-section');
    if (downloadSection) {
        downloadSection.insertAdjacentElement('afterend', section);
    } else {
        distributionResults.appendChild(section);
    }
}

// Función para verificar y mostrar duplicados antes de distribuir
async function checkAndDisplayDuplicates() {
    if (!AppState.csvData || AppState.csvData.length === 0) {
        return;
    }
    
    try {
        // Detectar columna de teléfono
        const headers = Object.keys(AppState.csvData[0]);
        const phoneColumns = detectPhoneColumns(headers, AppState.csvData);
        
        if (phoneColumns.length === 0) {
            return;
        }
        
        const phoneColumn = phoneColumns[0];
        
        // Verificar duplicados
        const duplicateLeads = [];
        const totalLeads = AppState.csvData.length;
        
        console.log('🔍 Verificando duplicados...');
        
        // Verificar cada lead
        for (let i = 0; i < AppState.csvData.length; i++) {
            const lead = AppState.csvData[i];
            const phone = lead[phoneColumn] || '';
            
            if (phone && phone !== 'sin telefono') {
                const isDuplicate = await checkDuplicatePhone(phone);
                if (isDuplicate) {
                    duplicateLeads.push(lead);
                }
            }
            
            // Mostrar progreso cada 10 leads
            if ((i + 1) % 10 === 0 || i === AppState.csvData.length - 1) {
                console.log(`📊 Verificando: ${i + 1}/${totalLeads} leads...`);
            }
        }
        
        // Mostrar tabla de duplicados si hay
        if (duplicateLeads.length > 0) {
            displayDuplicatesTable(duplicateLeads, phoneColumn, headers);
        }
    } catch (error) {
        console.error('Error al verificar duplicados:', error);
    }
}

// Función para mostrar tabla de duplicados similar a la vista previa
function displayDuplicatesTable(duplicateLeads, phoneColumn, headers) {
    const distributionResults = document.getElementById('distributionResults');
    if (!distributionResults) return;
    
    // Eliminar sección anterior si existe
    const existingSection = document.getElementById('duplicatesTableSection');
    if (existingSection) {
        existingSection.remove();
    }
    
    // Crear contenedor principal
    const section = document.createElement('div');
    section.id = 'duplicatesTableSection';
    section.style.cssText = 'margin-bottom: 30px;';
    
    // Título con cantidad destacada
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); border-radius: 10px; color: white; text-align: center;';
    titleDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 1.3em;">⚠️ Leads Duplicados Detectados</h3>
        <div style="font-size: 2em; font-weight: bold; margin: 10px 0;">${duplicateLeads.length}</div>
        <p style="margin: 0; font-size: 0.9em; opacity: 0.9;">Estos leads ya existen en la base de datos y no se guardarán nuevamente</p>
    `;
    section.appendChild(titleDiv);
    
    // Crear tabla similar a la vista previa
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    tableContainer.style.cssText = 'max-height: 400px;';
    
    const table = document.createElement('table');
    
    // Crear encabezados
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Encabezados principales
    const mainHeaders = ['Correo electrónico', 'Nombre', 'Número de teléfono', 'Provincia/Estado'];
    mainHeaders.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.cssText = 'padding: 12px; text-align: left; font-weight: 600;';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    tbody.id = 'duplicatesTableBody';
    
    duplicateLeads.forEach(lead => {
        const row = document.createElement('tr');
        row.style.cssText = 'border-bottom: 1px solid #eee;';
        
        // Correo
        const emailCell = document.createElement('td');
        emailCell.textContent = lead.correo || lead.Correo || lead.CORREO || lead.email || lead.Email || 'sin correo';
        emailCell.style.cssText = 'padding: 12px;';
        row.appendChild(emailCell);
        
        // Nombre
        const nameCell = document.createElement('td');
        nameCell.textContent = lead.nombre || lead.Nombre || lead.NOMBRE || 'sin nombre';
        nameCell.style.cssText = 'padding: 12px;';
        row.appendChild(nameCell);
        
        // Teléfono
        const phoneCell = document.createElement('td');
        phoneCell.textContent = lead[phoneColumn] || 'sin telefono';
        phoneCell.style.cssText = 'padding: 12px;';
        row.appendChild(phoneCell);
        
        // Provincia
        const provinceCell = document.createElement('td');
        provinceCell.textContent = lead.provincia || lead.Provincia || lead.PROVINCIA || lead.estado || lead.Estado || 'provincia o estado no especificado';
        provinceCell.style.cssText = 'padding: 12px;';
        row.appendChild(provinceCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    section.appendChild(tableContainer);
    
    // Insertar ANTES del título "Distribución de Leads"
    const distributionTitle = distributionResults.querySelector('h4');
    if (distributionTitle) {
        distributionTitle.insertAdjacentElement('beforebegin', section);
    } else {
        distributionResults.insertBefore(section, distributionResults.firstChild);
    }
}

// Función para mostrar la distribución
export function displayDistribution(distribution) {
    const distributionGrid = document.getElementById('distributionGrid');
    const downloadButtons = document.getElementById('downloadButtons');
    
    // Limpiar contenido anterior (pero mantener la sección de duplicados)
    distributionGrid.innerHTML = '';
    downloadButtons.innerHTML = '';
    
    // Asegurar que el título "Distribución de Leads" esté presente
    const distResults = document.getElementById('distributionResults');
    if (distResults) {
        let distributionTitle = distResults.querySelector('h4');
        if (!distributionTitle) {
            distributionTitle = document.createElement('h4');
            distributionTitle.textContent = 'Distribución de Leads';
            const duplicatesSection = document.getElementById('duplicatesTableSection');
            if (duplicatesSection) {
                duplicatesSection.insertAdjacentElement('afterend', distributionTitle);
            } else {
                distResults.insertBefore(distributionTitle, distResults.firstChild);
            }
        }
    }
    
    // Mostrar tarjetas de distribución
    distribution.forEach(seller => {
        const card = document.createElement('div');
        card.className = 'distribution-card';
        card.innerHTML = `
            <div class="seller-number">Vendedor ${seller.sellerNumber}</div>
            <div class="lead-count">${seller.count}</div>
            <div class="lead-label">Leads asignados</div>
        `;
        distributionGrid.appendChild(card);
        
        // Crear botón de descarga
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-download';
        downloadBtn.textContent = `📥 Vendedor ${seller.sellerNumber} (${seller.count})`;
        downloadBtn.onclick = () => downloadSellerCSV(seller.sellerNumber);
        downloadButtons.appendChild(downloadBtn);
    });
    
    // Mostrar sección de resultados
    if (distResults) {
        distResults.style.display = 'block';
        distResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

