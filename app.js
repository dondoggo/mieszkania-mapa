(function () {
    const flats = Array.isArray(window.FLATS) ? window.FLATS : [];
    const elTbody = document.getElementById("tbody");

    // Mapa
    const map = L.map("map").setView([52.2297, 21.0122], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    const markers = L.layerGroup().addTo(map);

    function render() {
        const fPrice = parseFloat(document.getElementById("f-price").value);
        const fSqm = parseFloat(document.getElementById("f-sqm").value);
        const fArea = document.getElementById("f-area").value.toLowerCase();

        const filtered = flats.filter(x => {
            return (!fPrice || x.pricePLN <= fPrice) &&
                (!fSqm || x.sqm >= fSqm) &&
                (!fArea || x.area.toLowerCase().includes(fArea));
        });

        elTbody.innerHTML = "";
        markers.clearLayers();

        filtered.forEach(x => {
            const pricePerM = x.sqm ? Math.round(x.pricePLN / x.sqm) : 0;
            const avgRate = ((x.rate_loc + x.rate_apt + x.rate_price) / 3).toFixed(1);

            // Dodaj marker
            L.marker([x.lat, x.lng]).addTo(markers).bindPopup(`<b>${x.pricePLN.toLocaleString()} zł</b><br>${x.area}`);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="sticky-col highlight">${x.pricePLN.toLocaleString()} zł</td>
                <td>${x.sqm} m²</td>
                <td style="color:#94a3b8">${pricePerM} zł/m²</td>
                <td>${x.rooms}</td>

                <td>${x.area}</td>
                <td>${x.floor || '-'}</td>
                <td>${x.year || '-'}</td>
                <td>${x.condition || '-'}</td>
                <td>${x.rent || '-'} zł</td>
                <td>${x.ownership || '-'}</td>
                <td>${x.kw || '-'}</td>

                <td>${x.balcony === 'Tak' ? '🏙️' : ''} ${x.parking ? '🚗' : ''}</td>
                <td title="${x.minusy}">${x.plusy.substring(0,12)}...</td>
                <td>${"⭐".repeat(x.rate_loc)}</td>
                <td>${"⭐".repeat(x.rate_apt)}</td>
                <td>${"⭐".repeat(x.rate_price)}</td>
                <td class="highlight" style="background:#eff6ff">${avgRate}</td>

                <td><span class="badge badge-status">${x.status}</span></td>
                <td>${x.contact_type || '-'}</td>
                <td>${x.negotiable || '-'}</td>
                <td><a href="${x.url}" target="_blank" style="color:var(--primary)">Otwórz ↗</a></td>
            `;
            tr.onclick = (e) => { if(e.target.tagName !== 'A') map.setView([x.lat, x.lng], 15); };
            elTbody.appendChild(tr);
        });
    }

    document.querySelectorAll("input").forEach(i => i.addEventListener("input", render));
    document.getElementById("reset-filters").onclick = () => {
        document.querySelectorAll("input").forEach(i => i.value = "");
        render();
    };

    render();
})();