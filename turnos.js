// Administración de turnos con LocalStorage.
// Un turno relaciona una mascota con un veterinario en una fecha y hora.
(() => {
    "use strict";

    const formulario = document.getElementById("formTurno");
    const selectMascota = document.getElementById("idMascota");
    const selectVeterinario = document.getElementById("idVeterinario");
    const campoFecha = document.getElementById("fecha");
    const campoHora = document.getElementById("hora");
    const campoMotivo = document.getElementById("motivo");
    const avisoDatos = document.getElementById("avisoDatos");
    const botonGuardar = document.getElementById("botonGuardarTurno");

    const filtroVeterinario = document.getElementById("filtroVeterinario");
    const filtroFecha = document.getElementById("filtroFecha");
    const botonLimpiarFiltros = document.getElementById("botonLimpiarFiltros");
    const botonExportar = document.getElementById("botonExportarTurnos");

    const tablaTurnos = document.getElementById("listaTurnos");
    const contadorTurnos = document.getElementById("totalTurnos");

    const mascotas = App.obtenerMascotas();
    const veterinarios = App.obtenerVeterinarios();

    let turnos = cargarTurnos();
    let turnosVisibles = [];

    function cargarTurnos() {
        return App.leerLista(App.CLAVES.turnos).map((turno, indice) => ({
            idTurno: String(turno.idTurno || `turno-importado-${indice}`),
            idMascota: String(turno.idMascota ?? ""),
            idVeterinario: String(turno.idVeterinario ?? ""),
            fecha: String(turno.fecha ?? ""),
            hora: String(turno.hora ?? ""),
            motivo: String(turno.motivo ?? "")
        }));
    }

    function buscarMascota(id) {
        return mascotas.find((mascota) => mascota.idMascota === id);
    }

    function buscarVeterinario(id) {
        return veterinarios.find((veterinario) => veterinario.idVeterinario === id);
    }

    // ---------- Selects del formulario y de los filtros ----------

    function cargarSelects() {
        selectMascota.innerHTML = '<option value="">Seleccionar</option>' +
            mascotas.map((mascota) =>
                `<option value="${App.escaparHTML(mascota.idMascota)}">${App.escaparHTML(mascota.nombreMascota)} (${App.escaparHTML(mascota.nombreDuenio)})</option>`
            ).join("");

        const opcionesVeterinarios = veterinarios.map((veterinario) =>
            `<option value="${App.escaparHTML(veterinario.idVeterinario)}">${App.escaparHTML(veterinario.nombre)} - ${App.escaparHTML(veterinario.especializacion)}</option>`
        ).join("");

        selectVeterinario.innerHTML = '<option value="">Seleccionar</option>' + opcionesVeterinarios;
        filtroVeterinario.innerHTML = '<option value="">Todos</option>' + opcionesVeterinarios;

        // No se puede registrar un turno sin mascotas o sin veterinarios
        if (mascotas.length === 0 || veterinarios.length === 0) {
            const faltantes = [];
            if (mascotas.length === 0) faltantes.push('<a href="mascotas.html" class="alert-link">una mascota</a>');
            if (veterinarios.length === 0) faltantes.push('<a href="veterinarios.html" class="alert-link">un veterinario</a>');

            avisoDatos.innerHTML = `Para registrar un turno primero tenés que cargar ${faltantes.join(" y ")}.`;
            avisoDatos.classList.remove("d-none");
            botonGuardar.disabled = true;
        }
    }

    // ---------- Listado ----------

    function mostrarTurnos() {
        const idVeterinario = filtroVeterinario.value;
        const fecha = filtroFecha.value;

        turnosVisibles = turnos
            .filter((turno) => !idVeterinario || turno.idVeterinario === idVeterinario)
            .filter((turno) => !fecha || turno.fecha === fecha)
            .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`));

        contadorTurnos.textContent = turnosVisibles.length === turnos.length
            ? String(turnos.length)
            : `${turnosVisibles.length} de ${turnos.length}`;

        if (turnosVisibles.length === 0) {
            tablaTurnos.innerHTML = turnos.length === 0
                ? '<tr><td colspan="7" class="text-center">No hay turnos registrados.</td></tr>'
                : '<tr><td colspan="7" class="text-center">No hay turnos que coincidan con los filtros.</td></tr>';
            return;
        }

        tablaTurnos.innerHTML = turnosVisibles.map((turno) => {
            const mascota = buscarMascota(turno.idMascota);
            const veterinario = buscarVeterinario(turno.idVeterinario);
            const id = App.escaparHTML(turno.idTurno);

            return `<tr>
                <td>${App.formatearFecha(turno.fecha)}</td>
                <td>${App.escaparHTML(turno.hora)}</td>
                <td>${App.escaparHTML(mascota ? mascota.nombreMascota : "(mascota eliminada)")}</td>
                <td>${App.escaparHTML(mascota ? mascota.nombreDuenio : "—")}</td>
                <td>${App.escaparHTML(veterinario ? veterinario.nombre : "(veterinario eliminado)")}</td>
                <td>${App.escaparHTML(turno.motivo)}</td>
                <td class="text-nowrap">
                    <button type="button" class="btn btn-info btn-sm" data-accion="comprobante" data-id="${id}">Comprobante</button>
                    <button type="button" class="btn btn-danger btn-sm" data-accion="eliminar" data-id="${id}">Eliminar</button>
                </td>
            </tr>`;
        }).join("");
    }

    // ---------- Registrar ----------

    function registrarTurno(evento) {
        evento.preventDefault();

        const idMascota = selectMascota.value;
        const idVeterinario = selectVeterinario.value;
        const fecha = campoFecha.value;
        const hora = campoHora.value;
        const motivo = campoMotivo.value.trim();

        if (!idMascota || !idVeterinario || !fecha || !hora || !motivo) {
            alert("Completá todos los campos del turno.");
            return;
        }

        if (fecha < App.hoyISO() || (fecha === App.hoyISO() && hora < App.ahoraHHMM())) {
            alert("La fecha y hora del turno no pueden estar en el pasado.");
            return;
        }

        const ocupaVeterinario = turnos.some((turno) =>
            turno.idVeterinario === idVeterinario && turno.fecha === fecha && turno.hora === hora);

        if (ocupaVeterinario) {
            alert("El veterinario seleccionado ya tiene un turno en esa fecha y hora.");
            return;
        }

        const ocupaMascota = turnos.some((turno) =>
            turno.idMascota === idMascota && turno.fecha === fecha && turno.hora === hora);

        if (ocupaMascota) {
            alert("La mascota seleccionada ya tiene un turno en esa fecha y hora.");
            return;
        }

        const turno = {
            idTurno: App.crearId("turno"),
            idMascota,
            idVeterinario,
            fecha,
            hora,
            motivo
        };

        const nuevaLista = [...turnos, turno];

        if (!App.guardarLista(App.CLAVES.turnos, nuevaLista)) return;

        turnos = nuevaLista;
        formulario.reset();
        mostrarTurnos();

        if (confirm("Turno registrado correctamente.\n\n¿Querés imprimir el comprobante?")) {
            imprimirComprobante(turno);
        }
    }

    // ---------- Eliminar ----------

    function eliminarTurno(id) {
        const turno = turnos.find((item) => item.idTurno === id);
        if (!turno) return;

        const mascota = buscarMascota(turno.idMascota);
        const nombre = mascota ? mascota.nombreMascota : "la mascota";

        if (!confirm(`¿Querés eliminar el turno de ${nombre} del ${App.formatearFecha(turno.fecha)} a las ${turno.hora}?`)) {
            return;
        }

        const nuevaLista = turnos.filter((item) => item.idTurno !== id);

        if (!App.guardarLista(App.CLAVES.turnos, nuevaLista)) return;

        turnos = nuevaLista;
        mostrarTurnos();
    }

    // ---------- Comprobante (imprimir o guardar como PDF) ----------

    function imprimirComprobante(turno) {
        const mascota = buscarMascota(turno.idMascota);
        const veterinario = buscarVeterinario(turno.idVeterinario);
        const e = App.escaparHTML;

        const filas = [
            ["Fecha", App.formatearFecha(turno.fecha)],
            ["Hora", turno.hora],
            ["Mascota", mascota ? `${mascota.nombreMascota} (${mascota.especie})` : "—"],
            ["Dueño/a", mascota ? mascota.nombreDuenio : "—"],
            ["Veterinario/a", veterinario ? veterinario.nombre : "—"],
            ["Matrícula", veterinario ? veterinario.matricula : "—"],
            ["Especialidad", veterinario ? veterinario.especializacion : "—"],
            ["Motivo", turno.motivo],
            ["Valor de la consulta", veterinario ? App.formatearMoneda(veterinario.valorConsulta) : "—"]
        ].map(([titulo, valor]) =>
            `<tr><th>${e(titulo)}</th><td>${e(valor)}</td></tr>`
        ).join("");

        const numero = turno.idTurno.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comprobante de turno ${e(numero)}</title>
<style>
    body { font-family: Arial, sans-serif; color: #333; margin: 40px; }
    .comprobante { max-width: 600px; margin: 0 auto; border: 2px solid #2f7d6d; border-radius: 10px; padding: 30px; }
    h1 { color: #2f7d6d; text-align: center; margin: 0; }
    h2 { text-align: center; margin: 5px 0 25px; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    th { width: 40%; color: #2f7d6d; }
    .nota { margin-top: 25px; font-size: 14px; text-align: center; }
    .pie { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    button { display: block; margin: 25px auto 0; padding: 10px 20px; font-size: 16px; cursor: pointer; }
    @media print { button { display: none; } body { margin: 0; } }
</style>
</head>
<body>
    <div class="comprobante">
        <h1>Veterinaria La Mary</h1>
        <h2>Comprobante de turno N° ${e(numero)}</h2>
        <table>${filas}</table>
        <p class="nota">Presentar este comprobante el día del turno. Si no podés asistir, avisanos con anticipación.</p>
        <p class="pie">Merlo, Buenos Aires · 0220-486-4222 · contacto@veterinarialamary.com</p>
    </div>
    <button type="button" onclick="window.print()">Imprimir / Guardar como PDF</button>
</body>
</html>`;

        const ventana = window.open("", "_blank", "width=800,height=900");

        if (!ventana) {
            alert("El navegador bloqueó la ventana emergente. Permitila para ver el comprobante.");
            return;
        }

        ventana.document.open();
        ventana.document.write(html);
        ventana.document.close();

        setTimeout(() => {
            ventana.focus();
            ventana.print();
        }, 400);
    }

    // ---------- Eventos ----------

    tablaTurnos.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const { accion, id } = boton.dataset;

        if (accion === "eliminar") eliminarTurno(id);

        if (accion === "comprobante") {
            const turno = turnos.find((item) => item.idTurno === id);
            if (turno) imprimirComprobante(turno);
        }
    });

    filtroVeterinario.addEventListener("change", mostrarTurnos);
    filtroFecha.addEventListener("change", mostrarTurnos);

    botonLimpiarFiltros.addEventListener("click", () => {
        filtroVeterinario.value = "";
        filtroFecha.value = "";
        mostrarTurnos();
    });

    botonExportar.addEventListener("click", () => {
        if (turnosVisibles.length === 0) {
            alert("No hay turnos para exportar.");
            return;
        }

        App.exportarCSV(
            "turnos",
            ["Fecha", "Hora", "Mascota", "Dueño", "Veterinario", "Motivo"],
            turnosVisibles.map((turno) => {
                const mascota = buscarMascota(turno.idMascota);
                const veterinario = buscarVeterinario(turno.idVeterinario);

                return [
                    App.formatearFecha(turno.fecha),
                    turno.hora,
                    mascota ? mascota.nombreMascota : "",
                    mascota ? mascota.nombreDuenio : "",
                    veterinario ? veterinario.nombre : "",
                    turno.motivo
                ];
            })
        );
    });

    formulario.addEventListener("submit", registrarTurno);

    // No se permiten fechas pasadas en el calendario
    campoFecha.min = App.hoyISO();

    cargarSelects();
    mostrarTurnos();
})();
