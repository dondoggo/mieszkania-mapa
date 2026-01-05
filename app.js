(function () {
    /** @type {Array<{id:string,title:string,area:string,pricePLN:number,lat:number,lng:number,url:string}>} */
    const flats = Array.isArray(window.FLATS) ? window.FLATS : [];

    const elQ = document.getElementById("q");
    const elMaxPrice = document.getElementById("maxPrice");
    const elSort = document.getElementById("sort");
    const elReset = document.getElementById("reset");
    const elTbody = document.getElementById("tbody");
    const elCount = document.getElementById("count");

    // --- MAPA ---
    const defaultCenter = guessCenter(flats) ?? { lat: 52.2297, lng: 21.0122 }; // Warszawa jako domyślne
    const map = L.map("map").setView([defaultCenter.lat, defaultCenter.lng], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    // --- UI ---
    elQ.addEventListener("input", render);
    elMaxPrice.addEventListener("input", render);
    elSort.addEventListener("change", render);
    elReset.addEventListener("click", () => {
        elQ.value = "";
        elMaxPrice.value = "";
        elSort.value = "price_asc";
        render();
    });

    render();

    function render() {
        const filtered = applyFilters(flats);
        const sorted = applySort(filtered);

        renderTable(sorted);
        renderMarkers(sorted);
        renderCount(sorted.length);

        fitMapIfNeeded(sorted);
    }

    function applyFilters(items) {
        const q = (elQ.value || "").trim().toLowerCase();
        const maxPrice = Number(elMaxPrice.value);

        return items.filter(x => {
            const text = `${x.title} ${x.area}`.toLowerCase();
            const okQ = q ? text.includes(q) : true;
            const okPrice = Number.isFinite(maxPrice) && maxPrice > 0 ? x.pricePLN <= maxPrice : true;
            return okQ && okPrice;
        });
    }

    function applySort(items) {
        const mode = elSort.value;
        const copy = [...items];

        copy.sort((a, b) => {
            if (mode === "price_asc") return a.pricePLN - b.pricePLN;
            if (mode === "price_desc") return b.pricePLN - a.pricePLN;
            if (mode === "title_asc") return a.title.localeCompare(b.title, "pl");
            if (mode === "city_asc") return a.area.localeCompare(b.area, "pl");
            return 0;
        });

        return copy;
    }

    function renderTable(items) {
        elTbody.innerHTML = "";

        for (const x of items) {
            const tr = document.createElement("tr");
            tr.title = "Kliknij, aby zbliżyć mapę i otworzyć szczegóły pinezki";

            tr.addEventListener("click", () => {
                if (isValidLatLng(x)) {
                    map.setView([x.lat, x.lng], 15);
                }
                // Otwórz link w nowej karcie (opcjonalnie):
                // window.open(x.url, "_blank", "noopener,noreferrer");
            });

            tr.innerHTML = `
        <td><strong>${escapeHtml(x.title)}</strong></td>
        <td>${escapeHtml(x.area)}</td>
        <td class="num">${formatPLN(x.pricePLN)}</td>
        <td><a href="${escapeAttr(x.url)}" target="_blank" rel="noopener noreferrer">Otodom</a></td>
      `;

            elTbody.appendChild(tr);
        }

        if (items.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td colspan="4" style="color:#6b7280;padding:14px 12px;">Brak wyników.</td>`;
            elTbody.appendChild(tr);
        }
    }

    function renderMarkers(items) {
        markersLayer.clearLayers();

        for (const x of items) {
            if (!isValidLatLng(x)) continue;

            const popupHtml = `
        <div style="min-width:220px">
          <div style="font-weight:700;margin-bottom:4px">${escapeHtml(x.title)}</div>
          <div style="color:#6b7280;margin-bottom:6px">${escapeHtml(x.area)}</div>
          <div style="margin-bottom:8px"><strong>${formatPLN(x.pricePLN)}</strong></div>
          <a href="${escapeAttr(x.url)}" target="_blank" rel="noopener noreferrer">Otwórz na Otodom</a>
        </div>
      `;

            const marker = L.marker([x.lat, x.lng]).bindPopup(popupHtml);
            marker.addTo(markersLayer);
        }
    }

    function renderCount(n) {
        elCount.textContent = `Widoczne oferty: ${n}`;
    }

    function fitMapIfNeeded(items) {
        const coords = items.filter(isValidLatLng).map(x => [x.lat, x.lng]);
        if (coords.length === 0) return;

        const bounds = L.latLngBounds(coords);
        // Nie zoomuj jak jest 1 punkt i już blisko
        if (coords.length === 1) {
            const [lat, lng] = coords[0];
            map.setView([lat, lng], Math.max(map.getZoom(), 13));
            return;
        }
        map.fitBounds(bounds.pad(0.2));
    }

    function guessCenter(items) {
        const valid = items.filter(isValidLatLng);
        if (valid.length === 0) return null;
        const avgLat = valid.reduce((s, x) => s + x.lat, 0) / valid.length;
        const avgLng = valid.reduce((s, x) => s + x.lng, 0) / valid.length;
        return { lat: avgLat, lng: avgLng };
    }

    function isValidLatLng(x) {
        return (
            x &&
            Number.isFinite(x.lat) &&
            Number.isFinite(x.lng) &&
            Math.abs(x.lat) <= 90 &&
            Math.abs(x.lng) <= 180
        );
    }

    function formatPLN(n) {
        try {
            return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);
        } catch {
            return `${n} PLN`;
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function escapeAttr(str) {
        // Minimalnie: zabezpieczenie cudzysłowów w atrybutach.
        return String(str).replaceAll('"', "%22");
    }
})();
