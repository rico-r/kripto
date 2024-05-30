
const MODE_ENCRYPT = 0;
const MODE_DECRYPT = 1;
let mode = MODE_ENCRYPT;

const modeEl = document.getElementById('mode');
const submitEl = document.getElementById('submit');
/** @type {HTMLInputElement} */
const fileEl = document.getElementById('file');
const keyEl = document.getElementById('key');
const previewEl = document.getElementById('preview');
const previewResultEl = document.getElementById('previewResult');
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
    if (url) {
        URL.revokeObjectURL(url);
        url = null;
    }
    previewResult();
}

function onInputKey(e) {
    if (keyEl.value.length == 0) {
        submitEl.setAttribute('disabled', '');
    } else {
        submitEl.removeAttribute('disabled');
    }
}

/**
 * Tampilkan preview dari input
 */
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
 * Tampilkan preview dari hasil
 */
function previewResult() {
    if (url) {
        previewResultEl.src = url;
        previewResultEl.parentElement.classList.remove('d-none');
    } else {
        previewResultEl.removeAttribute('src');
        previewResultEl.parentElement.classList.add('d-none');
    }
    downloadBtn.setAttribute('disabled', '');
}

/**
 * @param {string} key
 * @param {number} len
 */
function generateFSRMask(key, len) {
    const result = new Uint8Array(len);
    for (let i = 0; i < key.length; i++) {
        result[i] = key.charCodeAt(i);
    }
    for (let i = key.length; i < len; i++) {
        result[i] = result[i - 1] ^ result[i - key.length];
    }
    return result;
}

async function generateAESKey(key) {
    key = new TextEncoder().encode(key);
    key = await crypto.subtle.digest('SHA-256', key);
    return crypto.subtle.importKey("raw", key, { name: "AES-GCM", }, true, ["encrypt", "decrypt"]);
}

/**
 * @param {Uint8Array} input
 * @param {string} key
 * @returns {Uint8Array}
 */
function encyptDecryptFSR(input, key) {
    const result = new Uint8Array(input.byteLength);
    const mask = generateFSRMask(key, input.byteLength)
    for (let i = 0; i < input.byteLength; i++) {
        result[i] = input[i] ^ mask[i];
    }
    return result;
}

/**
 * @param {Uint8Array} input
 * @param {string} key
 * @returns {Uint8Array}
 */
async function encyptAES(input, key) {
    const rawKey = await generateAESKey(key);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const enc = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, rawKey, input));

    // Gabung iv dan hasil enkripsi
    const result = new Uint8Array(iv.length + enc.length);
    result.set(iv);
    result.set(enc, iv.length);

    return result;
}

/**
 * @param {Uint8Array} input
 * @param {string} key
 * @returns {Uint8Array}
 */
async function decryptAES(input, key) {
    const rawKey = await generateAESKey(key);

    // Ambil iv dari input
    const iv = input.slice(0, 12);

    // Buang iv dari input
    input = input.slice(12, input.length);

    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, rawKey, input));
}

/**
 * @param {Uint8Array} input
 * @param {string} key
 * @returns {Uint8Array}
 */
function encyptVigenere(input, key) {
    const result = new Uint8Array(input.byteLength);
    for (let i = 0; i < input.byteLength; i++) {
        result[i] = (input[i] + key.charCodeAt(i % key.length)) % 256;
    }
    return result;
}

/**
 * @param {Uint8Array} input
 * @param {string} key
 * @returns {Uint8Array}
 */
function decryptVigenere(input, key) {
    const result = new Uint8Array(input.byteLength);
    for (let i = 0; i < input.byteLength; i++) {
        result[i] = (input[i] + 256 - key.charCodeAt(i % key.length)) % 256;
    }
    return result;
}

/**
 * @param {File} file
 * @param {String} key
 */
async function encypt(file, key) {
    let result = new Uint8Array(await file.arrayBuffer());
    result = encyptDecryptFSR(result, key);
    result = await encyptAES(result, key);
    result = encyptVigenere(result, key);
    return URL.createObjectURL(new Blob([result], { type: 'application/octet-stream' }));
}

/**
 * @param {File} file
 * @param {String} key
 */
async function decrypt(file, key) {
    let result = new Uint8Array(await file.arrayBuffer());
    result = decryptVigenere(result, key);
    result = await decryptAES(result, key);
    result = encyptDecryptFSR(result, key);
    return URL.createObjectURL(new Blob([result], { type: 'application/octet-stream' }));
}

async function submit() {
    loadingEl.classList.remove('d-none');
    if (url) {
        URL.revokeObjectURL(url);
        url = null;
    }
    previewResult();

    const file = fileEl.files[0];
    const key = keyEl.value;
    fileName = file.name;

    switch (mode) {
        case MODE_ENCRYPT:
            url = await encypt(file, key);
            break;
        case MODE_DECRYPT:
            decrypt(file, key).then(result => {
                url = result;
            }).catch(() => {
                alert('Gagal melakukan dekripsi')
            }).finally(() => {
                previewResult();
            });
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
    a.download = mode == MODE_ENCRYPT ? (fileName + '.enc') : fileName.replace(/\.enc$/g, '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

keyEl.addEventListener('input', onInputKey);

onModeChange({ target: modeEl });
onInputKey();
previewImage();
