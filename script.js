// Store parking slots
let parkingSlots = [];

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSlots();
    displaySlots();
    updateStats();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        displaySlots();
        updateStats();
        showToast('Data refreshed successfully', 'success');
    });
});

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}

// Add Parking Slot
document.getElementById('addSlotForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const slotNo = document.getElementById('slotNo').value.trim();
    const isCovered = document.getElementById('isCovered').checked;
    const isEVCharging = document.getElementById('isEVCharging').checked;
    
    // Validate
    if (!slotNo) {
        showToast('Please enter a slot number', 'error');
        return;
    }
    
    // Check duplicate
    if (parkingSlots.some(slot => slot.slotNo === slotNo)) {
        showToast('Slot number already exists', 'error');
        return;
    }
    
    // Create slot
    const slot = {
        slotNo,
        isCovered,
        isEVCharging,
        isOccupied: false,
        timestamp: new Date().toISOString()
    };
    
    parkingSlots.push(slot);
    saveSlots();
    displaySlots();
    updateStats();
    updateLastUpdate();
    
    // Reset form
    document.getElementById('addSlotForm').reset();
    
    showToast('Parking slot added successfully', 'success');
});

// Park Vehicle
document.getElementById('parkVehicleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const needsEV = document.getElementById('needsEV').checked;
    const needsCover = document.getElementById('needsCover').checked;
    
    parkVehicle(needsEV, needsCover);
});

// Park Vehicle Function
function parkVehicle(needsEV, needsCover) {
    // Get available slots
    let availableSlots = parkingSlots
        .map((slot, index) => ({ ...slot, originalIndex: index }))
        .filter(slot => !slot.isOccupied);
    
    if (availableSlots.length === 0) {
        showResult('No slot available', false);
        return;
    }
    
    // Filter by requirements
    if (needsEV) {
        availableSlots = availableSlots.filter(slot => slot.isEVCharging);
    }
    
    if (needsCover) {
        availableSlots = availableSlots.filter(slot => slot.isCovered);
    }
    
    if (availableSlots.length === 0) {
        showResult('No slot available', false);
        return;
    }
    
    // Allocate nearest (first available)
    const allocatedSlot = availableSlots[0];
    parkingSlots[allocatedSlot.originalIndex].isOccupied = true;
    
    saveSlots();
    displaySlots();
    updateStats();
    updateLastUpdate();
    
    showResult(allocatedSlot, true);
}

// Display Slots in Table
function displaySlots() {
    const container = document.getElementById('slotsDisplay');
    
    if (parkingSlots.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Parking Slots Available</h3>
                <p>Start by adding your first parking slot using the form above.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="slots-table">
            <thead>
                <tr>
                    <th><i class="fas fa-hashtag"></i> Slot Number</th>
                    <th><i class="fas fa-info-circle"></i> Status</th>
                    <th><i class="fas fa-star"></i> Features</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    parkingSlots.forEach((slot, index) => {
        const features = [];
        if (slot.isCovered) features.push('<span class="feature-tag"><i class="fas fa-shield-alt"></i> Covered</span>');
        if (slot.isEVCharging) features.push('<span class="feature-tag"><i class="fas fa-bolt"></i> EV Charging</span>');
        if (!slot.isCovered && !slot.isEVCharging) features.push('<span class="feature-tag"><i class="fas fa-car"></i> Standard</span>');
        
        html += `
            <tr>
                <td><span class="slot-number">${slot.slotNo}</span></td>
                <td>
                    <span class="badge ${slot.isOccupied ? 'badge-danger' : 'badge-success'}">
                        <i class="fas ${slot.isOccupied ? 'fa-times-circle' : 'fa-check-circle'}"></i>
                        ${slot.isOccupied ? 'Occupied' : 'Available'}
                    </span>
                </td>
                <td>
                    <div class="feature-tags">
                        ${features.join('')}
                    </div>
                </td>
                <td>
                    ${slot.isOccupied ? 
                        `<button class="btn btn-danger" onclick="removeVehicle(${index})">
                            <i class="fas fa-times"></i> Free Slot
                        </button>` :
                        `<button class="btn btn-success" onclick="parkInSlot(${index})">
                            <i class="fas fa-car"></i> Park Here
                        </button>`
                    }
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Park in specific slot
function parkInSlot(index) {
    if (parkingSlots[index].isOccupied) {
        showToast('This slot is already occupied', 'error');
        return;
    }
    
    parkingSlots[index].isOccupied = true;
    saveSlots();
    displaySlots();
    updateStats();
    updateLastUpdate();
    
    showResult(parkingSlots[index], true);
}

// Remove vehicle
function removeVehicle(index) {
    if (!parkingSlots[index].isOccupied) {
        showToast('This slot is already empty', 'error');
        return;
    }
    
    const slotNo = parkingSlots[index].slotNo;
    parkingSlots[index].isOccupied = false;
    
    saveSlots();
    displaySlots();
    updateStats();
    updateLastUpdate();
    
    showToast(`Slot ${slotNo} is now available`, 'success');
    
    // Hide result
    document.getElementById('resultCard').style.display = 'none';
}

// Show Result
function showResult(data, isSuccess) {
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    
    resultCard.style.display = 'block';
    
    if (!isSuccess) {
        resultContent.innerHTML = `
            <div class="result-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${data}</h3>
                <p>Please adjust your requirements or add more parking slots.</p>
            </div>
        `;
    } else {
        const features = [];
        if (data.isCovered) features.push('Covered Parking');
        if (data.isEVCharging) features.push('EV Charging Available');
        
        resultContent.innerHTML = `
            <div class="result-success">
                <i class="fas fa-check-circle"></i>
                <h3>Vehicle Parked Successfully!</h3>
                <div class="slot-details">
                    <p><strong>Allocated Slot:</strong> <strong>${data.slotNo}</strong></p>
                    ${features.length > 0 ? `<p><strong>Features:</strong> ${features.join(' • ')}</p>` : ''}
                    <p style="color: var(--text-gray); margin-top: 1rem;">
                        <i class="fas fa-clock"></i> Parked at ${new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        `;
    }
    
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Update Statistics
function updateStats() {
    const total = parkingSlots.length;
    const occupied = parkingSlots.filter(s => s.isOccupied).length;
    const available = total - occupied;
    
    document.getElementById('totalSlots').textContent = total;
    document.getElementById('availableSlots').textContent = available;
    document.getElementById('occupiedSlots').textContent = occupied;
}

// Update Last Update Time
function updateLastUpdate() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = timeStr;
}

// Save to localStorage
function saveSlots() {
    localStorage.setItem('parkingSlots', JSON.stringify(parkingSlots));
}

// Load from localStorage
function loadSlots() {
    const stored = localStorage.getItem('parkingSlots');
    if (stored) {
        parkingSlots = JSON.parse(stored);
        updateLastUpdate();
    }
}

// Toast Notification
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        font-family: 'Open Sans', sans-serif;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease-out;
    `;
    
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 300);
    }, 3000);
}
