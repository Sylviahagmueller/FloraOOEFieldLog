
let funde = {};
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

    if (funde[input]) {
        status.textContent = "Diese Art wurde bereits erfasst.";
        return;
    }

    const timestamp = new Date().toISOString();
    funde[input] = {
        name: arten[input],
        zeit: timestamp,
        lat: lastPosition ? lastPosition.latitude : "N/A",
        lon: lastPosition ? lastPosition.longitude : "N/A"
    };

    status.textContent = `Fund gespeichert: ${arten[input]}`;
    document.getElementById("search").value = "";
    document.getElementById("suggestions").innerHTML = "";
    updateList();
}

function updateList() {
    const list = document.getElementById("fundList");
    list.innerHTML = "";
    for (const key in funde) {
        const f = funde[key];
        const li = document.createElement("li");
        li.textContent = `${f.name} – ${f.zeit} – [${f.lat}, ${f.lon}]`;
        list.appendChild(li);
    }
}

function exportCSV() {
    let csv = "Kürzel,Name,Zeit,Lat,Lon\n";
    for (const key in funde) {
        const f = funde[key];
        csv += `${key},${f.name},${f.zeit},${f.lat},${f.lon}\n`;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "funde.csv";
    a.click();
    URL.revokeObjectURL(url);
}
