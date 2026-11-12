// Administración de veterinarios con LocalStorage.
(() => {
    "use strict";

    const TAMANIO_MAXIMO_IMAGEN = 1024 * 1024; // 1 MB (el LocalStorage tiene un límite de ~5 MB)

    const formulario = document.getElementById("formVeterinario");
    const tablaVeterinarios = document.getElementById("listaVeterinarios");
    const contadorVeterinarios = document.getElementById("totalVeterinarios");
    const botonGuardar = document.getElementById("botonGuardar");
    const botonCancelar = document.getElementById("botonCancelar");
    const botonExportar = document.getElementById("botonExportarVeterinarios");
    let idEditado = null;

    let veterinarios = App.obtenerVeterinarios();

    // Guarda la lista. Si falla (almacenamiento lleno) se mantiene el estado anterior.
    function guardarVeterinarios(nuevaLista) {
        if (!App.guardarLista(App.CLAVES.veterinarios, nuevaLista)) {
            return false;
        }
        veterinarios = nuevaLista;
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

    function mostrarVeterinarios() {
        contadorVeterinarios.textContent = String(veterinarios.length);

        if (veterinarios.length === 0) {
            tablaVeterinarios.innerHTML = '<tr><td colspan="6" class="text-center">No hay veterinarios registrados.</td></tr>';
            return;
        }

        tablaVeterinarios.innerHTML = veterinarios.map((veterinario) => {
            const foto = veterinario.fotoVeterinario.startsWith("data:image/")
                ? `<img src="${App.escaparHTML(veterinario.fotoVeterinario)}" alt="Foto de ${App.escaparHTML(veterinario.nombre)}" class="rounded" style="width:64px;height:64px;object-fit:cover">`
                : "—";
            const id = App.escaparHTML(veterinario.idVeterinario);

            return `<tr>
                <td>${foto}</td>
                <td>${App.escaparHTML(veterinario.matricula)}</td>
                <td>${App.escaparHTML(veterinario.nombre)}</td>
                <td>${App.escaparHTML(veterinario.especializacion)}</td>
                <td>${App.formatearMoneda(veterinario.valorConsulta)}</td>
                <td class="text-nowrap">
                    <button type="button" class="btn btn-warning btn-sm" data-accion="editar" data-id="${id}">Editar</button>
                    <button type="button" class="btn btn-danger btn-sm" data-accion="eliminar" data-id="${id}">Eliminar</button>
                </td>
            </tr>`;
        }).join("");
    }

    function mostrarVistaPrevia(foto) {
        const vista = document.getElementById("vistaPreviaFoto");
        if (!vista) return;

        if (foto) {
            vista.src = foto;
            vista.classList.remove("d-none");
        } else {
            vista.removeAttribute("src");
            vista.classList.add("d-none");
        }
    }

    function limpiarFormulario() {
        formulario.reset();
        idEditado = null;
        botonGuardar.textContent = "Guardar veterinario";
        botonCancelar.classList.add("d-none");
        document.getElementById("tituloFormulario").textContent = "Nuevo veterinario";
        mostrarVistaPrevia("");
    }

    function editarVeterinario(id) {
        const veterinario = veterinarios.find((item) => item.idVeterinario === id);
        if (!veterinario) return;

        idEditado = id;
        document.getElementById("matricula").value = veterinario.matricula;
        document.getElementById("nombre").value = veterinario.nombre;
        document.getElementById("especialidad").value = veterinario.especializacion;
        document.getElementById("valorConsulta").value = veterinario.valorConsulta;
        document.getElementById("fotoVeterinario").value = "";

        mostrarVistaPrevia(veterinario.fotoVeterinario);
        document.getElementById("tituloFormulario").textContent = "Editar veterinario";
        botonGuardar.textContent = "Guardar cambios";
        botonCancelar.classList.remove("d-none");
        formulario.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function guardarDesdeFormulario(evento) {
        evento.preventDefault();

        const matricula = Number(document.getElementById("matricula").value);
        const valorConsulta = Number(document.getElementById("valorConsulta").value);

        if (!Number.isInteger(matricula) || matricula <= 0 ||
            !Number.isFinite(valorConsulta) || valorConsulta < 0) {
            alert("Ingresá una matrícula entera y un valor de consulta válido.");
            return;
        }

        // La matrícula identifica al profesional: no puede repetirse
        const repetida = veterinarios.some(
            (item) => item.matricula === matricula && item.idVeterinario !== idEditado
        );

        if (repetida) {
            alert("Ya existe un veterinario registrado con esa matrícula.");
            return;
        }

        const archivo = document.getElementById("fotoVeterinario").files?.[0];

        if (archivo && !archivo.type.startsWith("image/")) {
            alert("Seleccioná un archivo de imagen válido.");
            return;
        }

        if (archivo && archivo.size > TAMANIO_MAXIMO_IMAGEN) {
            alert("La imagen es muy pesada. Elegí una de hasta 1 MB.");
            return;
        }

        const anterior = veterinarios.find((item) => item.idVeterinario === idEditado);
        let fotoVeterinario = anterior?.fotoVeterinario || "";

        if (archivo) {
            try {
                fotoVeterinario = await convertirImagen(archivo);
            } catch {
                alert("No se pudo cargar la foto.");
                return;
            }
        }

        const veterinario = {
            idVeterinario: idEditado || App.crearId("veterinario"),
            matricula,
            nombre: document.getElementById("nombre").value.trim(),
            especializacion: document.getElementById("especialidad").value.trim(),
            valorConsulta,
            fotoVeterinario
        };

        const nuevaLista = idEditado
            ? veterinarios.map((item) => item.idVeterinario === idEditado ? veterinario : item)
            : [...veterinarios, veterinario];

        if (!guardarVeterinarios(nuevaLista)) return;

        mostrarVeterinarios();
        limpiarFormulario();
    }

    function eliminarVeterinario(id) {
        const veterinario = veterinarios.find((item) => item.idVeterinario === id);
        if (!veterinario) return;

        const turnos = App.leerLista(App.CLAVES.turnos);
        const historias = App.leerLista(App.CLAVES.historias);
        const turnosVet = turnos.filter((turno) => turno.idVeterinario === id);
        const historiasVet = historias.filter((registro) => registro.idVeterinario === id);

        let pregunta = `¿Querés eliminar a ${veterinario.nombre}?`;

        if (turnosVet.length > 0 || historiasVet.length > 0) {
            pregunta += `\n\nTambién se eliminarán ${turnosVet.length} turno(s) y ${historiasVet.length} registro(s) de historia clínica asociados.`;
        }

        if (!confirm(pregunta)) return;

        if (!guardarVeterinarios(veterinarios.filter((item) => item.idVeterinario !== id))) return;

        // Se eliminan también los datos asociados para no dejar registros huérfanos
        App.guardarLista(App.CLAVES.turnos, turnos.filter((turno) => turno.idVeterinario !== id));
        App.guardarLista(App.CLAVES.historias, historias.filter((registro) => registro.idVeterinario !== id));

        mostrarVeterinarios();

        if (idEditado === id) limpiarFormulario();
    }

    tablaVeterinarios.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const { accion, id } = boton.dataset;

        if (accion === "editar") editarVeterinario(id);
        if (accion === "eliminar") eliminarVeterinario(id);
    });

    document.getElementById("fotoVeterinario").addEventListener("change", async (evento) => {
        const archivo = evento.target.files?.[0];
        if (!archivo) return;

        if (!archivo.type.startsWith("image/")) {
            alert("Seleccioná un archivo de imagen válido.");
            evento.target.value = "";
            return;
        }

        if (archivo.size > TAMANIO_MAXIMO_IMAGEN) {
            alert("La imagen es muy pesada. Elegí una de hasta 1 MB.");
            evento.target.value = "";
            return;
        }

        try {
            mostrarVistaPrevia(await convertirImagen(archivo));
        } catch {
            alert("No se pudo cargar la foto.");
            evento.target.value = "";
        }
    });

    botonExportar.addEventListener("click", () => {
        if (veterinarios.length === 0) {
            alert("No hay veterinarios para exportar.");
            return;
        }

        App.exportarCSV(
            "veterinarios",
            ["Matrícula", "Nombre", "Especialización", "Valor de consulta"],
            veterinarios.map((v) => [v.matricula, v.nombre, v.especializacion, v.valorConsulta])
        );
    });

    formulario.addEventListener("submit", guardarDesdeFormulario);
    botonCancelar.addEventListener("click", limpiarFormulario);

    mostrarVeterinarios();
})();
