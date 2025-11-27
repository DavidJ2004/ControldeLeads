// Módulo para gestión de distribución de leads entre vendedores
import { AppState } from './config.js';
import { showError } from './utils.js';
import { downloadSellerCSV } from './csvExporter.js';

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

