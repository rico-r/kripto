
const MODE_ENCRYPT = 0;
const MODE_DECRYPT = 1;
let mode = MODE_ENCRYPT;

const modeEl = document.getElementById('mode');
const submitEl = document.getElementById('submit');
/** @type {HTMLInputElement} */
const fileEl = document.getElementById('file');
const keyEl = document.getElementById('key');
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
            previewEl.parentElement.classList.remove('d-none');
            break;

        case 'dekripsi':
            mode = MODE_DECRYPT;
            submitEl.innerText = 'Mulai dekripsi';
            previewEl.parentElement.classList.add('d-none');
            break;
    }
    downloadBtn.disabled = true;
}

function onInputKey(e) {
    if (keyEl.value.length == 0) {
        submitEl.setAttribute('disabled', '');
    } else {
        submitEl.removeAttribute('disabled');
    }
}

function previewImage() {
    if (fileEl.files &&
        fileEl.files[0] &&
        fileEl.files[0].type.startsWith('image/') &&
        mode == MODE_ENCRYPT) {
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

/**
 * @param {File} file
 * @param {String} key
 */
async function encypt(file, key) {
    const input = new Uint8Array(await file.arrayBuffer());
    const result = new Uint8Array(file.size);
    for (let i = 0; i < file.size; i++) {
        result[i] = (input[i] + key.charCodeAt(i % key.length)) % 256;
    }
    return URL.createObjectURL(new Blob([result], { type: 'application/octet-stream' }));
}

/**
 * @param {File} file
 */
async function decrypt(file, key) {
    const input = new Uint8Array(await file.arrayBuffer());
    const result = new Uint8Array(file.size);
    for (let i = 0; i < file.size; i++) {
        result[i] = (input[i] + 256 - key.charCodeAt(i % key.length)) % 256;
    }
    return URL.createObjectURL(new Blob([result], { type: 'application/octet-stream' }));
}

async function submit() {
    loadingEl.classList.remove('d-none');
    if (url) {
        URL.revokeObjectURL(url);
        url = null;
    }

    const file = fileEl.files[0];
    const key = keyEl.value;
    fileName = file.name;

    switch (mode) {
        case MODE_ENCRYPT:
            url = await encypt(file, key);
            break;
        case MODE_DECRYPT:
            url = await decrypt(file, key);
            break;
    }

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
});

keyEl.addEventListener('input', onInputKey);

onModeChange({ target: modeEl });
onInputKey();
previewImage();
