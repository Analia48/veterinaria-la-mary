// ==========================================
// REGISTRO DE ADMINISTRADORES
// Los usuarios se guardan en LocalStorage (ver comun.js) y luego
// pueden iniciar sesión desde login.html.
// ==========================================

(() => {
    "use strict";

    const formulario = document.getElementById("formRegistro");
    const botonRegistrar = document.getElementById("botonRegistrar");
    const mensaje = document.getElementById("mensajeRegistro");

    function mostrarMensaje(texto, tipo) {
        mensaje.className = `alert alert-${tipo} mt-3`;
        mensaje.textContent = texto;
    }

    async function registrar(evento) {
        evento.preventDefault();
        mensaje.className = "d-none";

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const email = document.getElementById("email").value.trim();
        const username = document.getElementById("usuario").value.trim();
        const clave = document.getElementById("clave").value;
        const clave2 = document.getElementById("clave2").value;

        if (!nombre || !apellido || !email || !username || !clave || !clave2) {
            mostrarMensaje("Completá todos los campos.", "warning");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            mostrarMensaje("Ingresá un email válido.", "warning");
            return;
        }

        if (!/^[\w.-]{3,30}$/.test(username)) {
            mostrarMensaje("El usuario debe tener entre 3 y 30 caracteres (letras, números, punto, guion o guion bajo).", "warning");
            return;
        }

        if (clave.length < 6) {
            mostrarMensaje("La contraseña debe tener al menos 6 caracteres.", "warning");
            return;
        }

        if (clave !== clave2) {
            mostrarMensaje("Las contraseñas no coinciden.", "warning");
            return;
        }

        botonRegistrar.disabled = true;

        try {
            const resultado = await App.registrarUsuarioLocal({ nombre, apellido, username, email, clave });

            if (!resultado.ok) {
                mostrarMensaje(resultado.mensaje, "danger");
                return;
            }

            formulario.reset();
            mostrarMensaje("Cuenta creada correctamente. Redirigiendo al inicio de sesión...", "success");
            setTimeout(() => location.href = "login.html", 1500);
        } finally {
            botonRegistrar.disabled = false;
        }
    }

    // Si ya hay sesión iniciada no tiene sentido registrarse
    if (App.estaLogueado()) {
        location.replace("turnos.html");
        return;
    }

    formulario.addEventListener("submit", registrar);
})();