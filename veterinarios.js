// veterinarios.js

const formulario = document.getElementById("formVeterinario");
const listaVeterinarios = document.getElementById("listaVeterinarios");
const campoFoto = document.getElementById("fotoVeterinario");
const vistaPreviaFoto = document.getElementById("vistaPreviaFoto");
const tituloFormulario = document.getElementById("tituloFormulario");
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");

let indiceEnEdicion = null;
let fotoEnEdicion = "";

function cargarVeterinarios() {
    try {
        const datos = JSON.parse(localStorage.getItem("veterinarios")) || [];
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

let veterinarios = cargarVeterinarios();

function guardarVeterinarios() {
    localStorage.setItem("veterinarios", JSON.stringify(veterinarios));
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function convertirImagenBase64(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();

        lector.onload = () => resolve(lector.result);
        lector.onerror = () => reject(new Error("No se pudo leer la imagen."));

        lector.readAsDataURL(archivo);
    });
}

function mostrarVistaPrevia(foto) {
    if (!vistaPreviaFoto) return;

    if (foto) {
        vistaPreviaFoto.src = foto;
        vistaPreviaFoto.classList.remove("d-none");
    } else {
        vistaPreviaFoto.removeAttribute("src");
        vistaPreviaFoto.classList.add("d-none");
    }
}

function mostrarVeterinarios() {
    if (!listaVeterinarios) return;

    if (veterinarios.length === 0) {
        listaVeterinarios.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    No hay veterinarios registrados.
                </div>
            </div>
        `;
        return;
    }

    listaVeterinarios.innerHTML = veterinarios.map((veterinario, indice) => {
        const nombre = escaparHTML(veterinario.nombre);
        const especialidad = escaparHTML(veterinario.especialidad);
        const matricula = escaparHTML(veterinario.matricula);
        const valor = Number(veterinario.valorConsulta || 0);
        const foto = typeof veterinario.fotoVeterinario === "string"
            && veterinario.fotoVeterinario.startsWith("data:image/")
            ? veterinario.fotoVeterinario
            : "";

        const imagenHTML = foto
            ? `<img src="${foto}"
                    class="card-img-top"
                    alt="Foto de ${nombre}"
                    style="height: 220px; object-fit: cover;">`
            : "";

        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm">
                    ${imagenHTML}

                    <div class="card-body">
                        <h3 class="card-title">${nombre}</h3>

                        <p class="card-text">
                            <strong>Especialidad:</strong> ${especialidad}
                        </p>

                        <p class="card-text">
                            <strong>Matrícula:</strong> ${matricula}
                        </p>

                        <p class="card-text">
                            <strong>Valor de consulta:</strong>
                            $${valor.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>

                        <div class="d-flex gap-2">
                            <button
                                type="button"
                                class="btn btn-secondary"
                                onclick="editarVeterinario(${indice})">
                                Editar
                            </button>

                            <button
                                type="button"
                                class="btn btn-danger"
                                onclick="eliminarVeterinario(${indice})">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function limpiarFormulario() {
    formulario.reset();
    indiceEnEdicion = null;
    fotoEnEdicion = "";

    if (tituloFormulario) {
        tituloFormulario.textContent = "Nuevo veterinario";
    }

    if (botonGuardar) {
        botonGuardar.textContent = "Guardar veterinario";
    }

    if (botonCancelar) {
        botonCancelar.classList.add("d-none");
    }

    mostrarVistaPrevia("");
}

function editarVeterinario(indice) {
    const veterinario = veterinarios[indice];
    if (!veterinario) return;

    indiceEnEdicion = indice;
    fotoEnEdicion = veterinario.fotoVeterinario || "";

    document.getElementById("nombre").value = veterinario.nombre || "";
    document.getElementById("especialidad").value =
        veterinario.especialidad || "";
    document.getElementById("matricula").value =
        veterinario.matricula || "";
    document.getElementById("valorConsulta").value =
        veterinario.valorConsulta ?? "";

    if (campoFoto) {
        campoFoto.value = "";
    }

    mostrarVistaPrevia(fotoEnEdicion);

    if (tituloFormulario) {
        tituloFormulario.textContent = "Editar veterinario";
    }

    if (botonGuardar) {
        botonGuardar.textContent = "Guardar cambios";
    }

    if (botonCancelar) {
        botonCancelar.classList.remove("d-none");
    }

    formulario.scrollIntoView({ behavior: "smooth", block: "start" });
}

function eliminarVeterinario(indice) {
    if (!veterinarios[indice]) return;

    veterinarios.splice(indice, 1);
    guardarVeterinarios();
    mostrarVeterinarios();

    if (indiceEnEdicion === indice) {
        limpiarFormulario();
    }
}

if (campoFoto) {
    campoFoto.addEventListener("change", async () => {
        const archivo = campoFoto.files?.[0];

        if (!archivo) {
            mostrarVistaPrevia(fotoEnEdicion);
            return;
        }

        if (!archivo.type.startsWith("image/")) {
            alert("Seleccioná un archivo de imagen válido.");
            campoFoto.value = "";
            mostrarVistaPrevia(fotoEnEdicion);
            return;
        }

        try {
            const foto = await convertirImagenBase64(archivo);
            mostrarVistaPrevia(foto);
        } catch {
            alert("No se pudo cargar la imagen.");
            campoFoto.value = "";
            mostrarVistaPrevia(fotoEnEdicion);
        }
    });
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const archivo = campoFoto?.files?.[0];
    let fotoVeterinario = fotoEnEdicion;

    if (archivo) {
        try {
            fotoVeterinario = await convertirImagenBase64(archivo);
        } catch {
            alert("No se pudo cargar la foto. Intentá nuevamente.");
            return;
        }
    }

    const datosVeterinario = {
        idVeterinario: indiceEnEdicion !== null
            ? veterinarios[indiceEnEdicion].idVeterinario
            : (crypto.randomUUID?.() || String(Date.now())),
        nombre: document.getElementById("nombre").value.trim(),
        especialidad: document.getElementById("especialidad").value.trim(),
        matricula: document.getElementById("matricula").value,
        valorConsulta: Number(document.getElementById("valorConsulta").value),
        fotoVeterinario
    };

    if (indiceEnEdicion !== null) {
        veterinarios[indiceEnEdicion] = datosVeterinario;
    } else {
        veterinarios.push(datosVeterinario);
    }

    guardarVeterinarios();
    mostrarVeterinarios();
    limpiarFormulario();

    alert(
        indiceEnEdicion === null
            ? "Veterinario guardado correctamente."
            : "Veterinario actualizado correctamente."
    );
});

if (botonCancelar) {
    botonCancelar.addEventListener("click", limpiarFormulario);
}

window.editarVeterinario = editarVeterinario;
window.eliminarVeterinario = eliminarVeterinario;

mostrarVeterinarios();