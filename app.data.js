// Static app data extracted from app.js for maintainability.
const allNames = ["Steve", "Alex", "Ari", "Kai", "Noor", "Sunny", "Zuri", "Efe", "Makena"];
const minecraftVersionOptions = [
    { id: '1.21.11', label: '1.21.11', minFormat: 75, maxFormat: 75 },
    { id: '1.21.9', label: '1.21.9', minFormat: 69, maxFormat: 69 },
    { id: '1.21.8', label: '1.21.8', packFormat: 64 },
    { id: '1.21.6', label: '1.21.6', packFormat: 63 },
    { id: '1.21.5', label: '1.21.5', packFormat: 55 },
    { id: '1.21.4', label: '1.21.4', packFormat: 46 },
    { id: '1.21-1.21.3', label: '1.21 - 1.21.3', packFormat: 34 },
    { id: '1.20.5-1.20.6', label: '1.20.5 - 1.20.6', packFormat: 32 },
    { id: '1.20.3-1.20.4', label: '1.20.3 - 1.20.4', packFormat: 22 },
    { id: '1.20.2', label: '1.20.2', packFormat: 18 },
    { id: '1.20-1.20.1', label: '1.20 - 1.20.1', packFormat: 15 },
    { id: '1.19.4', label: '1.19.4', packFormat: 13 },
    { id: '1.19.3', label: '1.19.3', packFormat: 12 },
    { id: '1.19-1.19.2', label: '1.19 - 1.19.2', packFormat: 9 },
    { id: '1.18-1.18.2', label: '1.18 - 1.18.2', packFormat: 8 },
    { id: '1.17-1.17.1', label: '1.17 - 1.17.1', packFormat: 7 },
    { id: '1.16.2-1.16.5', label: '1.16.2 - 1.16.5', packFormat: 6 },
    { id: '1.15-1.16.1', label: '1.15 - 1.16.1', packFormat: 5 },
    { id: '1.13-1.14.4', label: '1.13 - 1.14.4', packFormat: 4 },
    { id: '1.11-1.12.2', label: '1.11 - 1.12.2', packFormat: 3 },
    { id: '1.9-1.10.2', label: '1.9 - 1.10.2', packFormat: 2 },
    { id: '1.6.1-1.8.9', label: '1.6.1 - 1.8.9', packFormat: 1 }
];
const defaultMinecraftVersion = '1.21.11';
const translations = {
    'pt-br': {
        dropText: 'Arraste e Solte Sua Skin PNG', 
        dropDetails: '', 
        versionLabel: 'VERSÃO DO MINECRAFT',
        usernameLabel: 'NOME DE USUÁRIO',
        usernamePlaceholder: 'Digite o nome de usuário',
        loadSkinText: 'CARREGAR SKIN',
        usernameLoading: 'Carregando skin...',
        usernameLoaded: 'Skin carregada para {username}.',
        removeText: 'REMOVER', 
        downloadText: 'BAIXAR', 
        successText: 'Pacote de skins baixado com sucesso!', 
        howToTitle: 'COMO USAR', 
        howToList: ['Selecione a versão do Minecraft antes de baixar.', 'Baixe o .zip e ative como Resource Pack.', 'Skins padrão (Steve, Alex, Ari, etc.) serão substituídas pela sua.'], 
        zipStructureTitle: 'ESTRUTURA DO ZIP:', 
        zipStructureText: `skin_pack/
  pack.mcmeta
  README.txt
  assets/minecraft/textures/entity/
    ├ steve.png
    ├ alex.png
    ├ ... (todas as 9 skins)
    ├ player/
      ├ wide/
├ steve.png
├ ...
      └ slim/
├ alex.png
└ ...`, 
        fileNamePrefix: 'Arquivo carregado: ', 
        alertWrongFormat: 'A imagem precisa ter 64×64 pixels.', 
        alertSelectPng: 'Por favor, selecione um arquivo PNG.', 
        alertSelectVersion: 'Selecione uma versão do Minecraft.',
        alertInvalidUsername: 'Nome de usuário inválido. Use 3-16 caracteres: letras, números ou _.',
        alertUsernameNotFound: 'Usuário não encontrado.',
        alertSkinFetchFailed: 'Não foi possível carregar a skin para esse usuário.',
        alertNetworkFailure: 'Falha de rede ao carregar a skin. Tente novamente.',
        readme: 'Este é um pacote de recursos para o Minecraft Java Edition, gerado localmente para funcionar offline. Ele substitui todas as 9 skins padrão do jogo (incluindo Steve, Alex, Ari, etc.) pela sua skin personalizada.\n\nCriado pelo 1337rod :)', 
        mcmetaDesc: 'Pacote de skins gerado localmente para substituir as skins padrão do Minecraft. Funciona offline.', 
        toggleBtnText: 'MOSTRAR DETALHES', 
        toggleBtnTextAlt: 'OCULTAR DETALHES', 
        privacyLink: 'Privacidade e Termos',
        privacyTitle: 'Política de Privacidade e Termos de Serviço', 
        privacyText: ['Este site não coleta, armazena ou processa qualquer dado pessoal. Todo o processamento da sua skin é feito diretamente no seu navegador.', 'Os arquivos gerados ficam apenas no seu computador e não são enviados para a internet.', 'O uso da ferramenta é inteiramente gratuito e não requer conta ou login.']
    },
    'en': {
        dropText: 'Drag and Drop Your PNG Skin', 
        dropDetails: '', 
        versionLabel: 'MINECRAFT VERSION',
        usernameLabel: 'MINECRAFT USERNAME',
        usernamePlaceholder: 'Enter username',
        loadSkinText: 'LOAD SKIN',
        usernameLoading: 'Loading skin...',
        usernameLoaded: 'Skin loaded for {username}.',
        removeText: 'REMOVE', 
        downloadText: 'DOWNLOAD', 
        successText: 'Skin pack downloaded successfully!', 
        howToTitle: 'HOW TO USE', 
        howToList: ['Choose a Minecraft version before downloading.', 'Download the .zip and activate it as a Resource Pack.', 'Default skins (Steve, Alex, Ari, etc.) will be replaced with your skin.'], 
        zipStructureTitle: 'ZIP STRUCTURE:', 
        zipStructureText: `skin_pack/
  pack.mcmeta
  README.txt
  assets/minecraft/textures/entity/
    ├ steve.png
    ├ alex.png
    ├ ... (all 9 skins)
    ├ player/
      ├ wide/
├ steve.png
├ ...
      └ slim/
├ alex.png
└ ...`, 
        fileNamePrefix: 'File loaded: ', 
        alertWrongFormat: 'The image needs to be 64×64 pixels.', 
        alertSelectPng: 'Please select a PNG file.', 
        alertSelectVersion: 'Please choose a Minecraft version.',
        alertInvalidUsername: 'Invalid username. Use 3-16 letters, numbers, or _.',
        alertUsernameNotFound: 'Username not found.',
        alertSkinFetchFailed: 'Could not load a skin for that username.',
        alertNetworkFailure: 'Network error while loading skin. Please try again.',
        readme: 'This is a resource pack for Minecraft Java Edition, generated locally to work offline. It replaces all 9 default game skins (including Steve, Alex, Ari, etc.) with your custom skin.\n\nCreated by 1337rod :)', 
        mcmetaDesc: 'Locally generated skin pack to replace default Minecraft skins. Works offline.', 
        toggleBtnText: 'SHOW DETAILS', 
        toggleBtnTextAlt: 'HIDE DETAILS', 
        privacyLink: 'Privacy and Terms',
        privacyTitle: 'Privacy Policy and Terms of Service', 
        privacyText: ['This website does not collect, store, or process any personal data. All skin processing is done directly in your browser.', 'The generated files remain only on your computer and are not sent to the internet.', 'The use of the tool is completely free and does not require an account or login.']
    },
    'es': {
        dropText: 'Arrastra y Suelta Tu Skin PNG', 
        dropDetails: '', 
        versionLabel: 'VERSIÓN DE MINECRAFT',
        usernameLabel: 'NOMBRE DE USUARIO',
        usernamePlaceholder: 'Escribe el usuario',
        loadSkinText: 'CARGAR SKIN',
        usernameLoading: 'Cargando skin...',
        usernameLoaded: 'Skin cargada para {username}.',
        removeText: 'QUITAR', 
        downloadText: 'DESCARGAR', 
        successText: '¡Paquete de skins descargado con éxito!', 
        howToTitle: 'CÓMO USAR', 
        howToList: ['Elige la versión de Minecraft antes de descargar.', 'Descarga el .zip y actívalo como Paquete de Recursos.', 'Las skins predeterminadas (Steve, Alex, Ari, etc.) serán reemplazadas por la tuya.'], 
        zipStructureTitle: 'ESTRUCTURA DEL ZIP:', 
        zipStructureText: `skin_pack/
  pack.mcmeta
  README.txt
  assets/minecraft/textures/entity/
    ├ steve.png
    ├ alex.png
    ├ ... (todas las 9 skins)
    ├ player/
      ├ wide/
├ steve.png
├ ...
      └ slim/
├ alex.png
└ ...`, 
        fileNamePrefix: 'Archivo cargado: ', 
        alertWrongFormat: 'La imagen debe tener 64×64 píxeles.', 
        alertSelectPng: 'Por favor, selecciona un archivo PNG.', 
        alertSelectVersion: 'Selecciona una versión de Minecraft.',
        alertInvalidUsername: 'Nombre de usuario inválido. Usa 3-16 caracteres: letras, números o _.',
        alertUsernameNotFound: 'No se encontró el usuario.',
        alertSkinFetchFailed: 'No se pudo cargar la skin para ese usuario.',
        alertNetworkFailure: 'Error de red al cargar la skin. Inténtalo de nuevo.',
        readme: 'Este es un paquete de recursos para Minecraft Java Edition, generado localmente para funcionar sin conexión. Reemplaza las 9 skins predeterminadas del juego (incluyendo Steve, Alex, Ari, etc.) con tu skin personalizada.\n\nCreado por 1337rod :)', 
        mcmetaDesc: 'Paquete de skins generado localmente para reemplazar las skins predeterminadas de Minecraft. Funciona sin conexión.', 
        toggleBtnText: 'MOSTRAR DETALLES', 
        toggleBtnTextAlt: 'OCULTAR DETALLES', 
        privacyLink: 'Privacidad y Términos',
        privacyTitle: 'Política de Privacidad y Términos de Servicio', 
        privacyText: ['Este sitio no recopila, almacena ni processa ningún dato personal. Todo el procesamiento de su skin se realiza directamente en su navegador.', 'Los archivos generados permanecen solo en su computadora **y no se envían** a Internet.', 
        'El uso de la herramienta es completamente gratuito **y no requiere** una cuenta ni inicio de sesión.' 
    ]
    }
};

window.AppData = {
    allNames,
    minecraftVersionOptions,
    defaultMinecraftVersion,
    translations
};
