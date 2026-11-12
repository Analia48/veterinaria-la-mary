// Administración de mascotas con LocalStorage.
(() => {
    "use strict";

    const TAMANIO_MAXIMO_IMAGEN = 1024 * 1024; // 1 MB (el LocalStorage tiene un límite de ~5 MB)

    const formulario = document.getElementById("formMascota");
    const tablaMascotas = document.getElementById("listaMascotas");
    const contadorMascotas = document.getElementById("totalMascotas");
    const botonGuardar = document.getElementById("botonGuardarMascota");
    const botonCancelar = document.getElementById("botonCancelarMascota");
    const botonExportar = document.getElementById("botonExportarMascotas");
    let idEditado = null;

    let mascotas = App.obtenerMascotas();

    // Guarda la lista. Si falla (almacenamiento lleno) se vuelve al estado anterior.
    function guardarMascotas(nuevaLista) {
        if (!App.guardarLista(App.CLAVES.mascotas, nuevaLista)) {
            return false;
        }
        mascotas = nuevaLista;
        return true;
    }

    function convertirImagen(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onload = () => resolve(lector.result);
            lector.onerror = () => reject(new Error("No se pudo leer la imagen."));
            lector.readAsDataURL(archivo);
        });
    }

    function mostrarMascotas() {
        contadorMascotas.textContent = String(mascotas.length);

        if (mascotas.length === 0) {
            tablaMascotas.innerHTML = '<tr><td colspan="8" class="text-center">No hay mascotas registradas.</td></tr>';
            return;
        }

        tablaMascotas.innerHTML = mascotas.map((mascota) => {
            const imagen = mascota.imagenMascota.startsWith("data:image/")
                ? `<img src="${App.escaparHTML(mascota.imagenMascota)}" alt="Foto de ${App.escaparHTML(mascota.nombreMascota)}" class="rounded" style="width:64px;height:64px;object-fit:cover">`
                : "—";
            const id = App.escaparHTML(mascota.idMascota);

            return `<tr>
                <td>${imagen}</td>
                <td>${App.escaparHTML(mascota.nombreMascota)}</td>
                <td>${App.escaparHTML(mascota.especie)}</td>
                <td>${App.escaparHTML(mascota.nombreDuenio)}</td>
                <td>${App.escaparHTML(mascota.color)}</td>
                <td>${App.escaparHTML(mascota.edad)}</td>
                <td>${App.escaparHTML(mascota.peso)}</td>
                <td class="text-nowrap">
                    <button type="button" class="btn btn-warning btn-sm" data-accion="editar" data-id="${id}">Editar</button>
                    <a class="btn btn-info btn-sm" href="historia-clinica.html?mascota=${encodeURIComponent(mascota.idMascota)}">Historia</a>
                    <button type="button" class="btn btn-danger btn-sm" data-accion="eliminar" data-id="${id}">Eliminar</button>
                </td>
            </tr>`;
        }).join("");
    }

    function limpiarFormulario() {
        formulario.reset();
        idEditado = null;
        botonGuardar.textContent = "Guardar mascota";
        botonCancelar.classList.add("d-none");
        document.getElementById("tituloFormulario").textContent = "Nueva mascota";
    }

    function editarMascota(id) {
        const mascota = mascotas.find((item) => item.idMascota === id);
        if (!mascota) return;

        idEditado = id;
        document.getElementById("nombre").value = mascota.nombreMascota;
        document.getElementById("especie").value = mascota.especie;
        document.getElementById("edad").value = mascota.edad;
        document.getElementById("dueno").value = mascota.nombreDuenio;
        document.getElementById("color").value = mascota.color;
        document.getElementById("peso").value = mascota.peso;
        document.getElementById("imagenMascota").value = "";

        document.getElementById("tituloFormulario").textContent = "Editar mascota";
        botonGuardar.textContent = "Guardar cambios";
        botonCancelar.classList.remove("d-none");
        formulario.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function guardarDesdeFormulario(evento) {
        evento.preventDefault();

        const edad = Number(document.getElementById("edad").value);
        const peso = Number(document.getElementById("peso").value);

        if (!Number.isInteger(edad) || edad < 0 || !Number.isFinite(peso) || peso < 0) {
            alert("La edad debe ser un número entero y el peso debe ser válido.");
            return;
        }

        const archivo = document.getElementById("imagenMascota").files?.[0];

        if (archivo && !archivo.type.startsWith("image/")) {
            alert("Seleccioná un archivo de imagen válido.");
            return;
        }

        if (archivo && archivo.size > TAMANIO_MAXIMO_IMAGEN) {
            alert("La imagen es muy pesada. Elegí una de hasta 1 MB.");
            return;
        }

        const anterior = mascotas.find((item) => item.idMascota === idEditado);
        let imagenMascota = anterior?.imagenMascota || "";

        if (archivo) {
            try {
                imagenMascota = await convertirImagen(archivo);
            } catch {
                alert("No se pudo cargar la imagen.");
                return;
            }
        }

        const mascota = {
            idMascota: idEditado || App.crearId("mascota"),
            nombreMascota: document.getElementById("nombre").value.trim(),
            nombreDuenio: document.getElementById("dueno").value.trim(),
            color: document.getElementById("color").value.trim(),
            edad,
            peso,
            especie: document.getElementById("especie").value,
            imagenMascota
        };

        const nuevaLista = idEditado
            ? mascotas.map((item) => item.idMascota === idEditado ? mascota : item)
            : [...mascotas, mascota];

        if (!guardarMascotas(nuevaLista)) return;

        mostrarMascotas();
        limpiarFormulario();
    }

    function eliminarMascota(id) {
        const mascota = mascotas.find((item) => item.idMascota === id);
        if (!mascota) return;

        const turnos = App.leerLista(App.CLAVES.turnos);
        const historias = App.leerLista(App.CLAVES.historias);
        const turnosMascota = turnos.filter((turno) => turno.idMascota === id);
        const historiasMascota = historias.filter((registro) => registro.idMascota === id);

        let pregunta = `¿Querés eliminar a ${mascota.nombreMascota}?`;

        if (turnosMascota.length > 0 || historiasMascota.length > 0) {
            pregunta += `\n\nTambién se eliminarán ${turnosMascota.length} turno(s) y ${historiasMascota.length} registro(s) de historia clínica asociados.`;
        }

        if (!confirm(pregunta)) return;

        if (!guardarMascotas(mascotas.filter((item) => item.idMascota !== id))) return;

        // Se eliminan también los datos asociados para no dejar registros huérfanos
        App.guardarLista(App.CLAVES.turnos, turnos.filter((turno) => turno.idMascota !== id));
        App.guardarLista(App.CLAVES.historias, historias.filter((registro) => registro.idMascota !== id));

        mostrarMascotas();

        if (idEditado === id) limpiarFormulario();
    }

    tablaMascotas.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const { accion, id } = boton.dataset;

        if (accion === "editar") editarMascota(id);
        if (accion === "eliminar") eliminarMascota(id);
    });

    botonExportar.addEventListener("click", () => {
        if (mascotas.length === 0) {
            alert("No hay mascotas para exportar.");
            return;
        }

        App.exportarCSV(
            "mascotas",
            ["Nombre", "Especie", "Dueño", "Color", "Edad", "Peso (kg)"],
            mascotas.map((m) => [m.nombreMascota, m.especie, m.nombreDuenio, m.color, m.edad, m.peso])
        );
    });

    formulario.addEventListener("submit", guardarDesdeFormulario);
    botonCancelar.addEventListener("click", limpiarFormulario);

    mostrarMascotas();
})();
