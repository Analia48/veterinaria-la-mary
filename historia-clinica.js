// Administración de historias clínicas con LocalStorage.
// Cada registro relaciona una mascota con el veterinario que la atendió.
(() => {
    "use strict";

    const formulario = document.getElementById("formHistoria");
    const selectMascota = document.getElementById("idMascota");
    const selectVeterinario = document.getElementById("idVeterinario");
    const campoFecha = document.getElementById("fecha");
    const campoProximoControl = document.getElementById("proximoControl");
    const avisoDatos = document.getElementById("avisoDatos");
    const botonGuardar = document.getElementById("botonGuardarHistoria");

    const filtroMascota = document.getElementById("filtroMascota");
    const botonImprimir = document.getElementById("botonImprimirHistorial");
    const botonExportar = document.getElementById("botonExportarHistorial");
    const detalle = document.getElementById("detalleHistorial");

    const mascotas = App.obtenerMascotas();
    const veterinarios = App.obtenerVeterinarios();

    let historias = cargarHistorias();
    let registrosVisibles = [];

    function cargarHistorias() {
        return App.leerLista(App.CLAVES.historias).map((registro, indice) => ({
            idHistoria: String(registro.idHistoria || `historia-importada-${indice}`),
            idMascota: String(registro.idMascota ?? ""),
            idVeterinario: String(registro.idVeterinario ?? ""),
            fecha: String(registro.fecha ?? ""),
            motivo: String(registro.motivo ?? ""),
            diagnostico: String(registro.diagnostico ?? ""),
            tratamiento: String(registro.tratamiento ?? ""),
            peso: registro.peso === null || registro.peso === undefined || registro.peso === "" ? null : Number(registro.peso),
            temperatura: registro.temperatura === null || registro.temperatura === undefined || registro.temperatura === "" ? null : Number(registro.temperatura),
            proximoControl: String(registro.proximoControl ?? ""),
            observaciones: String(registro.observaciones ?? "")
        }));
    }

    function buscarMascota(id) {
        return mascotas.find((mascota) => mascota.idMascota === id);
    }

    function buscarVeterinario(id) {
        return veterinarios.find((veterinario) => veterinario.idVeterinario === id);
    }

    // Más recientes primero
    function ordenarPorFechaDescendente(lista) {
        return [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha));
    }

    // ---------- Selects ----------

    function cargarSelects() {
        const opcionesMascotas = mascotas.map((mascota) =>
            `<option value="${App.escaparHTML(mascota.idMascota)}">${App.escaparHTML(mascota.nombreMascota)} (${App.escaparHTML(mascota.nombreDuenio)})</option>`
        ).join("");

        selectMascota.innerHTML = '<option value="">Seleccionar</option>' + opcionesMascotas;
        filtroMascota.innerHTML = '<option value="">Todas las mascotas</option>' + opcionesMascotas;

        selectVeterinario.innerHTML = '<option value="">Seleccionar</option>' +
            veterinarios.map((veterinario) =>
                `<option value="${App.escaparHTML(veterinario.idVeterinario)}">${App.escaparHTML(veterinario.nombre)} - ${App.escaparHTML(veterinario.especializacion)}</option>`
            ).join("");

        if (mascotas.length === 0 || veterinarios.length === 0) {
            const faltantes = [];
            if (mascotas.length === 0) faltantes.push('<a href="mascotas.html" class="alert-link">una mascota</a>');
            if (veterinarios.length === 0) faltantes.push('<a href="veterinarios.html" class="alert-link">un veterinario</a>');

            avisoDatos.innerHTML = `Para registrar una historia clínica primero tenés que cargar ${faltantes.join(" y ")}.`;
            avisoDatos.classList.remove("d-none");
            botonGuardar.disabled = true;
        }
    }

    // ---------- Visualización ----------

    function mostrarHistorial() {
        const idMascota = filtroMascota.value;

        if (idMascota) {
            mostrarHistorialDeMascota(idMascota);
        } else {
            mostrarListadoGeneral();
        }
    }

    // Tabla resumen con los registros de todas las mascotas
    function mostrarListadoGeneral() {
        registrosVisibles = ordenarPorFechaDescendente(historias);

        if (registrosVisibles.length === 0) {
            detalle.innerHTML = '<p class="text-center">No hay registros de historia clínica.</p>';
            return;
        }

        const filas = registrosVisibles.map((registro) => {
            const mascota = buscarMascota(registro.idMascota);
            const veterinario = buscarVeterinario(registro.idVeterinario);

            return `<tr>
                <td>${App.formatearFecha(registro.fecha)}</td>
                <td>${App.escaparHTML(mascota ? mascota.nombreMascota : "(mascota eliminada)")}</td>
                <td>${App.escaparHTML(mascota ? mascota.nombreDuenio : "—")}</td>
                <td>${App.escaparHTML(veterinario ? veterinario.nombre : "(veterinario eliminado)")}</td>
                <td>${App.escaparHTML(registro.motivo)}</td>
                <td>${App.escaparHTML(registro.diagnostico)}</td>
                <td class="text-nowrap no-imprimir">
                    <button type="button" class="btn btn-primary btn-sm" data-accion="ver" data-id="${App.escaparHTML(registro.idMascota)}">Ver historial completo</button>
                </td>
            </tr>`;
        }).join("");

        detalle.innerHTML = `
            <p class="text-center">Total de registros: <strong>${registrosVisibles.length}</strong></p>
            <div class="table-responsive">
                <table class="table table-striped table-bordered align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th>Fecha</th>
                            <th>Mascota</th>
                            <th>Dueño</th>
                            <th>Veterinario</th>
                            <th>Motivo</th>
                            <th>Diagnóstico</th>
                            <th class="no-imprimir">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    }

    // Ficha de la mascota + todos sus registros, del más reciente al más antiguo
    function mostrarHistorialDeMascota(idMascota) {
        const mascota = buscarMascota(idMascota);

        if (!mascota) {
            detalle.innerHTML = '<p class="text-center">La mascota seleccionada ya no existe.</p>';
            registrosVisibles = [];
            return;
        }

        registrosVisibles = ordenarPorFechaDescendente(
            historias.filter((registro) => registro.idMascota === idMascota)
        );

        const e = App.escaparHTML;

        const ficha = `
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <h3 class="card-title text-center">${e(mascota.nombreMascota)}</h3>
                    <div class="row text-center g-2">
                        <div class="col-6 col-md-3"><strong>Especie:</strong> ${e(mascota.especie)}</div>
                        <div class="col-6 col-md-3"><strong>Edad:</strong> ${e(mascota.edad)} año(s)</div>
                        <div class="col-6 col-md-3"><strong>Color:</strong> ${e(mascota.color)}</div>
                        <div class="col-6 col-md-3"><strong>Peso registrado:</strong> ${e(mascota.peso)} kg</div>
                        <div class="col-12"><strong>Dueño/a:</strong> ${e(mascota.nombreDuenio)}</div>
                    </div>
                </div>
            </div>`;

        if (registrosVisibles.length === 0) {
            detalle.innerHTML = ficha + '<p class="text-center">Esta mascota todavía no tiene registros en su historia clínica.</p>';
            return;
        }

        const tarjetas = registrosVisibles.map((registro) => {
            const veterinario = buscarVeterinario(registro.idVeterinario);

            const datosOpcionales = [];
            if (registro.peso !== null) datosOpcionales.push(`<dt class="col-sm-4">Peso</dt><dd class="col-sm-8">${e(registro.peso)} kg</dd>`);
            if (registro.temperatura !== null) datosOpcionales.push(`<dt class="col-sm-4">Temperatura</dt><dd class="col-sm-8">${e(registro.temperatura)} °C</dd>`);
            if (registro.proximoControl) datosOpcionales.push(`<dt class="col-sm-4">Próximo control</dt><dd class="col-sm-8">${App.formatearFecha(registro.proximoControl)}</dd>`);
            if (registro.observaciones) datosOpcionales.push(`<dt class="col-sm-4">Observaciones</dt><dd class="col-sm-8">${e(registro.observaciones)}</dd>`);

            return `
                <div class="card shadow-sm mb-3 registro-historia">
                    <div class="card-header">
                        <strong>${App.formatearFecha(registro.fecha)}</strong>
                        — ${e(veterinario ? veterinario.nombre : "(veterinario eliminado)")}
                    </div>
                    <div class="card-body">
                        <dl class="row mb-0">
                            <dt class="col-sm-4">Motivo de consulta</dt><dd class="col-sm-8">${e(registro.motivo)}</dd>
                            <dt class="col-sm-4">Diagnóstico</dt><dd class="col-sm-8">${e(registro.diagnostico)}</dd>
                            <dt class="col-sm-4">Tratamiento</dt><dd class="col-sm-8">${e(registro.tratamiento)}</dd>
                            ${datosOpcionales.join("")}
                        </dl>
                    </div>
                </div>`;
        }).join("");

        detalle.innerHTML = ficha +
            `<p class="text-center">Registros: <strong>${registrosVisibles.length}</strong> (del más reciente al más antiguo)</p>` +
            tarjetas;
    }

    // ---------- Registrar ----------

    function numeroOpcional(valor) {
        return valor === "" ? null : Number(valor);
    }

    function registrarHistoria(evento) {
        evento.preventDefault();

        const idMascota = selectMascota.value;
        const idVeterinario = selectVeterinario.value;
        const fecha = campoFecha.value;
        const motivo = document.getElementById("motivo").value.trim();
        const diagnostico = document.getElementById("diagnostico").value.trim();
        const tratamiento = document.getElementById("tratamiento").value.trim();
        const peso = numeroOpcional(document.getElementById("peso").value);
        const temperatura = numeroOpcional(document.getElementById("temperatura").value);
        const proximoControl = campoProximoControl.value;
        const observaciones = document.getElementById("observaciones").value.trim();

        if (!idMascota || !idVeterinario || !fecha || !motivo || !diagnostico || !tratamiento) {
            alert("Completá los campos obligatorios de la consulta.");
            return;
        }

        if (fecha > App.hoyISO()) {
            alert("La fecha de la consulta no puede ser futura.");
            return;
        }

        if (peso !== null && (!Number.isFinite(peso) || peso <= 0)) {
            alert("El peso debe ser un número mayor a 0.");
            return;
        }

        if (temperatura !== null && (!Number.isFinite(temperatura) || temperatura < 30 || temperatura > 45)) {
            alert("La temperatura debe estar entre 30 °C y 45 °C.");
            return;
        }

        if (proximoControl && proximoControl < fecha) {
            alert("La fecha del próximo control no puede ser anterior a la consulta.");
            return;
        }

        const registro = {
            idHistoria: App.crearId("historia"),
            idMascota,
            idVeterinario,
            fecha,
            motivo,
            diagnostico,
            tratamiento,
            peso,
            temperatura,
            proximoControl,
            observaciones
        };

        const nuevaLista = [...historias, registro];

        if (!App.guardarLista(App.CLAVES.historias, nuevaLista)) return;

        historias = nuevaLista;
        formulario.reset();
        campoFecha.value = App.hoyISO();

        // Se muestra el historial completo de la mascota que se acaba de atender
        filtroMascota.value = idMascota;
        mostrarHistorial();
        detalle.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // ---------- Eventos ----------

    detalle.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion='ver']");
        if (!boton) return;

        filtroMascota.value = boton.dataset.id;
        mostrarHistorial();
    });

    filtroMascota.addEventListener("change", mostrarHistorial);

    botonImprimir.addEventListener("click", () => {
        if (registrosVisibles.length === 0) {
            alert("No hay registros para imprimir.");
            return;
        }
        window.print();
    });

    botonExportar.addEventListener("click", () => {
        if (registrosVisibles.length === 0) {
            alert("No hay registros para exportar.");
            return;
        }

        App.exportarCSV(
            "historia-clinica",
            ["Fecha", "Mascota", "Dueño", "Veterinario", "Motivo", "Diagnóstico", "Tratamiento", "Peso (kg)", "Temperatura (°C)", "Próximo control", "Observaciones"],
            registrosVisibles.map((registro) => {
                const mascota = buscarMascota(registro.idMascota);
                const veterinario = buscarVeterinario(registro.idVeterinario);

                return [
                    App.formatearFecha(registro.fecha),
                    mascota ? mascota.nombreMascota : "",
                    mascota ? mascota.nombreDuenio : "",
                    veterinario ? veterinario.nombre : "",
                    registro.motivo,
                    registro.diagnostico,
                    registro.tratamiento,
                    registro.peso ?? "",
                    registro.temperatura ?? "",
                    registro.proximoControl ? App.formatearFecha(registro.proximoControl) : "",
                    registro.observaciones
                ];
            })
        );
    });

    formulario.addEventListener("submit", registrarHistoria);

    // ---------- Inicio ----------

    campoFecha.max = App.hoyISO();
    campoFecha.value = App.hoyISO();

    cargarSelects();

    // Desde mascotas.html se puede llegar con ?mascota=ID para ver su historial directamente
    const idDesdeUrl = new URLSearchParams(location.search).get("mascota");

    if (idDesdeUrl && buscarMascota(idDesdeUrl)) {
        filtroMascota.value = idDesdeUrl;
        selectMascota.value = idDesdeUrl;
    }

    mostrarHistorial();
})();
