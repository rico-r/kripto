
const MODE_ENCRYPT = 0;
const MODE_DECRYPT = 1;
let mode = MODE_ENCRYPT;

const modeEl = document.getElementById('mode');
const submitEl = document.getElementById('submit');
/** @type {HTMLInputElement} */
const fileEl = document.getElementById('file');
const previewEl = document.getElementById('preview');
const loadingEl = document.getElementById('loading');
const downloadBtn = document.getElementById('download');
let url = null;
let fileName = null;

/**
 * @param {Event} e
 */
function onModeChange(e) {
    switch (e.target.value) {
        case 'enkripsi':
            mode = MODE_ENCRYPT;
            submitEl.innerText = 'Mulai enkripsi';
            break;

        case 'dekripsi':
            mode = MODE_DECRYPT;
            submitEl.innerText = 'Mulai dekripsi';
            break;
    }
    downloadBtn.disabled = true;
}

function previewImage() {
    if (fileEl.files &&
        fileEl.files[0] &&
        fileEl.files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewEl.src = e.target.result;
            previewEl.parentElement.classList.remove('d-none');
        };
        reader.readAsDataURL(fileEl.files[0]);
    } else {
        previewEl.removeAttribute('src');
        previewEl.parentElement.classList.add('d-none');
    }
    downloadBtn.setAttribute('disabled', '');
}

async function submit() {
    loadingEl.classList.remove('d-none');
    if (url) {
        URL.revokeObjectURL(url);
    }

    const file = fileEl.files[0];
    url = URL.createObjectURL(file);
    fileName = file.name;
    downloadBtn.href = url;

    // Tunggu 2 detik
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 2000);
    });;

    loadingEl.classList.add('d-none');
    downloadBtn.removeAttribute('disabled');
}

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
    return false;
});

modeEl.addEventListener('change', onModeChange);
fileEl.addEventListener('change', previewImage);
document.forms[0].addEventListener('reset', () => {
    setTimeout(() => {
        onModeChange({ target: modeEl });
        previewImage();
    }, 100);
});
downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
})
onModeChange({ target: modeEl });
previewImage();
