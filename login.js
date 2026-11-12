// ==========================================
// INICIO DE SESIÓN CON DUMMYJSON
// Documentación: https://dummyjson.com/docs/auth
// ==========================================

(() => {
    "use strict";

    const URL_LOGIN = "https://dummyjson.com/auth/login";

    const formulario = document.getElementById("formLogin");
    const campoUsuario = document.getElementById("usuario");
    const campoClave = document.getElementById("clave");
    const botonIngresar = document.getElementById("botonIngresar");
    const mensaje = document.getElementById("mensajeLogin");

    // Páginas a las que se puede volver después de iniciar sesión (evita redirecciones inseguras)
    const DESTINO_VALIDO = /^(mascotas|veterinarios|turnos|historia-clinica)\.html(\?[\w=&%.-]*)?$/;

    function mostrarMensaje(texto, tipo) {
        mensaje.className = `alert alert-${tipo} mt-3`;
        mensaje.textContent = texto;
    }

    function ocultarMensaje() {
        mensaje.className = "d-none";
        mensaje.textContent = "";
    }

    function irAlDestino() {
        const guardado = sessionStorage.getItem(App.CLAVE_DESTINO) || "";
        sessionStorage.removeItem(App.CLAVE_DESTINO);
        location.replace(DESTINO_VALIDO.test(guardado) ? guardado : "turnos.html");
    }

    function mostrarCredencialesIncorrectas() {
        mostrarMensaje("Usuario o contraseña incorrectos. Verificá los datos e intentá nuevamente.", "danger");
        campoClave.value = "";
        campoClave.focus();
    }

    // Administradores creados desde registro.html (guardados en LocalStorage)
    async function ingresarConUsuarioRegistrado(username, password) {
        const usuario = await App.validarUsuarioLocal(username, password);
        if (!usuario) return false;

        App.guardarSesion(App.crearTokenLocal(usuario), {
            id: usuario.idUsuario,
            username: usuario.username,
            firstName: usuario.nombre,
            lastName: usuario.apellido
        });

        irAlDestino();
        return true;
    }

    async function iniciarSesion(evento) {
        evento.preventDefault();
        ocultarMensaje();

        const username = campoUsuario.value.trim();
        const password = campoClave.value;

        if (!username || !password) {
            mostrarMensaje("Ingresá el usuario y la contraseña.", "warning");
            return;
        }

        botonIngresar.disabled = true;
        botonIngresar.textContent = "Ingresando...";

        try {
            const respuesta = await fetch(URL_LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, expiresInMins: 60 })
            });

            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                // DummyJSON responde 400 con { message: "Invalid credentials" }
                // Se prueba entonces con los administradores registrados en este sitio
                if (await ingresarConUsuarioRegistrado(username, password)) return;

                mostrarCredencialesIncorrectas();
                return;
            }

            // Según la versión de la API el token llega como accessToken o como token
            const token = datos.accessToken || datos.token;

            if (!token) {
                mostrarMensaje("La respuesta del servidor no incluyó un token. Intentá nuevamente.", "danger");
                return;
            }

            App.guardarSesion(token, {
                id: datos.id,
                username: datos.username,
                firstName: datos.firstName,
                lastName: datos.lastName
            });

            irAlDestino();
        } catch (error) {
            console.error(error);

            // Sin conexión con DummyJSON también se permite ingresar con un usuario registrado
            if (await ingresarConUsuarioRegistrado(username, password)) return;

            mostrarMensaje("No se pudo conectar con el servidor de autenticación. Revisá tu conexión a internet.", "danger");
        } finally {
            botonIngresar.disabled = false;
            botonIngresar.textContent = "Ingresar";
        }
    }

    // Si ya hay una sesión iniciada, se avisa en lugar de mostrar el formulario
    if (App.estaLogueado()) {
        formulario.classList.add("d-none");
        document.getElementById("sesionActiva").classList.remove("d-none");
    }

    formulario.addEventListener("submit", iniciarSesion);
})();