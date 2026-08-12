/**
 * Panel de Administración LEBJ PRO - Módulo de Gestión de Partidos
 * Sincronización en tiempo real con Google Apps Script / Google Sheets
 */

const API_URL = "https://script.google.com/macros/s/AKfycbz_FSpPwZfk0WZQ0F6T8s0cuvH2EZvce1qWHpQzZaGkuAsfXQz89f8DhC9QjqKjmAeH/exec";

// Estado global de la aplicación
let allMatches = [];

// Elementos del DOM
const matchSelector = document.getElementById("match-selector");
const adminForm = document.getElementById("admin-match-form");
const alertBox = document.getElementById("form-alert");
const submitBtn = document.getElementById("btn-submit");

/**
 * Carga los partidos existentes desde la base de datos de Google Sheets
 */
async function loadExistingMatches() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error en la respuesta de la API");
        
        const data = await res.json();
        allMatches = data.schedule || [];

        // Limpiar opciones anteriores excepto la primera ("Registrar un Partido Nuevo")
        matchSelector.innerHTML = '<option value="NEW">➕ Registrar un Partido Nuevo</option>';

        allMatches.forEach((m, index) => {
            const opt = document.createElement("option");
            opt.value = index;
            opt.textContent = `[${m.phase || 'N/A'}] ${m.teamA} vs ${m.teamB} (${m.date})`;
            matchSelector.appendChild(opt);
        });
    } catch (e) {
        console.error("No se pudieron cargar los partidos desde Google Sheets:", e);
        showAlert("Error al conectar con Google Sheets. Intenta recargar la página.", "error");
    }
}

/**
 * Rellena el formulario automáticamente al seleccionar un partido del selector
 */
matchSelector.addEventListener("change", (e) => {
    const selectedIndex = e.target.value;

    if (selectedIndex === "NEW") {
        adminForm.reset();
        // Restaurar valores por defecto del formulario limpio
        document.getElementById("match-scorea").value = "-";
        document.getElementById("match-scoreb").value = "-";
        document.getElementById("match-phase").value = "J1";
        document.getElementById("match-status").value = "pending";
        document.getElementById("match-group").value = "Grupo A";
        return;
    }

    const match = allMatches[selectedIndex];
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

/**
 * Envía la actualización o creación del partido a Google Sheets via POST
 */
adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    showAlert("Sincronizando con Google Sheets...", "info");
    toggleLoadingState(true);

    const payload = {
        sheetName: "Calendario",
        teamA: document.getElementById("match-teama").value,
        teamB: document.getElementById("match-teamb").value,
        rowValues: [
            document.getElementById("match-date").value,
            document.getElementById("match-teama").value,
            document.getElementById("match-teamb").value,
            document.getElementById("match-scorea").value,
            document.getElementById("match-scoreb").value,
            document.getElementById("match-status").value,
            document.getElementById("match-court").value,
            document.getElementById("match-phase").value,
            document.getElementById("match-group").value
        ]
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === "success") {
            showAlert("¡Cambios guardados con éxito en Google Sheets!", "success");
            setTimeout(() => location.reload(), 1500);
        } else {
            throw new Error(result.message || "Respuesta no exitosa del servidor");
        }
    } catch (err) {
        console.error("Error al guardar:", err);
        showAlert("Error al guardar: " + err.message, "error");
        toggleLoadingState(false);
    }
});

/**
 * Función auxiliar para mostrar alertas de estado con colores dinámicos
 */
function showAlert(message, type) {
    alertBox.innerText = message;
    if (type === "info") alertBox.style.color = "var(--secondary-color)";
    if (type === "success") alertBox.style.color = "var(--success-color)";
    if (type === "error") alertBox.style.color = "var(--error-color)";
}

/**
 * Bloquea/Desbloquea el botón para evitar múltiples envíos accidentales
 */
function toggleLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
    } else {
        submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Actualizar en Google Sheets`;
    }
}

// Inicialización
document.addEventListener("DOMContentLoaded", loadExistingMatches);