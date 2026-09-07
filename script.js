function mostrarServicio(servicio) {

    let informacion = document.getElementById("informacion-servicio");

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
}