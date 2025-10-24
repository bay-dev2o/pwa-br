// IndexedDB setup
const DB_NAME = 'EmployeeDB';
const DB_VERSION = 1;
const STORE_NAME = 'employees';

let db;

// Open IndexedDB connection
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('nik', 'nik', { unique: true });
                store.createIndex('nama', 'nama', { unique: false });
                store.createIndex('statusKeluarga', 'statusKeluarga', { unique: false });
            }
        };
    });
}

// Add employee to IndexedDB
function addEmployee(employee) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(employee);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Get all employees from IndexedDB
function getAllEmployees() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Update employee in IndexedDB
function updateEmployee(employee) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(employee);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Delete employee from IndexedDB
function deleteEmployee(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Get employee by ID
function getEmployeeById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// DOM Elements
const form = document.getElementById('employee-form');
const nikInput = document.getElementById('nik');
const namaInput = document.getElementById('nama');
const teleponInput = document.getElementById('telepon');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const getLocationBtn = document.getElementById('getLocationBtn');
const statusKeluargaInputs = document.querySelectorAll('input[name="statusKeluarga"]');
const pendidikanSelect = document.getElementById('pendidikan');
const pendidikanLainnyaInput = document.getElementById('pendidikan-lainnya');
const educationOtherContainer = document.getElementById('education-other-container');
const employeeList = document.getElementById('employee-list');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');
const statsToggle = document.getElementById('stats-toggle');
const statsSection = document.getElementById('stats-section');
const exportBtn = document.getElementById('export-btn');
const globeContainer = document.getElementById('globe-container');
const heartAnimation = document.getElementById('heart-animation');
const notificationContainer = document.getElementById('notification-container');
const offlineIndicator = document.getElementById('offline-indicator');

// Error message elements
const nikError = document.getElementById('nik-error');
const namaError = document.getElementById('nama-error');
const teleponError = document.getElementById('telepon-error');
const alamatError = document.getElementById('alamat-error');
const statusError = document.getElementById('status-error');
const pendidikanError = document.getElementById('pendidikan-error');

// Statistic elements
const totalEmployeesEl = document.getElementById('total-employees');
const marriedCountEl = document.getElementById('married-count');
const singleCountEl = document.getElementById('single-count');
const avgEducationEl = document.getElementById('avg-education');

// Current editing employee ID
let currentEditId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Open database
        await openDB();
        
        // Load employees
        await loadEmployees();
        
        // Load statistics
        await updateStatistics();
        
        // Set up event listeners
        setupEventListeners();
        
        // Check offline status
        updateOfflineStatus();
        
        // Set up service worker update notification
        setupServiceWorkerUpdate();
        
        // Auto-save draft
        setupAutoSave();
        
        console.log('Aplikasi dimuat dengan sukses');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Gagal memuat aplikasi. Silakan refresh halaman.', 'error');
    }
});

// Set up event listeners
function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', handleFormSubmit);
    
    // Form reset
    form.addEventListener('reset', resetForm);
    
    // Real-time validation
    nikInput.addEventListener('input', validateNIK);
    namaInput.addEventListener('input', validateNama);
    teleponInput.addEventListener('input', validateTelepon);
    latitudeInput.addEventListener('input', validateAlamat);
    longitudeInput.addEventListener('input', validateAlamat);
    
    // Status keluarga selection
    statusKeluargaInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.checked) {
                showHeartAnimation();
            }
        });
    });
    
    // Pendidikan selection
    pendidikanSelect.addEventListener('change', () => {
        if (pendidikanSelect.value === 'Lainnya') {
            educationOtherContainer.classList.add('show');
            pendidikanLainnyaInput.focus();
        } else {
            educationOtherContainer.classList.remove('show');
        }
        validatePendidikan();
    });
    
    // Get location button
    getLocationBtn.addEventListener('click', getLocation);
    
    // Search input
    searchInput.addEventListener('input', handleSearch);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Stats toggle
    statsToggle.addEventListener('click', toggleStats);
    
    // Export button
    exportBtn.addEventListener('click', exportData);
    
    // Offline status
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const isNIKValid = validateNIK();
    const isNamaValid = validateNama();
    const isTeleponValid = validateTelepon();
    const isAlamatValid = validateAlamat();
    const isStatusValid = validateStatus();
    const isPendidikanValid = validatePendidikan();
    
    if (!isNIKValid || !isNamaValid || !isTeleponValid || !isAlamatValid || !isStatusValid || !isPendidikanValid) {
        showNotification('Harap perbaiki kesalahan pada formulir sebelum menyimpan.', 'error');
        return;
    }
    
    try {
        // Get form data
        const employee = {
            nik: nikInput.value,
            nama: namaInput.value,
            telepon: teleponInput.value,
            latitude: parseFloat(latitudeInput.value),
            longitude: parseFloat(longitudeInput.value),
            statusKeluarga: document.querySelector('input[name="statusKeluarga"]:checked').value,
            pendidikan: pendidikanSelect.value === 'Lainnya' ? pendidikanLainnyaInput.value : pendidikanSelect.value,
            createdAt: new Date().toISOString()
        };
        
        if (currentEditId) {
            // Update existing employee
            employee.id = currentEditId;
            await updateEmployee(employee);
            showNotification('Data karyawan berhasil diperbarui!', 'success');
            currentEditId = null;
        } else {
            // Add new employee
            await addEmployee(employee);
            showNotification('Data karyawan berhasil disimpan!', 'success');
        }
        
        // Reset form
        resetForm();
        
        // Reload employees
        await loadEmployees();
        
        // Update statistics
        await updateStatistics();
        
        // Clear auto-save
        localStorage.removeItem('employeeDraft');
    } catch (error) {
        console.error('Error saving employee:', error);
        showNotification('Gagal menyimpan data karyawan. Silakan coba lagi.', 'error');
    }
}

// Reset form
function resetForm() {
    form.reset();
    currentEditId = null;
    document.querySelector('button[type="submit"]').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Simpan Data Karyawan
    `;
    
    // Hide error messages
    hideAllErrors();
    
    // Hide additional education field
    educationOtherContainer.classList.remove('show');
    
    // Hide globe and heart animations
    globeContainer.classList.add('hidden');
    heartAnimation.classList.add('hidden');
}

// Validation functions
function validateNIK() {
    const nik = nikInput.value.trim();
    const isValid = /^\d{16}$/.test(nik);
    
    if (nik.length === 0) {
        showError(nikError, 'NIK harus diisi');
        nikInput.classList.add('error');
        return false;
    }
    
    if (!isValid) {
        showError(nikError, 'NIK harus 16 digit angka');
        nikInput.classList.add('error');
        return false;
    }
    
    hideError(nikError);
    nikInput.classList.remove('error');
    return true;
}

function validateNama() {
    const nama = namaInput.value.trim();
    const isValid = /^[a-zA-Z\s]+$/.test(nama) && nama.length >= 5 && nama.length <= 50 && nama.length !== 4;
    
    if (nama.length === 0) {
        showError(namaError, 'Nama lengkap harus diisi');
        namaInput.classList.add('error');
        return false;
    }
    
    if (!/^[a-zA-Z\s]+$/.test(nama)) {
        showError(namaError, 'Nama hanya boleh mengandung huruf dan spasi');
        namaInput.classList.add('error');
        return false;
    }
    
    if (nama.length < 5) {
        showError(namaError, 'Nama minimal 5 karakter');
        namaInput.classList.add('error');
        return false;
    }
    
    if (nama.length > 50) {
        showError(namaError, 'Nama maksimal 50 karakter');
        namaInput.classList.add('error');
        return false;
    }
    
    if (nama.length === 4) {
        showError(namaError, 'Nama tidak boleh tepat 4 karakter');
        namaInput.classList.add('error');
        return false;
    }
    
    hideError(namaError);
    namaInput.classList.remove('error');
    return true;
}

function validateTelepon() {
    const telepon = teleponInput.value.trim();
    const isValid = /^\d+$/.test(telepon);
    
    if (telepon.length === 0) {
        showError(teleponError, 'Nomor telepon harus diisi');
        teleponInput.classList.add('error');
        return false;
    }
    
    if (!isValid) {
        showError(teleponError, 'Nomor telepon hanya boleh angka');
        teleponInput.classList.add('error');
        return false;
    }
    
    hideError(teleponError);
    teleponInput.classList.remove('error');
    return true;
}

function validateAlamat() {
    const latitude = latitudeInput.value.trim();
    const longitude = longitudeInput.value.trim();
    
    if (latitude.length === 0 || longitude.length === 0) {
        showError(alamatError, 'Koordinat harus diisi');
        latitudeInput.classList.add('error');
        longitudeInput.classList.add('error');
        return false;
    }
    
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
        showError(alamatError, 'Latitude harus antara -90 dan 90');
        latitudeInput.classList.add('error');
        return false;
    }
    
    if (isNaN(lon) || lon < -180 || lon > 180) {
        showError(alamatError, 'Longitude harus antara -180 dan 180');
        longitudeInput.classList.add('error');
        return false;
    }
    
    hideError(alamatError);
    latitudeInput.classList.remove('error');
    longitudeInput.classList.remove('error');
    return true;
}

function validateStatus() {
    const status = document.querySelector('input[name="statusKeluarga"]:checked');
    
    if (!status) {
        showError(statusError, 'Pilih status keluarga');
        return false;
    }
    
    hideError(statusError);
    return true;
}

function validatePendidikan() {
    const pendidikan = pendidikanSelect.value;
    
    if (!pendidikan) {
        showError(pendidikanError, 'Pilih tingkat pendidikan');
        return false;
    }
    
    if (pendidikan === 'Lainnya' && !pendidikanLainnyaInput.value.trim()) {
        showError(pendidikanError, 'Masukkan pendidikan lainnya');
        return false;
    }
    
    hideError(pendidikanError);
    return true;
}

// Show error message
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

// Hide error message
function hideError(element) {
    element.textContent = '';
    element.classList.remove('show');
}

// Hide all error messages
function hideAllErrors() {
    hideError(nikError);
    hideError(namaError);
    hideError(teleponError);
    hideError(alamatError);
    hideError(statusError);
    hideError(pendidikanError);
    
    // Remove error classes
    nikInput.classList.remove('error');
    namaInput.classList.remove('error');
    teleponInput.classList.remove('error');
    latitudeInput.classList.remove('error');
    longitudeInput.classList.remove('error');
}

// Get location using Geolocation API
function getLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation tidak didukung oleh browser Anda.', 'error');
        return;
    }
    
    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = '<div class="spinner"></div> Mendapatkan lokasi...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            latitudeInput.value = position.coords.latitude.toFixed(6);
            longitudeInput.value = position.coords.longitude.toFixed(6);
            
            // Show globe visualization
            globeContainer.classList.remove('hidden');
            
            // Validate address
            validateAlamat();
            
            showNotification('Lokasi berhasil didapatkan!', 'success');
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Ambil Lokasi Otomatis
            `;
        },
        (error) => {
            console.error('Geolocation error:', error);
            showNotification('Gagal mendapatkan lokasi. Silakan masukkan secara manual.', 'error');
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Ambil Lokasi Otomatis
            `;
        }
    );
}

// Show heart animation
function showHeartAnimation() {
    heartAnimation.classList.remove('hidden');
    setTimeout(() => {
        heartAnimation.classList.add('hidden');
    }, 3000);
}

// Load employees from database
async function loadEmployees(query = '') {
    try {
        const employees = await getAllEmployees();
        renderEmployeeList(employees, query);
    } catch (error) {
        console.error('Error loading employees:', error);
        showNotification('Gagal memuat data karyawan.', 'error');
    }
}

// Render employee list
function renderEmployeeList(employees, query = '') {
    // Filter employees based on search query
    let filteredEmployees = employees;
    if (query) {
        filteredEmployees = employees.filter(employee => 
            employee.nama.toLowerCase().includes(query.toLowerCase()) ||
            employee.nik.includes(query)
        );
    }
    
    if (filteredEmployees.length === 0) {
        employeeList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>${query ? 'Tidak ada karyawan yang cocok dengan pencarian' : 'Belum ada data karyawan'}</p>
            </div>
        `;
        return;
    }
    
    // Sort employees by creation date (newest first)
    filteredEmployees.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    employeeList.innerHTML = filteredEmployees.map(employee => `
        <div class="employee-card" data-id="${employee.id}">
            <div class="employee-header">
                <div>
                    <h3 class="employee-name">${employee.nama}</h3>
                    <p class="employee-nik">NIK: ${employee.nik}</p>
                </div>
            </div>
            
            <div class="employee-details">
                <div class="detail-item">
                    <span class="detail-label">Telepon:</span>
                    <span class="detail-value">${employee.telepon}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Koordinat:</span>
                    <span class="detail-value">${employee.latitude.toFixed(4)}, ${employee.longitude.toFixed(4)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${employee.statusKeluarga}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pendidikan:</span>
                    <span class="detail-value">${employee.pendidikan}</span>
                </div>
            </div>
            
            <div class="employee-actions">
                <button class="card-btn edit-btn" onclick="editEmployee(${employee.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="card-btn delete-btn" onclick="deleteEmployeeConfirm(${employee.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Handle search
function handleSearch() {
    const query = searchInput.value.trim();
    loadEmployees(query);
}

// Edit employee
async function editEmployee(id) {
    try {
        const employee = await getEmployeeById(id);
        if (!employee) {
            showNotification('Data karyawan tidak ditemukan.', 'error');
            return;
        }
        
        // Fill form with employee data
        nikInput.value = employee.nik;
        namaInput.value = employee.nama;
        teleponInput.value = employee.telepon;
        latitudeInput.value = employee.latitude;
        longitudeInput.value = employee.longitude;
        
        // Set status keluarga
        document.querySelector(`input[name="statusKeluarga"][value="${employee.statusKeluarga}"]`).checked = true;
        
        // Set pendidikan
        if (['SD', 'SMP', 'SMA/SMK', 'Diploma', 'S1', 'S2', 'S3'].includes(employee.pendidikan)) {
            pendidikanSelect.value = employee.pendidikan;
            educationOtherContainer.classList.remove('show');
        } else {
            pendidikanSelect.value = 'Lainnya';
            pendidikanLainnyaInput.value = employee.pendidikan;
            educationOtherContainer.classList.add('show');
        }
        
        // Set current edit ID
        currentEditId = id;
        
        // Change submit button text
        document.querySelector('button[type="submit"]').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Perbarui Data Karyawan
        `;
        
        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        
        showNotification('Mode edit aktif. Perbarui data dan simpan.', 'success');
    } catch (error) {
        console.error('Error editing employee:', error);
        showNotification('Gagal memuat data karyawan untuk diedit.', 'error');
    }
}

// Delete employee confirmation
function deleteEmployeeConfirm(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) {
        deleteEmployeeById(id);
    }
}

// Delete employee by ID
async function deleteEmployeeById(id) {
    try {
        await deleteEmployee(id);
        showNotification('Data karyawan berhasil dihapus!', 'success');
        await loadEmployees();
        await updateStatistics();
    } catch (error) {
        console.error('Error deleting employee:', error);
        showNotification('Gagal menghapus data karyawan.', 'error');
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    themeToggle.innerHTML = newTheme === 'dark' ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    ` : `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
    `;
}

// Toggle stats section
function toggleStats() {
    statsSection.classList.toggle('hidden');
    
    // Update button icon based on visibility
    const isVisible = !statsSection.classList.contains('hidden');
    statsToggle.innerHTML = isVisible ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    ` : `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
    `;
}

// Update statistics
async function updateStatistics() {
    try {
        const employees = await getAllEmployees();
        
        // Total employees
        totalEmployeesEl.textContent = employees.length;
        
        // Count by status
        let marriedCount = 0;
        let singleCount = 0;
        
        employees.forEach(employee => {
            if (employee.statusKeluarga === 'Menikah') {
                marriedCount++;
            } else {
                singleCount++;
            }
        });
        
        marriedCountEl.textContent = marriedCount;
        singleCountEl.textContent = singleCount;
        
        // Average education level
        if (employees.length > 0) {
            const educationLevels = {
                'SD': 1,
                'SMP': 2,
                'SMA/SMK': 3,
                'Diploma': 4,
                'S1': 5,
                'S2': 6,
                'S3': 7
            };
            
            let totalLevel = 0;
            let count = 0;
            
            employees.forEach(employee => {
                const level = educationLevels[employee.pendidikan] || 0;
                if (level > 0) {
                    totalLevel += level;
                    count++;
                }
            });
            
            if (count > 0) {
                const avgLevel = totalLevel / count;
                const educationNames = Object.keys(educationLevels);
                const avgEducation = educationNames.find(key => educationLevels[key] >= avgLevel) || 'SD';
                avgEducationEl.textContent = avgEducation;
            } else {
                avgEducationEl.textContent = '-';
            }
        } else {
            avgEducationEl.textContent = '-';
        }
        
        // Animate statistics
        animateValue(totalEmployeesEl, 0, employees.length, 1000);
        animateValue(marriedCountEl, 0, marriedCount, 1000);
        animateValue(singleCountEl, 0, singleCount, 1000);
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// Animate numeric value
function animateValue(element, start, end, duration) {
    if (start === end) return;
    
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

// Export data to JSON
function exportData() {
    getAllEmployees()
        .then(employees => {
            const dataStr = JSON.stringify(employees, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'data-karyawan.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNotification('Data berhasil diekspor!', 'success');
        })
        .catch(error => {
            console.error('Error exporting data:', error);
            showNotification('Gagal mengekspor data.', 'error');
        });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        ${type === 'success' ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        ` : `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        `}
        ${message}
    `;
    
    notificationContainer.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Update offline status indicator
function updateOfflineStatus() {
    if (navigator.onLine) {
        offlineIndicator.classList.add('hidden');
    } else {
        offlineIndicator.classList.remove('hidden');
    }
}

// Set up service worker update notification
function setupServiceWorkerUpdate() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            showNotification('Versi baru tersedia. Refresh halaman untuk memperbarui.', 'success');
        });
    }
}

// Set up auto-save draft
function setupAutoSave() {
    // Save draft every 2 seconds
    setInterval(() => {
        if (nikInput.value || namaInput.value || teleponInput.value || 
            latitudeInput.value || longitudeInput.value) {
            
            const draft = {
                nik: nikInput.value,
                nama: namaInput.value,
                telepon: teleponInput.value,
                latitude: latitudeInput.value,
                longitude: longitudeInput.value,
                statusKeluarga: document.querySelector('input[name="statusKeluarga"]:checked')?.value || '',
                pendidikan: pendidikanSelect.value,
                pendidikanLainnya: pendidikanLainnyaInput.value
            };
            
            localStorage.setItem('employeeDraft', JSON.stringify(draft));
        }
    }, 2000);
    
    // Load draft if exists
    const draft = localStorage.getItem('employeeDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            nikInput.value = data.nik || '';
            namaInput.value = data.nama || '';
            teleponInput.value = data.telepon || '';
            latitudeInput.value = data.latitude || '';
            longitudeInput.value = data.longitude || '';
            
            if (data.statusKeluarga) {
                const statusInput = document.querySelector(`input[name="statusKeluarga"][value="${data.statusKeluarga}"]`);
                if (statusInput) statusInput.checked = true;
            }
            
            pendidikanSelect.value = data.pendidikan || '';
            if (data.pendidikan === 'Lainnya') {
                educationOtherContainer.classList.add('show');
                pendidikanLainnyaInput.value = data.pendidikanLainnya || '';
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }
}

// Spinner for loading states
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(spinnerStyle);

// Make functions available globally for inline event handlers
window.editEmployee = editEmployee;
window.deleteEmployeeConfirm = deleteEmployeeConfirm;