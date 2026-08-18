/**
 * Panel de Administración LEBJ PRO - Gestión Modular
 */
const API_URL = "https://script.google.com/macros/s/AKfycbz_FSpPwZfk0WZQ0F6T8s0cuvH2EZvce1qWHpQzZaGkuAsfXQz89f8DhC9QjqKjmAeH/exec";

let globalAdminData = { schedule: [], teams: [], players: [] };

document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    loadAllData();
});

// ==========================================
// 1. GESTIÓN DE PESTAÑAS (TABS)
// ==========================================
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });
}

// ==========================================
// 2. CARGA CENTRALIZADA DE DATOS
// ==========================================
async function loadAllData() {
    try {
        const res = await fetch(API_URL);
        globalAdminData = await res.json();
        
        populateMatchSelector();
        populateTeamSelectors();
        
    } catch (e) {
        console.error("Error conectando con Google Sheets:", e);
        showMsg(".match-alert", "Error de conexión. Recarga la página.", "error");
    }
}

function showMsg(selector, message, type) {
    const el = document.querySelector(selector);
    el.innerText = message;
    el.style.color = type === "error" ? "var(--error-color)" : (type === "success" ? "var(--success-color)" : "var(--secondary-color)");
    if(type === "success") setTimeout(() => el.innerText = "", 4000);
}

function toggleBtn(btnElement, isLoading) {
    btnElement.disabled = isLoading;
    if (isLoading) {
        btnElement.dataset.original = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
    } else {
        btnElement.innerHTML = btnElement.dataset.original || "Guardar";
    }
}

// ==========================================
// 3. MÓDULO: PARTIDOS
// ==========================================
const matchSelector = document.getElementById("match-selector");
const matchForm = document.getElementById("admin-match-form");

function populateMatchSelector() {
    const currentSel = matchSelector.value;
    matchSelector.innerHTML = '<option value="NEW">➕ Registrar un Partido Nuevo</option>';
    
    (globalAdminData.schedule || []).forEach((m, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `[${m.phase}] ${m.teamA} vs ${m.teamB} (${m.date})`;
        matchSelector.appendChild(opt);
    });
    if(currentSel) matchSelector.value = currentSel;
}

matchSelector.addEventListener("change", (e) => {
    if (e.target.value === "NEW") {
        matchForm.reset();
        document.getElementById("match-scorea").value = "-";
        document.getElementById("match-scoreb").value = "-";
        return;
    }
    const match = globalAdminData.schedule[e.target.value];
    if (match) {
        document.getElementById("match-date").value = match.date || "";
        document.getElementById("match-teama").value = match.teamA || "";
        document.getElementById("match-teamb").value = match.teamB || "";
        document.getElementById("match-scorea").value = match.scoreA || "-";
        document.getElementById("match-scoreb").value = match.scoreB || "-";
        document.getElementById("match-status").value = match.status || "pending";
        document.getElementById("match-phase").value = match.phase || "J1";
        document.getElementById("match-group").value = match.group || "Grupo A";
        document.getElementById("match-court").value = match.court || "";
    }
});

matchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    toggleBtn(btn, true);
    
    const payload = {
        sheetName: "Calendario",
        teamA: document.getElementById("match-teama").value,
        teamB: document.getElementById("match-teamb").value,
        rowValues: [
            document.getElementById("match-date").value, document.getElementById("match-teama").value,
            document.getElementById("match-teamb").value, document.getElementById("match-scorea").value,
            document.getElementById("match-scoreb").value, document.getElementById("match-status").value,
            document.getElementById("match-court").value, document.getElementById("match-phase").value,
            document.getElementById("match-group").value
        ]
    };

    try {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        if ((await res.json()).status === "success") {
            showMsg(".match-alert", "Partido guardado exitosamente", "success");
            await loadAllData();
        }
    } catch(err) { showMsg(".match-alert", "Error al guardar", "error"); }
    toggleBtn(btn, false);
});

// ==========================================
// 4. MÓDULO: EQUIPOS (REDES)
// ==========================================
const teamSelector = document.getElementById("team-selector");
const teamForm = document.getElementById("admin-team-form");

function populateTeamSelectors() {
    const teams = globalAdminData.teams || [];
    
    // Selectores de Equipos (Para Redes)
    teamSelector.innerHTML = '<option value="">-- Elige un equipo --</option>';
    
    // Selectores de Equipos (Para Roster)
    const rosterTeamSel = document.getElementById("roster-team-selector");
    rosterTeamSel.innerHTML = '<option value="">-- Elige un equipo --</option>';

    teams.forEach(t => {
        const opt1 = document.createElement("option"); opt1.value = t.name; opt1.textContent = t.name;
        const opt2 = document.createElement("option"); opt2.value = t.name; opt2.textContent = t.name;
        teamSelector.appendChild(opt1);
        rosterTeamSel.appendChild(opt2);
    });
}

teamSelector.addEventListener("change", (e) => {
    const teamName = e.target.value;
    if (!teamName) { teamForm.style.display = "none"; return; }
    
    teamForm.style.display = "block";
    const team = globalAdminData.teams.find(t => t.name === teamName);
    document.getElementById("team-social-url").value = team ? team.socialUrl : "";
});

teamForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    toggleBtn(btn, true);

    const payload = {
        sheetName: "Equipos",
        teamName: teamSelector.value,
        socialUrl: document.getElementById("team-social-url").value
    };

    try {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        if ((await res.json()).status === "success") {
            showMsg(".team-alert", "Perfil de equipo actualizado", "success");
            await loadAllData();
        }
    } catch(err) { showMsg(".team-alert", "Error al guardar perfil", "error"); }
    toggleBtn(btn, false);
});

// ==========================================
// 5. MÓDULO: JUGADORES
// ==========================================
const rosterTeamSel = document.getElementById("roster-team-selector");
const rosterPlayerSel = document.getElementById("roster-player-selector");
const playerForm = document.getElementById("admin-player-form");

rosterTeamSel.addEventListener("change", (e) => {
    const teamName = e.target.value;
    playerForm.style.display = "none";
    
    if (!teamName) {
        rosterPlayerSel.innerHTML = '<option value="">-- Primero elige un equipo --</option>';
        rosterPlayerSel.disabled = true;
        return;
    }

    rosterPlayerSel.disabled = false;
    rosterPlayerSel.innerHTML = '<option value="">-- Selecciona jugador --</option><option value="NEW">➕ Nuevo Jugador</option>';
    
    const teamPlayers = (globalAdminData.players || []).filter(p => p.team === teamName);
    teamPlayers.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.textContent = p.name;
        rosterPlayerSel.appendChild(opt);
    });
});

rosterPlayerSel.addEventListener("change", (e) => {
    const val = e.target.value;
    if(!val) { playerForm.style.display = "none"; return; }
    
    playerForm.style.display = "block";
    
    if (val === "NEW") {
        document.getElementById("player-name").value = "";
        document.getElementById("player-name").disabled = false;
        document.getElementById("player-games").value = "0";
        document.getElementById("player-points").value = "0";
    } else {
        const p = globalAdminData.players.find(pl => pl.name === val && pl.team === rosterTeamSel.value);
        document.getElementById("player-name").value = p.name;
        document.getElementById("player-name").disabled = true; // Evitar que edite el nombre para no duplicar
        document.getElementById("player-games").value = p.games || 0;
        document.getElementById("player-points").value = p.points || 0;
    }
});

playerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    toggleBtn(btn, true);

    const payload = {
        sheetName: "Jugadores",
        teamName: rosterTeamSel.value,
        playerName: document.getElementById("player-name").value,
        games: document.getElementById("player-games").value,
        points: document.getElementById("player-points").value
    };

    try {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        if ((await res.json()).status === "success") {
            showMsg(".player-alert", "Jugador guardado con éxito", "success");
            await loadAllData();
            // Actualizar el dropdown silenciosamente
            rosterTeamSel.dispatchEvent(new Event('change'));
        }
    } catch(err) { showMsg(".player-alert", "Error al guardar jugador", "error"); }
    toggleBtn(btn, false);
});