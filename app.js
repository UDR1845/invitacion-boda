
const data = window.INVITATION;

let index = 0;
let playing = false;
let touchX = 0;

// Reproducción automática
let autoplayTimer = null;
let autoplayEnabled = data.autoplay ?? true;
let presentationStarted = false;

// Elementos HTML
const scene = document.querySelector('#scene');
const image = document.querySelector('#sceneImage');
const content = document.querySelector('#sceneContent');
const counter = document.querySelector('#counter');
const bar = document.querySelector('#progressBar');
const audio = document.querySelector('#music');
const soundBtn = document.querySelector('#soundBtn');
const soundIcon = document.querySelector('#soundIcon');
const soundLabel = document.querySelector('#soundLabel');

const prevBtn = document.querySelector('#prevBtn');
const nextBtn = document.querySelector('#nextBtn');

// Interpolar datos de la invitación
function interpolate(value) {
    return value.replace(/\{(\w+)\}/g, (_, key) =>
        data[key] ?? `{${key}}`
    );
}

function prepareHtml(html) {
    return html.replace(/\{(\w+)\}/g, (_, key) =>
        data[key] ?? `{${key}}`
    );
}

// Detener temporizador
function stopAutoplay() {
    if (autoplayTimer) {
        clearTimeout(autoplayTimer);
        autoplayTimer = null;
    }
}

// Iniciar temporizador de la escena actual
function startAutoplay() {
  stopAutoplay();

  if (!presentationStarted) return;

  const item = data.scenes[index];
  const duration = (item.duration ?? 5) * 1000;

  // La última pantalla permanece visible.
  if (index === data.scenes.length - 1) return;

  autoplayTimer = setTimeout(() => {
    next();
  }, duration);
}

// Activar o desactivar avance automático
function toggleAutoplay() {
    autoplayEnabled = !autoplayEnabled;

    if (autoplayEnabled) {
        startAutoplay();
    } else {
        stopAutoplay();
    }

    return autoplayEnabled;
}

// Renderizar escena
async function render() {
    stopAutoplay();

    const item = data.scenes[index];

    scene.className = `scene scene-enter scene-${item.style || 'default'}`;

    content.innerHTML = '<div class="loading-scene">✧</div>';

    try {
        const response = await fetch(item.file);

        if (!response.ok) {
            throw new Error(`No se pudo cargar ${item.file}`);
        }

        content.innerHTML = prepareHtml(await response.text());

    } catch (error) {
        content.innerHTML = `
            <article class="editorial-card">
                <p class="eyebrow">INVITACIÓN</p>
                <h1 class="script-title">No se pudo cargar esta pantalla</h1>
                <p>Abre el proyecto con Live Server y revisa ${item.file}.</p>
            </article>
        `;

        console.error(error);
    }

    // Reemplazar textos dinámicos
    content.querySelectorAll('[data-text]').forEach(el => {
        const key = el.dataset.text;

        if (data[key] !== undefined) {
            el.textContent = data[key];
        }
    });

    // Eliminar adornos que no se encuentren
    content.querySelectorAll('[data-decor]').forEach(img => {
        img.addEventListener('error', () => img.remove());
    });

    const startBtn = content.querySelector('#startPresentationBtn');

    if (startBtn) {
      startBtn.addEventListener('click', startPresentation);
    }

    // Actualizar contador
    counter.textContent =
        `${String(index + 1).padStart(2, '0')} / ${String(data.scenes.length).padStart(2, '0')}`;

    // Actualizar barra de progreso
    bar.style.width = `${(index + 1) / data.scenes.length * 100}%`;

    // Botones
    prevBtn.disabled = index === 0;

    nextBtn.textContent =
        index === data.scenes.length - 1 ? '↻' : '›';

    // Iniciar temporizador después de cargar la escena
    startAutoplay();
}

// Avanzar escena
function next() {
    stopAutoplay();

    if (index === data.scenes.length - 1) {
        // Reiniciar desde la primera escena
        index = 0;
    } else {
        index++;
    }

    render();
}

// Retroceder escena
function prev() {
    stopAutoplay();

    index = Math.max(0, index - 1);

    render();
}

// Botones de navegación
nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);

// Música de fondo
async function activateMusic() {
    try {
        await audio.play();

        playing = true;
        soundIcon.textContent = '♫';
        soundLabel.textContent = 'Música activada';

    } catch (error) {
        playing = false;
        soundLabel.textContent = 'Pulsa para reproducir';
    }
}

soundBtn.addEventListener('click', async () => {

    if (!playing) {
        await activateMusic();

    } else {
        audio.pause();

        playing = false;
        soundIcon.textContent = '♪';
        soundLabel.textContent = 'Activar música';
    }
});

// Intentar reproducción automática de música
audio.loop = true;

document.addEventListener('DOMContentLoaded', () => {
    activateMusic();
});

// Teclado
document.addEventListener('keydown', e => {

    if (e.key === 'ArrowRight') next();

    if (e.key === 'ArrowLeft') prev();

    // Espacio: pausar o reanudar avance automático
    if (e.code === 'Space') {
        e.preventDefault();
        toggleAutoplay();
    }
});

// Deslizamiento táctil
scene.addEventListener('touchstart', e => {
    touchX = e.changedTouches[0].screenX;
}, { passive: true });

scene.addEventListener('touchend', e => {

    const dx = e.changedTouches[0].screenX - touchX;

    if (Math.abs(dx) > 55) {
        dx < 0 ? next() : prev();
    }

}, { passive: true });

async function startPresentation() {
  if (presentationStarted) return;

  presentationStarted = true;

  // Ocultar el botón de inicio.
  const startBtn = document.querySelector('#startPresentationBtn');
  if (startBtn) startBtn.remove();

  // Activar música.
  try {
    await audio.play();
    playing = true;
    soundIcon.textContent = '♫';
    soundLabel.textContent = 'Música activada';
  } catch (error) {
    // La presentación continúa aunque el navegador bloquee el audio.
    soundLabel.textContent = 'Activar música';
  }

  // Comenzar a contar el tiempo de la primera escena.
  startAutoplay();
}

// Iniciar presentación
render();
