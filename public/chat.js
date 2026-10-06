// Se conecta automáticamente al host actual (sirve tanto en localhost como en AWS)
var socket = io.connect();

var persona = document.getElementById('persona');
var panelBienvenida = document.getElementById('panel-bienvenida');
var appChat = document.getElementById('app-chat');
var usuario = document.getElementById('usuario');
var mensaje = document.getElementById('mensaje');
var archivoInput = document.getElementById('archivo');
var botonEnviar = document.getElementById('enviar');
var escribiendoMensaje = document.getElementById('escribiendo-mensaje');
var output = document.getElementById('output');

// Generador de sonido sintético mediante Web Audio API
function reproducirSonidoNotificacion() {
    try {
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Tono D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // Subida a A5

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch(e) {
        console.warn("El navegador bloqueó la reproducción automática de audio:", e);
    }
}

// Función para cambiar de panel de inicio a la interfaz de chat
function ingresarAlChat() {
    if (persona.value.trim() !== '') {
        panelBienvenida.style.display = "none";
        appChat.style.display = "block";
        usuario.value = persona.value.trim();
        usuario.readOnly = true;
    } else {
        alert("Por favor, ingresa tu nombre de usuario.");
    }
}

// Función para enviar mensaje y/o archivo
function enviarPayload() {
    var texto = mensaje.value.trim();
    var file = archivoInput.files[0];

    if (!texto && !file) return;

    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            socket.emit('chat', {
                usuario: usuario.value,
                mensaje: texto,
                archivo: {
                    nombre: file.name,
                    tipo: file.type,
                    data: e.target.result
                }
            });
            archivoInput.value = '';
            mensaje.value = '';
        };
        reader.readAsDataURL(file);
    } else {
        socket.emit('chat', {
            usuario: usuario.value,
            mensaje: texto,
            archivo: null
        });
        mensaje.value = '';
    }
}

// Eventos del botón y teclado
botonEnviar.addEventListener('click', enviarPayload);
mensaje.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') enviarPayload();
});

// Notificación de escritura
mensaje.addEventListener('keyup', function() {
    socket.emit('typing', {
        nombre: usuario.value,
        texto: mensaje.value
    });
});

// Escuchar mensajes entrantes del servidor
socket.on('chat', function(data) {
    escribiendoMensaje.innerHTML = '';
    reproducirSonidoNotificacion();

    var contenido = '<p><strong>' + data.usuario + ': </strong>' + (data.mensaje || '');

    if (data.archivo) {
        var tipo = data.archivo.tipo;
        if (tipo.startsWith('image/')) {
            contenido += '<br><img class="archivo-adjunto" style="max-height:200px; border-radius:4px;" src="' + data.archivo.data + '">';
        } else if (tipo.startsWith('video/')) {
            contenido += '<br><video class="archivo-adjunto" controls style="max-width:100%; max-height:220px;" src="' + data.archivo.data + '"></video>';
        } else if (tipo.startsWith('audio/')) {
            contenido += '<br><audio controls style="margin-top:5px;" src="' + data.archivo.data + '"></audio>';
        } else {
            contenido += '<br><a href="' + data.archivo.data + '" download="' + data.archivo.nombre + '" style="color:#246AA6; text-decoration:underline;">📥 Descargar: ' + data.archivo.nombre + '</a>';
        }
    }

    contenido += '</p>';
    output.innerHTML += contenido;
    document.getElementById('ventana-mensajes').scrollTop = document.getElementById('ventana-mensajes').scrollHeight;
});

// Escuchar notificación de escritura
socket.on('typing', function(data) {
    if (data.texto) {
        escribiendoMensaje.innerHTML = '<p><em>' + data.nombre + ' está escribiendo un mensaje...</em></p>';
    } else {
        escribiendoMensaje.innerHTML = '';
    }
});
