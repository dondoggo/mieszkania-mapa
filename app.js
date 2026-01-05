(function () {
    const flats = Array.isArray(window.FLATS) ? window.FLATS : [];

    const filters = {
        price: document.getElementById("f-price"),
        sqm: document.getElementById("f-sqm"),
        area: document.getElementById("f-area"),
        rooms: document.getElementById("f-rooms")
    };
    const elReset = document.getElementById("reset-filters");
    const elTbody = document.getElementById("tbody");

    // Mapa z ładniejszym, jasnym stylem
    const map = L.map("map").setView([52.2297, 21.0122], 12);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    // Renderowanie
    function render() {
        const filtered = flats.filter(x => {
            const fPrice = parseFloat(filters.price.value);
            const fSqm = parseFloat(filters.sqm.value);
            const fArea = filters.area.value.toLowerCase();
            const fRooms = parseInt(filters.rooms.value);

            return (!fPrice || x.pricePLN <= fPrice) &&
                (!fSqm || (x.sqm || 0) >= fSqm) &&
                (!fArea || x.area.toLowerCase().includes(fArea)) &&
                (!fRooms || (x.rooms || 0) >= fRooms);
        });

        renderTable(filtered);
        renderMarkers(filtered);
    }

    function renderTable(items) {
        elTbody.innerHTML = "";
        items.forEach(x => {
            const pricePerMeter = x.sqm ? Math.round(x.pricePLN / x.sqm) : "-";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="price-tag">${formatPLN(x.pricePLN)}</td>
                <td class="sqm-price">${pricePerMeter} zł/m²</td>
                <td>${x.sqm || "-"} m²</td>
                <td>${x.area}</td>
                <td><span class="room-badge">${x.rooms || "?"} pok.</span></td>
                <td style="color:#64748b">${x.phone || "brak"}</td>
                <td><a href="${x.url}" target="_blank" class="btn-link">Otwórz ↗</a></td>
            `;
            tr.onclick = (e) => {
                if(e.target.tagName !== 'A') map.setView([x.lat, x.lng], 15);
            };
            elTbody.appendChild(tr);
        });
    }

    function renderMarkers(items) {
        markersLayer.clearLayers();
        items.forEach(x => {
            if (x.lat && x.lng) {
                const popup = `
                    <div style="font-family:'Inter', sans-serif">
                        <b>${x.title}</b><br>
                        <span style="color:#4f46e5; font-weight:700">${formatPLN(x.pricePLN)}</span>
                    </div>
                `;
                L.marker([x.lat, x.lng]).bindPopup(popup).addTo(markersLayer);
            }
        });
    }

    // Eventy
    Object.values(filters).forEach(i => i.addEventListener("input", render));
    elReset.addEventListener("click", () => {
        Object.values(filters).forEach(i => i.value = "");
        render();
    });

    function formatPLN(n) { return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(n); }

    render();
})();