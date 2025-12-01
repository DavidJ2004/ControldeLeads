// Módulo para gestión de distribución de leads entre vendedores
import { AppState } from './config.js';
import { showError } from './utils.js';
import { downloadSellerCSV } from './csvExporter.js';
import { saveLeadsToSupabase, isSupabaseConfigured } from './supabaseManager.js';
import { detectPhoneColumns } from './phoneNormalizer.js';

// Función para dividir los leads entre vendedores
export function distributeLeads() {
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
            
            // Mostrar mensaje discreto en la interfaz
            showSupabaseSaveMessage(result);
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

// Función para mostrar la distribución
export function displayDistribution(distribution) {
    const distributionGrid = document.getElementById('distributionGrid');
    const downloadButtons = document.getElementById('downloadButtons');
    
    // Limpiar contenido anterior
    distributionGrid.innerHTML = '';
    downloadButtons.innerHTML = '';
    
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
    const distributionResults = document.getElementById('distributionResults');
    if (distributionResults) {
        distributionResults.style.display = 'block';
        distributionResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

