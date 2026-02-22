(() => {
// Main app behavior and orchestration (English-only UI).

const dom = window.AppDom || {};
const data = window.AppData || {};

const versionSelect = dom.versionSelect || document.getElementById('version-select');
const dropArea = dom.dropArea || document.getElementById('drop-area');
const uploadSection = document.getElementById('upload-section');
const fileInput = dom.fileInput || document.getElementById('file-input');
const loadedState = dom.loadedState || document.getElementById('loaded-state');
const successMessage = dom.successMessage || document.getElementById('success-message');
const fileNameDisplay = dom.fileNameDisplay || document.getElementById('file-name-display');
const preview = dom.preview || document.getElementById('skin-preview');
const removeButton = dom.removeButton || document.getElementById('remove-btn');
const downloadButton = dom.downloadButton || document.getElementById('download-btn');
const usernameLabel = dom.usernameLabel || document.getElementById('username-label');
const usernameInput = dom.usernameInput || document.getElementById('username-input');
const loadSkinButton = dom.loadSkinButton || document.getElementById('load-skin-btn');
const usernameFeedback = dom.usernameFeedback || document.getElementById('username-feedback');
const toggleDetailsBtn = dom.toggleDetailsBtn || document.getElementById('toggle-details-btn');
const detailsContainer = dom.detailsContainer || document.getElementById('details-container');
const howToTitle = dom.howToTitle || document.getElementById('how-to-title');
const zipStructureTitle = dom.zipStructureTitle || document.getElementById('zip-structure-title');
const howToListContainer = dom.howToListContainer || document.getElementById('how-to-list-container');
const privacyModal = dom.privacyModal || document.getElementById('privacy-modal');
const privacyLink = dom.privacyLink || document.getElementById('privacy-link');
const modalCloseBtn = dom.modalCloseBtn || document.getElementById('modal-close-btn');
const secretFeatureOverlay = dom.secretFeatureOverlay || document.getElementById('secret-feature-overlay');
const secretFeatureCloseButton = dom.secretFeatureCloseButton || document.getElementById('secret-feature-close');
const clickSound = dom.clickSound || document.getElementById('mc-click-sound');
const achievementSound = dom.achievementSound || document.getElementById('mc-achievement-sound');
const downloadSound = dom.downloadSound || document.getElementById('mc-download-sound');
const errorToast = dom.errorToast || document.getElementById('error-toast');
const errorToastText = dom.errorToastText || document.getElementById('error-toast-text');

const allNames = Array.isArray(data.allNames) && data.allNames.length
    ? data.allNames
    : ["Steve", "Alex", "Ari", "Kai", "Noor", "Sunny", "Zuri", "Efe", "Makena"];
const minecraftVersionOptions = Array.isArray(data.minecraftVersionOptions) && data.minecraftVersionOptions.length
    ? data.minecraftVersionOptions
    : [{ id: '1.21.11', label: '1.21.11', minFormat: 75, maxFormat: 75 }];
const defaultMinecraftVersion = typeof data.defaultMinecraftVersion === 'string'
    ? data.defaultMinecraftVersion
    : minecraftVersionOptions[0].id;

const TEXTS = {
    dropText: 'Drag and Drop Your PNG Skin',
    versionLabel: 'MINECRAFT VERSION',
    usernameLabel: 'Minecraft Username',
    usernamePlaceholder: 'Enter username',
    loadSkin: 'LOAD SKIN',
    usernameLoading: 'Loading skin...',
    usernameLoaded: 'Skin loaded for {username}.',
    remove: 'REMOVE',
    download: 'DOWNLOAD',
    success: 'Skin pack downloaded successfully!',
    detailsShow: 'SHOW DETAILS',
    detailsHide: 'HIDE DETAILS',
    howToTitle: 'HOW TO USE',
    howToList: [
        'Choose a Minecraft version before downloading.',
        'Drag and drop your 64x64 PNG skin, or load from username.',
        'Click DOWNLOAD to generate skin_pack.zip.'
    ],
    zipStructureTitle: 'ZIP STRUCTURE',
    zipStructureText: `skin_pack/
  pack.mcmeta
  pack.png
  README.txt
  assets/minecraft/textures/entity/
    steve.png
    alex.png
    ... (all 9 skins)
    player/
      wide/
        steve.png
        ...
      slim/
        alex.png
        ...`,
    privacyLink: 'Privacy and Terms',
    filePrefix: 'File loaded: ',
    alertWrongFormat: 'The image needs to be 64x64 pixels.',
    alertSelectPng: 'Please select a PNG file.',
    alertSelectVersion: 'Please choose a Minecraft version.',
    alertInvalidUsername: 'Invalid username. Use 3-16 letters, numbers, or _.',
    alertUsernameNotFound: 'Username not found.',
    alertSkinFetchFailed: 'Could not load a skin for that username.',
    alertNetworkFailure: 'Network error while loading skin. Please try again.',
    alertPackIconFailed: 'Failed to generate pack.png from the skin face.',
    readme: 'This is a resource pack for Minecraft Java Edition, generated locally to work offline. It replaces all 9 default game skins (including Steve, Alex, Ari, etc.) with your custom skin.\n\nCreated by 1337rod :)',
    mcmetaDesc: 'Locally generated skin pack to replace default Minecraft skins. Works offline.'
};

let skinFile = null;
let currentFileName = '';
let isSkinFetchLoading = false;
let player = null;
let secretFeatureActive = false;
let sequence = '';
let isYouTubeApiReady = false;

function playClickSound() {
    if (!clickSound) {
        return;
    }
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
}

function playAchievementSound() {
    if (!achievementSound) {
        return;
    }
    achievementSound.currentTime = 0;
    achievementSound.play().catch(() => {});
}

function playDownloadSound() {
    if (!downloadSound) {
        return;
    }
    downloadSound.currentTime = 0;
    downloadSound.play().catch(() => {});
}

function setInteractivity(enabled) {
    if (versionSelect) {
        versionSelect.disabled = !enabled;
    }
    if (downloadButton) {
        downloadButton.disabled = !enabled || !skinFile;
    }
    if (usernameInput) {
        usernameInput.disabled = !enabled || isSkinFetchLoading;
    }
    if (loadSkinButton) {
        loadSkinButton.disabled = !enabled || isSkinFetchLoading;
    }
}

function showErrorToast(message) {
    playAchievementSound();
    setInteractivity(false);

    if (!errorToast || !errorToastText) {
        console.error(message);
        setInteractivity(true);
        return;
    }

    errorToastText.textContent = message;
    errorToast.style.display = 'block';
    errorToast.classList.add('toast-show');

    setTimeout(() => {
        errorToast.classList.remove('toast-show');
        errorToast.style.display = 'none';
        setInteractivity(true);
    }, 3600);
}

function setUsernameFeedback(message, tone) {
    if (!usernameFeedback) {
        return;
    }
    usernameFeedback.textContent = message || '';
    usernameFeedback.classList.remove('is-loading', 'is-success', 'is-error');
    if (tone === 'loading') {
        usernameFeedback.classList.add('is-loading');
    } else if (tone === 'success') {
        usernameFeedback.classList.add('is-success');
    } else if (tone === 'error') {
        usernameFeedback.classList.add('is-error');
    }
}

function clearUsernameFeedback() {
    setUsernameFeedback('', '');
}

function formatTemplate(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (match, key) => {
        return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
    });
}

function setDetailsButtonText() {
    if (!toggleDetailsBtn || !detailsContainer) {
        return;
    }
    const isVisible = detailsContainer.style.display === 'flex';
    toggleDetailsBtn.textContent = isVisible ? TEXTS.detailsHide : TEXTS.detailsShow;
}

function applyStaticText() {
    const dropTextNode = document.getElementById('drop-text');
    if (dropTextNode) {
        dropTextNode.textContent = TEXTS.dropText;
    }
    if (versionSelect) {
        versionSelect.setAttribute('aria-label', TEXTS.versionLabel);
    }
    if (usernameLabel) {
        usernameLabel.textContent = TEXTS.usernameLabel;
    }
    if (usernameInput) {
        usernameInput.placeholder = TEXTS.usernamePlaceholder;
    }
    if (loadSkinButton) {
        loadSkinButton.textContent = TEXTS.loadSkin;
    }
    if (removeButton) {
        removeButton.textContent = TEXTS.remove;
    }
    if (downloadButton) {
        downloadButton.textContent = TEXTS.download;
    }
    if (howToTitle) {
        howToTitle.textContent = TEXTS.howToTitle;
    }
    if (zipStructureTitle) {
        zipStructureTitle.textContent = TEXTS.zipStructureTitle;
    }
    if (howToListContainer) {
        howToListContainer.innerHTML = TEXTS.howToList
            .map((item) => `<p class="how-to-item">${item}</p>`)
            .join('');
    }
    const zipStructureCode = document.getElementById('zip-structure-code');
    if (zipStructureCode) {
        zipStructureCode.textContent = TEXTS.zipStructureText;
    }
    if (privacyLink) {
        privacyLink.textContent = TEXTS.privacyLink;
    }
    if (successMessage && successMessage.style.display === 'block') {
        const successTextNode = successMessage.querySelector('.text-shadow');
        if (successTextNode) {
            successTextNode.textContent = TEXTS.success;
        }
    }
    if (skinFile && fileNameDisplay) {
        fileNameDisplay.textContent = TEXTS.filePrefix + currentFileName;
    }
    setDetailsButtonText();
}

function initializeVersionSelector() {
    if (!versionSelect || !minecraftVersionOptions.length) {
        return;
    }

    versionSelect.innerHTML = '';
    minecraftVersionOptions.forEach((versionOption) => {
        const option = document.createElement('option');
        option.value = versionOption.id;
        option.textContent = versionOption.label;
        versionSelect.appendChild(option);
    });

    const hasDefault = minecraftVersionOptions.some((v) => v.id === defaultMinecraftVersion);
    versionSelect.value = hasDefault ? defaultMinecraftVersion : minecraftVersionOptions[0].id;
}

function getSelectedVersion() {
    if (!versionSelect) {
        return null;
    }
    return minecraftVersionOptions.find((versionOption) => versionOption.id === versionSelect.value) || null;
}

function showState(state) {
    if (dropArea) {
        dropArea.style.display = 'none';
    }
    if (loadedState) {
        loadedState.style.display = 'none';
    }
    if (successMessage) {
        successMessage.style.display = 'none';
    }

    if (state === 'drop') {
        if (dropArea) {
            dropArea.style.display = 'block';
        }
        if (fileInput) {
            fileInput.value = '';
        }
        skinFile = null;
        currentFileName = '';
        clearUsernameFeedback();
        if (fileNameDisplay) {
            fileNameDisplay.textContent = '';
        }
    } else if (state === 'loaded') {
        if (loadedState) {
            loadedState.style.display = 'flex';
        }
    } else if (state === 'success') {
        if (successMessage) {
            successMessage.style.display = 'block';
            const successTextNode = successMessage.querySelector('.text-shadow');
            if (successTextNode) {
                successTextNode.textContent = TEXTS.success;
            }
        }
        setTimeout(() => showState('drop'), 3000);
    }

    applyStaticText();
    setInteractivity(true);
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function readImageDimensions(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.width, height: image.height });
        image.onerror = reject;
        image.src = dataUrl;
    });
}

function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
    });
}

function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error('canvas-to-blob-failed'));
        }, 'image/png');
    });
}

async function createPackIconBlobFromSkinDataUrl(dataUrl) {
    const sourceImage = await loadImageFromDataUrl(dataUrl);

    // 8x8 face base (8,8) + hat overlay (40,8), then upscale with nearest-neighbor.
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 8;
    faceCanvas.height = 8;
    const faceContext = faceCanvas.getContext('2d');
    if (!faceContext) {
        throw new Error('face-context-missing');
    }
    faceContext.clearRect(0, 0, 8, 8);
    faceContext.drawImage(sourceImage, 8, 8, 8, 8, 0, 0, 8, 8);
    faceContext.drawImage(sourceImage, 40, 8, 8, 8, 0, 0, 8, 8);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = 128;
    outputCanvas.height = 128;
    const outputContext = outputCanvas.getContext('2d');
    if (!outputContext) {
        throw new Error('output-context-missing');
    }
    outputContext.imageSmoothingEnabled = false;
    outputContext.clearRect(0, 0, 128, 128);
    outputContext.drawImage(faceCanvas, 0, 0, 8, 8, 0, 0, 128, 128);

    return canvasToPngBlob(outputCanvas);
}

async function handleFile(file, options = {}) {
    const isPng = Boolean(file) && (
        file.type === 'image/png' ||
        (!file.type && typeof file.name === 'string' && /\.png$/i.test(file.name))
    );
    if (!isPng) {
        showErrorToast(TEXTS.alertSelectPng);
        return { success: false, reason: 'invalid-type' };
    }

    try {
        const dataUrl = await readFileAsDataUrl(file);
        const dimensions = await readImageDimensions(dataUrl);
        if (dimensions.width !== 64 || dimensions.height !== 64) {
            showErrorToast(TEXTS.alertWrongFormat);
            if (fileInput) {
                fileInput.value = '';
            }
            return { success: false, reason: 'wrong-format' };
        }

        skinFile = file;
        currentFileName = options.displayName || file.name;
        if (preview) {
            preview.src = dataUrl;
        }
        showState('loaded');
        return { success: true, reason: null };
    } catch (error) {
        console.error('Failed to read selected skin file', error);
        showErrorToast(TEXTS.alertSelectPng);
        return { success: false, reason: 'read-failed' };
    }
}

function isValidMinecraftUsername(username) {
    return /^[A-Za-z0-9_]{3,16}$/.test(username);
}

async function loadSkinByUsername() {
    if (!usernameInput) {
        return;
    }

    const username = usernameInput.value.trim();
    if (!isValidMinecraftUsername(username)) {
        setUsernameFeedback(TEXTS.alertInvalidUsername, 'error');
        return;
    }

    isSkinFetchLoading = true;
    setInteractivity(true);
    setUsernameFeedback(TEXTS.usernameLoading, 'loading');

    try {
        const response = await fetch(`/api/skin?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: { Accept: 'image/png, application/json' }
        });
        const contentType = String(response.headers.get('content-type') || '').toLowerCase();

        if (!response.ok) {
            let apiCode = '';
            if (contentType.includes('application/json')) {
                try {
                    const payload = await response.json();
                    apiCode = String(payload && payload.code ? payload.code : '').toLowerCase();
                } catch (error) {
                    // Ignore parse failures and fall through to status-based mapping.
                }
            }

            if (response.status === 400 || apiCode === 'invalid_username') {
                setUsernameFeedback(TEXTS.alertInvalidUsername, 'error');
                return;
            }
            if (response.status === 404 || apiCode === 'username_not_found') {
                setUsernameFeedback(TEXTS.alertUsernameNotFound, 'error');
                return;
            }
            if (response.status >= 500 || apiCode === 'upstream_failure' || apiCode === 'network_failure') {
                setUsernameFeedback(TEXTS.alertNetworkFailure, 'error');
                return;
            }
            setUsernameFeedback(TEXTS.alertSkinFetchFailed, 'error');
            return;
        }

        if (contentType.includes('application/json')) {
            setUsernameFeedback(TEXTS.alertSkinFetchFailed, 'error');
            return;
        }

        const blob = await response.blob();
        if (!blob || !blob.size) {
            setUsernameFeedback(TEXTS.alertSkinFetchFailed, 'error');
            return;
        }
        const pngBlob = blob.type === 'image/png' ? blob : blob.slice(0, blob.size, 'image/png');
        const fetchedFile = new File([pngBlob], `${username}.png`, { type: 'image/png' });
        const result = await handleFile(fetchedFile, { displayName: `${username}.png` });
        if (result.success) {
            setUsernameFeedback(formatTemplate(TEXTS.usernameLoaded, { username }), 'success');
        } else if (result.reason === 'wrong-format') {
            setUsernameFeedback(TEXTS.alertWrongFormat, 'error');
        } else {
            setUsernameFeedback(TEXTS.alertSkinFetchFailed, 'error');
        }
    } catch (error) {
        console.error('Skin lookup failed', error);
        if (window.location && window.location.protocol === 'file:') {
            setUsernameFeedback('Run this app through a local server to use username lookup.', 'error');
        } else {
            setUsernameFeedback(TEXTS.alertNetworkFailure, 'error');
        }
    } finally {
        isSkinFetchLoading = false;
        setInteractivity(!errorToast || errorToast.style.display !== 'block');
    }
}

async function processSkinAndCreateZip() {
    if (!skinFile) {
        showErrorToast(TEXTS.alertSelectPng);
        return;
    }
    if (typeof JSZip === 'undefined') {
        showErrorToast('Zip library failed to load. Refresh and try again.');
        return;
    }

    const selectedVersion = getSelectedVersion();
    if (!selectedVersion) {
        showErrorToast(TEXTS.alertSelectVersion);
        return;
    }

    if (downloadButton) {
        downloadButton.disabled = true;
    }

    try {
        const dataUrl = await readFileAsDataUrl(skinFile);
        const base64Data = String(dataUrl).replace(/^data:image\/png;base64,/, '');
        let packIconBlob = null;
        try {
            packIconBlob = await createPackIconBlobFromSkinDataUrl(dataUrl);
        } catch (error) {
            console.error('Failed to create pack icon from skin face', error);
            showErrorToast(TEXTS.alertPackIconFailed);
            return;
        }

        const zip = new JSZip();
        const packFolder = zip.folder('skin_pack');
        const packMetadata = { description: [{ text: TEXTS.mcmetaDesc }] };

        if (typeof selectedVersion.minFormat === 'number' && typeof selectedVersion.maxFormat === 'number') {
            packMetadata.min_format = selectedVersion.minFormat;
            packMetadata.max_format = selectedVersion.maxFormat;
        } else {
            packMetadata.pack_format = selectedVersion.packFormat;
        }

        packFolder.file('README.txt', TEXTS.readme);
        packFolder.file('pack.mcmeta', JSON.stringify({ pack: packMetadata }, null, 2));
        packFolder.file('pack.png', packIconBlob);

        const entityFolder = packFolder.folder('assets/minecraft/textures/entity');
        const slimFolder = entityFolder.folder('player/slim');
        const wideFolder = entityFolder.folder('player/wide');

        allNames.forEach((name) => {
            const fileName = `${String(name).toLowerCase()}.png`;
            entityFolder.file(fileName, base64Data, { base64: true });
            slimFolder.file(fileName, base64Data, { base64: true });
            wideFolder.file(fileName, base64Data, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'skin_pack.zip';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);

        showState('success');
        playDownloadSound();
    } catch (error) {
        console.error('Failed to generate zip', error);
        showErrorToast('Failed to generate skin_pack.zip.');
    } finally {
        if (downloadButton) {
            downloadButton.disabled = false;
        }
    }
}

// =======================================================
// Initialization + Event listeners
// =======================================================

initializeVersionSelector();
applyStaticText();
showState('drop');

if (versionSelect) {
    versionSelect.addEventListener('change', playClickSound);
}

if (dropArea) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        dropArea.addEventListener(eventName, (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });
    ['dragenter', 'dragover'].forEach((eventName) => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'));
    });
    ['dragleave', 'drop'].forEach((eventName) => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'));
    });

    dropArea.addEventListener('drop', (event) => {
        handleFile(event.dataTransfer.files[0]);
        playClickSound();
    });

    // Some browsers do not trigger hidden file input through label reliably.
    dropArea.addEventListener('click', () => {
        if (fileInput) {
            fileInput.click();
        }
    });
}

if (uploadSection) {
    ['dragenter', 'dragover'].forEach((eventName) => {
        uploadSection.addEventListener(eventName, (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (dropArea) {
                dropArea.classList.add('highlight');
            }
        });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
        uploadSection.addEventListener(eventName, (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (dropArea) {
                dropArea.classList.remove('highlight');
            }
        });
    });
    uploadSection.addEventListener('drop', (event) => {
        const droppedFile = event.dataTransfer && event.dataTransfer.files
            ? event.dataTransfer.files[0]
            : null;
        if (droppedFile) {
            handleFile(droppedFile);
            playClickSound();
        }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (event) => {
        handleFile(event.target.files[0]);
        playClickSound();
    });
}

if (dropArea && fileInput) {
    dropArea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInput.click();
            playClickSound();
        }
    });
}

if (loadSkinButton) {
    loadSkinButton.addEventListener('click', () => {
        loadSkinByUsername();
        playClickSound();
    });
}

if (usernameInput) {
    usernameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            loadSkinByUsername();
            playClickSound();
        }
    });
    usernameInput.addEventListener('input', () => clearUsernameFeedback());
}

if (removeButton) {
    removeButton.addEventListener('click', () => {
        showState('drop');
        playClickSound();
    });
}

if (downloadButton) {
    downloadButton.addEventListener('click', () => {
        processSkinAndCreateZip();
        playClickSound();
    });
}

if (toggleDetailsBtn && detailsContainer) {
    toggleDetailsBtn.addEventListener('click', () => {
        playClickSound();
        const currentlyVisible = detailsContainer.style.display === 'flex';
        detailsContainer.style.display = currentlyVisible ? 'none' : 'flex';
        setDetailsButtonText();
    });
}

if (privacyLink && privacyModal) {
    privacyLink.addEventListener('click', (event) => {
        event.preventDefault();
        privacyModal.style.display = 'flex';
        playClickSound();
    });
}

if (modalCloseBtn && privacyModal) {
    modalCloseBtn.addEventListener('click', () => {
        privacyModal.style.display = 'none';
        playClickSound();
    });
}

window.addEventListener('click', (event) => {
    if (privacyModal && event.target === privacyModal) {
        privacyModal.style.display = 'none';
        playClickSound();
    }
});

// =======================================================
// Secret feature
// =======================================================

function initializePlayer() {
    if (typeof YT === 'undefined' || typeof YT.Player !== 'function') {
        return;
    }

    player = new YT.Player('secret-feature-player', {
        videoId: 'VqAGrH-qVwE',
        playerVars: {
            autoplay: 1,
            rel: 0,
            showinfo: 0,
            modestbranding: 1
        },
        events: {
            onStateChange: onPlayerStateChange
        }
    });
}

window.onYouTubeIframeAPIReady = () => {
    isYouTubeApiReady = true;
};

document.addEventListener('keydown', (event) => {
    if (secretFeatureActive) {
        return;
    }

    const key = event.key;
    if (key === '1' || key === '3' || key === '7') {
        sequence += key;
        if (sequence.includes('1337')) {
            if (secretFeatureOverlay) {
                secretFeatureOverlay.style.display = 'flex';
            }
            secretFeatureActive = true;
            sequence = '';

            if (!player && isYouTubeApiReady) {
                initializePlayer();
            } else if (player) {
                player.playVideo();
            }
        }
    } else {
        sequence = '';
    }
});

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        closeSecretFeature();
    }
}

if (secretFeatureCloseButton) {
    secretFeatureCloseButton.addEventListener('click', closeSecretFeature);
}

function closeSecretFeature() {
    if (secretFeatureOverlay) {
        secretFeatureOverlay.style.display = 'none';
    }
    secretFeatureActive = false;
    if (player) {
        player.stopVideo();
    }
}

})();
