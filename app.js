(function () {
    const flats = Array.isArray(window.FLATS) ? window.FLATS : [];
    const elTbody = document.getElementById("tbody");

    // Mapa
    const map = L.map("map").setView([52.2297, 21.0122], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    const markers = L.layerGroup().addTo(map);

    function formatNotes(flat) {
        const plusy = flat.plusy || "";
        const minusy = flat.minusy || "";
        if (!plusy && !minusy) {
            return { short: "Brak danych", full: "Brak danych" };
        }
        const full = [plusy && `+ ${plusy}`, minusy && `- ${minusy}`].filter(Boolean).join(" • ");
        const short = full.length > 40 ? `${full.slice(0, 40).trim()}...` : full;
        return { short, full };
    }

    function render() {
        const fPrice = parseFloat(document.getElementById("f-price").value);
        const fSqm = parseFloat(document.getElementById("f-sqm").value);
        const fRooms = parseFloat(document.getElementById("f-rooms").value);
        const fArea = document.getElementById("f-area").value.toLowerCase();

        const filtered = flats.filter(x => {
            return (!fPrice || x.pricePLN <= fPrice) &&
                (!fSqm || x.sqm >= fSqm) &&
                (!fRooms || x.rooms >= fRooms) &&
                (!fArea || x.area.toLowerCase().includes(fArea));
        });

        elTbody.innerHTML = "";
        markers.clearLayers();

        filtered.forEach(x => {
            const pricePerM = x.sqm ? Math.round(x.pricePLN / x.sqm) : 0;
            const rateLoc = Number(x.rate_loc) || 0;
            const rateApt = Number(x.rate_apt) || 0;
            const ratePrice = Number(x.rate_price) || 0;
            const avgRate = ((rateLoc + rateApt + ratePrice) / 3).toFixed(1);
            const notes = formatNotes(x);

            // Dodaj marker
            L.marker([x.lat, x.lng]).addTo(markers).bindPopup(`<b>${x.pricePLN.toLocaleString()} zł</b><br>${x.area}`);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="sticky-col highlight">${x.pricePLN.toLocaleString()} zł</td>
                <td>${x.sqm} m²</td>
                <td style="color:#94a3b8">${pricePerM} zł/m²</td>
                <td>${x.rooms}</td>

                <td class="col-area">${x.area}</td>
                <td>${x.floor || '-'}</td>
                <td>${x.year || '-'}</td>
                <td>${x.condition || '-'}</td>
                <td>${x.rent || '-'} zł</td>
                <td>${x.ownership || '-'}</td>
                <td>${x.kw || '-'}</td>

                <td>${x.balcony === 'Tak' ? '🏙️' : ''} ${x.parking ? '🚗' : ''}</td>
                <td title="${notes.full}">${notes.short}</td>
                <td>${"⭐".repeat(rateLoc)}</td>
                <td>${"⭐".repeat(rateApt)}</td>
                <td>${"⭐".repeat(ratePrice)}</td>
                <td class="highlight" style="background:#eff6ff">${avgRate}</td>

                <td><span class="badge badge-status">${x.status}</span></td>
                <td>${x.contact_type || '-'}</td>
                <td>${x.negotiable || '-'}</td>
                <td><a href="${x.url}" target="_blank" style="color:var(--primary)">Otwórz ↗</a></td>
            `;
            tr.onclick = (e) => { if(e.target.tagName !== 'A') map.setView([x.lat, x.lng], 15); };
            elTbody.appendChild(tr);
        });

        if (!filtered.length) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td class="empty-state" colspan="21">Brak ofert spełniających kryteria.</td>`;
            elTbody.appendChild(tr);
        }
    }

    document.querySelectorAll("input").forEach(i => i.addEventListener("input", render));
    document.getElementById("reset-filters").onclick = () => {
        document.querySelectorAll("input").forEach(i => i.value = "");
        render();
    };

    render();
})();
