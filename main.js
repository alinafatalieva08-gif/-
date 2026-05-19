// ===== DATABASE =====
const DB_USERS = 'autosher_users';
const DB_CURRENT = 'autosher_current';
const DB_BOOKINGS = 'autosher_bookings';

function getDB(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || (key === DB_USERS ? [] : key === DB_BOOKINGS ? [] : null);
    } catch {
        return key === DB_USERS ? [] : key === DB_BOOKINGS ? [] : null;
    }
}
function setDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

let currentUser = getDB(DB_CURRENT);

// ===== AUTH =====
function checkAuth() {
    const guestElements = document.querySelectorAll('.guest-only, .guest-mobile-btn');
    const authElements = document.querySelectorAll('.auth-only, .auth-mobile-btn');
    const heroCta = document.getElementById('heroCtaBtn');

    if (currentUser) {
        guestElements.forEach(el => el.classList.add('hidden'));
        authElements.forEach(el => el.classList.remove('hidden'));
        document.getElementById('userNameHeader').textContent = currentUser.name.split(' ')[0];
        document.getElementById('userAvatarHeader').textContent = currentUser.name.charAt(0).toUpperCase();
        heroCta.textContent = 'Личный кабинет';
        heroCta.onclick = () => openDashboard('newbook');
        updateDashboardUI();
    } else {
        guestElements.forEach(el => el.classList.remove('hidden'));
        authElements.forEach(el => el.classList.add('hidden'));
        heroCta.textContent = 'Начать поездку';
        heroCta.onclick = () => openModal('register');
    }
}

// ... [ОСТАЛЬНЫЕ ФУНКЦИИ: submitRegister, submitLogin, logout, dashboard, booking, info modal, map, UI helpers, FAQ, init] ...

// ===== INTERACTIVE MAP =====
let map;
let carMarkers = [];
let activeFilter = 'all';

function initMap() {
    if (!window.carData || !window.carLocations) {
        setTimeout(initMap, 100);
        return;
    }

    map = L.map('carMap', {
        zoomControl: true,
        attributionControl: true
    }).setView([56.0184, 92.8672], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
    }).addTo(map);

    const markerIcons = {
        economy: L.divIcon({
            className: 'custom-marker',
            html: '<div class="legend-marker economy" style="width:32px;height:32px;font-size:0.9rem">Э</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        comfort: L.divIcon({
            className: 'custom-marker',
            html: '<div class="legend-marker comfort" style="width:32px;height:32px;font-size:0.9rem">К</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        business: L.divIcon({
            className: 'custom-marker',
            html: '<div class="legend-marker business" style="width:32px;height:32px;font-size:0.9rem">Б</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        premium: L.divIcon({
            className: 'custom-marker',
            html: '<div class="legend-marker premium" style="width:32px;height:32px;font-size:0.9rem">П</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        })
    };

    carLocations.forEach(car => {
        const marker = L.marker([car.lat, car.lng], { icon: markerIcons[car.class] }).addTo(map);
        const carInfo = carData[car.name];
        const popupContent = `
            <div class="map-popup">
                <div class="map-popup-header">
                    <div class="map-popup-car">${carInfo?.emoji || '🚗'}</div>
                    <div>
                        <div class="map-popup-title">${car.name}</div>
                        <span class="map-popup-class ${car.class}">${carInfo?.class || 'Автомобиль'}</span>
                    </div>
                </div>
                <div class="map-popup-price">${car.price} ₽ <small>/ мин</small></div>
                <div class="map-popup-specs">
                    <span class="map-popup-spec">⚙️ ${carInfo?.transmission || 'АКПП'}</span>
                    <span class="map-popup-spec">⛽ ${carInfo?.fuel || 'Бензин'}</span>
                    <span class="map-popup-spec">👥 5 мест</span>
                </div>
                <button class="btn btn-primary btn-sm map-popup-btn" onclick="openBooking('${car.name}')">Забронировать</button>
                <button class="btn btn-info btn-sm map-popup-btn" style="margin-top:6px" onclick="closeMapPopup(); openInfoModal('${car.name}')">ℹ️ Подробнее</button>
            </div>
        `;
        marker.bindPopup(popupContent, { maxWidth: 300, minWidth: 250, closeButton: true, autoClose: true });
        carMarkers.push({ marker, class: car.class, name: car.name });
    });

    // Legend filter
    document.querySelectorAll('.legend-item').forEach(item => {
        item.addEventListener('click', function() {
            const filterClass = this.dataset.class;
            activeFilter = filterClass;
            document.querySelectorAll('.legend-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            carMarkers.forEach(cm => {
                if (filterClass === 'all' || cm.class === filterClass) {
                    if (!map.hasLayer(cm.marker)) cm.marker.addTo(map);
                } else {
                    if (map.hasLayer(cm.marker)) map.removeLayer(cm.marker);
                }
            });
        });
    });

    setTimeout(() => {
        document.querySelectorAll('.custom-marker').forEach(marker => {
            marker.style.animation = 'pulse 2s infinite';
        });
    }, 500);
}

function closeMapPopup() { if (map) map.closePopup(); }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Scroll effects
    window.addEventListener('scroll', () => {
        document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
        document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 500);
    });

    // Fade-in observer
    const observer = new IntersectionObserver(entries =>
        entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
        { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Date input
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('startDate');
    if (startDate) {
        startDate.setAttribute('min', today);
        startDate.value = today;
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a =>
        a.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(a.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        })
    );

    // Map lazy load
    const zonesSection = document.getElementById('zones');
    if (zonesSection) {
        const mapObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !map) initMap();
            });
        }, { threshold: 0.1 });
        mapObserver.observe(zonesSection);
    }
});