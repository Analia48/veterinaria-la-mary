// ==========================================
// VETERINARIA LA MARY - FUNCIONES COMPARTIDAS
// Se carga en TODAS las páginas (antes que el resto de los scripts).
// Contiene: acceso a LocalStorage, sesión (sessionStorage),
// protección de páginas, barra de navegación y exportación a CSV.
// ==========================================

const App = (() => {
    "use strict";

    // ---------- Claves de almacenamiento ----------
    const CLAVES = {
        mascotas: "mascotas",
        veterinarios: "veterinarios",
        turnos: "turnos",
        historias: "historiasClinicas"
    };

    const CLAVE_TOKEN = "token";
    const CLAVE_USUARIO = "usuarioActual";
    const CLAVE_DESTINO = "paginaDestino";
    const CLAVE_USUARIOS = "usuariosRegistrados";
    const PAGINA_LOGIN = "login.html";

    // ---------- Utilidades generales ----------

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function crearId(prefijo = "id") {
        return globalThis.crypto?.randomUUID?.() ||
            `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    // Fecha de hoy en formato AAAA-MM-DD (hora local, sin desfasajes de zona horaria)
    function hoyISO() {
        const ahora = new Date();
        const mes = String(ahora.getMonth() + 1).padStart(2, "0");
        const dia = String(ahora.getDate()).padStart(2, "0");
        return `${ahora.getFullYear()}-${mes}-${dia}`;
    }

    // Hora actual en formato HH:MM
    function ahoraHHMM() {
        const ahora = new Date();
        return `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    }

    // "2026-11-05" -> "05/11/2026"
    function formatearFecha(iso) {
        if (!iso) return "—";
        const [anio, mes, dia] = String(iso).split("-");
        return anio && mes && dia ? `${dia}/${mes}/${anio}` : String(iso);
    }

    function formatearMoneda(numero) {
        return Number(numero || 0).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 2
        });
    }

    // ---------- LocalStorage ----------

    function leerLista(clave) {
        try {
            const datos = JSON.parse(localStorage.getItem(clave) || "[]");
            return Array.isArray(datos) ? datos : [];
        } catch {
            return [];
        }
    }

    // Devuelve true si pudo guardar. Si el almacenamiento está lleno avisa al usuario.
    function guardarLista(clave, lista) {
        try {
            localStorage.setItem(clave, JSON.stringify(lista));
            return true;
        } catch (error) {
            console.error(error);
            alert("No se pudieron guardar los datos. Es posible que el almacenamiento del navegador esté lleno (probá con imágenes más livianas).");
            return false;
        }
    }

    // Mascotas con los campos normalizados (acepta datos de entregas anteriores)
    function obtenerMascotas() {
        return leerLista(CLAVES.mascotas).map((mascota, indice) => ({
            idMascota: String(mascota.idMascota || `mascota-importada-${indice}`),
            nombreMascota: String(mascota.nombreMascota ?? mascota.nombre ?? ""),
            nombreDuenio: String(mascota.nombreDuenio ?? mascota.dueno ?? ""),
            color: String(mascota.color ?? ""),
            edad: Number(mascota.edad ?? 0),
            peso: Number(mascota.peso ?? 0),
            especie: String(mascota.especie ?? ""),
            imagenMascota: typeof mascota.imagenMascota === "string" ? mascota.imagenMascota : ""
        }));
    }

    // Veterinarios con los campos normalizados
    function obtenerVeterinarios() {
        return leerLista(CLAVES.veterinarios).map((veterinario, indice) => ({
            idVeterinario: String(veterinario.idVeterinario || `veterinario-importado-${indice}`),
            matricula: Number(veterinario.matricula ?? 0),
            nombre: String(veterinario.nombre ?? ""),
            especializacion: String(veterinario.especializacion ?? veterinario.especialidad ?? ""),
            valorConsulta: Number(veterinario.valorConsulta ?? 0),
            fotoVeterinario: typeof veterinario.fotoVeterinario === "string"
                ? veterinario.fotoVeterinario
                : ""
        }));
    }

    // ---------- Datos iniciales ----------
    // Corrección de la 2ª entrega: la portada ya no queda vacía en la primera visita.
    // Solo se cargan si la clave NO existe (si el administrador borra todos, quedan vacíos).

    const VETERINARIOS_INICIALES = [
        {
            idVeterinario: "veterinario-inicial-1",
            matricula: 4521,
            nombre: "Dra. Laura Fernández",
            especializacion: "Clínica general",
            valorConsulta: 15000,
            fotoVeterinario: ""
        },
        {
            idVeterinario: "veterinario-inicial-2",
            matricula: 3874,
            nombre: "Dr. Martín Acosta",
            especializacion: "Cirugía y traumatología",
            valorConsulta: 20000,
            fotoVeterinario: ""
        },
        {
            idVeterinario: "veterinario-inicial-3",
            matricula: 5230,
            nombre: "Dra. Sofía Benítez",
            especializacion: "Dermatología",
            valorConsulta: 18000,
            fotoVeterinario: ""
        }
    ];

    function inicializarDatos() {
        try {
            if (localStorage.getItem(CLAVES.veterinarios) === null) {
                localStorage.setItem(CLAVES.veterinarios, JSON.stringify(VETERINARIOS_INICIALES));
            }
        } catch (error) {
            console.error(error);
        }
    }

    // ---------- Sesión (token de DummyJSON en sessionStorage) ----------

    // El token de DummyJSON es un JWT: si trae fecha de vencimiento (exp) la controlamos.
    function tokenVigente(token) {
        try {
            const carga = token.split(".")[1];
            const json = JSON.parse(atob(carga.replace(/-/g, "+").replace(/_/g, "/")));
            return !json.exp || json.exp * 1000 > Date.now();
        } catch {
            return true; // si no se puede leer, se considera válido
        }
    }

    function guardarSesion(token, usuario) {
        sessionStorage.setItem(CLAVE_TOKEN, token);
        sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario || {}));
    }

    function limpiarSesion() {
        sessionStorage.removeItem(CLAVE_TOKEN);
        sessionStorage.removeItem(CLAVE_USUARIO);
    }

    function estaLogueado() {
        const token = sessionStorage.getItem(CLAVE_TOKEN);
        if (!token) return false;

        if (!tokenVigente(token)) {
            limpiarSesion();
            return false;
        }
        return true;
    }

    function obtenerUsuario() {
        try {
            return JSON.parse(sessionStorage.getItem(CLAVE_USUARIO) || "{}");
        } catch {
            return {};
        }
    }

    function cerrarSesion() {
        limpiarSesion();
        sessionStorage.removeItem(CLAVE_DESTINO);
        location.href = "index.html";
    }

    function paginaActual() {
        return location.pathname.split("/").pop() || "index.html";
    }


    // ---------- Registro de administradores (local) ----------
    // DummyJSON no guarda usuarios nuevos, por eso los registros se guardan en LocalStorage.
    // La contraseña no se guarda en texto plano: se guarda su hash SHA-256.
    // (Es una solución pensada para un trabajo práctico, no para un sistema real.)

    async function hashClave(texto) {
        if (globalThis.crypto?.subtle) {
            const datos = new TextEncoder().encode(texto);
            const resumen = await crypto.subtle.digest("SHA-256", datos);
            return Array.from(new Uint8Array(resumen))
                .map((byte) => byte.toString(16).padStart(2, "0"))
                .join("");
        }

        // Alternativa simple si el navegador no ofrece crypto.subtle
        let hash = 5381;
        for (const caracter of texto) hash = ((hash << 5) + hash + caracter.charCodeAt(0)) >>> 0;
        return `simple-${hash}`;
    }

    async function registrarUsuarioLocal({ nombre, apellido, username, email, clave }) {
        const usuarios = leerLista(CLAVE_USUARIOS);

        const repetido = usuarios.some(
            (usuario) => String(usuario.username).toLowerCase() === username.toLowerCase()
        );

        if (repetido) {
            return { ok: false, mensaje: "Ese nombre de usuario ya está registrado." };
        }

        usuarios.push({
            idUsuario: crearId("usuario"),
            nombre,
            apellido,
            username,
            email,
            claveHash: await hashClave(clave)
        });

        if (!guardarLista(CLAVE_USUARIOS, usuarios)) {
            return { ok: false, mensaje: "No se pudo guardar el registro." };
        }

        return { ok: true };
    }

    // Devuelve el usuario si el usuario y la contraseña coinciden, o null
    async function validarUsuarioLocal(username, clave) {
        const claveHash = await hashClave(clave);

        const usuario = leerLista(CLAVE_USUARIOS).find(
            (item) => String(item.username).toLowerCase() === username.toLowerCase() &&
                item.claveHash === claveHash
        );

        return usuario || null;
    }

    // Token con vencimiento (60 min) para las cuentas registradas localmente
    function crearTokenLocal(usuario) {
        const carga = { sub: usuario.idUsuario, exp: Math.floor(Date.now() / 1000) + 3600 };
        return `local.${btoa(JSON.stringify(carga))}.sin-firma`;
    }

    // Las páginas de administración tienen <html data-protegida="true">.
    // Si se entra por URL sin sesión iniciada, se redirige al login.
    function protegerPagina() {
        if (document.documentElement.dataset.protegida !== "true") return;
        if (estaLogueado()) return;

        document.documentElement.style.visibility = "hidden";
        sessionStorage.setItem(CLAVE_DESTINO, paginaActual() + location.search);
        location.replace(PAGINA_LOGIN);
    }

    // ---------- Barra de navegación ----------

    function construirMenu() {
        const lista = document.getElementById("menuNavegacion");
        if (!lista) return;

        const actual = paginaActual();
        const logueado = estaLogueado();

        const publicos = [
            ["index.html", "Inicio"],
            ["institucional.html", "Institucional"],
            ["servicios.html", "Servicios"],
            ["contacto.html", "Contacto"]
        ];

        const administracion = [
            ["mascotas.html", "Mascotas"],
            ["veterinarios.html", "Veterinarios"],
            ["turnos.html", "Turnos"],
            ["historia-clinica.html", "Historia Clínica"]
        ];

        const enlaces = logueado ? publicos.concat(administracion) : publicos;

        let html = enlaces.map(([destino, texto]) => {
            const activo = destino === actual;
            return `<li class="nav-item">
                <a class="nav-link${activo ? " active" : ""}" href="${destino}"${activo ? ' aria-current="page"' : ""}>${texto}</a>
            </li>`;
        }).join("");

        if (logueado) {
            const usuario = obtenerUsuario();
            const nombre = usuario.firstName || usuario.username || "administrador";
            html += `<li class="nav-item d-flex align-items-center ms-xl-3">
                <span class="text-white small me-2">Hola, ${escaparHTML(nombre)}</span>
                <button type="button" class="btn btn-outline-light btn-sm" id="botonCerrarSesion">Cerrar sesión</button>
            </li>`;
        } else {
            const activo = actual === PAGINA_LOGIN;
            const activoRegistro = actual === "registro.html";
            html += `<li class="nav-item">
                <a class="nav-link${activo ? " active" : ""}" href="${PAGINA_LOGIN}">Iniciar sesión</a>
            </li>
            <li class="nav-item">
                <a class="nav-link${activoRegistro ? " active" : ""}" href="registro.html">Registrarse</a>
            </li>`;
        }

        lista.innerHTML = html;

        const botonSalir = document.getElementById("botonCerrarSesion");
        if (botonSalir) botonSalir.addEventListener("click", cerrarSesion);
    }

    // ---------- Exportar tablas a CSV (abre bien en Excel) ----------

    function exportarCSV(nombreArchivo, encabezados, filas) {
        const celda = (valor) => {
            let texto = String(valor ?? "");
            // Evita que Excel interprete el texto como una fórmula
            if (/^[=+@]/.test(texto)) texto = "'" + texto;
            return `"${texto.replaceAll('"', '""')}"`;
        };

        const contenido = [encabezados, ...filas]
            .map((fila) => fila.map(celda).join(";"))
            .join("\r\n");

        const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = `${nombreArchivo}.csv`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // ---------- Arranque ----------

    inicializarDatos();
    protegerPagina();

    document.addEventListener("DOMContentLoaded", construirMenu);

    // Si se vuelve con el botón "Atrás" a una página guardada en caché, se vuelve a controlar la sesión
    window.addEventListener("pageshow", (evento) => {
        if (evento.persisted) {
            protegerPagina();
            construirMenu();
        }
    });

    return {
        CLAVES,
        PAGINA_LOGIN,
        CLAVE_DESTINO,
        escaparHTML,
        crearId,
        hoyISO,
        ahoraHHMM,
        formatearFecha,
        formatearMoneda,
        leerLista,
        guardarLista,
        obtenerMascotas,
        obtenerVeterinarios,
        guardarSesion,
        registrarUsuarioLocal,
        validarUsuarioLocal,
        crearTokenLocal,
        estaLogueado,
        cerrarSesion,
        exportarCSV
    };
})();