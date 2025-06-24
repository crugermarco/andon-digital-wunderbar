let autoRefreshInterval;

const GOOGLE_SHEETS_CONFIG = {
    apiKey: 'AIzaSyBYw2gwhaxFI6JgXZFRFkKcu5n6-mOvwV4', 
    spreadsheetId: '16bdhcjyctw5KLoleLAd4_vkw8eKqedxLHulWO1kEGJ8', 
    range: 'Sheet1!A1:K11', 
};

const mockData = [
    ["https://www.haas.com.mx/wp-content/uploads/2022/09/HAAS-VF-1.png?w=400", "MT", "maquina cnc #1"],
    ["https://www.haas.com.mx/wp-content/uploads/2022/09/HAAS-VF-1.png?w=400", "IN PROGRESS", "maquina cnc #2"],
    ["https://www.haas.com.mx/wp-content/uploads/2022/09/HAAS-VF-1.png?w=400", "OPERATIVO", "maquina cnc #3"],
    ["https://www.haas.com.mx/wp-content/uploads/2022/09/HAAS-VF-1.png?w=400", "MT", "maquina cnc #4"],
    ["https://www.haas.com.mx/wp-content/uploads/2022/09/HAAS-VF-1.png?w=400", "IN PROGRESS", "maquina cnc #5"],
    ["https://www.haas.com.mx/wp-content/uploads/2022/09/HAAS-VF-1.png?w=400", "OPERATIVO", "maquina cnc #6"]
];

async function getSheetData() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${GOOGLE_SHEETS_CONFIG.range}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values) {
            return data.values.slice(1); 
        } else {
            throw new Error('No se encontraron datos');
        }
    } catch (error) {
        console.warn('Error conectando con Google Sheets, usando datos de ejemplo:', error);
        return mockData; 
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = timeString;
}

function getStatusClass(status) {
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes('MT')) return 'status-mt';
    if (statusUpper.includes('IN PROGRESS')) return 'status-progress';
    return 'status-neutral';
}

function getStatusColor(status) {
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes('MT')) return '#ff4757';
    if (statusUpper.includes('IN PROGRESS')) return '#4CAF50';
    return '#9E9E9E';
}

function createMachineCard(imgUrl, status, name, index) {
    const statusClass = getStatusClass(status);
    const statusColor = getStatusColor(status);
    
    return `
        <div class="machine-card fade-in" style="--status-color: ${statusColor}; animation-delay: ${index * 0.1}s">
            <div class="machine-image">
                ${imgUrl && imgUrl.startsWith('http') 
                    ? `<img src="${imgUrl}" alt="${name}" onerror="this.parentElement.innerHTML='<div class=placeholder>📷 Sin Imagen</div>'">`
                    : '<div class="placeholder">📷 Sin Imagen</div>'
                }
            </div>
            <div class="machine-name">${name}</div>
            <div class="status-badge ${statusClass}">${status}</div>
            <div class="machine-details">
                <div class="detail-item">
                    <span>🏷️</span>
                    <span>ID: M${String(index + 1).padStart(3, '0')}</span>
                </div>
                <div class="detail-item">
                    <span>⚡</span>
                    <span>${status.includes('MT') ? 'Alerta' : status.includes('PROGRESS') ? 'Activo' : 'Normal'}</span>
                </div>
            </div>
        </div>
    `;
}

async function loadData() {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Actualizando datos...</p>
        </div>
    `;

    try {
        const data = await getSheetData();
        
        let cardsHTML = '<div class="machines-grid">';
        
        data.forEach((row, index) => {
            if (row.length >= 2) {
                const imgUrl = row[0] || '';
                const status = row[1] || 'DESCONOCIDO';
                const name = row[2] || `Máquina ${index + 1}`;
                
                cardsHTML += createMachineCard(imgUrl, status, name, index);
            }
        });
        
        cardsHTML += '</div>';
        content.innerHTML = cardsHTML;
        
        document.getElementById('total-machines').textContent = `${data.length} Máquinas`;
        
        document.getElementById('last-update-time').textContent = new Date().toLocaleTimeString('es-MX');
        
    } catch (error) {
        content.innerHTML = `
            <div class="error-message">
                ❌ Error al cargar los datos: ${error.message}
                <br><br>
                <button class="btn-refresh" onclick="loadData()">Reintentar</button>
            </div>
        `;
    }
}

function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(loadData, 60000);
}

function init() {
    updateClock();
    setInterval(updateClock, 1000); 
    loadData();
    startAutoRefresh();
}

window.addEventListener('load', init);

window.addEventListener('beforeunload'), () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}
}