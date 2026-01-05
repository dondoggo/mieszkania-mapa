(function () {
    const flats = Array.isArray(window.FLATS) ? window.FLATS : [];

    const elQ = document.getElementById("q");
    const elMaxPrice = document.getElementById("maxPrice");
    const elSort = document.getElementById("sort");
    const elReset = document.getElementById("reset");
    const elListings = document.getElementById("listings-container");
    const elCount = document.getElementById("count");
    const elStats = document.getElementById("stats-bar");

    // Inicjalizacja Mapy
    const defaultCenter = guessCenter(flats) ?? { lat: 52.2297, lng: 21.0122 };
    const map = L.map("map", { scrollWheelZoom: true }).setView([defaultCenter.lat, defaultCenter.lng], 12);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    // Event Listeners
    [elQ, elMaxPrice, elSort].forEach(el => el.addEventListener("input", render));
    elReset.addEventListener("click", () => {
        elQ.value = ""; elMaxPrice.value = ""; elSort.value = "price_asc";
        render();
    });

    function render() {
        const filtered = applyFilters(flats);
        const sorted = applySort(filtered);

        renderStats(filtered);
        renderCards(sorted);
        renderMarkers(sorted);

        elCount.textContent = `${sorted.length} ${getNoun(sorted.length, 'oferta', 'oferty', 'ofert')}`;
        fitMapIfNeeded(sorted);
    }

    function applyFilters(items) {
        const q = (elQ.value || "").trim().toLowerCase();
        const maxPrice = Number(elMaxPrice.value);

        return items.filter(x => {
            const text = `${x.title} ${x.area}`.toLowerCase();
            const okQ = q ? text.includes(q) : true;
            const okPrice = (maxPrice > 0) ? x.pricePLN <= maxPrice : true;
            return okQ && okPrice;
        });
    }

    function applySort(items) {
        const mode = elSort.value;
        const copy = [...items];
        return copy.sort((a, b) => {
            if (mode === "price_asc") return a.pricePLN - b.pricePLN;
            if (mode === "price_desc") return b.pricePLN - a.pricePLN;
            if (mode === "title_asc") return a.title.localeCompare(b.title, "pl");
            return 0;
        });
    }

    function renderStats(items) {
        if (items.length === 0) { elStats.innerHTML = ""; return; }
        const avg = Math.round(items.reduce((acc, x) => acc + x.pricePLN, 0) / items.length);
        const min = Math.min(...items.map(x => x.pricePLN));

        elStats.innerHTML = `
            <div class="stat-card"><div class="stat-label">Średnia cena</div><div class="stat-value">${formatPLN(avg)}</div></div>
            <div class="stat-card"><div class="stat-label">Najtańsze</div><div class="stat-value">${formatPLN(min)}</div></div>
        `;
    }

    function renderCards(items) {
        elListings.innerHTML = "";
        if (items.length === 0) {
            elListings.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b;">Brak wyników spełniających kryteria.</div>';
            return;
        }

        items.forEach(x => {
            const card = document.createElement("div");
            card.className = "flat-card";
            card.innerHTML = `
                <h4>${escapeHtml(x.title)}</h4>
                <div class="flat-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    ${escapeHtml(x.area)}
                </div>
                <div class="flat-price">${formatPLN(x.pricePLN)}</div>
            `;
            card.onclick = () => {
                map.setView([x.lat, x.lng], 15);
                // Znajdź marker i otwórz popup
                markersLayer.eachLayer(m => {
                    if (m.getLatLng().lat === x.lat && m.getLatLng().lng === x.lng) m.openPopup();
                });
            };
            elListings.appendChild(card);
        });
    }

    function renderMarkers(items) {
        markersLayer.clearLayers();
        items.forEach(x => {
            if (!isValidLatLng(x)) return;
            const popupHtml = `
                <div style="font-family:'Inter', sans-serif; padding:5px">
                    <strong style="display:block;margin-bottom:5px">${escapeHtml(x.title)}</strong>
                    <span style="color:#2563eb; font-weight:bold; font-size:16px">${formatPLN(x.pricePLN)}</span><br>
                    <a href="${x.url}" target="_blank" style="display:inline-block; margin-top:10px; color:#2563eb; text-decoration:none; font-weight:600">Zobacz ogłoszenie →</a>
                </div>
            `;
            L.marker([x.lat, x.lng]).bindPopup(popupHtml).addTo(markersLayer);
        });
    }

    // Helpery
    function formatPLN(n) { return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(n); }
    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
    function isValidLatLng(x) { return x && Number.isFinite(x.lat) && Math.abs(x.lat) <= 90; }
    function getNoun(n, s, m, g) { return n === 1 ? s : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? m : g); }
    function guessCenter(items) {
        const v = items.filter(isValidLatLng);
        if (!v.length) return null;
        return { lat: v.reduce((s, x) => s + x.lat, 0) / v.length, lng: v.reduce((s, x) => s + x.lng, 0) / v.length };
    }
    function fitMapIfNeeded(items) {
        const coords = items.filter(isValidLatLng).map(x => [x.lat, x.lng]);
        if (coords.length > 1) map.fitBounds(L.latLngBounds(coords).pad(0.1));
    }

    render();
})();