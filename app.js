(function () {
    const flats = Array.isArray(window.FLATS) ? window.FLATS : [];

    // Elementy filtrów
    const filters = {
        price: document.getElementById("f-price"),
        sqm: document.getElementById("f-sqm"),
        area: document.getElementById("f-area"),
        rooms: document.getElementById("f-rooms")
    };
    const elReset = document.getElementById("reset-filters");
    const elTbody = document.getElementById("tbody");

    // Inicjalizacja Mapy (po lewej stronie)
    const map = L.map("map").setView([52.2297, 21.0122], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    // Nasłuchiwanie na wszystkie filtry
    Object.values(filters).forEach(input => {
        input.addEventListener("input", render);
    });

    elReset.addEventListener("click", () => {
        Object.values(filters).forEach(input => input.value = "");
        render();
    });

    function applyFilters(items) {
        const fPrice = parseFloat(filters.price.value);
        const fSqm = parseFloat(filters.sqm.value);
        const fArea = filters.area.value.toLowerCase();
        const fRooms = parseInt(filters.rooms.value);

        return items.filter(x => {
            const okPrice = fPrice ? x.pricePLN <= fPrice : true;
            const okSqm = fSqm ? (x.sqm || 0) >= fSqm : true;
            const okArea = fArea ? x.area.toLowerCase().includes(fArea) : true;
            const okRooms = fRooms ? (x.rooms || 0) >= fRooms : true;
            return okPrice && okSqm && okArea && okRooms;
        });
    }

    function renderTable(items) {
        elTbody.innerHTML = "";
        items.forEach(x => {
            const pricePerMeter = x.sqm ? Math.round(x.pricePLN / x.sqm) : "-";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="price-cell">${formatPLN(x.pricePLN)}</td>
                <td>${pricePerMeter} zł/m²</td>
                <td>${x.sqm || "-"} m²</td>
                <td>${escapeHtml(x.area)}</td>
                <td>${x.rooms || "-"}</td>
                <td>${x.phone || "brak"}</td>
                <td><a href="${x.url}" target="_blank" class="link-btn">Otodom ↗</a></td>
            `;
            tr.onclick = () => map.setView([x.lat, x.lng], 15);
            elTbody.appendChild(tr);
        });
    }

    function renderMarkers(items) {
        markersLayer.clearLayers();
        items.forEach(x => {
            if (x.lat && x.lng) {
                L.marker([x.lat, x.lng])
                    .bindPopup(`<b>${x.title}</b><br>${formatPLN(x.pricePLN)}`)
                    .addTo(markersLayer);
            }
        });
    }

    function render() {
        const filtered = applyFilters(flats);
        renderTable(filtered);
        renderMarkers(filtered);
    }

    function formatPLN(n) {
        return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(n);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
    }

    render();
})();