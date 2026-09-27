
 // ==========================================
 // VETERINARIA LA MARY - SCRIPT PRINCIPAL
 // ==========================================


// ==========================================
// ESCAPAR TEXTO HTML
// ==========================================

function escaparHTML(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// SERVICIOS
// ==========================================

function mostrarServicio(servicio) {

    const informacion = document.getElementById("informacion-servicio");

    if (!informacion) {
        return;
    }

    if (servicio === "consulta") {
        informacion.innerHTML = `
            <h3>Consulta veterinaria</h3>
            <p>Atención clínica general para controlar la salud de las mascotas y detectar posibles problemas.</p>
        `;
    }

    if (servicio === "vacunacion") {
        informacion.innerHTML = `
            <h3>Vacunación</h3>
            <p>Aplicación de vacunas y seguimiento del calendario de vacunación de perros y gatos.</p>
        `;
    }

    if (servicio === "desparasitacion") {
        informacion.innerHTML = `
            <h3>Desparasitación</h3>
            <p>Control y prevención de parásitos internos y externos.</p>
        `;
    }

    if (servicio === "peluqueria") {
        informacion.innerHTML = `
            <h3>Peluquería y baño</h3>
            <p>Baño, corte y cuidado de la higiene de las mascotas.</p>
        `;
    }

    if (servicio === "salud") {
        informacion.innerHTML = `
            <h3>Control de salud</h3>
            <p>Controles periódicos para prevenir enfermedades y mantener el bienestar de los animales.</p>
        `;
    }

    if (servicio === "urgencias") {
        informacion.innerHTML = `
            <h3>Urgencias veterinarias</h3>
            <p>Atención ante situaciones que requieran asistencia veterinaria rápida.</p>
        `;
    }

    localStorage.setItem("ultimoServicio", servicio);
}


// ==========================================
// API EXTERNA DE PERROS
// ==========================================

function buscarRaza() {

    const resultado = document.getElementById("resultado-raza");

    if (!resultado) {
        return;
    }

    resultado.innerHTML = `
        <p>Buscando información...</p>
    `;

    fetch("https://dog.ceo/api/breed/hound/images/random")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al consultar la API");
            }
            return response.json();
        })
        .then(data => {

            resultado.innerHTML = `
                <h3>Información obtenida desde una API</h3>

                <p>
                    Se obtuvo una imagen de una raza de perro
                    mediante una API externa.
                </p>

                <img
                    src="${data.message}"
                    class="img-fluid rounded mt-3"
                    alt="Imagen de perro obtenida desde una API">
            `;
        })
        .catch(error => {

            resultado.innerHTML = `
                <p>No se pudo obtener la información.</p>
            `;

            console.error(error);
        });
}


// ==========================================
// OBTENER FOTO DEL VETERINARIO
// ==========================================

function obtenerFotoInicio(veterinario) {
    return (
        veterinario.fotoVeterinario ||
        veterinario.imagenVeterinario ||
        veterinario.foto ||
        veterinario.imagen ||
        ""
    );
}


// ==========================================
// MOSTRAR PROFESIONALES EN LA PÁGINA PRINCIPAL
// ==========================================

function mostrarProfesionalesInicio() {

    const lista = document.getElementById("listaProfesionalesInicio");

    // Esta función solo actúa en index.html
    if (!lista) {
        return;
    }

    const veterinarios = JSON.parse(
        localStorage.getItem("veterinarios")
    ) || [];

    if (veterinarios.length === 0) {
        lista.innerHTML = `
            <div class="col-12 text-center">
                <p>No hay profesionales registrados.</p>
            </div>
        `;
        return;
    }

    lista.innerHTML = veterinarios.map(function(veterinario) {

        const nombre = escaparHTML(veterinario.nombre || "");

        const especialidad = escaparHTML(
            veterinario.especialidad ||
            veterinario.especializacion ||
            ""
        );

        const valor = Number(veterinario.valorConsulta || 0);

        const foto = obtenerFotoInicio(veterinario);

        let imagenHTML = "";

        if (foto && foto.startsWith("data:image/")) {
            imagenHTML = `
                <img
                    src="${foto}"
                    class="card-img-top"
                    alt="Foto de ${nombre}"
                    style="height: 250px; object-fit: cover;">
            `;
        }

        return `
            <div class="col-12 col-md-6 col-lg-4">

                <div class="card h-100 shadow-sm">

                    ${imagenHTML}

                    <div class="card-body text-center">

                        <h3 class="card-title">
                            ${nombre}
                        </h3>

                        <p class="card-text">
                            <strong>Especialidad:</strong>
                            ${especialidad}
                        </p>

                        <p class="card-text">
                            <strong>Valor de consulta:</strong>
                            $${valor.toFixed(2)}
                        </p>

                    </div>
                </div>
            </div>
        `;
    }).join("");
}


// ==========================================
// INICIAR AL CARGAR LA PÁGINA
// ==========================================

window.addEventListener("DOMContentLoaded", function() {

    // Recuperar el último servicio seleccionado
    const ultimoServicio = localStorage.getItem("ultimoServicio");

    if (ultimoServicio) {
        mostrarServicio(ultimoServicio);
    }

    // Mostrar profesionales en el inicio
    mostrarProfesionalesInicio();
});