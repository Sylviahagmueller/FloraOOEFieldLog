let funde = []; 
let arten = {}; 
let lastPosition = null;

fetch("arten.json")
    .then(response => response.json())
    .then(data => arten = data);

navigator.geolocation.getCurrentPosition(
    (position) => {
        lastPosition = position.coords;
    },
    (error) => {
        console.error("GPS-Fehler:", error);
    }
);

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

function recordFund() {
    const input = document.getElementById("search").value.trim().toLowerCase();
    const status = document.getElementById("status");

    if (!arten[input]) {
        status.textContent = "Kürzel nicht gefunden!";
        return;
    }

    const timestamp = new Date().toISOString();
    funde.push({
        kuerzel: input,
        name: arten[input],
        zeit: timestamp,
        lat: lastPosition ? lastPosition.latitude : "N/A",
        lon: lastPosition ? lastPosition.longitude : "N/A"
    });

    status.textContent = `Fund gespeichert: ${arten[input]}`;
    document.getElementById("search").value = "";
    document.getElementById("suggestions").innerHTML = "";
    updateList();
}


function updateList() {
    const tbody = document.querySelector("#fundTable tbody");
    tbody.innerHTML = "";

    funde.forEach(f => {
        const date = new Date(f.zeit);
        const dateStr = date.toLocaleDateString("de-DE");
        const timeStr = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

        const [gattung, art] = f.name.split(" ");

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



function exportCSV() {
    let csv = "Kürzel,Name,Zeit,Lat,Lon\n";
    funde.forEach(f => {
        csv += `${f.kuerzel},${f.name},${f.zeit},${f.lat},${f.lon}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "funde.csv";
    a.click();
    URL.revokeObjectURL(url);
}

