// mascotas.js

const formularioMascota = document.getElementById("formMascota");
const listaMascotas = document.getElementById("listaMascotas");

function cargarMascotas() {
    try {
        const datos = JSON.parse(localStorage.getItem("mascotas")) || [];
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

let mascotas = cargarMascotas();

function guardarMascotas() {
    localStorage.setItem("mascotas", JSON.stringify(mascotas));
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

function mostrarMascotas() {
    if (!listaMascotas) return;

    if (mascotas.length === 0) {
        listaMascotas.innerHTML = `
            <div class="alert alert-info text-center">
                No hay mascotas registradas.
            </div>
        `;
        return;
    }

    listaMascotas.innerHTML = mascotas.map((mascota, indice) => {
        const nombre = escaparHTML(mascota.nombre || mascota.nombreMascota);
        const especie = escaparHTML(mascota.especie);
        const edad = escaparHTML(mascota.edad);
        const dueno = escaparHTML(mascota.dueno || mascota.nombreDuenio);
        const color = escaparHTML(mascota.color);
        const peso = escaparHTML(mascota.peso);

        const imagenValida =
            typeof mascota.imagenMascota === "string" &&
            mascota.imagenMascota.startsWith("data:image/");

        const imagenHTML = imagenValida
            ? `<img
                    src="${escaparHTML(mascota.imagenMascota)}"
                    class="img-fluid rounded mb-3"
                    style="max-width: 200px;"
                    alt="Imagen de ${nombre}">`
            : "";

        return `
            <div class="card shadow-sm mb-3">
                <div class="card-body">
                    <h3 class="card-title">${nombre}</h3>

                    ${imagenHTML}

                    <p><strong>Especie:</strong> ${especie}</p>
                    <p><strong>Edad:</strong> ${edad} años</p>
                    <p><strong>Dueño:</strong> ${dueno}</p>
                    <p><strong>Color:</strong> ${color}</p>
                    <p><strong>Peso:</strong> ${peso} kg</p>

                    <button
                        type="button"
                        class="btn btn-danger"
                        onclick="eliminarMascota(${indice})">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function eliminarMascota(indice) {
    if (!Number.isInteger(indice) || indice < 0 || indice >= mascotas.length) {
        return;
    }

    mascotas.splice(indice, 1);
    guardarMascotas();
    mostrarMascotas();
}

if (formularioMascota) {
    formularioMascota.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const especie = document.getElementById("especie").value;
        const edad = Number(document.getElementById("edad").value);
        const dueno = document.getElementById("dueno").value.trim();
        const color = document.getElementById("color").value.trim();
        const peso = Number(document.getElementById("peso").value);
        const archivoImagen =
            document.getElementById("imagenMascota").files?.[0];

        let imagenMascota = "";

        if (archivoImagen) {
            if (!archivoImagen.type.startsWith("image/")) {
                alert("Seleccioná un archivo de imagen válido.");
                return;
            }

            try {
                imagenMascota = await convertirImagenBase64(archivoImagen);
            } catch {
                alert("No se pudo cargar la imagen. Intentá nuevamente.");
                return;
            }
        }

        const nuevaMascota = {
            idMascota: crypto.randomUUID?.() || String(Date.now()),
            nombreMascota: nombre,
            nombreDuenio: dueno,
            nombre,
            especie,
            edad,
            dueno,
            color,
            peso,
            imagenMascota
        };

        mascotas.push(nuevaMascota);
        guardarMascotas();
        mostrarMascotas();
        formularioMascota.reset();

        alert("Mascota guardada correctamente.");
    });
}

window.eliminarMascota = eliminarMascota;

mostrarMascotas();