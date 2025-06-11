let funde = [];
let arten = {};
let lastPosition = null;

// Lade Artenliste
fetch("arten.json")
    .then(response => response.json())
    .then(data => arten = data);

// Hole GPS-Position
/*navigator.geolocation.getCurrentPosition(
    (position) => {
        lastPosition = position.coords;
    },
    (error) => {
        console.error("GPS-Fehler:", error);
    }
);*/

// Vorschläge anzeigen
function showSuggestions() {
    const input = document.getElementById("search").value.toLowerCase();
    const suggestionBox = document.getElementById("suggestions");
    suggestionBox.innerHTML = "";

    if (input.length < 2) return;

    const matches = Object.entries(arten).filter(([k, v]) =>
        k.includes(input) || v.toLowerCase().includes(input)
    );

    matches.slice(0, 10).forEach(([k, v]) => {
        const div = document.createElement("div");
        div.textContent = `${k} – ${v}`;
        div.onclick = () => {
            document.getElementById("search").value = k;
            suggestionBox.innerHTML = "";
        };
        suggestionBox.appendChild(div);
    });
}

// Fund speichern
function recordFund() {
    const input = document.getElementById("search").value.trim().toLowerCase();
    const status = document.getElementById("status");

    if (!arten[input]) {
        status.textContent = "Kürzel nicht gefunden!";
        return;
    }

    const timestamp = new Date().toISOString();

    // Versuche Standort zu ermitteln, aber speichere auch ohne
    status.textContent = "📡 Versuche Standort zu ermitteln …";
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        status.textContent = `Standort erfasst: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        saveFund(input, timestamp, lat, lon);
    }, error => {
        status.textContent = `Standort konnte nicht erfasst werden: ${error.message}`;
        saveFund(input, timestamp, "N/A", "N/A");
    });
}


function saveFund(input, timestamp, lat, lon) {
    const beobachter = document.getElementById("beobachter").value.trim();
    const projekt = document.getElementById("projekt").value.trim();

    funde.push({
        kuerzel: input,
        name: arten[input],
        zeit: timestamp,
        lat: typeof lat === "number" ? lat.toFixed(5) : lat,
        lon: typeof lon === "number" ? lon.toFixed(5) : lon,
        beobachter: beobachter,
        projekt: projekt
    });

    document.getElementById("status").textContent = `Fund gespeichert: ${arten[input]}`;
    document.getElementById("search").value = "";
    document.getElementById("suggestions").innerHTML = "";
    updateList();
}


// Tabelle aktualisieren
function updateList() {
    const tbody = document.querySelector("#fundTable tbody");
    tbody.innerHTML = "";

    funde.forEach(f => {
        const date = new Date(f.zeit);
        const dateStr = date.toLocaleDateString("de-DE");
        const timeStr = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        const [gattung, ...rest] = f.name.split(" ");
        const art = rest.join(" ");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${gattung}</td>
            <td>${art}</td>
            <td>${dateStr}, ${timeStr}</td>
            <td>${f.lat}, ${f.lon}</td>
        `;
        tbody.appendChild(row);
    });
}

// CSV exportieren
function exportCSV() {
    let csv = "Datum;Laenge;Breite;Dets;Gattung;Art\n";

    funde.forEach(f => {
        const date = new Date(f.zeit);
        const datum = date.toLocaleDateString("de-DE") + " " + date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        const laenge = f.lon || "";
        const breite = f.lat || "";
        const dets = f.beobachter || "";
        const [gattung, ...rest] = f.name.split(" ");
        const art = rest.join(" ");

        csv += `${datum};${laenge};${breite};${dets};${gattung};${art}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const fileName = generateFilename();
    const file = new File([blob], fileName, { type: "text/csv" });

    if (isMobile() && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
            title: "Funde exportieren",
            text: "Fundliste als CSV-Datei",
            files: [file]
        }).catch(error => {
            alert("Teilen abgebrochen oder nicht verfügbar.");
        });
    } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
}


function generateFilename() {
    const projekt = document.getElementById("projekt").value.trim();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0,5).replace(":", "-");
    const safeProjekt = projekt !== "" ? "_" + projekt.replaceAll(" ", "_") : "";
    return `Funde${safeProjekt}_${dateStr}_${timeStr}.csv`;
}

function isMobile() {
    return /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
}


// Tabelle sortieren
function sortTable(colIndex) {
    const table = document.getElementById("fundTable");
    const rows = Array.from(table.tBodies[0].rows);
    const ascending = table.getAttribute("data-sort-dir") !== "asc";
    rows.sort((a, b) => {
        const aText = a.cells[colIndex].textContent.trim();
        const bText = b.cells[colIndex].textContent.trim();
        return ascending ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });
    table.setAttribute("data-sort-dir", ascending ? "asc" : "desc");
    rows.forEach(row => table.tBodies[0].appendChild(row));
}
