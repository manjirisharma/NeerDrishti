// ============================================
// FLOOD RISK PREDICTOR DASHBOARD - SCRIPT
// Interactive functionality with mock data
// ============================================

// Global State
const state = {
    currentSection: 'dashboard',
    userLocation: null,
    locationSource: null,
    map: null,
    uploadedFile: null,
    currentFileType: 'image'
};

// Mock Data
const mockData = {
    locations: [
        { name: 'Lucknow, Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
        { name: 'Kanpur, Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
        { name: 'Agra, Uttar Pradesh', lat: 27.1767, lng: 78.0081 }
    ],
    riskLevels: ['minimal', 'low', 'guarded', 'elevated', 'severe', 'extreme'],
    riskData: {
        minimal: { status: 'SAFE', confidence: 94, color: '#22c55e' },
        low: { status: 'LOW RISK', confidence: 88, color: '#84cc16' },
        guarded: { status: 'GUARDED', confidence: 82, color: '#eab308' },
        elevated: { status: 'WARNING', confidence: 76, color: '#f97316' },
        severe: { status: 'DANGER', confidence: 85, color: '#ef4444' },
        extreme: { status: 'EXTREME', confidence: 91, color: '#7f1d1d' }
    },
    chatbotResponses: {
        'emergency numbers': {
            message: 'Here are the emergency contact numbers:\n\n🚨 National Emergency: 1077\n📞 NDRF Helpline: 011-26167177\n🏛️ State Disaster Control: 1070\n🏥 Health Emergency: 108\n\nPlease save these numbers and call immediately if you need assistance.',
            delay: 800
        },
        'nearest shelter': {
            message: 'Based on your location in Lucknow, here are nearby relief centers:\n\n1. District Magistrate Office - 2.3 km\n2. Community Center, Gomti Nagar - 3.1 km\n3. Government School, Hazratganj - 4.5 km\n\nAll centers are equipped with basic amenities, medical aid, and food supplies.',
            delay: 1000
        },
        'safety tips': {
            message: '🛡️ Essential Flood Safety Tips:\n\n1. Move to higher ground immediately\n2. Never walk through floodwater (6 inches can knock you down)\n3. Avoid driving through flooded areas\n4. Keep emergency kit ready (water, medicine, flashlight)\n5. Stay informed via official channels\n6. Turn off utilities if instructed\n7. Don\'t touch electrical equipment if wet\n\nStay safe!',
            delay: 1200
        },
        'default': {
            message: 'I can help you with:\n\n• Emergency contact numbers\n• Nearest relief shelters\n• Flood safety guidelines\n• Risk assessment information\n• Evacuation procedures\n\nWhat would you like to know?',
            delay: 600
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLocationModal();
    initMap();
    initUploadSection();
    initChatbot();
    initSettings();
    initSimulationSection();
    updateLastUpdated();
    
    // Check backend availability
    checkBackendHealth();

    // Auto-refresh data every 5 minutes
    setInterval(() => {
        updateDashboardData();
        updateLastUpdated();
    }, 300000);
});

// Navigation
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const navItems = document.querySelectorAll('.nav-item');
    const mainContent = document.getElementById('mainContent');

    // Create mobile overlay
    const mobileOverlay = document.createElement('div');
    mobileOverlay.className = 'mobile-overlay';
    mobileOverlay.id = 'mobileOverlay';
    document.body.appendChild(mobileOverlay);

    // Hamburger toggle
    hamburger?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    // Close sidebar when clicking overlay
    mobileOverlay.addEventListener('click', () => {
        closeSidebar();
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target) && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        }
    });

    // Navigation items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            
            // Add click animation
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
                item.style.transform = '';
            }, 150);

            navigateToSection(section);

            // Update active state with animation
            navItems.forEach(nav => {
                nav.classList.remove('active');
                nav.style.transform = '';
            });
            
            setTimeout(() => {
                item.classList.add('active');
            }, 100);

            // Close sidebar on mobile with delay for smooth transition
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    closeSidebar();
                }, 200);
            }
        });
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    function toggleSidebar() {
        const isActive = sidebar.classList.contains('active');
        if (isActive) {
            closeSidebar();
            document.getElementsByClassName('nav-menu')[0].style.display="none";
            
        } else {
            openSidebar();
            document.getElementsByClassName('nav-menu')[0].style.display="block";
        }
    }

    function openSidebar() {
        sidebar.classList.add('active');
        hamburger.classList.add('active');
        mobileOverlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        document.body.style.overflow = 'hidden';
        
        // Add stagger animation to nav items
        navItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 50 + 100);
        });
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        hamburger.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        document.body.style.overflow = '';
        
        
        // Reset nav items
        navItems.forEach(item => {
            item.style.transition = '';
            item.style.opacity = '';
            item.style.transform = '';
        });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeSidebar();
            document.getElementsByClassName('nav-menu')[0].style.display="block";
        }else{
            document.getElementsByClassName('nav-menu')[0].style.display="none";
        }
    });
}

function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        state.currentSection = sectionId;

        // Reinitialize map if navigating to map section
        if (sectionId === 'map' && state.map) {
            setTimeout(() => {
                state.map.invalidateSize();
            }, 100);
        }
    }
}


// BACKEND INTEGRATION


async function checkBackendHealth() {
    try {
        console.log('🔍 Checking Python backend health...');
        const response = await fetch('/api/health', {
            timeout: 3000
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend online:', data.device);
            showBackendStatus(true, data);
        } else {
            throw new Error('Backend not responding');
        }
    } catch (error) {
        console.warn('⚠️ Backend offline:', error.message);
        showBackendStatus(false);
    }
}

function showBackendStatus(isOnline, data = null) {
    // Remove existing banner
    const existingBanner = document.getElementById('backendBanner');
    if (existingBanner) {
        existingBanner.remove();
    }
    
    if (!isOnline) {
        // Show offline banner
        const banner = document.createElement('div');
        banner.id = 'backendBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #ef4444, #dc2626);
            color: white;
            padding: 12px 20px;
            text-align: center;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        banner.innerHTML = `
            ⚠️ Python backend not running. Start <code>floodPredictor.py</code> for AI analysis features.
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 4px 8px;
                margin-left: 10px;
                border-radius: 4px;
                cursor: pointer;
            ">×</button>
        `;
        document.body.prepend(banner);
        
        // Adjust main content margin
        document.querySelector('.main-content').style.marginTop = '60px';
    } else {
        // Reset main content margin
        document.querySelector('.main-content').style.marginTop = '0';
        console.log(`🚀 Backend ready on ${data.device.toUpperCase()}`);
    }
}


// LOCATION MODAL & PERMISSION


function initLocationModal() {
    const modal = document.getElementById('locationModal');
    const allowBtn = document.getElementById('allowLocation');
    const denyBtn = document.getElementById('denyLocation');

    // Show modal after short delay
    setTimeout(() => {
        modal?.classList.remove('hidden');
    }, 1000);

    allowBtn?.addEventListener('click', () => {
        modal?.classList.add('hidden');
        showLocationLoading();
        initLocationFlow(); // Start location detection only after user consent
    });

    denyBtn?.addEventListener('click', () => {
        modal?.classList.add('hidden');
        useRegionalFallback(); // Use fallback location
    });
}

function showLocationLoading() {
    const info = document.getElementById('locationInfo');
    if (info) {
        info.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Detecting location...</span>
            <small style="display:block;opacity:0.7;color:#eab308;font-weight:500;margin-top:2px">
                Please wait...
            </small>
        `;
    }
}


// LOCATION FLOW (GPS → IP → FALLBACK)


function initLocationFlow() {
    requestPreciseLocation();
}

function requestPreciseLocation() {
    if (!('geolocation' in navigator)) {
        console.warn('Geolocation not supported, using IP');
        requestIPLocation();
        return;
    }

    const timeoutId = setTimeout(() => {
        console.warn('GPS timeout, switching to IP location');
        requestIPLocation();
    }, 5000); // 5 second timeout

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            clearTimeout(timeoutId);
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            console.log('GPS location detected:', lat, lng);

            try {
                const name = await reverseGeocode(lat, lng);
                
                // Check GPS accuracy - if too low, it might be fallback coordinates
                console.log(`📡 GPS Accuracy: ${accuracy} meters`);
                if (accuracy > 100000) {
                    console.warn('⚠️ GPS accuracy is very low - coordinates might be network-based fallback');
                    console.warn('🔧 TROUBLESHOOTING STEPS:');
                    console.warn('   1. Your device GPS might be cached/stuck on Lucknow');
                    console.warn('   2. Browser is using network location instead of real GPS');
                    console.warn('   3. Try: Phone Settings > Privacy & Security > Location Services > Reset');
                    console.warn('   4. Or try: Chrome Settings > Privacy > Site Settings > Location > Reset');
                    console.warn('   5. Move outside if indoors, GPS works better outdoors');
                    console.warn('🚀 SOLUTION: Look for the "Force Real GPS" button!');
                    
                    // Add button for forcing real GPS if accuracy is very low
                    if (!document.getElementById('forceGpsBtn')) {
                        const forceBtn = document.createElement('button');
                        forceBtn.id = 'forceGpsBtn';
                        forceBtn.innerHTML = '🛰️ Force Real GPS Location';
                        forceBtn.style.cssText = `
                            position: fixed;
                            top: 80px;
                            right: 20px;
                            background: #ff4444;
                            color: white;
                            border: none;
                            padding: 12px 18px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                            z-index: 9999;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            transition: all 0.3s ease;
                        `;
                        forceBtn.onclick = forceRealGPS;
                        document.body.appendChild(forceBtn);
                        
                        console.log('🔴 Added "Force Real GPS" button to screen');
                    }
                }
                
                // Detect if coordinates are suspiciously close to Lucknow center
                const lucknowLat = 26.8467;
                const lucknowLng = 80.9462;
                const distanceFromLucknow = Math.sqrt(
                    Math.pow(lat - lucknowLat, 2) + Math.pow(lng - lucknowLng, 2)
                );
                
                if (distanceFromLucknow < 0.05) { // Within ~5km of Lucknow center
                    console.warn('🏙️ DETECTED: Coordinates are in Lucknow area');
                    console.warn('❓ Are you actually in Lucknow? If not, GPS might be stuck!');
                }
                
                // CRITICAL: Set the actual GPS coordinates
                state.userLocation = { lat, lng, name, accuracy };
                state.locationSource = 'gps';
                
                console.log('✅ GPS SUCCESS - Coordinates set:', lat, lng);
                console.log('✅ State updated:', state.userLocation);
                console.log(`📍 Location: ${name}`);
                console.log(`🎯 Accuracy: ${accuracy.toFixed(2)} meters`);

                updateLocationUI();
                updateAlertsDisplay();
                
                // FORCE map update with real coordinates
                if (state.map) {
                    console.log('🗺️ Forcing map update to real GPS coordinates');
                    updateMapLocation(lat, lng);
                } else {
                    console.error('❌ Map not initialized!');
                }
            } catch (error) {
                console.error('Reverse geocoding failed, using coordinates:', error);
                // Still save location with coordinates if geocoding fails
                const fallbackName = getCountryFromCoordinates(lat, lng) + ` (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
                state.userLocation = { lat, lng, name: fallbackName, accuracy };
                state.locationSource = 'gps';
                updateLocationUI();
                updateAlertsDisplay();
                if (state.map) {
                    updateMapLocation(lat, lng);
                }
            }
        },
        (error) => {
            clearTimeout(timeoutId);
            console.warn('GPS failed:', error.message);
            requestIPLocation();
        },
        {
            enableHighAccuracy: true,  // Use precise satellite GPS instead of network
            timeout: 15000,            // Wait longer for real GPS (15 seconds)
            maximumAge: 0              // Don't use cached location - force fresh GPS
        }
    );
}

async function requestIPLocation() {
    console.log('Attempting IP-based location...');
    
    try {
        // Add timeout to IP request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch('https://ipapi.co/json/', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            throw new Error(`IP API failed: ${res.status}`);
        }
        
        const data = await res.json();
        
        console.log('IP location detected:', data.city, data.region, data.country_name);

        // Use IP data directly, but also try reverse geocoding for better accuracy
        let name = 'Unknown location';
        if (data.city && data.region && data.country_name) {
            name = `${data.city}, ${data.region}, ${data.country_name}`;
        } else if (data.city && data.country_name) {
            name = `${data.city}, ${data.country_name}`;
        } else if (data.country_name) {
            name = data.country_name;
        } else {
            // Try reverse geocoding as backup
            try {
                name = await reverseGeocode(data.latitude, data.longitude);
            } catch (e) {
                name = `${data.latitude.toFixed(2)}°, ${data.longitude.toFixed(2)}°`;
            }
        }

        state.userLocation = {
            lat: data.latitude,
            lng: data.longitude,
            name: name
        };
        state.locationSource = 'ip';
        
        console.log('✅ IP LOCATION - Coordinates set:', data.latitude, data.longitude);
        console.log('✅ IP State updated:', state.userLocation);

        updateLocationUI();
        updateAlertsDisplay(); // Update alerts with new location
        
        // FORCE map update with IP coordinates
        if (state.map) {
            console.log('🗺️ Forcing map update to IP coordinates');
            updateMapLocation(data.latitude, data.longitude);
        }
    } catch (e) {
        console.error('IP location failed:', e);
        useRegionalFallback();
    }
}

function useRegionalFallback() {
    console.log('Using regional fallback location');
    
    // DO NOT set fallback coordinates - keep null to force user permission
    state.userLocation = null;
    state.locationSource = 'fallback';
    
    console.log('❌ NO VALID COORDINATES - User must allow GPS access');

    updateLocationUI();
    updateAlertsDisplay(); // Update alerts with fallback location
    if (state.map) {
        // Just show India overview, no zones
        state.map.setView([20.5937, 78.9629], 5);
    }
}


// LOCATION UI + CONFIDENCE


function updateLocationUI() {
    const info = document.getElementById('locationInfo');
    
    if (!info || !state.userLocation) return;

    let confidenceText = '';
    let confidenceColor = '';

    if (state.locationSource === 'gps') {
        confidenceText = 'High Accuracy (GPS)';
        confidenceColor = '#22c55e';
    } else if (state.locationSource === 'ip') {
        confidenceText = 'Medium Accuracy (IP-based)';
        confidenceColor = '#eab308';
    } else {
        confidenceText = 'Low Accuracy (Regional Estimate)';
        confidenceColor = '#ef4444';
    }

    // Extract just the city from location name if possible
    let displayName = state.userLocation.name;
    if (displayName && displayName.includes(',')) {
        const parts = displayName.split(',');
        displayName = parts[0].trim(); // Show just the city part
    }

    info.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${displayName}</span>
        <small style="display:block;opacity:0.7;color:${confidenceColor};font-weight:500;margin-top:2px;font-size:11px">
            ${confidenceText}
        </small>
    `;
}


// DYNAMIC ALERTS BASED ON LOCATION


function generateLocationBasedAlerts() {
    if (!state.userLocation) return;
    
    let userCity = 'your area';
    let userState = 'your region';
    
    if (state.userLocation.name) {
        const locationParts = state.userLocation.name.split(',');
        userCity = locationParts[0]?.trim() || 'your area';
        userState = locationParts[1]?.trim() || 'your region';
    }
    
    // Generate realistic alerts based on location
    const alerts = [
        {
            type: 'severe',
            title: `Heavy Rainfall Warning - ${userCity}`,
            time: '45 minutes ago',
            message: `Intense rainfall expected in ${userCity} and surrounding areas. Water logging possible in low-lying regions.`,
            location: `${userCity}, ${userState}`
        },
        {
            type: 'elevated',
            title: `River Water Level Rising - ${userState}`,
            time: '1 hour ago',
            message: `Water levels in major rivers near ${userCity} are rising. Residents advised to stay alert and avoid river banks.`,
            location: `Near ${userCity}`
        },
        {
            type: 'extreme',
            title: `Flash Flood Alert - ${userState}`,
            time: '2 hours ago',
            message: `Sudden heavy downpour may cause flash floods in ${userState}. Immediate evacuation recommended for vulnerable areas.`,
            location: `${userState} Region`
        },
        {
            type: 'guarded',
            title: `Weather Advisory - ${userCity}`,
            time: '3 hours ago',
            message: `Moderate to heavy rain predicted in ${userCity}. Citizens advised to avoid unnecessary travel and stay indoors.`,
            location: `${userCity} District`
        },
        {
            type: 'low',
            title: `Drainage System Check - ${userCity}`,
            time: '4 hours ago',
            message: `Municipal authorities conducting drainage inspection in ${userCity}. Minor water accumulation possible in some areas.`,
            location: `${userCity} Municipal Area`
        }
    ];
    
    return alerts;
}

function updateAlertsDisplay() {
    const alertsContainer = document.querySelector('.alerts-container');
    if (!alertsContainer) return;
    
    const alerts = generateLocationBasedAlerts();
    if (!alerts) return;
    
    alertsContainer.innerHTML = alerts.map(alert => `
        <div class="alert-card ${alert.type}">
            <div class="alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </div>
            <div class="alert-content">
                <div class="alert-header">
                    <h3>${alert.title}</h3>
                    <span class="alert-time">${alert.time}</span>
                </div>
                <p>${alert.message}</p>
                <div class="alert-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${alert.location}
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// REVERSE GEOCODING (OSM)
// ============================================

async function reverseGeocode(lat, lng) {
    // Try multiple geocoding services for reliability
    const services = [
        // Service 1: BigDataCloud (free, no API key)
        async () => {
            const res = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            const data = await res.json();
            if (data.city && data.principalSubdivision) {
                return `${data.city}, ${data.principalSubdivision}, ${data.countryName}`;
            }
            if (data.locality && data.principalSubdivision) {
                return `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
            }
            return null;
        },
        
        // Service 2: OpenStreetMap Nominatim
        async () => {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
            );
            const data = await res.json();
            if (data && data.address) {
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.suburb;
                const state = addr.state;
                const country = addr.country;
                if (city && state) return `${city}, ${state}, ${country}`;
                if (city) return `${city}, ${country}`;
            }
            return null;
        },
        
        // Service 3: Coordinate-based city lookup for major cities
        async () => {
            const majorCities = {
                // India major cities
                '28.6139,77.2090': 'New Delhi, Delhi, India',
                '19.0760,72.8777': 'Mumbai, Maharashtra, India',
                '13.0827,80.2707': 'Chennai, Tamil Nadu, India',
                '22.5726,88.3639': 'Kolkata, West Bengal, India',
                '12.9716,77.5946': 'Bangalore, Karnataka, India',
                '17.3850,78.4867': 'Hyderabad, Telangana, India',
                '26.9124,75.7873': 'Jaipur, Rajasthan, India',
                '23.0225,72.5714': 'Ahmedabad, Gujarat, India',
                '18.5204,73.8567': 'Pune, Maharashtra, India',
                '26.8467,80.9462': 'Lucknow, Uttar Pradesh, India',
                // Global major cities
                '40.7128,-74.0060': 'New York, NY, USA',
                '34.0522,-118.2437': 'Los Angeles, CA, USA',
                '51.5074,-0.1278': 'London, England, UK',
                '48.8566,2.3522': 'Paris, France',
                '35.6762,139.6503': 'Tokyo, Japan',
                '55.7558,37.6173': 'Moscow, Russia',
                '39.9042,116.4074': 'Beijing, China',
                '31.2304,121.4737': 'Shanghai, China'
            };
            
            // Find closest city within 50km
            let closestCity = null;
            let minDistance = Infinity;
            
            for (const [coords, cityName] of Object.entries(majorCities)) {
                const [cityLat, cityLng] = coords.split(',').map(Number);
                const distance = Math.sqrt(
                    Math.pow(lat - cityLat, 2) + Math.pow(lng - cityLng, 2)
                );
                if (distance < 0.5 && distance < minDistance) { // ~50km radius
                    minDistance = distance;
                    closestCity = cityName;
                }
            }
            
            return closestCity;
        }
    ];
    
    // Try each service with timeout
    for (const service of services) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const result = await Promise.race([
                service(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 3000)
                )
            ]);
            
            clearTimeout(timeoutId);
            
            if (result) {
                console.log('Geocoding successful:', result);
                return result;
            }
        } catch (error) {
            console.warn('Geocoding service failed:', error.message);
            continue;
        }
    }
    
    // Ultimate fallback: Country/region based on coordinates
    const country = getCountryFromCoordinates(lat, lng);
    return `${country} (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
}

function getCountryFromCoordinates(lat, lng) {
    // Simple country detection based on coordinate ranges
    if (lat >= 8 && lat <= 37 && lng >= 68 && lng <= 97) return 'India';
    if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -66) return 'United States';
    if (lat >= 50 && lat <= 60 && lng >= -8 && lng <= 2) return 'United Kingdom';
    if (lat >= 42 && lat <= 51 && lng >= -5 && lng <= 8) return 'France';
    if (lat >= 47 && lat <= 55 && lng >= 5 && lng <= 15) return 'Germany';
    if (lat >= 35 && lat <= 46 && lng >= 139 && lng <= 146) return 'Japan';
    if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) return 'China';
    if (lat >= 41 && lat <= 82 && lng >= 19 && lng <= 169) return 'Russia';
    if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) return 'Australia';
    if (lat >= 45 && lat <= 84 && lng >= -141 && lng <= -52) return 'Canada';
    
    // Default based on hemisphere
    if (lat > 0) return 'Northern Hemisphere';
    return 'Southern Hemisphere';
}

// Map Initialization (Leaflet)
function initMap() {
    const mapElement = document.getElementById('floodMap');
    if (!mapElement) return;

    if (typeof L === 'undefined') {
        console.warn('Leaflet library (L) is not loaded. Map features require internet connection.');
        mapElement.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#94a3b8;text-align:center;padding:24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px;opacity:0.6;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <p style="font-size:1.05rem;font-weight:600;margin-bottom:4px;color:#e2e8f0;">Online Map Layer Unavailable</p>
                <p style="font-size:0.85rem;color:#64748b;">Connect to the internet to load interactive Leaflet & satellite tiles.</p>
            </div>`;
        return;
    }

    // Initialize map with India view, will update with actual location
    state.map = L.map('floodMap').setView([20.5937, 78.9629], 5);

    // 1. High-resolution Dark Mode Basemap (Base + Reference Labels - No API Key Required)
    const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 18
    });
    const darkLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 18
    });
    const darkGroup = L.layerGroup([darkBase, darkLabels]);

    // 2. High-resolution Satellite Imagery (No API Key Required)
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        maxZoom: 18
    });

    // 3. OpenStreetMap Streets (No API Key Required)
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });

    // Default to Dark Mode basemap
    darkGroup.addTo(state.map);

    // Layer switcher to toggle between Dark Mode, Satellite, and Street Map
    const baseLayers = {
        "Dark Basemap": darkGroup,
        "Satellite Imagery": satellite,
        "Street Map (OSM)": osm
    };
    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(state.map);

    // DO NOT add risk zones here - wait for real coordinates
    console.log('Map initialized - waiting for real coordinates before adding zones');

    // Click event for risk analysis
    state.map.on('click', (e) => {
        const clickedLat = e.latlng.lat;
        const clickedLng = e.latlng.lng;
        
        console.log(`🗅️ Map clicked at: ${clickedLat}, ${clickedLng}`);
        
        // Show detailed analysis for clicked location
        analyzeClickedLocation(e.latlng);
        
        // Add "Return to My Location" button if not already present
        addReturnToLocationButton();
    });
}

function analyzeClickedLocation(latlng) {
    const lat = latlng.lat;
    const lng = latlng.lng;
    
    console.log(`🔍 Analyzing clicked location: ${lat}, ${lng}`);
    
    // Get risk assessment for clicked location
    const preciseRisk = assessLocationRisk(lat, lng);
    const riskData = mockData.riskData[preciseRisk];
    const elevation = getElevationEstimate(lat, lng);
    const waterDistance = getWaterProximity(lat, lng);
    
    // Clear existing analysis markers
    state.map.eachLayer((layer) => {
        if (layer.options && layer.options.analysisMarker) {
            state.map.removeLayer(layer);
        }
    });
    
    // Add analysis marker at clicked location
    const analysisMarker = L.circleMarker([lat, lng], {
        color: riskData.color,
        fillColor: riskData.color,
        fillOpacity: 0.8,
        radius: 12,
        weight: 3,
        analysisMarker: true // Custom property to identify analysis markers
    }).addTo(state.map);
    
    // Get city name for clicked location
    reverseGeocode(lat, lng).then(locationName => {
        const popupContent = `
            <div style="min-width: 280px; font-family: Arial, sans-serif; padding: 5px;">
                <h3 style="margin: 0 0 12px 0; color: ${riskData.color}; border-bottom: 2px solid ${riskData.color}; padding-bottom: 5px;">📍 Location Analysis</h3>
                <p style="margin: 8px 0;"><strong>📍 Location:</strong> ${locationName}</p>
                <p style="margin: 8px 0;"><strong>📊 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p style="margin: 8px 0;"><strong>⚠️ Flood Risk:</strong> <span style="color: ${riskData.color}; font-weight: bold; font-size: 16px;">${riskData.status}</span></p>
                <p style="margin: 8px 0;"><strong>🏔️ Elevation:</strong> ~${elevation.toFixed(0)}m</p>
                <p style="margin: 8px 0;"><strong>💧 Water Distance:</strong> ~${waterDistance.toFixed(1)}km</p>
                <p style="margin: 8px 0;"><strong>📈 Risk Score:</strong> ${(preciseRisk * 100).toFixed(1)}%</p>
                <div style="margin-top: 12px; padding: 10px; background: ${riskData.color}15; border: 1px solid ${riskData.color}40; border-radius: 6px;">
                    <strong style="color: ${riskData.color};">💡 ${riskData.status} Risk Zone</strong><br>
                    <small style="color: #666; line-height: 1.3;">Click anywhere else on map to analyze different locations.</small>
                </div>
            </div>
        `;
        
        analysisMarker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'analysis-popup'
        }).openPopup();
    }).catch(error => {
        console.error('Geocoding failed for clicked location:', error);
        
        const popupContent = `
            <div style="min-width: 280px; font-family: Arial, sans-serif; padding: 5px;">
                <h3 style="margin: 0 0 12px 0; color: ${riskData.color}; border-bottom: 2px solid ${riskData.color}; padding-bottom: 5px;">📍 Location Analysis</h3>
                <p style="margin: 8px 0;"><strong>📊 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p style="margin: 8px 0;"><strong>⚠️ Flood Risk:</strong> <span style="color: ${riskData.color}; font-weight: bold; font-size: 16px;">${riskData.status}</span></p>
                <p style="margin: 8px 0;"><strong>🏔️ Elevation:</strong> ~${elevation.toFixed(0)}m</p>
                <p style="margin: 8px 0;"><strong>💧 Water Distance:</strong> ~${waterDistance.toFixed(1)}km</p>
                <p style="margin: 8px 0;"><strong>📈 Risk Score:</strong> ${(preciseRisk * 100).toFixed(1)}%</p>
                <div style="margin-top: 12px; padding: 10px; background: ${riskData.color}15; border: 1px solid ${riskData.color}40; border-radius: 6px;">
                    <strong style="color: ${riskData.color};">💡 ${riskData.status} Risk Zone</strong><br>
                    <small style="color: #666;">Click anywhere else on map to analyze different locations.</small>
                </div>
            </div>
        `;
        
        analysisMarker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'analysis-popup'
        }).openPopup();
    });
    
    // Generate flood zones around clicked location
    console.log(`🌊 Generating flood zones around clicked location`);
    generateFloatZonesForLocation(lat, lng);
}

function generateFloatZonesForLocation(centerLat, centerLng) {
    if (!state.map) return;
    
    // Clear existing flood zones but keep user marker and analysis markers
    state.map.eachLayer((layer) => {
        if ((layer instanceof L.Circle || layer instanceof L.Polygon) && 
            !layer.options.userMarker && 
            !layer.options.analysisMarker) {
            state.map.removeLayer(layer);
        }
    });
    
    // Generate precise zones around clicked location
    const zones = [
        {
            name: 'Immediate Area',
            lat: centerLat,
            lng: centerLng,
            radius: 400,
            risk: 'medium',
            type: 'circle'
        },
        {
            name: 'North Zone',
            lat: centerLat + 0.0008,
            lng: centerLng - 0.0003,
            radius: 250,
            risk: 'low',
            type: 'circle'
        },
        {
            name: 'South Zone', 
            lat: centerLat - 0.0008,
            lng: centerLng + 0.0005,
            radius: 300,
            risk: 'high',
            type: 'circle'
        },
        {
            name: 'East Drainage',
            lat: centerLat + 0.0003,
            lng: centerLng + 0.0012,
            radius: 200,
            risk: 'guarded',
            type: 'circle'
        },
        {
            name: 'West Elevated',
            lat: centerLat - 0.0002,
            lng: centerLng - 0.0010,
            radius: 180,
            risk: 'minimal',
            type: 'circle'
        }
    ];
    
    zones.forEach(zone => {
        const riskData = mockData.riskData[zone.risk];
        
        L.circle([zone.lat, zone.lng], {
            radius: zone.radius,
            color: riskData.color,
            fillColor: riskData.color,
            fillOpacity: 0.25,
            weight: 2
        }).addTo(state.map)
        .bindPopup(`
            <div style="min-width: 180px;">
                <b>🌊 ${zone.name}</b><br>
                <strong>Risk:</strong> <span style="color: ${riskData.color}">${riskData.status}</span><br>
                <strong>Coverage:</strong> ${zone.radius}m radius<br>
                <small style="color: #666;">Flood risk assessment area</small>
            </div>
        `);
    });
}

function addReturnToLocationButton() {
    // Don't add if user location is not available or button already exists
    if (!state.userLocation || document.getElementById('returnToLocationBtn')) {
        return;
    }
    
    const returnBtn = document.createElement('button');
    returnBtn.id = 'returnToLocationBtn';
    returnBtn.innerHTML = '🏠 Show My Location';
    returnBtn.style.cssText = `
        position: fixed;
        top: 140px;
        right: 20px;
        background: #28a745;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        transition: all 0.3s ease;
    `;
    
    returnBtn.onmouseover = () => {
        returnBtn.style.background = '#218838';
        returnBtn.style.transform = 'translateY(-2px)';
    };
    
    returnBtn.onmouseout = () => {
        returnBtn.style.background = '#28a745';
        returnBtn.style.transform = 'translateY(0)';
    };
    
    returnBtn.onclick = () => {
        console.log('🏠 Returning to user location analysis');
        
        // Go back to user's location
        updateMapLocation(state.userLocation.lat, state.userLocation.lng);
        
        // Remove the return button
        returnBtn.remove();
        
        // Clear any click analysis markers
        state.map.eachLayer((layer) => {
            if (layer.options && layer.options.analysisMarker) {
                state.map.removeLayer(layer);
            }
        });
    };
    
    document.body.appendChild(returnBtn);
    console.log('🏠 Added "Return to My Location" button');
}

function addLocationMarker(lat, lng) {
    if (!state.map) return;

    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
            iconSize: [20, 20]
        })
    }).addTo(state.map);

    let popupText = 'Your Location';
    if (state.locationSource === 'gps') {
        popupText += '<br><small>📍 GPS Detected</small>';
    } else if (state.locationSource === 'ip') {
        popupText += '<br><small>🌐 IP-based</small>';
    } else {
        popupText += '<br><small>📍 Approximate</small>';
    }
    
    marker.bindPopup(popupText + '<br>Click map to analyze other areas');
}

function addRiskZones() {
    console.log('🎯 addRiskZones called');
    console.log('📍 Current state.userLocation:', state.userLocation);
    
    if (!state.map) {
        console.error('❌ Map not available');
        return;
    }
    
    if (!state.userLocation) {
        console.error('❌ No user location available');
        return;
    }

    // Use the actual user coordinates - not fallback coordinates
    const userLat = state.userLocation.lat;
    const userLng = state.userLocation.lng;
    
    console.log('🗺️ Generating flood zones for coordinates:', userLat, userLng);
    console.log('📊 Location source:', state.locationSource);
    
    // Skip zones if using regional fallback (India center)
    if (userLat === 20.5937 && userLng === 78.9629) {
        console.log('⚠️ Using fallback coordinates - skipping precise zones');
        return;
    }
    
    // Check if coordinates are realistic (not 0,0 or other defaults)
    if (userLat === 0 || userLng === 0) {
        console.log('⚠️ Invalid coordinates detected - skipping zones');
        return;
    }
    
    console.log('✅ Valid coordinates confirmed - creating zones');
    
    // Create precise flood zones based on actual user location
    const preciseZones = generateFloodRiskZones(userLat, userLng);
    
    console.log(`📊 Generated ${preciseZones.length} zones`);
    
    preciseZones.forEach((zone, index) => {
        console.log(`🌊 Zone ${index + 1}: ${zone.name} at ${zone.lat}, ${zone.lng}`);
        
        const riskData = mockData.riskData[zone.risk];
        
        if (zone.type === 'circle') {
            L.circle([zone.lat, zone.lng], {
                radius: zone.radius,
                color: riskData.color,
                fillColor: riskData.color,
                fillOpacity: 0.3,
                weight: 2
            }).addTo(state.map)
            .bindPopup(`
                <b>${zone.name}</b><br>
                Risk Level: <strong style="color: ${riskData.color}">${riskData.status}</strong><br>
                Type: ${zone.description}<br>
                Coordinates: ${zone.lat.toFixed(6)}, ${zone.lng.toFixed(6)}
            `);
        } else if (zone.type === 'polygon') {
            L.polygon(zone.coordinates, {
                color: riskData.color,
                fillColor: riskData.color,
                fillOpacity: 0.25,
                weight: 2
            }).addTo(state.map)
            .bindPopup(`
                <b>${zone.name}</b><br>
                Risk Level: <strong style="color: ${riskData.color}">${riskData.status}</strong><br>
                Type: ${zone.description}
            `);
        }
    });
    
    console.log('✅ All flood zones added to map');
}

function generateFloodRiskZones(centerLat, centerLng) {
    const zones = [];
    
    console.log('Creating flood zones at exact coordinates:', centerLat, centerLng);
    
    // Generate precise flood zones based on actual coordinates
    // Use smaller offsets for more accurate placement
    
    // 1. Current location risk (at exact coordinates)
    const locationRisk = assessLocationRisk(centerLat, centerLng);
    zones.push({
        type: 'circle',
        lat: centerLat,
        lng: centerLng,
        radius: 300,
        risk: locationRisk,
        name: 'Your Exact Location',
        description: `Risk assessment for coordinates ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`
    });
    
    // 2. Nearby areas with precise coordinates (smaller distances)
    zones.push({
        type: 'circle',
        lat: centerLat + 0.001, // ~100m north
        lng: centerLng - 0.0015, // ~150m west  
        radius: 400,
        risk: 'elevated',
        name: 'North-West Area',
        description: 'Potential water accumulation zone'
    });
    
    zones.push({
        type: 'circle',
        lat: centerLat - 0.0008, // ~80m south
        lng: centerLng + 0.0012, // ~120m east
        radius: 350,
        risk: 'guarded',
        name: 'South-East Area', 
        description: 'Drainage monitoring zone'
    });
    
    // 3. Precise polygon areas around user location
    zones.push({
        type: 'polygon',
        coordinates: [
            [centerLat + 0.0006, centerLng - 0.0005],
            [centerLat + 0.0012, centerLng + 0.0003],
            [centerLat + 0.0004, centerLng + 0.0008],
            [centerLat - 0.0002, centerLng + 0.0004]
        ],
        risk: 'low',
        name: 'Northern Residential Zone',
        description: 'Well-drained residential area'
    });
    
    // 4. Higher risk water-related area
    zones.push({
        type: 'circle',
        lat: centerLat - 0.0015, // ~150m south
        lng: centerLng - 0.001, // ~100m west
        radius: 500,
        risk: 'severe',
        name: 'Low-lying Area',
        description: 'Potential flood accumulation point'
    });
    
    // 5. Safe zone
    zones.push({
        type: 'polygon',
        coordinates: [
            [centerLat - 0.0012, centerLng + 0.0015],
            [centerLat - 0.0006, centerLng + 0.0020],
            [centerLat - 0.0002, centerLng + 0.0012],
            [centerLat - 0.0008, centerLng + 0.0008]
        ],
        risk: 'minimal',
        name: 'Elevated Safety Zone',
        description: 'Higher ground - flood safe area'
    });
    
    return zones;
}

function isNearWaterBody(lat, lng) {
    // Check if coordinates are near known water bodies
    const waterBodies = [
        // Indian coasts and major rivers
        { lat: 19.0, lng: 72.8, radius: 2 }, // Mumbai coast
        { lat: 13.0, lng: 80.2, radius: 2 }, // Chennai coast
        { lat: 22.5, lng: 88.3, radius: 2 }, // Kolkata near Ganges
        { lat: 26.8, lng: 80.9, radius: 1 }, // Lucknow near Gomti
        // Add more as needed
    ];
    
    return waterBodies.some(water => {
        const distance = Math.sqrt(
            Math.pow(lat - water.lat, 2) + Math.pow(lng - water.lng, 2)
        );
        return distance < water.radius;
    });
}

function assessLocationRisk(lat, lng) {
    // Assess flood risk based on precise coordinates
    const elevation = getElevationEstimate(lat, lng);
    const waterProximity = getWaterProximity(lat, lng);
    const urbanDensity = getUrbanDensity(lat, lng);
    
    // Risk calculation based on factors
    let riskScore = 0;
    
    // Elevation factor (lower = higher risk)
    if (elevation < 10) riskScore += 3;
    else if (elevation < 50) riskScore += 2;
    else if (elevation < 100) riskScore += 1;
    
    // Water proximity factor
    if (waterProximity < 0.5) riskScore += 3; // Very close to water
    else if (waterProximity < 2) riskScore += 2;
    else if (waterProximity < 5) riskScore += 1;
    
    // Urban density factor (affects drainage)
    if (urbanDensity > 0.8) riskScore += 1; // High density = poor drainage
    
    // Convert score to risk level
    if (riskScore >= 6) return 'extreme';
    if (riskScore >= 4) return 'severe';
    if (riskScore >= 3) return 'elevated';
    if (riskScore >= 2) return 'guarded';
    if (riskScore >= 1) return 'low';
    return 'minimal';
}

function getElevationEstimate(lat, lng) {
    // Simple elevation estimation based on known geographic patterns
    // This is a rough estimate - in real app, use elevation API
    
    // Coastal areas (low elevation)
    if (isNearWaterBody(lat, lng)) return Math.random() * 20;
    
    // Plains (medium elevation)  
    if (lat > 20 && lat < 30 && lng > 70 && lng < 90) {
        return 50 + Math.random() * 100; // Indo-Gangetic plains
    }
    
    // Mountainous regions (high elevation)
    if (lat > 30 || (lat > 10 && lat < 15 && lng > 75 && lng < 80)) {
        return 500 + Math.random() * 1000; // Himalayas, Western Ghats
    }
    
    return 100 + Math.random() * 200; // Default
}

function getWaterProximity(lat, lng) {
    // Calculate distance to nearest water body (simplified)
    let minDistance = Infinity;
    
    // Check against known water bodies
    const majorRivers = [
        { lat: 25.3, lng: 83.0, name: 'Ganges' },
        { lat: 19.1, lng: 72.9, name: 'Arabian Sea' },
        { lat: 13.0, lng: 80.3, name: 'Bay of Bengal' }
    ];
    
    majorRivers.forEach(river => {
        const distance = Math.sqrt(
            Math.pow((lat - river.lat) * 111, 2) + // Convert to km
            Math.pow((lng - river.lng) * 111, 2)
        );
        minDistance = Math.min(minDistance, distance);
    });
    
    return minDistance === Infinity ? 50 : minDistance; // Default 50km if no water body found
}

function getUrbanDensity(lat, lng) {
    // Estimate urban density (simplified)
    const majorCities = [
        { lat: 28.6, lng: 77.2, density: 0.9 }, // Delhi
        { lat: 19.1, lng: 72.9, density: 0.95 }, // Mumbai
        { lat: 13.1, lng: 80.3, density: 0.8 } // Chennai
    ];
    
    for (const city of majorCities) {
        const distance = Math.sqrt(
            Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
        );
        if (distance < 0.5) return city.density; // Within city
    }
    
    return 0.3 + Math.random() * 0.4; // Random suburban density
}

function updateMapLocation(lat, lng) {
    if (!state.map) return;
    
    console.log('Updating map to coordinates:', lat, lng);
    console.log('User location state:', state.userLocation);
    
    state.map.setView([lat, lng], 14); // Zoom closer for precise view
    
    // Clear existing markers and zones
    state.map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polygon) {
            state.map.removeLayer(layer);
        }
    });
    
    // Add new location marker
    addLocationMarker(lat, lng);
    
    // Add precise risk zones around new location
    addRiskZones();
}

function analyzeClickedLocation(latlng) {
    const lat = latlng.lat;
    const lng = latlng.lng;
    
    console.log(`🔍 Analyzing clicked location: ${lat}, ${lng}`);
    
    // Get risk assessment for clicked location
    const preciseRisk = assessLocationRisk(lat, lng);
    const riskData = mockData.riskData[preciseRisk];
    const elevation = getElevationEstimate(lat, lng);
    const waterDistance = getWaterProximity(lat, lng);
    
    // Clear existing analysis markers
    state.map.eachLayer((layer) => {
        if (layer.options && layer.options.analysisMarker) {
            state.map.removeLayer(layer);
        }
    });
    
    // Add analysis marker at clicked location
    const analysisMarker = L.circleMarker([lat, lng], {
        color: riskData.color,
        fillColor: riskData.color,
        fillOpacity: 0.8,
        radius: 12,
        weight: 3,
        analysisMarker: true // Custom property to identify analysis markers
    }).addTo(state.map);
    
    // Get city name for clicked location
    reverseGeocode(lat, lng).then(locationName => {
        const popupContent = `
            <div style="min-width: 280px; font-family: Arial, sans-serif; padding: 5px;">
                <h3 style="margin: 0 0 12px 0; color: ${riskData.color}; border-bottom: 2px solid ${riskData.color}; padding-bottom: 5px;">📍 Location Analysis</h3>
                <p style="margin: 8px 0;"><strong>📍 Location:</strong> ${locationName}</p>
                <p style="margin: 8px 0;"><strong>📊 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p style="margin: 8px 0;"><strong>⚠️ Flood Risk:</strong> <span style="color: ${riskData.color}; font-weight: bold; font-size: 16px;">${riskData.status}</span></p>
                <p style="margin: 8px 0;"><strong>🏔️ Elevation:</strong> ~${elevation.toFixed(0)}m</p>
                <p style="margin: 8px 0;"><strong>💧 Water Distance:</strong> ~${waterDistance.toFixed(1)}km</p>
                <p style="margin: 8px 0;"><strong>📈 Risk Score:</strong> ${(preciseRisk * 100).toFixed(1)}%</p>
                <p style="margin: 8px 0;"><strong>🎯 Confidence:</strong> ${riskData.confidence || 85}%</p>
                <div style="margin-top: 12px; padding: 10px; background: ${riskData.color}15; border: 1px solid ${riskData.color}40; border-radius: 6px;">
                    <strong style="color: ${riskData.color};">💡 ${riskData.status} Risk Zone</strong><br>
                    <small style="color: #666; line-height: 1.3;">${riskData.description || 'Click anywhere else on map to analyze different locations.'}</small>
                </div>
                <div style="margin-top: 10px; text-align: center;">
                    <small style="color: #888;">ℹ️ Click anywhere else for new analysis</small>
                </div>
            </div>
        `;
        
        analysisMarker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'analysis-popup'
        }).openPopup();
    }).catch(error => {
        console.error('Geocoding failed for clicked location:', error);
        
        const popupContent = `
            <div style="min-width: 280px; font-family: Arial, sans-serif; padding: 5px;">
                <h3 style="margin: 0 0 12px 0; color: ${riskData.color}; border-bottom: 2px solid ${riskData.color}; padding-bottom: 5px;">📍 Location Analysis</h3>
                <p style="margin: 8px 0;"><strong>📊 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p style="margin: 8px 0;"><strong>⚠️ Flood Risk:</strong> <span style="color: ${riskData.color}; font-weight: bold; font-size: 16px;">${riskData.status}</span></p>
                <p style="margin: 8px 0;"><strong>🏔️ Elevation:</strong> ~${elevation.toFixed(0)}m</p>
                <p style="margin: 8px 0;"><strong>💧 Water Distance:</strong> ~${waterDistance.toFixed(1)}km</p>
                <p style="margin: 8px 0;"><strong>📈 Risk Score:</strong> ${(preciseRisk * 100).toFixed(1)}%</p>
                <div style="margin-top: 12px; padding: 10px; background: ${riskData.color}15; border: 1px solid ${riskData.color}40; border-radius: 6px;">
                    <strong style="color: ${riskData.color};">💡 ${riskData.status} Risk Zone</strong><br>
                    <small style="color: #666;">Click anywhere else on map to analyze different locations.</small>
                </div>
            </div>
        `;
        
        analysisMarker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'analysis-popup'
        }).openPopup();
    });
    
    // Generate flood zones around clicked location
    console.log(`🌊 Generating flood zones around clicked location`);
    generateFloatZonesForLocation(lat, lng);
}

function generateFloatZonesForLocation(centerLat, centerLng) {
    if (!state.map) return;
    
    // Clear existing flood zones but keep user marker and analysis markers
    state.map.eachLayer((layer) => {
        if ((layer instanceof L.Circle || layer instanceof L.Polygon) && 
            !layer.options.userMarker && 
            !layer.options.analysisMarker) {
            state.map.removeLayer(layer);
        }
    });
    
    // Generate precise zones around clicked location
    const zones = [
        {
            name: 'Immediate Area',
            lat: centerLat,
            lng: centerLng,
            radius: 400,
            risk: 'medium',
            type: 'circle'
        },
        {
            name: 'North Zone',
            lat: centerLat + 0.0008,
            lng: centerLng - 0.0003,
            radius: 250,
            risk: 'low',
            type: 'circle'
        },
        {
            name: 'South Zone', 
            lat: centerLat - 0.0008,
            lng: centerLng + 0.0005,
            radius: 300,
            risk: 'high',
            type: 'circle'
        },
        {
            name: 'East Drainage',
            lat: centerLat + 0.0003,
            lng: centerLng + 0.0012,
            radius: 200,
            risk: 'guarded',
            type: 'circle'
        },
        {
            name: 'West Elevated',
            lat: centerLat - 0.0002,
            lng: centerLng - 0.0010,
            radius: 180,
            risk: 'minimal',
            type: 'circle'
        }
    ];
    
    zones.forEach(zone => {
        const riskData = mockData.riskData[zone.risk];
        
        L.circle([zone.lat, zone.lng], {
            radius: zone.radius,
            color: riskData.color,
            fillColor: riskData.color,
            fillOpacity: 0.25,
            weight: 2
        }).addTo(state.map)
        .bindPopup(`
            <div style="min-width: 180px;">
                <b>🌊 ${zone.name}</b><br>
                <strong>Risk:</strong> <span style="color: ${riskData.color}">${riskData.status}</span><br>
                <strong>Coverage:</strong> ${zone.radius}m radius<br>
                <small style="color: #666;">${riskData.description || 'Flood risk assessment area'}</small>
            </div>
        `);
    });
}

function addReturnToLocationButton() {
    // Don't add if user location is not available or button already exists
    if (!state.userLocation || document.getElementById('returnToLocationBtn')) {
        return;
    }
    
    const returnBtn = document.createElement('button');
    returnBtn.id = 'returnToLocationBtn';
    returnBtn.innerHTML = '🏠 Show My Location';
    returnBtn.style.cssText = `
        position: fixed;
        top: 140px;
        right: 20px;
        background: #28a745;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        transition: all 0.3s ease;
    `;
    
    returnBtn.onmouseover = () => {
        returnBtn.style.background = '#218838';
        returnBtn.style.transform = 'translateY(-2px)';
    };
    
    returnBtn.onmouseout = () => {
        returnBtn.style.background = '#28a745';
        returnBtn.style.transform = 'translateY(0)';
    };
    
    returnBtn.onclick = () => {
        console.log('🏠 Returning to user location analysis');
        
        // Go back to user's location
        updateMapLocation(state.userLocation.lat, state.userLocation.lng);
        
        // Remove the return button
        returnBtn.remove();
        
        // Clear any click analysis markers
        state.map.eachLayer((layer) => {
            if (layer.options && layer.options.analysisMarker) {
                state.map.removeLayer(layer);
            }
        });
    };
    
    document.body.appendChild(returnBtn);
    console.log('🏠 Added "Return to My Location" button');
}

// ============================================
// BACKEND INTEGRATION
// ============================================

async function checkBackendHealth() {
    try {
        console.log('🔍 Checking Python backend health...');
        const response = await fetch('/api/health', {
            timeout: 3000
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend online:', data.device);
            showBackendStatus(true, data);
        } else {
            throw new Error('Backend not responding');
        }
    } catch (error) {
        console.warn('⚠️ Backend offline:', error.message);
        showBackendStatus(false);
    }
}

function showBackendStatus(isOnline, data = null) {
    // Remove existing banner
    const existingBanner = document.getElementById('backendBanner');
    if (existingBanner) {
        existingBanner.remove();
    }
    
    if (!isOnline) {
        // Show offline banner
        const banner = document.createElement('div');
        banner.id = 'backendBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #ef4444, #dc2626);
            color: white;
            padding: 12px 20px;
            text-align: center;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        banner.innerHTML = `
            ⚠️ Python backend not running. Start <code>floodPredictor.py</code> for AI analysis features.
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 4px 8px;
                margin-left: 10px;
                border-radius: 4px;
                cursor: pointer;
            ">×</button>
        `;
        document.body.prepend(banner);
        
        // Adjust main content margin
        document.querySelector('.main-content').style.marginTop = '60px';
    } else {
        // Reset main content margin
        document.querySelector('.main-content').style.marginTop = '0';
        console.log(`🚀 Backend ready on ${data.device.toUpperCase()}`);
    }
}

// Upload Section
function initUploadSection() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const previewContent = document.getElementById('previewContent');
    const removeFileBtn = document.getElementById('removeFile');
    const analyzeBtn = document.getElementById('analyzeBtn');

    // Toggle between image/video
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFileType = btn.dataset.type;

            // Update file input accept attribute
            if (state.currentFileType === 'image') {
                fileInput.setAttribute('accept', 'image/*');
            } else {
                fileInput.setAttribute('accept', 'video/*');
            }
        });
    });

    // Click to upload
    uploadArea?.addEventListener('click', () => {
        fileInput?.click();
    });

    // Drag and drop
    uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea?.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        handleFileUpload(file);
    });

    // File input change
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFileUpload(file);
    });
    
    // Clipboard paste (Ctrl+V) support
    document.addEventListener('paste', (e) => {
        // Only handle paste in upload section
        const uploadSection = document.getElementById('upload');
        if (!uploadSection || !uploadSection.classList.contains('active')) {
            return;
        }
        
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    console.log('📋 Clipboard image detected');
                    handleFileUpload(file);
                    e.preventDefault();
                    break;
                }
            }
        }
    });
    
    console.log('📁 Upload section initialized with clipboard support (Ctrl+V)');

    // Remove file
    removeFileBtn?.addEventListener('click', () => {
        resetUpload();
    });

    // Analyze button
    analyzeBtn?.addEventListener('click', () => {
        runInference();
    });
}

function handleFileUpload(file) {
    if (!file) return;

    console.log('📁 File uploaded:', file.name, file.type);
    state.uploadedFile = file;

    const uploadArea = document.getElementById('uploadArea');
    const filePreview = document.getElementById('filePreview');
    const previewContent = document.getElementById('previewContent');

    uploadArea?.classList.add('hidden');
    filePreview?.classList.remove('hidden');
    
    // Determine if this is a clipboard paste
    const isClipboard = file.name.startsWith('blob:') || file.name === 'image.png' || file.name === '';

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        if (file.type.startsWith('image/')) {
            previewContent.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 8px;">`;
            console.log(`🖼️ ${isClipboard ? 'Clipboard image' : 'Image file'} preview loaded`);
        } else if (file.type.startsWith('video/')) {
            previewContent.innerHTML = `<video src="${e.target.result}" controls style="max-width: 100%; border-radius: 8px;"></video>`;
            console.log('🎥 Video file preview loaded');
        }
        
        // Auto-run inference after preview loads
        setTimeout(() => {
            runInference();
        }, 500);
    };
    reader.readAsDataURL(file);
    
    // Update preview header for clipboard images
    const previewHeader = document.querySelector('#filePreview .preview-header h3');
    if (previewHeader && isClipboard) {
        previewHeader.textContent = '📋 Clipboard Image Ready';
    }
}

function resetUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const filePreview = document.getElementById('filePreview');
    const fileInput = document.getElementById('fileInput');
    const inferenceLoader = document.getElementById('inferenceLoader');
    const inferenceResult = document.getElementById('inferenceResult');

    state.uploadedFile = null;
    fileInput.value = '';

    uploadArea?.classList.remove('hidden');
    filePreview?.classList.add('hidden');
    inferenceLoader?.classList.add('hidden');
    inferenceResult?.classList.add('hidden');
}

async function runInference() {
    if (!state.uploadedFile) {
        alert('Please upload a file first');
        return;
    }
    
    const loader = document.getElementById('inferenceLoader');
    const result = document.getElementById('inferenceResult');
    const preview = document.getElementById('filePreview');
    
    // Show loading
    preview?.classList.add('hidden');
    loader?.classList.remove('hidden');
    result?.classList.add('hidden');
    
    console.log('🤖 Starting AI inference...');
    
    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        
        if (progressFill) progressFill.style.width = progress + '%';
        if (progressText) progressText.textContent = Math.round(progress) + '%';
    }, 200);
    
    try {
        // Check if backend is available
        const healthCheck = await fetch('/api/health');
        if (!healthCheck.ok) {
            throw new Error('Backend not available. Please start floodPredictor.py');
        }
        
        // Prepare form data
        const formData = new FormData();
        formData.append('file', state.uploadedFile);
        
        const isVideo = state.uploadedFile.type.startsWith('video/');
        const endpoint = isVideo ? '/api/infer/video' : '/api/infer/image';
        
        console.log(`🚀 Sending ${isVideo ? 'video' : 'image'} to ${endpoint}`);
        
        // Send to Python backend
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ AI Analysis complete:', data);
        
        // Complete progress
        clearInterval(progressInterval);
        if (progressFill) progressFill.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
        
        setTimeout(() => {
            displayInferenceResults(data, isVideo);
        }, 500);
        
    } catch (error) {
        console.error('❌ Inference failed:', error);
        clearInterval(progressInterval);
        
        // Show error
        loader?.classList.add('hidden');
        preview?.classList.remove('hidden');
        
        alert(`AI Analysis failed: ${error.message}`);
    }
}

function displayInferenceResults(data, isVideo) {
    const loader = document.getElementById('inferenceLoader');
    const result = document.getElementById('inferenceResult');
    const preview = document.getElementById('filePreview');
    
    // Hide loader, show results
    loader?.classList.add('hidden');
    result?.classList.remove('hidden');
    
    console.log('📊 Displaying results:', data);
    
    // Update risk badge and text
    const riskElement = result?.querySelector('.result-risk h2');
    const riskBadge = result?.querySelector('.result-badge');
    
    if (riskElement && riskBadge) {
        const risk = data.risk?.toLowerCase() || 'unknown';
        riskElement.textContent = data.risk || 'Unknown';
        riskBadge.className = `result-badge ${risk}`;
        
        // Animate risk badge
        riskBadge.style.transform = 'scale(0.8)';
        setTimeout(() => {
            riskBadge.style.transform = 'scale(1)';
        }, 100);
    }
    
    // Update timestamp
    const timestamp = result?.querySelector('.result-timestamp');
    if (timestamp) {
        timestamp.textContent = `Analyzed at ${new Date().toLocaleTimeString()}`;
    }
    
    // Show annotated output if available
    if (data.output_image || data.output_video) {
        const outputFile = data.output_image || data.output_video;
        const outputUrl = `/outputs/${outputFile}`;
        
        console.log('🗺️ Loading annotated output:', outputUrl);
        
        const previewContent = document.getElementById('previewContent');
        if (previewContent) {
            if (isVideo) {
                const video = document.createElement('video');
                video.src = outputUrl;
                video.controls = true;
                video.style.cssText = 'max-width: 100%; border-radius: 8px;';
                previewContent.innerHTML = '';
                previewContent.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = outputUrl;
                img.alt = 'AI Analysis Result';
                img.style.cssText = 'max-width: 100%; border-radius: 8px;';
                img.onload = () => console.log('✅ Annotated image loaded');
                img.onerror = () => console.warn('⚠️ Failed to load annotated image');
                previewContent.innerHTML = '';
                previewContent.appendChild(img);
            }
            
            preview?.classList.remove('hidden');
        }
    }
    
    // Populate explainability details
    const detailsList = result?.querySelector('.result-details ul');
    if (detailsList && data.details) {
        detailsList.innerHTML = '';
        
        Object.entries(data.details).forEach(([key, value]) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${key}:</strong> ${value}`;
            detailsList.appendChild(li);
        });
    }
    
    // Update confidence display
    const confidenceElement = result?.querySelector('.result-confidence strong');
    if (confidenceElement && data.details && data.details['Water presence']) {
        const waterPercentage = parseFloat(data.details['Water presence']);
        confidenceElement.textContent = `${waterPercentage}% water coverage detected`;
    }
    
    // Update recommendations based on risk level
    const recommendations = result?.querySelector('.result-recommendations p');
    if (recommendations) {
        const risk = data.risk?.toLowerCase();
        const riskMessages = {
            'minimal': 'Area appears safe with minimal flood indicators. Continue monitoring weather conditions.',
            'low': 'Low flood risk detected. Stay informed about weather updates.',
            'guarded': 'Moderate risk present. Avoid flood-prone areas and monitor alerts.',
            'elevated': 'Higher risk detected. Consider moving to safer ground.',
            'severe': 'Significant flood risk. Evacuate immediately if advised.',
            'extreme': 'Extreme danger detected! Seek immediate shelter on higher ground.'
        };
        
        recommendations.textContent = riskMessages[risk] || 'Analysis complete. Monitor conditions carefully.';
    }
    
    console.log('✨ Results display updated successfully');
}

// Chatbot
function initChatbot() {
    const chatbotFab = document.getElementById('chatbotFab');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const closeChatbot = document.getElementById('closeChatbot');
    const chatInput = document.getElementById('chatInput');
    const sendMessage = document.getElementById('sendMessage');
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');

    // Toggle chatbot window
    chatbotFab?.addEventListener('click', () => {
        chatbotWindow?.classList.toggle('hidden');
        if (!chatbotWindow?.classList.contains('hidden')) {
            chatInput?.focus();
        }
    });

    closeChatbot?.addEventListener('click', () => {
        chatbotWindow?.classList.add('hidden');
    });

    // Send message
    sendMessage?.addEventListener('click', () => {
        sendChatMessage();
    });

    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // Quick actions
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const message = btn.textContent.trim().toLowerCase();
            addUserMessage(message);
            handleBotResponse(message);
        });
    });
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput?.value.trim();

    if (!message) return;

    addUserMessage(message);
    chatInput.value = '';

    // Simulate bot response
    setTimeout(() => {
        handleBotResponse(message.toLowerCase());
    }, 600);
}

function addUserMessage(message) {
    const chatMessages = document.getElementById('chatbotMessages');
    if (!chatMessages) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'message user';
    messageEl.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
        </div>
    `;

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleBotResponse(userMessage) {
    const chatMessages = document.getElementById('chatbotMessages');
    if (!chatMessages) return;

    // Get user's location for dynamic responses
    let userCity = 'your area';
    if (state.userLocation && state.userLocation.name) {
        const locationParts = state.userLocation.name.split(',');
        userCity = locationParts[0].trim();
    }

    // Create dynamic responses based on location
    const dynamicResponses = {
        'emergency numbers': {
            message: 'Here are the emergency contact numbers:\n\n🚨 National Emergency: 1077\n📞 NDRF Helpline: 011-26167177\n🏛️ State Disaster Control: 1070\n🏥 Health Emergency: 108\n\nPlease save these numbers and call immediately if you need assistance.',
            delay: 800
        },
        'nearest shelter': {
            message: `Based on your location in ${userCity}, here are nearby relief centers:\n\n1. District Magistrate Office - 2.3 km\n2. Community Center - 3.1 km\n3. Government School - 4.5 km\n\nAll centers are equipped with basic amenities, medical aid, and food supplies. Call local authorities for exact locations.`,
            delay: 1000
        },
        'safety tips': {
            message: '🛡️ Essential Flood Safety Tips:\n\n1. Move to higher ground immediately\n2. Never walk through floodwater (6 inches can knock you down)\n3. Avoid driving through flooded areas\n4. Keep emergency kit ready (water, medicine, flashlight)\n5. Stay informed via official channels\n6. Turn off utilities if instructed\n7. Don\'t touch electrical equipment if wet\n\nStay safe!',
            delay: 1200
        },
        'default': {
            message: 'I can help you with:\n\n• Emergency contact numbers\n• Nearest relief shelters\n• Flood safety guidelines\n• Risk assessment information\n• Evacuation procedures\n\nWhat would you like to know?',
            delay: 600
        }
    };

    // Find matching response
    let response = dynamicResponses.default;

    for (const [key, value] of Object.entries(dynamicResponses)) {
        if (userMessage.includes(key)) {
            response = value;
            break;
        }
    }

    setTimeout(() => {
        const messageEl = document.createElement('div');
        messageEl.className = 'message bot';
        messageEl.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <p>${response.message.replace(/\n/g, '<br>')}</p>
            </div>
        `;

        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, response.delay);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Settings
function initSettings() {
    const locationToggle = document.getElementById('locationToggle');

    locationToggle?.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Show modal again to get user consent
            const modal = document.getElementById('locationModal');
            modal?.classList.remove('hidden');
        } else {
            state.userLocation = null;
            state.locationSource = null;
            const locationInfo = document.getElementById('locationInfo');
            if (locationInfo) {
                locationInfo.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>Location disabled</span>
                `;
            }
        }
    });
}

// Dashboard Updates
function updateDashboardData() {
    // Simulate data refresh
    console.log('Refreshing dashboard data...');

    // Update weather values with slight variations
    updateWeatherData();
}

function updateWeatherData() {
    const weatherValues = document.querySelectorAll('.weather-value');

    // Add small random variations to simulate real-time updates
    weatherValues.forEach(value => {
        const currentText = value.textContent;
        const match = currentText.match(/([0-9.]+)/);

        if (match) {
            const num = parseFloat(match[1]);
            const variation = (Math.random() - 0.5) * 2;
            const newValue = (num + variation).toFixed(1);
            value.textContent = currentText.replace(match[1], newValue);
        }
    });
}

function updateLastUpdated() {
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
        const now = new Date();
        lastUpdated.textContent = `Updated ${now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;
    }
}

// Utility Functions
function generateId() {
    return `_${Math.random().toString(36).substr(2, 9)}`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for potential integration with backend
window.FloodWatch = {
    state,
    navigateToSection,
    updateDashboardData,
    analyzeLocation,
    forceRealGPS
};

// Force real satellite GPS (not network location)
function forceRealGPS() {
    console.log('🚀 FORCING REAL SATELLITE GPS...');
    console.log('🏠➡️🌲 Go outside for best GPS reception!');
    
    const btn = document.getElementById('forceGpsBtn');
    if (btn) {
        btn.innerHTML = '📡 Getting GPS...';
        btn.style.background = 'orange';
    }
    
    const options = {
        enableHighAccuracy: true,  // Force GPS satellite
        timeout: 30000,            // 30 seconds timeout
        maximumAge: 0              // Never use cached location
    };
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude: lat, longitude: lng, accuracy } = position.coords;
            console.log(`🛰️ REAL GPS RESULT: ${lat}, ${lng}`);
            console.log(`🎯 Real GPS accuracy: ${accuracy} meters`);
            
            if (accuracy < 50) {
                console.log('✅ EXCELLENT GPS ACCURACY!');
            } else if (accuracy < 500) {
                console.log('✅ GOOD GPS ACCURACY!');
            } else {
                console.warn('⚠️ Still low accuracy - try going outside');
            }
            
            try {
                const name = await reverseGeocode(lat, lng);
                state.userLocation = { lat, lng, name, accuracy };
                state.locationSource = 'forced-gps';
                
                updateLocationUI();
                updateAlertsDisplay();
                
                if (state.map) {
                    updateMapLocation(lat, lng);
                }
                
                // Remove the force GPS button on success
                if (btn) btn.remove();
                
            } catch (error) {
                console.error('Geocoding failed:', error);
            }
        },
        (error) => {
            console.error('🚨 Real GPS failed:', error.message);
            
            if (btn) {
                btn.innerHTML = '❌ GPS Failed - Try Again';
                btn.style.background = '#ff6666';
            }
            
            if (error.code === 1) {
                alert('📱 Please allow location access for real GPS!');
            } else if (error.code === 3) {
                alert('⏰ GPS timeout. Go outside and try again!');
            } else {
                alert('🚨 GPS error: ' + error.message);
            }
        },
        options
    );
}

console.log('✓ FloodWatch Dashboard initialized successfully');

// ============================================
// SIMULATION ENGINE (FRONTEND & BACKEND SYNC)
// ============================================

let simTimer = null;
let simIsPlaying = false;
let currentScenario = 'river_breach';

function initSimulationSection() {
    const rainfallSlider = document.getElementById('simRainfall');
    const hoursSlider = document.getElementById('simHours');
    const drainageSlider = document.getElementById('simDrainage');
    const playBtn = document.getElementById('simPlayBtn');
    const resetBtn = document.getElementById('simResetBtn');
    const scenarioBtns = document.querySelectorAll('.sim-scenario-btn');
    const sampleDemoBtn = document.getElementById('btnRunSampleDemo');

    // Scenario selection
    scenarioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            scenarioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentScenario = btn.dataset.scenario;
            triggerSimulationUpdate();
        });
    });

    // Slider inputs
    rainfallSlider?.addEventListener('input', (e) => {
        const valElem = document.getElementById('simRainfallVal');
        if (valElem) valElem.textContent = `${e.target.value} mm/h`;
        triggerSimulationUpdate();
    });

    hoursSlider?.addEventListener('input', (e) => {
        const valElem = document.getElementById('simHoursVal');
        if (valElem) valElem.textContent = `T + ${parseFloat(e.target.value).toFixed(1)} h`;
        triggerSimulationUpdate();
    });

    drainageSlider?.addEventListener('input', (e) => {
        const valElem = document.getElementById('simDrainageVal');
        if (valElem) valElem.textContent = `${e.target.value}%`;
        triggerSimulationUpdate();
    });

    // Auto-Play timeline
    playBtn?.addEventListener('click', () => {
        if (simIsPlaying) {
            stopSimulationPlayback();
        } else {
            startSimulationPlayback();
        }
    });

    resetBtn?.addEventListener('click', () => {
        stopSimulationPlayback();
        if (rainfallSlider) rainfallSlider.value = 65;
        if (hoursSlider) hoursSlider.value = 2.0;
        if (drainageSlider) drainageSlider.value = 40;
        document.getElementById('simRainfallVal').textContent = '65 mm/h';
        document.getElementById('simHoursVal').textContent = 'T + 2.0 h';
        document.getElementById('simDrainageVal').textContent = '40%';
        triggerSimulationUpdate();
    });

    // Sample demo button in upload section
    sampleDemoBtn?.addEventListener('click', async () => {
        sampleDemoBtn.disabled = true;
        sampleDemoBtn.innerHTML = '<span class="loading-spinner"></span> Running AI Analysis...';
        
        try {
            const resp = await fetch('/api/simulate/sample');
            if (resp.ok) {
                const data = await resp.json();
                displayInferenceResults(data, false);
                console.log('✅ Sample inference executed successfully:', data);
            } else {
                throw new Error('Backend sample endpoint returned error');
            }
        } catch (err) {
            console.warn('Backend unavailable, running client-side mock inference:', err);
            // Client-side fallback for presentation safety
            const mockSampleData = {
                risk: "Elevated",
                water_coverage: 16.4,
                details: {
                    "Water presence": "16.4%",
                    "Core water bodies": "6.8%",
                    "Buffer zones": "5.7%",
                    "Moisture areas": "3.9%",
                    "River/Ocean detected": true,
                    "Surface saturation": "High",
                    "Historical zone": "Likely",
                    "water_body_type": "river",
                    "edge_confidence": 0.84,
                    "false_positive_suppressed": true
                },
                output_image: "output_1792079612.png"
            };
            displayInferenceResults(mockSampleData, false);
        } finally {
            sampleDemoBtn.disabled = false;
            sampleDemoBtn.innerHTML = '⚡ Run Sample AI Inference';
        }
    });

    // Draw initial canvas and run initial simulation step
    drawSimulationCanvas(18.4, 6.8, 5.7);
    triggerSimulationUpdate();
}

function startSimulationPlayback() {
    simIsPlaying = true;
    const playBtn = document.getElementById('simPlayBtn');
    if (playBtn) {
        playBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            <span>Pause Simulation</span>
        `;
    }

    const hoursSlider = document.getElementById('simHours');
    if (!hoursSlider) return;

    simTimer = setInterval(() => {
        let cur = parseFloat(hoursSlider.value);
        if (cur >= 12.0) {
            hoursSlider.value = 0.5;
        } else {
            hoursSlider.value = (cur + 0.5).toFixed(1);
        }
        document.getElementById('simHoursVal').textContent = `T + ${parseFloat(hoursSlider.value).toFixed(1)} h`;
        triggerSimulationUpdate();
    }, 1200);
}

function stopSimulationPlayback() {
    simIsPlaying = false;
    clearInterval(simTimer);
    const playBtn = document.getElementById('simPlayBtn');
    if (playBtn) {
        playBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Auto-Play Timeline</span>
        `;
    }
}

async function triggerSimulationUpdate() {
    const rainfall = parseFloat(document.getElementById('simRainfall')?.value || 65);
    const hours = parseFloat(document.getElementById('simHours')?.value || 2);
    const drainage = parseFloat(document.getElementById('simDrainage')?.value || 40);

    try {
        const resp = await fetch(`/api/simulate/flood?scenario=${currentScenario}&rainfall=${rainfall}&hours=${hours}&drainage=${drainage}`);
        if (resp.ok) {
            const data = await resp.json();
            renderSimulationData(data);
            return;
        }
    } catch (e) {
        // Backend offline fallback - calculate client-side math
    }

    // Client-side Hydrological Calculation fallback
    const netPrecip = Math.max(0, rainfall * (1 - drainage / 100) * hours);
    const k = currentScenario === 'cloudburst' ? 0.024 : (currentScenario === 'dam_release' ? 0.03 : 0.016);
    const cMax = currentScenario === 'cloudburst' ? 48 : (currentScenario === 'dam_release' ? 55 : 42);
    const waterCoverage = Math.min(65, Math.max(2, 4 + cMax * (1 - Math.exp(-k * netPrecip))));
    const waterRise = 0.4 + netPrecip * 0.022;
    const submergedArea = waterCoverage * 3.8;
    const velocity = (1.2 + 0.03 * netPrecip) * (currentScenario === 'dam_release' ? 2.2 : 1.2);

    let risk = "Minimal";
    if (waterCoverage >= 35 || waterRise >= 3.5) risk = "Extreme";
    else if (waterCoverage >= 25 || waterRise >= 2.5) risk = "Severe";
    else if (waterCoverage >= 15 || waterRise >= 1.6) risk = "Elevated";
    else if (waterCoverage >= 8) risk = "Guarded";
    else if (waterCoverage >= 3) risk = "Low";

    const evacHours = Math.max(0.5, (risk === 'Extreme' ? 2 : (risk === 'Severe' ? 4 : (risk === 'Elevated' ? 7 : 18))) - hours * 0.4);

    renderSimulationData({
        risk_level: risk,
        water_coverage_pct: waterCoverage.toFixed(1),
        water_rise_meters: waterRise.toFixed(2),
        submerged_area_sqkm: submergedArea.toFixed(1),
        flow_velocity_kmh: velocity.toFixed(1),
        evacuation_window_hours: evacHours.toFixed(1),
        zones: {
            zone_a_core: (waterCoverage * 0.4).toFixed(1) + '%',
            zone_b_buffer: (waterCoverage * 0.38).toFixed(1) + '%',
            zone_c_moisture: (waterCoverage * 0.22).toFixed(1) + '%'
        }
    });
}

function renderSimulationData(data) {
    const riskBadge = document.getElementById('simRiskBadge');
    const coverageVal = document.getElementById('simCoverageVal');
    const riseVal = document.getElementById('simRiseVal');
    const evacVal = document.getElementById('simEvacVal');
    const areaVal = document.getElementById('simAreaVal');
    const velocityVal = document.getElementById('simVelocityVal');
    const satVal = document.getElementById('simSatVal');
    const directiveVal = document.getElementById('simDirectiveVal');

    const risk = data.risk_level || 'Low';
    if (riskBadge) {
        riskBadge.textContent = risk.toUpperCase();
        riskBadge.className = `sim-risk-badge ${risk.toLowerCase()}`;
    }

    if (coverageVal) coverageVal.textContent = `${data.water_coverage_pct}%`;
    if (riseVal) riseVal.textContent = `+${data.water_rise_meters} m`;
    if (evacVal) {
        evacVal.textContent = `${data.evacuation_window_hours} Hours`;
        evacVal.className = `sim-metric-value ${parseFloat(data.evacuation_window_hours) < 4 ? 'danger' : (parseFloat(data.evacuation_window_hours) < 8 ? 'alert' : '')}`;
    }
    if (areaVal) areaVal.textContent = `${data.submerged_area_sqkm} km²`;
    if (velocityVal) velocityVal.textContent = `${data.flow_velocity_kmh} km/h`;
    
    if (satVal) {
        satVal.textContent = parseFloat(data.water_coverage_pct) > 25 ? 'Critical (100% Saturated)' : (parseFloat(data.water_coverage_pct) > 12 ? 'High' : 'Moderate');
    }

    if (directiveVal) {
        if (risk === 'Extreme') {
            directiveVal.textContent = '🚨 RED ALERT: Immediate Mandatory Evacuation to High-Ground Shelters';
            directiveVal.className = 'danger-text';
        } else if (risk === 'Severe') {
            directiveVal.textContent = '⚠️ DANGER: Deploy NDRF/SDRF Flood Rescue Boats & Secure Power Grids';
            directiveVal.className = 'danger-text';
        } else if (risk === 'Elevated') {
            directiveVal.textContent = '⚡ WARNING: Prepare Sandbagging & Stage Emergency Rations';
            directiveVal.className = 'warning-text';
        } else {
            directiveVal.textContent = '✅ MONITORING: Normal Water Basin Drainage Flow Rates';
            directiveVal.className = 'safe-text';
        }
    }

    // Update dynamic simulation canvas
    const cov = parseFloat(data.water_coverage_pct);
    drawSimulationCanvas(cov, cov * 0.45, cov * 0.35);
}

function drawSimulationCanvas(totalPct, zoneA, zoneB) {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // Dynamic wave ripples from center river path
    const centerX = w / 2;
    const centerY = h / 2;
    const scale = Math.min(1.8, Math.max(0.2, totalPct / 30));

    // Zone C (Moisture Spread - Cyan outer ripple)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 210 * scale, 75 * scale, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();

    // Zone B (Buffer Hazard Zone - Orange middle ripple)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 140 * scale, 50 * scale, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
    ctx.stroke();

    // Zone A (Core River Water - Deep Red center)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 80 * scale, 28 * scale, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // S-curve river trajectory line
    ctx.beginPath();
    ctx.moveTo(20, h * 0.85);
    ctx.bezierCurveTo(w * 0.35, h * 0.75, w * 0.45, h * 0.25, w - 20, h * 0.2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // River label
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Central River Basin Inundation Boundary', 25, 30);
}
