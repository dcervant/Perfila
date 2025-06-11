/* Ejecuta la lógica principal de la aplicación una vez que el
   documento HTML está completamente cargado y parseado.*/
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Cargado. Inicializando Visualizador FHIR...");

    /* Bloque: Referencias a Elementos del DOM
       Descripción: Obtiene y almacena referencias a los elementos HTML clave
       (botones, paneles, modales, áreas de visualización) necesarios para
       la manipulación de la interfaz de usuario.*/
    // --- Referencias a Elementos del DOM ---
    // ... (constantes como networkContainer, loadingMessage, fileInput, etc.) ...
    const networkContainer = document.getElementById('network-container');
    const loadingMessage = document.getElementById('loading-message');
    const fileInput = document.getElementById('file-input');
    const loadFileButton = document.getElementById('load-file-button');
    const fileNameDisplay = document.getElementById('file-name');
    const openPasteModalButton = document.getElementById('open-paste-modal-button');
    const openFilterModalButton = document.getElementById('open-filter-modal-button');
    const helpButton = document.getElementById('help-button');

    // Paneles
    const controlPanel = document.getElementById('control-panel');
    const controlPanelTrigger = document.getElementById('control-panel-trigger');
    const closeControlPanelButton = document.getElementById('close-control-panel');
    const detailsPanel = document.getElementById('details-panel');
    const closeDetailsPanelButton = document.getElementById('close-details-panel');

    // Controles del Panel Izquierdo
    const toggleNames = document.getElementById('toggle-names');
    const toggleIds = document.getElementById('toggle-ids');
    const toggleDates = document.getElementById('toggle-dates');
    const toggleEdgeLabels = document.getElementById('toggle-edge-labels');
    const toggleTooltipConnections = document.getElementById('toggle-tooltip-connections');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-value');
    const focusResourceSelect = document.getElementById('focus-resource-select');
    const clearFocusButton = document.getElementById('clear-focus-button');
    const toggleAdjustOnDrag = document.getElementById('toggle-adjust-on-drag');

    // Panel de Detalles Derecho
    const detailsType = document.getElementById('details-type');
    const detailsId = document.getElementById('details-id');
    const detailsName = document.getElementById('details-name');
    const detailsDate = document.getElementById('details-date');
    const detailsJsonContainer = document.getElementById('details-json-container');
    const detailsJsonContent = document.getElementById('details-json-content')
    const copyJsonButton = document.getElementById('copy-json-button');

    // Modales
    const helpModal = document.getElementById('help-modal');
    const pasteJsonModal = document.getElementById('paste-json-modal');
    const filterModal = document.getElementById('filter-modal');
    const pasteJsonTextarea = document.getElementById('paste-json-textarea');
    const pasteJsonError = document.getElementById('paste-json-error');
    const drawPastedJsonButton = document.getElementById('draw-pasted-json');
    const clearPasteJsonButton = document.getElementById('clear-paste-json');
    const filterCheckboxesContainer = document.getElementById('filter-checkboxes');
    const filterSelectAllButton = document.getElementById('filter-select-all');
    const filterSelectNoneButton = document.getElementById('filter-select-none');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    // Referencia al botón redibujar
    const redrawButton = document.getElementById('redraw-button');

    const predefinedColorMap = {
        'Patient': '#93FF1A', // Verde claro
        'Encounter': '#4cc078', // Verde claro
        'List': '#ff8080', // Rojo claro
        'Observation': '#FFFFCC', // Amarillo claro
        'ValueSet': '#FFFFCC', // Amarillo claro
        'Practitioner': '#FFBB99', // Durazno
        'MedicationStatement': '#ffb3ff', // Rosa claro
        'MedicationRequest': '#ffb3ff', // Rosa claro
        'CarePlan': '#FF9900', // Naranja
        'Sequence': '#FF9900', // Naranja
        'CareTeam': '#ffe6ff', // Lila claro
        'Condition': '#ff00cc', // Magenta
        'LogicalModel': '#ff8080', // Rojo claro
        'ServiceRequest': '#ff8080', // Rojo claro
        'Composition': '#ff8080', // Rojo claro
        'Organization': '#FF9900', // Naranja
        'PractitionerRole': '#7ea166', // Amarillo claro
        'Location': '#93b322', // Verde claro
        'Coverage': '#f15757', // Rojo claro
        'HealthcareService': '#6ebad8', // Amarillo claro
        'MedicationDispense': '#b4678b', // Amarillo claro
        'Medication': '#d17ae7', // Morado claro
        'Measure': '#FF9900', // Naranja
        'Task': '#52d0b1', // Turquesa claro
        'Immunization': '#aeb76c', // Verde oliva
        'DiagnosticReport': '#ff8080', // Rojo claro
        'Specimen': '#cc9900', // Ocre
        'Account': '#B0E0E6', // Azul pálido
        'Appointment': '#ADD8E6', // Azul claro
        'Person': '#9696f7', //'#E6E6FA', // Lavanda
        'RelatedPerson': '#E6E6FA', // Lavanda
        'RequestGroup': '#DAE8FC', // Azul grisáceo
        'AllergyIntolerance': '#8e5615', // Marrón claro
        'ExplanationOfBenefit': '#d86d42' // Naranja claro
    };
    
    const defaultNodeColor = '#D3D3D3'; // Gris claro como color por defecto

    /* Bloque: Estado de la Aplicación
       Descripción: Inicializa variables que mantendrán el estado actual de
       la aplicación, como la instancia de la red Vis.js, los datasets de
       nodos y aristas, el Bundle FHIR cargado, mapeos de ID, etc.*/
    // --- Estado de la Aplicación ---
    // ... (variables let como network, allNodes, allEdges, etc.) ...
    let network = null;
    let allNodes = new vis.DataSet();
    let allEdges = new vis.DataSet();
    let currentBundle = null;
    let fhirIdToVisId = {}; // Mapeo de IDs FHIR (fullUrl, ResourceType/id) a IDs de nodos Vis.js
    let resourceTypesInBundle = new Set();
    let currentFocusNodeId = null; // ID del nodo Vis.js actualmente enfocado
    let colorMap = {}; // Mapa de resourceType a color

    // --- Configuración Inicial Vis.js ---
    const visOptions = {
        // *******************************************************************
        // ** Control del Grafo: Opciones Principales de Vis.js Network **
        // *******************************************************************
        nodes: {
            shape: 'box', // Nodos rectangulares
            margin: 10,
            font: {
                size: 14, // Tamaño inicial de fuente (se actualizará con el slider)
                face: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                multi: 'html', // Permite usar HTML básico (como <b>) en etiquetas si es necesario
                align: 'left'
            },
            borderWidth: 1,
            shadow: true,
            // El color se asignará dinámicamente por resourceType
        },
        edges: {
            arrows: {
                to: { enabled: true, scaleFactor: 0.7 } // Flechas en las aristas
            },
            color: {
                color: '#848484', // Color por defecto
                // highlight: '#ff0000', // Color al seleccionar/hover
                hover: '#d3d3d3'
            },
            font: {
                size: 12, // Tamaño inicial etiquetas de arista
                align: 'horizontal', // Etiqueta horizontal
                strokeWidth: 2, // Contorno blanco para legibilidad
                strokeColor: '#ffffff'
            },
            smooth: {
                enabled: true, // Líneas curvas
                // type: "cubicBezier", // Tipo de curva
                type: "dynamic", // Tipo de curva
                // type: "continuous", // Tipo de curva
                // type: "discrete", // Tipo de curva
                // type: "cubicBezier", // Tipo de curva
                // type: "straightCross", // Tipo de curva
                // type: "arc", // Tipo de curva
                // type: "curvedCW", // Tipo de curva
                // forceDirection: 'horizontal',
                roundness: 0.9
            },
            width: 1, // Grosor línea
            selectionWidth: 2.5, // Puedes ajustar este valor (p.ej., 2, 2.5, 3)
            hoverWidth: 1.5,
        },
        physics: {
            enabled: true, // Habilitar físicas inicialmente
             forceAtlas2Based: { // Algoritmo de layout
                gravitationalConstant: -30,
                centralGravity: 0.005,
                springLength: 100,
                springConstant: 0.18,
                avoidOverlap: 0.5 // Evitar solapamiento
             },
            // solver: 'forceAtlas2Based', // Otro buen algoritmo
            solver: 'barnesHut', // O barnesHut, experimentar cuál funciona mejor
            barnesHut: {
                gravitationalConstant: -1500,
                centralGravity: 0.3,
                springLength: 95,
                springConstant: 0.04,
                damping: 0.09,
                avoidOverlap: 0.1
            },
            stabilization: { // Estabilización inicial
                enabled: true,
                iterations: 1000, // Número de iteraciones para estabilizar
                updateInterval: 50,
                onlyDynamicEdges: false,
                fit: true
            }
        },
        interaction: {
            hover: true, // Habilitar hover en nodos/aristas
            tooltipDelay: 200, // Retraso antes de mostrar tooltip
            navigationButtons: true, // Mostrar botones de zoom/navegación
            keyboard: true, // Permitir navegación por teclado
            selectConnectedEdges: true, // No seleccionar aristas al hacer clic en nodo
            dragNodes: true, // Permitir arrastrar nodos
            zoomView: true,
            dragView: true
        },
        layout: {
            // hierarchical: { // Alternativa de layout jerárquico
            //     enabled: false,
            //     direction: 'LR', // Left-to-Right
            //     sortMethod: 'directed'
            // }
        }
        // *******************************************************************
        // ** Fin Control del Grafo: Opciones Principales de Vis.js Network **
        // *******************************************************************
    };

    // Nueva función para redibujar
    // function redrawGraphLayout() {
    //     if (!network) {
    //         console.log("[Redraw] No hay red para redibujar."); // Log si no hay red
    //     return;
    //     }
    //     console.log("[Redraw] Botón presionado. Estado actual de físicas:", network.physics.options.enabled); // Log inicial
    //     console.log("Redibujando layout del grafo...");
    //     try {
    //         // Importante: Asegurarse de habilitar dentro del objeto physics
    //         network.setOptions({ physics: { enabled: true } });
    //         console.log("[Redraw] Físicas habilitadas. Nuevo estado:", network.physics.options.enabled); // Confirmar cambio
    //     } catch (e) {
    //         console.error("[Redraw] Error al habilitar físicas:", e);
    //         return;
    //     }
    //     // Reactivar físicas temporalmente para reorganizar
    //     // network.setOptions({ physics: true });// Puedes descomentar si quieres que también se centre
    //     // Desactivar físicas después de un breve periodo de estabilización
    //     // (ajusta el tiempo según sea necesario)
    //     console.log("[Redraw] Configurando desactivación de físicas post-estabilización...");
    //     network.once('stabilizationIterationsDone', () => {
    //         console.log("[Redraw] >> Estabilización completada (evento). Desactivando físicas.");
    //         if (network) { // Verificar que network aún exista
    //              network.setOptions({ physics: { enabled: false } });
    //         } else {
    //              console.warn("[Redraw] La red fue destruida antes de desactivar físicas (evento).");
    //         }
    //     });
    //     // network.once('stabilizationIterationsDone', () => {
    //     //     console.log("Redibujo/Estabilización completado. Desactivando físicas.");
    //     //     network.setOptions({ physics: false });
    //     // });
    //     const redrawTimeout = 3000; // 3 segundos, ajusta si es necesario
    //     console.log(`[Redraw] Configurando timeout de ${redrawTimeout}ms para desactivar físicas.`);
    //     // Forzar parada si tarda mucho (opcional)
    //     setTimeout(() => {
    //         // Verificar que network exista Y que las físicas sigan activas antes de desactivar
    //         if (network && network.physics.options.enabled) {
    //             console.warn(`[Redraw] >> Desactivando físicas por timeout (${redrawTimeout}ms).`);
    //             network.setOptions({ physics: { enabled: false } });
    //         } else if (network) {
    //              console.log("[Redraw] Timeout: Físicas ya estaban desactivadas.");
    //         } else {
    //              console.warn("[Redraw] Timeout: La red fue destruida antes del timeout.");
    //         }
    //     }, redrawTimeout);
    //     // setTimeout(() => {
    //     //     if (network && network.physics.options.enabled) {
    //     //         console.log("Desactivando físicas por tiempo (timeout de redibujo).");
    //     //         network.setOptions({ physics: false });
    //     //     }
    //     // }, 3000); // Detener después de 3 segundos max
    //     // // Opcionalmente, ajustar la vista
    //     // network.fit();
    // }

    /**
    * Reactiva las físicas de Vis.js para reorganizar el layout del grafo,
    * cambiando temporalmente el suavizado de aristas a 'continuous' y
    * luego restaurándolo junto con la desactivación de físicas.
    */

    function redrawGraphLayout() {
        if (!network) {
            console.log("[Redraw] No hay red para redibujar.");
            return;
        }
        console.log("[Redraw] Botón presionado.");

        // Guardar el tipo de smooth por defecto (el que está en visOptions)
        const defaultSmoothType = visOptions.edges.smooth?.type || 'dynamic'; // Tipo original/por defecto
        const temporarySmoothType = 'continuous'; // Tipo temporal
        const revertDelay = 10; // 1 segundo

        // 1. Cambiar a 'continuous'
        try {
            console.log(`[Smooth Toggle] Cambiando smooth.type a: ${temporarySmoothType}`);
            network.setOptions({physics: { enabled: false }, // Asegurarse de que las físicas estén habilitadas
                edges: {
                    smooth: { 
                        roundness: 0.1, // Ajustar el radio de suavizado si es necesario
                        type: temporarySmoothType }
                }
            });
        } catch (e) {
            console.error("[Smooth Toggle] Error al cambiar a smooth 'continuous':", e);
            return; // Salir si hay error
        }

        // 2. Programar la restauración al tipo por defecto después del retraso
        console.log(`[Smooth Toggle] Programando restauración a smooth '${defaultSmoothType}' en ${revertDelay}ms.`);
        setTimeout(() => {
            // Verificar que la red aún exista antes de intentar restaurar
            if (!network) {
                console.warn("[Smooth Toggle] La red fue destruida antes de restaurar smooth.type.");
                return;
            }
            try {
                console.log(`[Smooth Toggle] Restaurando smooth.type a: ${defaultSmoothType}`);
                network.setOptions({
                    edges: { smooth: { type: defaultSmoothType } }
                });
                // *** AÑADIR activación breve de físicas ***
                console.log("[Smooth Restore] Activando físicas brevemente para separar aristas...");
                network.setOptions({ physics: { enabled: true } });
                // Desactivar muy rápido (ej. 500ms o unas pocas iteraciones)
                network.stabilize(50); // Intentar estabilizar por 50 iteraciones
                setTimeout(() => {
                     if(network) network.setOptions({ physics: { enabled: false } });
                     console.log("[Smooth Restore] Físicas desactivadas después de breve activación.");
                }, 500); // Desactivar después de 500ms
                // *****************************************
            } catch (e) { /* ... */ }
        }, revertDelay);


        // 4. Ajustar la vista (opcional)
        // network.fit();
    }

    // function redrawGraphLayout() {
    //     if (!network) {
    //         console.log("[Redraw] No hay red para redibujar.");
    //         return;
    //     }
    //     console.log("[Redraw] Botón presionado.");

    //     // Guardar el tipo de smooth por defecto (el que está en visOptions)
    //     const defaultSmoothType = visOptions.edges.smooth?.type || 'dynamic'; // Tipo original/por defecto
    //     const temporarySmoothType = 'continuous'; // Tipo temporal
    //     const revertDelay = 10; // 1 segundo

    //     // 1. Cambiar a 'continuous'
    //     try {
    //         console.log(`[Smooth Toggle] Cambiando smooth.type a: ${temporarySmoothType}`);
    //         network.setOptions({physics: { enabled: false }, // Asegurarse de que las físicas estén habilitadas
    //             edges: {
    //                 smooth: { 
    //                     roundness: 0.1, // Ajustar el radio de suavizado si es necesario
    //                     type: temporarySmoothType }
    //             }
    //         });
    //     } catch (e) {
    //         console.error("[Smooth Toggle] Error al cambiar a smooth 'continuous':", e);
    //         return; // Salir si hay error
    //     }

    //     // 2. Programar la restauración al tipo por defecto después del retraso
    //     console.log(`[Smooth Toggle] Programando restauración a smooth '${defaultSmoothType}' en ${revertDelay}ms.`);
    //     setTimeout(() => {
    //         // Verificar que la red aún exista antes de intentar restaurar
    //         if (!network) {
    //             console.warn("[Smooth Toggle] La red fue destruida antes de restaurar smooth.type.");
    //             return;
    //         }
    //         try {
    //             console.log(`[Smooth Toggle] Restaurando smooth.type a: ${defaultSmoothType}`);
    //             network.setOptions({physics: { enabled: false }, // Asegurarse de que las físicas estén habilitadas
    //                 edges: {
    //                     smooth: {
    //                         roundness: 0.9, // Ajustar el radio de suavizado si es necesario
    //                         type: defaultSmoothType } // Restaurar tipo original
    //                 }
    //             });
    //         } catch (e) {
    //             console.error("[Smooth Toggle] Error al restaurar smooth type:", e);
    //         }
    //     }, revertDelay);


    //     // 4. Ajustar la vista (opcional)
    //     // network.fit();
    // }
    // function redrawGraphLayout() {
    //     if (!network) {
    //         console.log("[Redraw] No hay red para redibujar.");
    //         return;
    //     }
    //     console.log("[Redraw] Botón presionado.");

    //     // Guardar el tipo de smooth por defecto (el que está en visOptions)
    //     const defaultSmoothType = visOptions.edges.smooth?.type || 'dynamic'; // Usa 'dynamic' como fallback
    //     const redrawSmoothType = 'continuous';

    //     // No hacer nada si las físicas ya están activas (evitar llamadas múltiples)
    //     if (network.physics.options.enabled) {
    //         console.log("[Redraw] Físicas ya activas, no se hace nada.");
    //         return;
    //     }

    //     console.log(`[Redraw] Tipo smooth por defecto: ${defaultSmoothType}. Cambiando temporalmente a: ${redrawSmoothType}`);

    //     // 1. Activar físicas Y cambiar a smooth 'continuous' en una sola llamada
    //     try {
    //         network.setOptions({
    //             physics: { enabled: false },
    //             edges: {
    //                 smooth: { type: redrawSmoothType } // Cambiar a 'continuous'
    //             }
    //         });
    //         console.log(`[Redraw] Físicas habilitadas y smooth cambiado a ${redrawSmoothType}.`);
    //     } catch (e) {
    //         console.error("[Redraw] Error al habilitar físicas o cambiar smooth:", e);
    //         return;
    //     }

    //     // Función reutilizable para restaurar el estado original
    //     const restoreOriginalState = (reason) => {
    //         // Solo restaurar si la red todavía existe
    //         if (!network) {
    //                 console.warn(`[Redraw Callback - ${reason}] La red fue destruida antes de restaurar estado.`);
    //                 return;
    //         }
    //         // Solo restaurar si las físicas están activas (para evitar restaurar dos veces)
    //         if (network.physics.options.disabled) {
    //                 console.log(`[Redraw Callback - ${reason}] Restaurando estado: Físicas off, Smooth: ${defaultSmoothType}`);
    //                 network.setOptions({
    //                     physics: { enabled: false },
    //                     edges: {
    //                         smooth: { type: defaultSmoothType } // Restaurar tipo original
    //                     }
    //                 });
    //         } else {
    //                 console.log(`[Redraw Callback - ${reason}] Físicas ya estaban desactivadas, no se restaura de nuevo.`);
    //         }
    //     };

    //     // 2. Configurar la restauración después de estabilizar
    //     console.log("[Redraw] Configurando restauración post-estabilización...");
    //     // Usar un ID único para el listener por si acaso
    //     const stabilizationListenerId = `redrawStabilized_${Date.now()}`;
    //     network.once(stabilizationListenerId, () => {
    //         console.log("[Redraw] >> Estabilización completada (evento).");
    //         restoreOriginalState('Stabilization');
    //         // Limpiar el timeout de seguridad si la estabilización ocurrió primero
    //         clearTimeout(fallbackTimeoutId);
    //     });
    //     // Renombrar el evento para que coincida con el ID usado
    //     network.off(stabilizationListenerId); // Limpiar listener anterior si existiera
    //     network.on(stabilizationListenerId, () => { // Registrar con nuevo ID
    //         console.log("[Redraw] >> Estabilización completada (evento).");
    //         restoreOriginalState('Stabilization');
    //         clearTimeout(fallbackTimeoutId); // Limpiar el timeout
    //     });


    //     // 3. Configurar un timeout de seguridad para restaurar
    //     const redrawTimeout = 3000; // 3 segundos
    //     console.log(`[Redraw] Configurando timeout de ${redrawTimeout}ms para restaurar estado.`);
    //     const fallbackTimeoutId = setTimeout(() => {
    //         console.warn(`[Redraw] >> Timeout (${redrawTimeout}ms) alcanzado.`);
    //         restoreOriginalState('Timeout');
    //             // Asegurarse de quitar el listener 'once' si el timeout se dispara primero
    //             network.off(stabilizationListenerId);
    //     }, redrawTimeout);


    //     // 4. Ajustar la vista (opcional)
    //     network.fit();
    // }

    // Event listener para el botón redibujar
    // if(redrawButton) {
    //     redrawButton.addEventListener('click', redrawGraphLayout);
    // }

    if(redrawButton) {
        console.log("[Setup] Añadiendo listener al botón Redibujar."); // Log para confirmar que se añade
        redrawButton.addEventListener('click', redrawGraphLayout);
    } else {
        console.warn("[Setup] No se encontró el botón con ID 'redraw-button'. La función de redibujo no estará disponible."); // Advertencia si no se encuentra
    }


    // --- Funciones Auxiliares ---

    /* Genera un color hexadecimal simple basado en un string 
     * Usado para asignar colores a nodos según su resourceType.*/
    function stringToColor(str) {
        // if (!str) return '#808080'; // Gris por defecto si no hay string
        if (!str) return defaultNodeColor; // Gris por defecto si no hay string

        if (predefinedColorMap[str]) {
            console.log(`[stringToColor] Usando color predefinido para ${str}: ${predefinedColorMap[str]}`);
            return predefinedColorMap[str];
        }

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Convert to 32bit integer
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            // Asegurarse de que el color no sea demasiado claro (difícil de leer en fondo blanco)
            const adjustedValue = Math.max(30, Math.min(200, value)); // Rango ajustado
            color += ('00' + adjustedValue.toString(16)).substr(-2);
        }
        return color;
    }

     /** Obtiene un nombre legible del recurso FHIR */
     function getResourceName(resource) {
        if (!resource) return 'N/A';
        // Prioridad: Patient.name, Practitioner.name, Organization.name, Location.name, Device.deviceName, etc.
        // 1. Comprobar primero si 'name' es un string simple (Organization, Location, etc.)
        if (typeof resource.name === 'string' && resource.name.trim() !== '') {
            // console.log(`[getResourceName] Found string name for ${resource.resourceType}: ${resource.name}`);
            return resource.name;
        }
        // 2. Comprobación existente para HumanName (Patient, Practitioner)
        if (resource.name && Array.isArray(resource.name) && resource.name.length > 0) {
            // Usualmente es name[0].text o una combinación de given/family
            const name = resource.name[0];
            if (name.text) return name.text;
            let fullName = (Array.isArray(name.given) ? name.given.join(' ') : '');
            if (name.family) fullName += (fullName ? ' ' : '') + name.family;
            return fullName || 'Nombre no especificado';
        }

        // 3. NUEVA LÓGICA: Si es Patient, Practitioner o Person y no se encontró un nombre en el paso 2,
        //    buscar identificador de documento.
        if ((resource.resourceType === 'Patient' || resource.resourceType === 'Practitioner' || resource.resourceType === 'Person') &&
            resource.identifier && Array.isArray(resource.identifier)) {
            for (const idEntry of resource.identifier) {
                if (idEntry.type && Array.isArray(idEntry.type.coding) && idEntry.type.coding.length > 0 &&
                    idEntry.type.coding[0].display && idEntry.value) {
                    // Se asume que el primer 'coding' dentro de 'type' es el relevante
                    // y que 'display' contiene el tipo de documento (ej: "DNI", "Pasaporte")
                    const docType = idEntry.type.coding[0].display;
                    const docValue = idEntry.value;

                    // Podrías añadir una lista de tipos de documentos que consideras "nombrables"
                    // Por ejemplo: const validDocTypesForName = ['DNI', 'RUC', 'CE', 'PASAPORTE'];
                    // if (validDocTypesForName.includes(docType.toUpperCase())) {
                    //    return `${docType}: ${docValue}`;
                    // }
                    // Por ahora, tomaremos cualquier tipo de documento encontrado.
                    console.log(`[getResourceName] Usando identifier para ${resource.resourceType} ${resource.id}: ${docType} ${docValue}`);
                    return `${docType}: ${docValue}`; // Formato: "DNI: 22270892"
                }
            }
        }

        if (resource.resourceType === 'Encounter') {
            // Verificar si existe el array 'identifier', si no está vacío,
            // si el primer elemento existe y si tiene una propiedad 'value'.
            if (resource.identifier && Array.isArray(resource.identifier) && resource.identifier.length > 0 && resource.identifier[0] && resource.identifier[0].value) {
                 console.log(`[getResourceName] Usando identifier para Encounter: ${resource.identifier[0].value}`);
                 // Devolver el valor del primer identificador.
                 // Opcional: Añadir un prefijo para claridad: return `Enc #: ${resource.identifier[0].value}`;
                 return resource.identifier[0].value;
            }
        }

        if (resource.resourceType === 'Coverage') {
            // Verificar si existe el array 'identifier', si no está vacío,
            // si el primer elemento existe y si tiene una propiedad 'value'.
            if (resource.identifier && Array.isArray(resource.identifier) && resource.identifier.length > 0 && resource.identifier[0] && resource.identifier[0].value) {
                 console.log(`[getResourceName] Usando identifier para Coverage: ${resource.identifier[0].value}`);
                 // Devolver el valor del primer identificador.
                 // Opcional: Añadir un prefijo para claridad: return `Enc #: ${resource.identifier[0].value}`;
                 return resource.identifier[0].value;
            }
        }

        if (resource.resourceType === 'Observation') {
            // Usar optional chaining (?.) para acceder de forma segura
            const profileUrl = resource.meta?.profile?.[0];
            if (typeof profileUrl === 'string' && profileUrl.includes('/')) { // Verificar que sea string y parezca URL/path
                try {
                    // Obtener la parte después del último '/'
                    const baseName = profileUrl.substring(profileUrl.lastIndexOf('/') + 1);
                    // Quitar la versión si existe (después de '|')
                    const profileName = baseName.split('|')[0];
                    if (profileName) { // Asegurarse de que no quede vacío
                        console.log(`[getResourceName] Usando profile name para Observation: ${profileName}`);
                        return profileName; // Devolver el nombre del perfil extraído
                    }
                } catch (e) {
                     // Loguear error si la extracción falla por alguna razón
                     console.warn(`Error extrayendo nombre de perfil para Observation ${resource.id}:`, e);
                }
            }
            // Si no se pudo obtener del profile, intentar con code.text como fallback (ver abajo)
        }

        // 3. Comprobaciones para otros campos comunes (Device, etc.)
        if (resource.deviceName && Array.isArray(resource.deviceName) && resource.deviceName.length > 0) {
            return resource.deviceName[0].name || 'Nombre Dispositivo no especificado';
        }
        if (resource.code && resource.code.text) { // Para Observation, Condition, etc.
            return resource.code.text;
        }
         if (resource.description) { // Para Location, etc.
            return resource.description;
        }
        return 'Nombre no disponible';
    }

     /** Obtiene una fecha relevante del recurso FHIR */
     function getResourceDate(resource) {
         if (!resource) return 'N/A';
         // Prioridad: meta.lastUpdated, effectiveDateTime, effectivePeriod.start, recordedDate, etc.
         if (resource.meta && resource.meta.lastUpdated) {
            //  return new Date(resource.meta.lastUpdated).toLocaleString();
             return resource.meta.lastUpdated; // Formato ISO completo
         }
         if (resource.effectiveDateTime) {
            //  return new Date(resource.effectiveDateTime).toLocaleString();
            return resource.effectiveDateTime; // dateTime
         }
         if (resource.effectivePeriod && resource.effectivePeriod.start) {
            //  return new Date(resource.effectivePeriod.start).toLocaleString();
            return resource.effectivePeriod.start; // dateTime
         }
         if (resource.birthDate) { // Añadido para Person/Patient
            return resource.birthDate; // Formato YYYY-MM-DD o YYYY-MM o YYYY
        }
        if (resource.recordedDate) { // Encounter
            // return new Date(resource.recordedDate).toLocaleString();
            return resource.recordedDate;
        }
        if (resource.date) { // DiagnosticReport, etc.
        //  return new Date(resource.date).toLocaleString();
            return resource.date;
        }
        if (resource.authoredOn) { // MedicationRequest, etc.
            // return new Date(resource.authoredOn).toLocaleString();
            return resource.authoredOn;
         }
         return 'Fecha no disponible';
     }

    /** Construye la etiqueta del nodo basada en los toggles */
    function buildNodeLabel(resource) {
        if (!resource) return '';
        const type = resource.resourceType || 'Desconocido';
        let label = `<b>${type}</b>`;

        if (toggleNames.checked) {
            const name = getResourceName(resource);
            if (name && name !== 'N/A' && name !== 'Nombre no disponible' && name !== 'Nombre no especificado') {
                label += `\n${name.substring(0, 30)}${name.length > 30 ? '...' : ''}`;
            }
        }
        if (toggleIds.checked && resource.id) {
            // *** Aumentar longitud del ID ***
            const maxIdLength = 25; // Ajusta este valor si necesitas más o menos
            label += `\nID: ${resource.id.substring(0, maxIdLength)}${resource.id.length > maxIdLength ? '...' : ''}`;
        }
        if (toggleDates.checked) {
            const rawDateStr = getResourceDate(resource); // Obtener la cadena de fecha raw
            let displayDate = ''; // Inicializar fecha a mostrar vacía

            if (rawDateStr) { // Solo intentar si obtuvimos una cadena
                try {
                    // Intentar parsear la fecha. new Date() maneja ISO y YYYY-MM-DD.
                    const dateObj = new Date(rawDateStr);
                    // Verificar si el objeto Date es válido antes de formatear
                    if (!isNaN(dateObj.getTime())) {
                        displayDate = dateObj.toLocaleDateString(); // Formatear a local
                        // Doble check por si toLocaleDateString devuelve "Invalid Date" en algún navegador/caso raro
                        if (displayDate === "Invalid Date") {
                            displayDate = ''; // No mostrar si sigue siendo inválido
                        }
                    }
                } catch (e) {
                    console.warn(`Error parsing date string "${rawDateStr}" for ${resource.resourceType}/${resource.id}:`, e);
                    displayDate = ''; // No mostrar si hay error
                }
            }

            // Solo añadir la línea si tenemos una fecha válida para mostrar
            if (displayDate) {
                label += `\n${displayDate}`;
            }
        }
        return label;
    }

    /** Construye el contenido del tooltip del nodo */
    function buildNodeTooltip(nodeId) {
        const nodeData = allNodes.get(nodeId);
        if (!nodeData || !nodeData.fhirResource) return 'Información no disponible';

        const resource = nodeData.fhirResource;
        const type = resource.resourceType || 'Desconocido';
        const name = getResourceName(resource);
        const date = getResourceDate(resource);
        const id = resource.id || 'Sin ID';

        let tooltip = `${type}/${id}`; // Sin <b>
        if (name !== 'N/A' && name !== 'Nombre no disponible' && name !== 'Nombre no especificado') tooltip += `\nNombre: ${name}`; // \n en lugar de <br>

        // let tooltip = `<b>${type}</b>/${id}`;
        // if (name !== 'N/A' && name !== 'Nombre no disponible' && name !== 'Nombre no especificado') tooltip += `<br/>Nombre: ${name}`;
        if (date !== 'N/A' && date !== 'Fecha no disponible') tooltip += `<br/>Fecha: ${date}`;

        // Añadir conexiones si el toggle está activo
        if (toggleTooltipConnections.checked && network) {
             tooltip += "<hr style='margin: 3px 0; border-top: 1px solid #ccc;'>Conexiones:";
             const connectedEdges = network.getConnectedEdges(nodeId);
             let connectionsHtml = "<ul>";
             let connectionCount = 0;

             connectedEdges.forEach(edgeId => {
                 const edge = allEdges.get(edgeId);
                 if (!edge) return;

                 let neighborNodeId = null;
                 let directionArrow = '';
                 let className = '';

                 if (edge.from === nodeId) { // Referencia saliente (Este nodo -> Otro)
                     neighborNodeId = edge.to;
                     directionArrow = ' -> ';
                     className = 'tooltip-ref-out'; // Verde
                 } else if (edge.to === nodeId) { // Referencia entrante (Otro nodo -> Este nodo)
                     neighborNodeId = edge.from;
                     directionArrow = ' <- ';
                     className = 'tooltip-ref-in'; // Azul
                 }

                 if (neighborNodeId) {
                     const neighborNode = allNodes.get(neighborNodeId);
                     if (neighborNode && neighborNode.fhirResource) {
                        const neighborType = neighborNode.fhirResource.resourceType || 'Desconocido';
                        const neighborId = neighborNode.fhirResource.id || '?';
                        const edgeLabel = edge.label ? ` (${edge.label})` : ''; // Añadir etiqueta de arista si existe
                        connectionsHtml += `<li class="${className}">${directionArrow}${neighborType}/${neighborId}${edgeLabel}</li>`;
                        connectionCount++;
                     }
                 }
             });

             if (connectionCount === 0) {
                 connectionsHtml += "<li>(Ninguna en el grafo)</li>";
             }
             connectionsHtml += "</ul>";
             tooltip += connectionsHtml;
        }

        return tooltip;
    }

    /**
     * Escapa caracteres HTML especiales en una cadena para mostrarla de forma segura como texto dentro de HTML.
     * @param {string} unsafe La cadena potencialmente insegura.
     * @returns {string} La cadena escapada.
     */
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&") // Reemplazar & primero
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "\\\"")
            .replace(/'/g, "'"); // ' es más compatible que '
    }

    /**
    * Construye un elemento DOM que representa el tooltip para un nodo.
    * @param {string | number} internalNodeId - ID interno del nodo en vis.js.
    * @returns {HTMLElement} - Un elemento DIV que contiene el tooltip formateado.
    */
    function buildNodeTitle(internalNodeId) {
        const nodeData = allNodes.get(internalNodeId); // Obtener datos del nodo usando el ID
        if (!nodeData || !nodeData.fhirResource) {
            const errorElement = document.createElement('span');
            errorElement.textContent = 'Información no disponible';
            return errorElement; // Devolver un elemento simple incluso en error
        }

        const resource = nodeData.fhirResource;
        const resourceType = resource.resourceType || 'Desconocido';
        const resourceId = resource.id || 'Sin ID';
        const rawDateStr = getResourceDate(resource); // Obtener la cadena de fecha raw
        const resourceName = getResourceName(resource);
        let resourceDate = ''; // Fecha formateada para mostrar

        if (rawDateStr && rawDateStr !== 'N/A' && rawDateStr !== 'Fecha no disponible') {
            try {
                const dateObj = new Date(rawDateStr);
                if (!isNaN(dateObj.getTime())) {
                    resourceDate = dateObj.toLocaleString(); // Usar formato completo para tooltip
                } else {
                    resourceDate = rawDateStr; // Mostrar raw si no se pudo parsear
                }
            } catch(e){
                resourceDate = rawDateStr; // Mostrar raw si hubo error
                console.warn(`Could not format date "${rawDateStr}" for tooltip.`);
            }
        }

        // --- Crear elemento contenedor para el tooltip ---
        const tooltipElement = document.createElement('div');
        // Aplicar estilos base directamente (alternativa a CSS externo para el tooltip)
        tooltipElement.style.fontFamily = 'var(--font-family, sans-serif)';
        tooltipElement.style.fontSize = '13px'; // Coincidir con CSS anterior
        tooltipElement.style.whiteSpace = 'pre-line'; // Respetar saltos de línea
        tooltipElement.style.textAlign = 'left';
        tooltipElement.style.color = '#fff'; // Color de texto blanco (asumiendo fondo oscuro)
        tooltipElement.style.padding = '5px'; // Añadir un poco de padding

        // Construir el contenido HTML seguro
        let tooltipHTML = `<b>Tipo:</b> ${escapeHtml(resourceType)}<br><b>ID:</b> ${escapeHtml(resourceId)}`;
        if (resourceName && resourceName !== 'N/A' && resourceName !== 'Nombre no disponible' && resourceName !== 'Nombre no especificado') {
            tooltipHTML += `<br><b>Nombre:</b> ${escapeHtml(resourceName)}`; // Añadir línea de Nombre
        }
        if (resourceDate) {
            tooltipHTML += `<br><b>Fecha:</b> ${escapeHtml(resourceDate)}`;
        }


        // --- NUEVA LÓGICA: Añadir todos los identificadores para Patient, Practitioner, Person ---
        if ((resourceType === 'Patient' || resourceType === 'Practitioner' || resourceType === 'Person' || resourceType === 'Organization') &&
        resource.identifier && Array.isArray(resource.identifier) && resource.identifier.length > 0) {
        
        let identifiersHTML = "<br><br><b>--- Identificadores ---</b>";
        let foundIdentifiers = false;
        resource.identifier.forEach(idEntry => {
            if (idEntry.type && Array.isArray(idEntry.type.coding) && idEntry.type.coding.length > 0 &&
                idEntry.type.coding[0].display && idEntry.value) {
                
                const docType = escapeHtml(idEntry.type.coding[0].display);
                const docValue = escapeHtml(idEntry.value);
                // Opcional: Mostrar el 'system' si es útil
                // const docSystem = idEntry.system ? ` (${escapeHtml(idEntry.system)})` : '';
                // identifiersHTML += `<br>${docType}${docSystem}: ${docValue}`;
                identifiersHTML += `<br>${docType}: ${docValue}`;
                foundIdentifiers = true;
            } else if (idEntry.value) { // Fallback si no tiene type.coding.display pero sí un value
                const docValue = escapeHtml(idEntry.value);
                const docSystem = idEntry.system ? escapeHtml(idEntry.system) : 'Desconocido';
                // Podrías intentar obtener un tipo de 'idEntry.type.text' si existe
                const docType = idEntry.type && idEntry.type.text ? escapeHtml(idEntry.type.text) : 'Otro ID';
                identifiersHTML += `<br>${docType} (${docSystem}): ${docValue}`;
                foundIdentifiers = true;
            }
        });

        if (foundIdentifiers) {
            tooltipHTML += identifiersHTML;
        }
    }
    // --- FIN NUEVA LÓGICA ---

        // --- Añadir Información de Conexiones (adaptado de tu ejemplo) ---
        if (toggleTooltipConnections.checked && network) { // Usar el toggle global
            tooltipHTML += `<br><br><b>--- Conexiones ---</b>`;

            const outgoingColor = '#90ee90'; // Verde desde CSS
            const incomingColor = '#add8e6'; // Azul desde CSS
            const outgoingRefs = new Set();
            const incomingRefs = new Set();
            const connectedEdges = network.getConnectedEdges(internalNodeId);

            connectedEdges.forEach(edgeId => {
                const edge = allEdges.get(edgeId); // Obtener de nuestro DataSet
                if (!edge) return;
                let targetNodeId = null;
                let prefix = '';
                let color = 'inherit';
                let isOutgoing = false;

                if (edge.from === internalNodeId) {
                    targetNodeId = edge.to; prefix = '→ '; color = outgoingColor; isOutgoing = true;
                } else if (edge.to === internalNodeId) {
                    targetNodeId = edge.from; prefix = '← '; color = incomingColor; isOutgoing = false;
                }

                if (targetNodeId !== null) {
                    const targetNodeData = allNodes.get(targetNodeId); // Obtener datos del nodo vecino
                    if (targetNodeData && targetNodeData.fhirResource) {
                        const targetResource = targetNodeData.fhirResource;
                        const targetType = targetResource.resourceType || 'Desconocido';
                        const targetId = targetResource.id || '?';
                        // Intentar obtener un nombre legible, si no, usar Tipo/ID
                        const targetName = getResourceName(targetResource);
                        let refText = `${targetType}/${targetId}`;
                        if (targetName && targetName !== 'N/A' && targetName !== 'Nombre no disponible' && targetName !== 'Nombre no especificado') {
                            refText = `${targetType} - ${targetName.substring(0, 25)}${targetName.length > 25 ? '...': ''}`;
                            // refText = `${targetType} - ${targetName}`; // Usar nombre si está disponible
                        }

                        const safeRefText = escapeHtml(refText); // Escapar texto descriptivo
                        // Usar la etiqueta original de la arista (ya debería ser segura si viene de findReferences)
                        const edgeLabelText = edge.originalLabel || '';
                        const safeEdgeLabel = escapeHtml(edgeLabelText); // Escapar por si acaso
                        const edgeLabelPart = safeEdgeLabel ? ` (${safeEdgeLabel})` : '';

                        const styledRefLine = `<span style="color:${color};">${prefix}${safeRefText}${edgeLabelPart}</span>`;

                        if(isOutgoing) outgoingRefs.add(styledRefLine);
                        else incomingRefs.add(styledRefLine);
                    }
                }
            });

            if (outgoingRefs.size > 0) {
                Array.from(outgoingRefs).sort().forEach(refHtml => { tooltipHTML += `<br>${refHtml}`; });
            }
            if (incomingRefs.size > 0) {
                Array.from(incomingRefs).sort().forEach(refHtml => { tooltipHTML += `<br>${refHtml}`; });
            }
            if (outgoingRefs.size === 0 && incomingRefs.size === 0) {
                tooltipHTML += "<br>(Sin conexiones directas visibles)";
            }
        }

        // tooltipHTML += `<br><br>(Haz clic para ver detalles)`; // Opcional

        // Asignar el HTML construido al elemento DOM
        tooltipElement.innerHTML = tooltipHTML;

        // Devolver el elemento DOM
        return tooltipElement;
    }



    /**
     * Limpia una ruta de objeto (path) eliminando los índices de array [].
     * Ejemplo: "identifier[0].assigner" -> "identifier.assigner"
     * @param {string} path La ruta a limpiar.
     * @returns {string} La ruta limpia.
     */
    function cleanPathLabel(path) {
        if (!path) return 'reference'; // Etiqueta por defecto si la ruta está vacía
        // Dividir por '.', limpiar cada parte, y unir de nuevo.
        return path.split('.')
                .map(segment => segment.replace(/\[\d+\]$/, '')) // Quita [0], [1], etc. al final de un segmento
                .join('.');
    }

    /**
     * Busca recursivamente campos 'reference' en un objeto y extrae la etiqueta de ruta completa.
     * La etiqueta será la ruta limpia hasta el objeto que contiene directamente el campo 'reference'.
     * @param {object|array} obj - El objeto o array a buscar.
     * @param {string} currentPath - La ruta completa (con índices) hasta 'obj'.
     * @param {array} references - Array acumulador para las referencias encontradas.
     * @returns {array} - El array de referencias encontradas con { reference: '...', label: '...' }.
     */
    function findReferences(obj, currentPath = '', references = []) {
        // Si no es un objeto o array, o es nulo, detener la recursión en esta rama.
        if (obj === null || typeof obj !== 'object') {
            return references;
        }

        // Si el objeto actual es un array, iterar sobre sus elementos
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                // Para los elementos del array, pasamos el 'item' como el nuevo objeto a buscar.
                // Ajustamos el currentPath para reflejar el índice.
                findReferences(item, `${currentPath}[${index}]`, references);
            });
        } else {
            // Si es un objeto (no array), iterar sobre sus claves
            for (const key in obj) {
                // Asegurarse de que la propiedad pertenece al objeto y no a su prototipo.
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    const newPath = currentPath ? `${currentPath}.${key}` : key; // Construir la ruta completa hasta el valor

                    // *** Lógica Clave para Encontrar la Referencia y la Etiqueta ***
                    // Estamos buscando una clave llamada 'reference' cuyo valor sea un string.
                    if (key === 'reference' && typeof value === 'string') {
                        // La etiqueta es la ruta LIMPIA hasta el OBJETO que contiene esta referencia.
                        // Esa ruta es 'currentPath' (la ruta pasada a esta llamada).
                        const label = cleanPathLabel(currentPath);

                        // Añadir la referencia encontrada al array de resultados.
                        references.push({ reference: value, label: label });
                        // console.log(`Found Ref: ${value} | Label: ${label} | Path to ref: ${newPath}`); // Para depuración

                    // Si el valor es otro objeto (o array), continuar la búsqueda recursivamente.
                    } else if (typeof value === 'object') {
                        // *** Llamada Recursiva ***
                        // El objeto/array hijo ('value') se convierte en el nuevo 'obj'.
                        // Pasamos el 'newPath' (ruta hasta el hijo) como el nuevo 'currentPath'.
                        findReferences(value, newPath, references);
                    }
                }
            }
        }
        // Devolver el array acumulado de referencias.
        return references;
    }

    /** Resuelve una referencia FHIR a un ID de nodo Vis.js */
    function resolveReference(refString) {
        if (!refString) return null;
        // Intentar mapeo directo (fullUrl, ResourceType/id, urn:uuid)
        if (fhirIdToVisId[refString]) {
            return fhirIdToVisId[refString];
        }
        // Si es una referencia relativa (e.g., "Patient/123"), ya debería estar en el mapa
        // Si es una URL absoluta, intentar extraer ResourceType/id
        try {
            const url = new URL(refString);
            const parts = url.pathname.split('/');
            if (parts.length >= 2) {
                const potentialRef = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
                 if (fhirIdToVisId[potentialRef]) {
                    return fhirIdToVisId[potentialRef];
                 }
            }
        } catch (e) {
             // No es una URL válida, podría ser URN o relativa simple
             // Ya cubierto por el chequeo directo de fhirIdToVisId
        }

        // Si no se encuentra, la referencia apunta fuera del bundle o es inválida
        // console.warn(`Referencia no resuelta en el bundle: ${refString}`);
        return null;
    }

    /** Limpia el grafo y el estado de la aplicación */
    function clearGraph() {
        console.log("Limpiando grafo...");
        if (network) {
            network.destroy();
            network = null;
        }
        allNodes.clear();
        allEdges.clear();
        fhirIdToVisId = {};
        resourceTypesInBundle.clear();
        currentBundle = null;
        currentFocusNodeId = null;
        colorMap = {};
        loadingMessage.style.display = 'block'; // Mostrar mensaje inicial
        fileNameDisplay.textContent = 'Ningún archivo cargado';
        // Limpiar paneles y controles
        resetDetailsPanel();
        resetFocusSelect();
        clearFilterCheckboxes();
        closeDetailsPanel(); // Cerrar panel por si estaba abierto
        // Restablecer sliders y toggles a sus valores por defecto si es necesario
        fontSizeSlider.value = 14;
        fontSizeValue.textContent = '14px';
        // toggleNames.checked = true;
        // toggleIds.checked = true;
        // toggleDates.checked = true;
        // toggleEdgeLabels.checked = true;
        // toggleTooltipConnections.checked = true;
    }

    /** Restablece el panel de detalles */
    function resetDetailsPanel() {
        detailsType.textContent = 'N/A';
        detailsId.textContent = 'N/A';
        detailsName.textContent = 'N/A';
        detailsDate.textContent = 'N/A';
        // detailsJson.textContent = 'Selecciona un nodo para ver detalles.';
        if (detailsJsonContent) 
            detailsJsonContent.textContent = 'Selecciona un nodo para ver detalles.';
    }

    /** Restablece el selector de enfoque */
    function resetFocusSelect() {
        focusResourceSelect.innerHTML = '<option value="">-- Seleccionar Recurso --</option>';
        focusResourceSelect.disabled = true;
        clearFocusButton.style.display = 'none'; // Ocultar botón X
    }

    /** Limpia los checkboxes de filtro */
    function clearFilterCheckboxes() {
        filterCheckboxesContainer.innerHTML = '<p>Carga un Bundle para ver los tipos de recurso.</p>';
    }

    /** Actualiza la visibilidad de los nodos según los filtros activos */
    function applyFilters() {
    console.log("Aplicando filtros...");
    const activeFilters = getActiveFilters();
    const nodesToUpdate = [];
    const isFocusActive = !!currentFocusNodeId; // Verifica si hay un nodo enfocado

    allNodes.forEach(node => {
        // Determinar si el nodo debería ser visible según los filtros de tipo
        let shouldBeVisibleBasedOnType = activeFilters.has(node.resourceType);

        // Si hay un enfoque activo, aplicar también la lógica de enfoque
        let shouldBeVisible = shouldBeVisibleBasedOnType;
        if (isFocusActive) {
            const relatedNodes = getFocusRelatedNodes(currentFocusNodeId);
            // Visible solo si cumple filtro Y está relacionado con el enfoque
            shouldBeVisible = shouldBeVisibleBasedOnType && relatedNodes.includes(node.id);
        }

        // El estado 'hidden' deseado es el INVERSO de 'shouldBeVisible'
        const desiredHiddenState = !shouldBeVisible;

        // Solo añadir a la actualización si el estado 'hidden' actual es DIFERENTE al deseado
        // Esto corrige el error anterior.
        if (node.hidden !== desiredHiddenState) {
            nodesToUpdate.push({ id: node.id, hidden: desiredHiddenState });
        }
    });

    // Si hubo cambios en la visibilidad, actualizar el dataset
    if (nodesToUpdate.length > 0) {
        console.log(`Actualizando visibilidad para ${nodesToUpdate.length} nodos.`);
        allNodes.update(nodesToUpdate);
        // Opcional: Forzar redibujo si la actualización no se refleja visualmente de inmediato
            if (network && !isFocusActive) { // Solo ajustar si no hay enfoque activo, el enfoque lo hace por su cuenta
            // network.redraw(); // Descomentar si 'update' no es suficiente
            network.fit(); // Reajustar la vista a los nodos ahora visibles
            }
    } else {
        console.log("No se requieren cambios de visibilidad por filtros.");
            // Aunque no haya cambios, si no hay enfoque, ajustar por si acaso
            if (network && !isFocusActive) {
                network.fit();
            }
    }
    console.log(`${allNodes.length - allNodes.get({ filter: node => node.hidden }).length} nodos visibles después de aplicar filtros.`);
}

    /** Obtiene los tipos de recurso actualmente seleccionados en el modal de filtros */
    function getActiveFilters() {
        const active = new Set();
        const checkboxes = filterCheckboxesContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            if (cb.checked) {
                active.add(cb.value);
            }
        });
        return active;
    }

    function updateNodeLabels() {
        if (!network) return;
        // Obtener el tamaño de fuente ACTUAL del slider
        const currentFontSize = parseInt(fontSizeSlider.value, 10);
        console.log(`Actualizando etiquetas de nodos (Toggles cambiaron) con fuente ${currentFontSize}px...`);
        const nodesToUpdate = [];
        allNodes.forEach(node => {
            if (node.fhirResource) {
																								 
                nodesToUpdate.push({
                    id: node.id,
                    // Reconstruir la etiqueta basada en los toggles
                    label: buildNodeLabel(node.fhirResource),
                    // Incluir también el tamaño de fuente actual en la actualización
                    // para asegurar consistencia si solo cambiaron los toggles.
                    font: {
                        size: currentFontSize
                    }
                });
            }
        });
        if (nodesToUpdate.length > 0) {
            console.log(`Enviando ${nodesToUpdate.length} actualizaciones de etiquetas de nodos (desde toggles)...`);
            allNodes.update(nodesToUpdate);
        }
    }

    // function updateEdgeLabels() {
    //     if (!network) return;
    //     onsole.log(`[Edge Labels] Actualizando. Mostrar: ${toggleEdgeLabels.checked}`);
    //     const showLabels = toggleEdgeLabels.checked;
    //     const edgesToUpdate = [];
    //     allEdges.forEach(edge => {
    //         const newLabel = showLabels ? (edge.originalLabel || '') : undefined; // Usar etiqueta original guardada
 
    //         // Forzamos la actualización para cada arista, independientemente de su estado anterior.
    //         // Esto asegura que Vis.js reciba la instrucción de mostrar/ocultar.
    //         edgesToUpdate.push({
    //             id: edge.id,
    //             label: newLabel,
    //             // Opcional: Podríamos intentar actualizar también la fuente para forzar redibujo,
    //             // pero usualmente cambiar la etiqueta a/desde 'undefined' debería ser suficiente.
    //             // font: { size: showLabels ? (visOptions.edges.font.size || 12) : undefined } // Ejemplo, si fuera necesario
    //         });
    //     });
 
    //     if (edgesToUpdate.length > 0) {
    //         console.log(`Enviando actualización para ${edgesToUpdate.length} etiquetas de aristas.`);
    //         allEdges.update(edgesToUpdate);
    //         console.log("Forzando redibujo de la red para actualizar visualización de etiquetas.");
    //         network.redraw(); // Forzar redibujo para aplicar cambios de etiquetas
    //     } else {
    //         console.log("No hay aristas para actualizar etiquetas.");
    //     }
    //     // Opcional: Forzar un redibujo completo si la actualización simple no funciona
    //     // if (network) {
    //     //    network.redraw();
    //     // }
    // }

    /** Actualiza la visibilidad y contenido de las etiquetas de las aristas */
    // function updateEdgeLabels() {
    //     if (!network) return;
    //     console.log(`[Edge Labels] Actualizando. Mostrar: ${toggleEdgeLabels.checked}`);
    //     const showLabels = toggleEdgeLabels.checked;
    //     const edgesToUpdate = [];
    //     const baseEdgeFontSize = Math.max(8, parseInt(fontSizeSlider.value, 10) - 2); // Obtener tamaño base

    //     allEdges.forEach(edge => {
    //         let updateData = { id: edge.id };
    //         let needsUpdate = false;

    //         if (showLabels) {
    //             // --- MOSTRAR ETIQUETA ---
    //             const expectedLabel = edge.originalLabel || '';
    //             // Actualizar si la etiqueta actual es diferente O si la fuente no está definida o es 0
    //             if (edge.label !== expectedLabel || !edge.font || edge.font.size === 0) {
    //                 updateData.label = expectedLabel;
    //                 // Asegurarse de que la fuente tenga el tamaño correcto al mostrar
    //                 updateData.font = { size: baseEdgeFontSize };
    //                 needsUpdate = true;
    //                 console.log(`[Edge Labels] Mostrando etiqueta para ${edge.id}. Label: "${expectedLabel}", Font Size: ${baseEdgeFontSize}`);
    //             }
    //         } else {
    //             // --- OCULTAR ETIQUETA ---
    //             // Actualizar si la etiqueta actual NO está ya oculta (undefined/null)
    //             // O si la fuente todavía tiene un tamaño > 0
    //             if (edge.label !== undefined && edge.label !== null || (edge.font && edge.font.size !== 0)) {
    //                 updateData.label = undefined; // Poner a undefined para ocultar
    //                 // Establecer explícitamente el tamaño de fuente a 0 también
    //                 updateData.font = { size: 0 };
    //                 needsUpdate = true;
    //                 console.log(`[Edge Labels] Ocultando etiqueta para ${edge.id}.`);
    //             }
    //         }

    //         if (needsUpdate) {
    //             edgesToUpdate.push(updateData);
    //         }
    //     });

    //     if (edgesToUpdate.length > 0) {
    //         console.log(`[Edge Labels] Enviando ${edgesToUpdate.length} actualizaciones de aristas.`);
    //         allEdges.update(edgesToUpdate);
    //         // Intentar redibujar DE NUEVO después de la actualización individual
    //         // A veces, la actualización de datos + redibujo funciona mejor que solo uno.
    //             console.log("[Edge Labels] Forzando redibujo después de actualizar aristas.");
    //             network.redraw();
    //     } else {
    //         console.log("[Edge Labels] No se requieren actualizaciones de aristas.");
    //     }
    // }

    // function updateFontSize(newSize) {
    //     if (!network) return;
    //     const newFontSize = parseInt(newSize, 10);
    //     console.log(`Actualizando tamaño de fuente a ${newFontSize}px`);
    //     // 1. Actualizar tamaño de fuente de ARISTAS usando setOptions (parece funcionar bien)
    //     network.setOptions({
    //         edges: {
    //             font: {
    //                 // Asegurarse de que la fuente de la arista no sea demasiado pequeña
    //                 size: Math.max(8, newFontSize - 2)
    //             }
    //         }
    //     });
    //     // Volver a aplicar las etiquetas de las aristas (visibilidad/contenido)
    //     // ya que el tamaño de fuente predeterminado cambió.
    //     updateEdgeLabels();

    //     // 2. Actualizar tamaño de fuente y etiqueta de NODOS DIRECTAMENTE via allNodes.update()
    //     console.log("Preparando actualización directa de fuente/etiqueta para nodos...");
    //     const nodesToUpdate = [];
    //     allNodes.forEach(node => {
    //         let updateData = {
    //             id: node.id,
    //             // Establecer explícitamente el tamaño de fuente para ESTE nodo
    //             font: {
    //                 size: newFontSize
    //             }
    //         };
    //         // Si el nodo tiene recurso asociado, también reconstruir la etiqueta
    //         if (node.fhirResource) {
    //             updateData.label = buildNodeLabel(node.fhirResource);
    //         }
    //         nodesToUpdate.push(updateData);
    //     });

    //     if (nodesToUpdate.length > 0) {
    //         console.log(`Enviando ${nodesToUpdate.length} actualizaciones de nodos (fuente+etiqueta)...`);
    //         // Actualizar el dataset de nodos con los nuevos tamaños de fuente y etiquetas
    //         allNodes.update(nodesToUpdate);
    //         // Opcional: Forzar redibujo si la actualización directa no es suficiente,
    //         // pero debería serlo. Descomentar si es necesario.
    //         // network.redraw();
    //     } else {
    //         console.log("No hay nodos para actualizar fuente/etiqueta.");
    //     }
    //     // YA NO es necesario llamar a updateNodeLabels() aquí,
    //     // porque el bucle anterior ya se encargó de actualizar fuente Y etiqueta.
    //     // updateNodeLabels(); // ELIMINADO
    // }

        // --- Funciones Auxiliares ---

    // ... (otras funciones sin cambios) ...

    /**
     * Actualiza la visibilidad y contenido de las etiquetas de las aristas
     * según el estado del toggle 'toggleEdgeLabels'.
     * Llama a network.redraw() para asegurar que los cambios visuales se apliquen.
     */
    // function updateEdgeLabels() {
    //     if (!network) return;
    //     console.log(`[Edge Labels] Actualizando VISIBILIDAD. Mostrar: ${toggleEdgeLabels.checked}`);
    //     const showLabels = toggleEdgeLabels.checked;
    //     const edgesToUpdate = [];

    //     allEdges.forEach(edge => {
    //         let updateData = { id: edge.id };
    //         let needsUpdate = false;
    //         const currentLabelIsHidden = (edge.label === undefined || edge.label === null);

    //         if (showLabels) {
    //             // --- MOSTRAR ETIQUETA ---
    //             const expectedLabel = edge.originalLabel || '';
    //             // Actualizar solo si está oculta O si la etiqueta es incorrecta
    //             if (currentLabelIsHidden || edge.label !== expectedLabel) {
    //                 updateData.label = expectedLabel;
    //                 // >>> NO TOCAR FONT AQUÍ <<<
    //                 needsUpdate = true;
    //             }
    //         } else {
    //             // --- OCULTAR ETIQUETA ---
    //             // Actualizar solo si NO está ya oculta
    //             if (!currentLabelIsHidden) {
    //                 updateData.label = undefined; // Poner a undefined para ocultar
    //                 // >>> NO TOCAR FONT AQUÍ <<<
    //                 needsUpdate = true;
    //             }
    //         }

    //         if (needsUpdate) {
    //             edgesToUpdate.push(updateData);
    //         }
    //     });

    //     if (edgesToUpdate.length > 0) {
    //         console.log(`[Edge Labels] Enviando ${edgesToUpdate.length} actualizaciones de visibilidad de etiquetas.`);
    //         allEdges.update(edgesToUpdate);
    //         // Forzar redibujo SIEMPRE que esta función se llame (cambio de toggle)
    //         // para asegurar que la ocultación (label:undefined) funcione.
    //         console.log("[Edge Labels] Forzando redibujo por cambio de toggle.");
    //         network.redraw();
    //     } else {
    //         console.log("[Edge Labels] No se requieren actualizaciones de visibilidad de etiquetas.");
    //         // Si no hubo cambios de etiqueta, no es necesario redibujar desde aquí.
    //         // El redibujo por cambio de tamaño se maneja en updateFontSize si fuera necesario.
    //     }
    // }

    // /**
    //  * Aplica el nuevo tamaño de fuente seleccionado con el slider a nodos y aristas.
    //  * Actualiza los DataSets directamente y podría forzar redibujo si es necesario.
    //  * @param {string|number} newSize Nuevo tamaño de fuente base en píxeles.
    //  */
    // function updateFontSize(newSize) {
    //     if (!network) return;
    //     const newFontSizeNodes = parseInt(newSize, 10);
    //     // Calcular tamaño para aristas (un poco más pequeño)
    //     const newFontSizeEdges = Math.max(8, newFontSizeNodes - 2);
    //     console.log(`Actualizando tamaño de fuente: Nodos=${newFontSizeNodes}px, Aristas=${newFontSizeEdges}px`);

    //     // --- 1. Actualizar NODOS ---
    //     console.log("Preparando actualización directa de fuente/etiqueta para nodos...");
    //     const nodesToUpdate = [];
    //     allNodes.forEach(node => {
    //         let updateData = {
    //             id: node.id,
    //             font: { size: newFontSizeNodes } // Establecer tamaño de fuente
    //         };
    //         // Reconstruir etiqueta (puede depender del tamaño, aunque no directamente ahora)
    //         if (node.fhirResource) {
    //             updateData.label = buildNodeLabel(node.fhirResource);
    //         }
    //         // Solo añadir si el tamaño realmente cambió (optimización)
    //         if (!node.font || node.font.size !== newFontSizeNodes || node.label !== updateData.label) {
    //             nodesToUpdate.push(updateData);
    //         }
    //     });

    //     if (nodesToUpdate.length > 0) {
    //         console.log(`Enviando ${nodesToUpdate.length} actualizaciones de nodos (fuente/etiqueta)...`);
    //         allNodes.update(nodesToUpdate);
    //     } else {
    //         console.log("No se requieren actualizaciones de nodos para tamaño de fuente.");
    //     }

    //     // --- 2. Actualizar ARISTAS ---
    //     console.log("Preparando actualización directa de fuente para aristas...");
    //     const edgesToUpdate = [];
    //     allEdges.forEach(edge => {
    //          // Solo actualizar si el tamaño realmente cambió
    //          if (!edge.font || edge.font.size !== newFontSizeEdges) {
    //              let updateData = {
    //                  id: edge.id,
    //                  font: { size: newFontSizeEdges }
    //              };
    //              // IMPORTANTE: Si las etiquetas están visibles, debemos re-establecer el label
    //              // porque al actualizar 'font', Vis.js podría perder el label si no se incluye.
    //              if (toggleEdgeLabels.checked) {
    //                  updateData.label = edge.originalLabel || '';
    //              } else {
    //                  updateData.label = undefined; // Asegurarse de que sigue oculto si debe estarlo
    //              }
    //              edgesToUpdate.push(updateData);
    //          }
    //     });

    //     if (edgesToUpdate.length > 0) {
    //         console.log(`Enviando ${edgesToUpdate.length} actualizaciones de aristas (fuente/label)...`);
    //         allEdges.update(edgesToUpdate);
    //         // Forzar redibujo después de actualizar aristas SIEMPRE que se mueva el slider,
    //         // porque cambiar font.size individualmente a veces no refresca visualmente.
    //         console.log("[Font Size] Forzando redibujo después de actualizar fuentes.");
    //         network.redraw();
    //     } else {
    //         console.log("No se requieren actualizaciones de aristas para tamaño de fuente.");
    //     }

    //     // La función updateEdgeLabels NO se llama aquí, porque esta función ya
    //     // se encarga de actualizar fuente Y etiqueta (si es visible) de las aristas.
    //     // Llamar a updateEdgeLabels solo es necesario cuando cambia el *toggle* de visibilidad.
    // }

    /**
     * Actualiza la visibilidad y contenido de las etiquetas de las aristas
     * según el estado del toggle 'toggleEdgeLabels'.
     * Actualiza tanto 'label' como 'font.size' para asegurar ocultamiento/muestra.
     * Llama a network.redraw() para asegurar que los cambios visuales se apliquen.
     */
    function updateEdgeLabels() {
        if (!network) return;
        console.log(`[Edge Labels] Actualizando VISIBILIDAD. Mostrar: ${toggleEdgeLabels.checked}`);
        const showLabels = toggleEdgeLabels.checked;
        const edgesToUpdate = [];
        // Obtener el tamaño de fuente base actual del slider para cuando MOSTRAMOS
        const baseEdgeFontSize = Math.max(8, parseInt(fontSizeSlider.value, 10) - 2);

        allEdges.forEach(edge => {
            let updateData = { id: edge.id };
            let needsUpdate = false;
            const currentLabelIsHidden = (edge.label === undefined || edge.label === null);
            const currentFontSize = edge.font?.size; // Obtener tamaño actual si existe

            if (showLabels) {
                // --- MOSTRAR ETIQUETA ---
                const expectedLabel = edge.originalLabel || '';
                // Actualizar si está oculta O la etiqueta es incorrecta O el tamaño es incorrecto/cero
                if (currentLabelIsHidden || edge.label !== expectedLabel || currentFontSize !== baseEdgeFontSize) {
                    updateData.label = expectedLabel;
                    updateData.font = { size: baseEdgeFontSize }; // Asegurar tamaño correcto al mostrar
                    needsUpdate = true;
                    // console.log(`[Edge Labels] Mostrando etiqueta para ${edge.id}.`);
                }
            } else {
                // --- OCULTAR ETIQUETA ---
                // Actualizar si NO está ya oculta O si el tamaño de fuente NO es cero
                if (!currentLabelIsHidden || (currentFontSize !== undefined && currentFontSize !== 0)) {
                    updateData.label = undefined; // Poner a undefined para ocultar
                    // *** RE-INTRODUCIR: Establecer explícitamente el tamaño de fuente a 0 ***
                    updateData.font = { size: 0 };
                    // ********************************************************************
                    needsUpdate = true;
                    // console.log(`[Edge Labels] Ocultando etiqueta para ${edge.id}.`);
                }
            }

            if (needsUpdate) {
                edgesToUpdate.push(updateData);
            }
        });

        if (edgesToUpdate.length > 0) {
            console.log(`[Edge Labels] Enviando ${edgesToUpdate.length} actualizaciones de aristas (label/font).`);
            allEdges.update(edgesToUpdate);
            // Forzar redibujo SIEMPRE que esta función se llame (cambio de toggle)
            // para asegurar que la ocultación (label:undefined, font.size:0) funcione.
            console.log("[Edge Labels] Forzando redibujo por cambio de toggle.");
            network.redraw();
        } else {
            console.log("[Edge Labels] No se requieren actualizaciones de visibilidad de etiquetas.");
        }
    }

    /**
     * Aplica el nuevo tamaño de fuente seleccionado con el slider a nodos y aristas.
     * Actualiza los DataSets directamente. Llama a updateEdgeLabels para
     * asegurar que el tamaño de fuente de las aristas se aplique correctamente.
     * @param {string|number} newSize Nuevo tamaño de fuente base en píxeles.
     */
    function updateFontSize(newSize) {
        if (!network) return;
        const newFontSizeNodes = parseInt(newSize, 10);
        // El tamaño de las aristas se calculará y aplicará dentro de updateEdgeLabels
        console.log(`Actualizando tamaño de fuente base para Nodos=${newFontSizeNodes}px`);

        // --- 1. Actualizar NODOS ---
        console.log("Preparando actualización directa de fuente/etiqueta para nodos...");
        const nodesToUpdate = [];
        allNodes.forEach(node => {
            let updateData = {
                id: node.id,
                font: { size: newFontSizeNodes } // Establecer tamaño de fuente del nodo
            };
            // Reconstruir etiqueta del nodo
            if (node.fhirResource) {
                updateData.label = buildNodeLabel(node.fhirResource);
            }
            // Solo actualizar si es necesario
            if (!node.font || node.font.size !== newFontSizeNodes || node.label !== updateData.label) {
                nodesToUpdate.push(updateData);
            }
        });

        if (nodesToUpdate.length > 0) {
            console.log(`Enviando ${nodesToUpdate.length} actualizaciones de nodos (fuente/etiqueta)...`);
            allNodes.update(nodesToUpdate);
            // Redraw podría ser necesario si actualizar solo nodos no refresca bien
            // network.redraw();
        } else {
            console.log("No se requieren actualizaciones de nodos para tamaño de fuente.");
        }

        // --- 2. Actualizar ARISTAS (SOLO si están visibles) ---
        // Dejamos que updateEdgeLabels maneje el tamaño de fuente de las aristas
        // al mostrarse/ocultarse para asegurar consistencia.
        // Si las etiquetas están visibles, llamar a updateEdgeLabels forzará la
        // aplicación del nuevo tamaño calculado a partir del slider.
        if (toggleEdgeLabels.checked) {
                console.log("[Font Size] Llamando a updateEdgeLabels para refrescar tamaño/visibilidad de etiquetas de aristas.");
                updateEdgeLabels();
        } else {
                console.log("[Font Size] Etiquetas de aristas están ocultas, no se llama a updateEdgeLabels desde aquí.");
                // Aunque estén ocultas, podríamos querer actualizar su 'font.size' interno a 0
                // por si se activa el toggle después, pero la lógica actual en updateEdgeLabels ya lo hace.
        }
    }

    // ... (resto del código, incluyendo los listeners para fontSizeSlider y toggleEdgeLabels) ...

    /** Obtiene los IDs de los nodos relacionados con el nodo de enfoque */
    function getFocusRelatedNodes(focusNodeId) {
        if (!network || !focusNodeId) return [];
        const relatedNodeIds = new Set([focusNodeId]);
        const connectedEdges = network.getConnectedEdges(focusNodeId);
        connectedEdges.forEach(edgeId => {
            const edge = allEdges.get(edgeId);
            if (edge) {
                if (edge.from !== focusNodeId) relatedNodeIds.add(edge.from);
                if (edge.to !== focusNodeId) relatedNodeIds.add(edge.to);
            }
        });
        return Array.from(relatedNodeIds);
    }

     /** Enfoca un nodo específico y sus vecinos */
     function focusOnNode(nodeId) {
        if (!network || !nodeId) {
            clearFocus(); // Si no hay nodeId, limpiar enfoque
            return;
        }
        console.log(`Enfocando nodo: ${nodeId}`);
        currentFocusNodeId = nodeId;
        clearFocusButton.style.display = 'inline-block'; // Mostrar botón X

        const relatedNodeIds = getFocusRelatedNodes(nodeId);
        const activeFilters = getActiveFilters();
        const nodesToUpdate = [];
        const nodesToShow = []; // IDs de nodos que se mostrarán realmente

        allNodes.forEach(node => {
            const isRelated = relatedNodeIds.includes(node.id);
            const isAllowedByFilter = activeFilters.has(node.resourceType);
            const shouldShow = isRelated && isAllowedByFilter;

            let update = { id: node.id, hidden: !shouldShow };

             // Resaltar nodo enfocado y vecinos directos (que se muestran)
             if (shouldShow) {
                 nodesToShow.push(node.id);
                 if (node.id === nodeId) {
                    update.borderWidth = 3;
                    // update.color = { border: '#ff0000', background: node.originalColor.background, highlight: { border: '#ff0000', background: node.originalColor.background } }; // Borde rojo fuerte
                    update.color = { background: node.originalColor.background, highlight: { background: node.originalColor.background } }; // Borde rojo fuerte
                    update.font = { size: (parseInt(fontSizeSlider.value, 10) + 2) }; // Fuente un poco más grande
                 } else {
                     update.borderWidth = 2;
                     update.color = { border: '#f5a623', background: node.originalColor.background, highlight: { border: '#f5a623', background: node.originalColor.background } }; // Borde naranja para vecinos
                     update.font = { size: parseInt(fontSizeSlider.value, 10) }; // Tamaño normal
                 }
             } else {
                  // Restaurar apariencia normal si se oculta o no está relacionado
                  update.borderWidth = 1;
                  update.color = node.originalColor; // Restaurar color original
                  update.font = { size: parseInt(fontSizeSlider.value, 10) };
             }

             // Solo añadir a la actualización si hay cambios reales
            if (node.hidden === shouldShow || node.borderWidth !== update.borderWidth || node.font?.size !== update.font?.size) {
                 nodesToUpdate.push(update);
            }
        });

        if (nodesToUpdate.length > 0) {
            allNodes.update(nodesToUpdate);
        }

        // Ajustar vista a los nodos mostrados
        if (nodesToShow.length > 0) {
            network.fit({
                nodes: nodesToShow,
                animation: { duration: 500, easingFunction: 'easeInOutQuad' }
            });
        } else {
            // Si el enfoque no muestra nada (p.ej. por filtros), centrar todo
            network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
        }
    }

    /** Limpia el enfoque y restaura la vista basada en filtros */
    function clearFocus() {
        if (!currentFocusNodeId) return; // Ya está limpio
        console.log("Limpiando enfoque.");
        currentFocusNodeId = null;
        focusResourceSelect.value = ''; // Deseleccionar en el dropdown
        clearFocusButton.style.display = 'none'; // Ocultar botón X

        // Restaurar apariencia de todos los nodos
        const nodesToUpdate = [];
        allNodes.forEach(node => {
            nodesToUpdate.push({
                 id: node.id,
                 borderWidth: 1,
                 color: node.originalColor, // Restaurar color original
                 font: { size: parseInt(fontSizeSlider.value, 10) } // Restaurar tamaño fuente
            });
        });
        if (nodesToUpdate.length > 0) {
            allNodes.update(nodesToUpdate);
        }

        // Re-aplicar filtros para restaurar la visibilidad general
        applyFilters();
        // network.fit() se llama dentro de applyFilters si no hay enfoque
    }

    /** Copia texto al portapapeles */
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('JSON copiado al portapapeles');
            // Podrías mostrar una notificación temporal
            const originalText = copyJsonButton.innerHTML;
            copyJsonButton.innerHTML = '<i class="fas fa-check"></i> Copiado';
            copyJsonButton.disabled = true;
            setTimeout(() => {
                copyJsonButton.innerHTML = originalText;
                copyJsonButton.disabled = false;
            }, 1500);
        }).catch(err => {
            console.error('Error al copiar al portapapeles: ', err);
            alert('No se pudo copiar el texto. Verifica los permisos del navegador.');
        });
    }


    // --- Procesamiento del Bundle FHIR ---
    function processBundle(bundleData, sourceName = "Datos Cargados") {
        clearGraph();
        console.log("Procesando Bundle FHIR...");
        loadingMessage.textContent = 'Procesando Bundle...';
        loadingMessage.style.display = 'block';

        if (!bundleData || bundleData.resourceType !== 'Bundle') {
            console.error("Error: El archivo no es un Bundle FHIR válido.");
            loadingMessage.textContent = 'Error: El archivo no contiene un recurso Bundle FHIR válido.';
            fileNameDisplay.textContent = `Error en ${sourceName}`;
            return;
        }

        currentBundle = bundleData; // Guardar el bundle actual
        fileNameDisplay.textContent = sourceName;

        if (!bundleData.entry || bundleData.entry.length === 0) {
            console.warn("Bundle vacío o sin entradas (entries).");
            loadingMessage.textContent = 'El Bundle está vacío o no tiene entradas para visualizar.';
            // Aún así inicializamos el network vacío y controles
        }
        const nodes = [];
        const edges = [];
        resourceTypesInBundle.clear();
        fhirIdToVisId = {};
        // colorMap = {};
        resetFocusSelect(); // Esto ya limpia el select

        // Se declara aquí para que sea local a cada ejecución de processBundle
        let tempNodeBorderColors = {};

        // *** NUEVO: Array temporal para las opciones del ComboBox ***
        let focusOptionsData = [];

        // *******************************************************************
        // ** Control del Grafo: Primera pasada - Crear Nodos y Mapeo de IDs **
        // *******************************************************************
        console.log("Creando nodos y mapeando IDs...");
        (bundleData.entry || []).forEach((entry, index) => {
            if (!entry.resource) {
                console.warn(`Entrada ${index} sin recurso.`);
                return;
            }
            const resource = entry.resource;
            const resourceType = resource.resourceType;
            const id = resource.id; // Puede ser undefined
            const fullUrl = entry.fullUrl; // Puede ser undefined

            if (!resourceType) {
                console.warn(`Recurso en entrada ${index} sin resourceType.`);
                return;
            }

            resourceTypesInBundle.add(resourceType);

             // Generar ID único para Vis.js (usar id si existe, sino fullUrl o index)
             // Es crucial que sea único DENTRO del grafo Vis.js
            const visNodeId = id || fullUrl || `generated-${resourceType}-${index}`;

            // Añadir mapeos para resolución de referencias
            if (id) {
                fhirIdToVisId[`${resourceType}/${id}`] = visNodeId; // Mapeo relativo
            }
            if (fullUrl) {
                fhirIdToVisId[fullUrl] = visNodeId; // Mapeo por fullUrl (puede ser absoluto o URN)
                // Si fullUrl es URN (e.g., urn:uuid:...), mapearlo también
                 if (fullUrl.startsWith('urn:uuid:')) {
                     fhirIdToVisId[fullUrl] = visNodeId;
                 }
            }
             // Mapeo por el ID de Vis.js mismo, por si acaso
             fhirIdToVisId[visNodeId] = visNodeId;

            // Asignar color basado en resourceType
            // if (!colorMap[resourceType]) {
            //      colorMap[resourceType] = stringToColor(resourceType);
            // }

            let baseColor = predefinedColorMap[resourceType] || defaultNodeColor; // Buscar en el mapa o usar el por defecto
            // Verificación básica de formato (opcional pero recomendado)
            if (typeof baseColor !== 'string' || !baseColor.startsWith('#')) {
                console.warn(`Color inválido o no encontrado para ${resourceType}. Usando color por defecto.`);
                baseColor = defaultNodeColor;
            }

            // const nodeColor = {
            //      border: colorMap[resourceType],
            //      background: lightenColor(colorMap[resourceType], 0.7), // Fondo más claro que el borde
            //      highlight: {
            //         border: colorMap[resourceType],
            //         background: lightenColor(colorMap[resourceType], 0.5)
            //      },
            //      hover: {
            //         border: colorMap[resourceType],
            //         background: lightenColor(colorMap[resourceType], 0.6)
            //      }
            // };
            const nodeColor = {
                border: baseColor, // Usar el color definido como borde principal
                background: lightenColor(baseColor, 0.1), // Aclarar para el fondo (ajusta el 0.7 si quieres más/menos claro)
                highlight: { // Colores al seleccionar/hacer clic
                border: baseColor,
                background: lightenColor(baseColor, 0.5) // Fondo ligeramente más oscuro que el normal al resaltar
                },
                hover: { // Colores al pasar el ratón
                border: baseColor,
                background: lightenColor(baseColor, 0.1) // Fondo ligeramente más oscuro que el normal al hacer hover
                }
            };

            if (typeof nodeColor.border === 'string' && nodeColor.border.startsWith('#')) {
                tempNodeBorderColors[visNodeId] = nodeColor.border;
            } else {
                // Si baseColor ya fue validado, esto no debería ocurrir a menudo, pero por seguridad:
                tempNodeBorderColors[visNodeId] = defaultNodeColor;
                console.warn(`[Node Color Temp Map] Color inválido (${nodeColor.border}) para ${visNodeId} (${resourceType}), guardando default.`);
            }

            // Crear objeto nodo para Vis.js
            const node = {
                id: visNodeId,
                label: buildNodeLabel(resource),
                title: "Cargando tooltip...", // Este title se reemplaza en hoverNode
                shape: 'box',
                resourceType: resourceType,
                fhirResource: resource,
                originalColor: nodeColor, // Guardar los colores originales
                color: nodeColor // Aplicar los colores iniciales
            };
            nodes.push(node);
            // const node = {
            //     id: visNodeId,
            //     label: buildNodeLabel(resource), // Construir etiqueta inicial
            //     title: "Cargando tooltip...", // Placeholder, se genera al hacer hover
            //     shape: 'box', // Redundante si está en opciones globales, pero seguro
            //     resourceType: resourceType,
            //     fhirResource: resource, // Guardar el recurso completo para detalles/tooltip
            //     originalColor: nodeColor, // Guardar color base para restaurar
            //     color: nodeColor // Aplicar color inicial
            //     // Añadir más propiedades si se necesitan
            // };
            // nodes.push(node);

            // *** RECOLECTAR DATOS para el ComboBox (en lugar de añadir directamente) ***
            if (resource.id || fullUrl) { // Solo añadir si tiene alguna forma de identificador
                const namePart = getResourceName(resource);
                // Formato: Tipo/ID - Nombre (o Tipo/ID si no hay nombre)
                 const optionText = `${resourceType}/${id || '(no ID)'}${namePart !== 'N/A' && namePart !== 'Nombre no disponible' && namePart !== 'Nombre no especificado' ? ` - ${namePart.substring(0, 40)}` : ''}`;
                focusOptionsData.push({ value: visNodeId, text: optionText });
            }
        });

        // *** NUEVO: Ordenar y poblar el ComboBox DESPUÉS del bucle ***
        if (focusOptionsData.length > 0) {
            console.log(`Ordenando ${focusOptionsData.length} opciones del ComboBox...`);
            // Ordenar alfabéticamente por el texto de la opción
            focusOptionsData.sort((a, b) => a.text.localeCompare(b.text));

            // Poblar el select con las opciones ordenadas
            focusOptionsData.forEach(optData => {
                const option = new Option(optData.text, optData.value);
                focusResourceSelect.add(option);
            });

            focusResourceSelect.disabled = false; // Habilitar el select
        } else {
            focusResourceSelect.disabled = true; // Mantener deshabilitado si no hay opciones
        }
        // Ya no se necesita el focusResourceSelect.disabled = nodes.length === 0;

        // *******************************************************************
        // ** Control del Grafo: Segunda pasada - Crear Aristas (Referencias) **
        // *******************************************************************
        console.log("Buscando referencias y creando aristas...");
        (bundleData.entry || []).forEach((entry, index) => {
             if (!entry.resource) return;
             const resource = entry.resource;
             const sourceVisNodeId = resolveReference(resource.id ? `${resource.resourceType}/${resource.id}` : entry.fullUrl);

             if (!sourceVisNodeId) {
                 console.warn(`No se pudo encontrar el ID de Vis.js para el recurso fuente: ${resource.resourceType}/${resource.id || entry.fullUrl}`);
                 return; // No se puede crear arista si no se encuentra el nodo fuente
             }

             // Buscar referencias dentro del recurso
             const references = findReferences(resource);

             references.forEach(refInfo => {
                 const targetVisNodeId = resolveReference(refInfo.reference);

                 // Crear arista solo si la referencia apunta a otro nodo DENTRO del bundle
                 if (targetVisNodeId && targetVisNodeId !== sourceVisNodeId) {
                    const edgeLabel = refInfo.label || ''; // Etiqueta de la arista (campo de referencia)
                    // let edgeColor = visOptions.edges.color.color; // Color por defecto

                    // const sourceNode = allNodes.get(sourceVisNodeId);

                    // if (!sourceNode) {
                    //      console.error(`[Edge Color ERROR] No se encontró el objeto nodo para el ID fuente: ${sourceVisNodeId}`);
                    //      // Si ves este error, hay un problema fundamental con cómo se obtienen/guardan los nodos.
                    // } else {
                    //      // Si encontramos el nodo, loguear su información relevante para el color
                    //      // console.log(`[Edge Color DEBUG] Nodo fuente encontrado para ${sourceVisNodeId}:`, sourceNode);
                    //      // console.log(`[Edge Color DEBUG]   - Tiene originalColor?`, sourceNode.hasOwnProperty('originalColor'));
                    //      if (sourceNode.originalColor) {
                    //          // console.log(`[Edge Color DEBUG]   - originalColor object:`, sourceNode.originalColor);
                    //          // console.log(`[Edge Color DEBUG]   - originalColor.border:`, sourceNode.originalColor.border);
                    //          // console.log(`[Edge Color DEBUG]   - typeof originalColor.border:`, typeof sourceNode.originalColor.border);
                    //      }
                    // }

                    // let finalEdgeColor = visOptions.edges.color.color; // Empezar con el color por defecto como fallback
                    let finalEdgeColor = tempNodeBorderColors[sourceVisNodeId]; // Intenta obtener el color guardado
                    let colorSource = 'Temporal Map'; // Para depuración

                    if (!finalEdgeColor || typeof finalEdgeColor !== 'string' || !finalEdgeColor.startsWith('#')) {
                        // Si no hay color válido en el mapa temporal, usar el color de arista por defecto
                        console.warn(`[Edge Color WARN] No se encontró color válido en temp map para ID fuente: ${sourceVisNodeId} (Color: ${finalEdgeColor}). Usando default.`);
                        finalEdgeColor = visOptions.edges.color.color; // Fallback al color por defecto de las aristas definido en visOptions
                        colorSource = 'Default Fallback (Invalid/Not in Temp Map)';
                    }

                    // if (sourceNode && sourceNode.originalColor && typeof sourceNode.originalColor.border === 'string') {
                    //     // Usar el color del BORDE del nodo origen si lo encontramos
                    //     finalEdgeColor = sourceNode.originalColor.border;
                    //     // console.log(`[Edge Color] Asignando color ${finalEdgeColor} de nodo ${sourceNode.resourceType} a arista`); // Log opcional para depurar
                    // } else {
                    //     // Mantener el color por defecto si no se pudo obtener el color del nodo origen
                    //     console.warn(`[Edge Color] No se pudo obtener color para nodo origen ${sourceVisNodeId}, usando default.`);
                    // }

                    // Colores especiales para Patient y Encounter
                    // const sourceResourceType = allNodes.get(sourceVisNodeId)?.resourceType;
                    // const targetResourceType = allNodes.get(targetVisNodeId)?.resourceType;

                    // if (sourceResourceType === 'Encounter' || targetResourceType === 'Encounter') {
                    //     edgeColor = '#DC143C'; // Rojo (Crimson)
                    // } else if (sourceResourceType === 'Patient' || targetResourceType === 'Patient') {
                    //     edgeColor = '#1E90FF'; // Azul (DodgerBlue)
                    // }

                    const edge = {
                        id: `${sourceVisNodeId}-to-${targetVisNodeId}-${edgeLabel}-${Math.random()}`, // ID único para la arista
                        from: sourceVisNodeId,
                        to: targetVisNodeId,
                        label: toggleEdgeLabels.checked ? edgeLabel : undefined, // Mostrar etiqueta si toggle está activo
                        originalLabel: edgeLabel, // Guardar etiqueta original
                        // color: { color: edgeColor, highlight: '#ff0000', hover: '#d3d3d3' },
                        color: {
                            color: finalEdgeColor, // Color base de la línea/flecha
                            // highlight: '#FF0000', // Color al seleccionar la arista (rojo fuerte)
                            highlight: lightenColor(finalEdgeColor, -0.3) || finalEdgeColor,
                            // Opcional: Hacer que el hover sea un poco más oscuro que el color base
                            hover: lightenColor(finalEdgeColor, -0.2) || visOptions.edges.color.hover // Usa función lightenColor o el default
                        },
                        arrows: 'to',
                        // physics: false // Podría desactivar física solo para aristas si es necesario
                    };
                    edges.push(edge);
                 } else if (!targetVisNodeId) {
                     // console.log(`Referencia externa o no resuelta: ${refInfo.reference} desde ${resource.resourceType}/${resource.id}`);
                 }
             });
        });

        // --- Inicializar o Actualizar Vis.js Network ---
        loadingMessage.style.display = 'none'; // Ocultar mensaje de carga/procesando
        console.log(`Nodos creados: ${nodes.length}, Aristas creadas: ${edges.length}`);

        // Actualizar datasets
        allNodes.clear();
        allEdges.clear();
        allNodes.add(nodes);
        allEdges.add(edges);

        console.log("Opciones de Vis.js ANTES de crear Network:", JSON.stringify(visOptions, null, 2)); // Log para ver las opciones completas
        // Opcional: verificar específicamente el valor de navigationButtons
        console.log(`>> Verificando visOptions.interaction.navigationButtons: ${visOptions.interaction?.navigationButtons}`);

        if (!network) {
            // Crear nueva instancia de Network
            console.log("Creando NUEVA instancia de vis.Network..."); // Log inicio creación
            try {
                 network = new vis.Network(networkContainer, { nodes: allNodes, edges: allEdges }, visOptions);
                 console.log(">>> Instancia de vis.Network CREADA exitosamente."); // Log éxito
                 addNetworkEventListeners();
            } catch (error) {
                 console.error("!!! ERROR al crear la instancia de vis.Network:", error); // Log si falla
                 loadingMessage.textContent = 'Error al inicializar el grafo.';
                 loadingMessage.style.display = 'block';
                 return; // Detener si falla la creación
            }

        } else {
            // Si ya existe, solo actualizar datos
             console.log("Actualizando datos de la instancia de vis.Network existente..."); // Log inicio actualización
             network.setData({ nodes: allNodes, edges: allEdges });
             // Opcional: Reaplicar opciones por si algo cambió dinámicamente
             // console.log("Reaplicando opciones a Network existente...");
             // network.setOptions(visOptions);
             console.log(">>> Datos de vis.Network ACTUALIZADOS."); // Log éxito actualización
        }

        // Desactivar físicas después de la estabilización inicial
        network.once('stabilizationIterationsDone', () => {
            console.log("Estabilización completada. Desactivando físicas.");
            network.setOptions({ physics: false });
            // network.fit(); // Ajustar vista después de estabilizar
        });
        // También desactivar después de un tiempo por si no estabiliza rápido
        setTimeout(() => {
             if (network && network.physics.options.enabled) {
                 console.log("Desactivando físicas por tiempo (timeout).");
                 network.setOptions({ physics: false });
             }
        }, 5000); // Desactivar después de 5 segundos max

        // Generar checkboxes de filtro
        populateFilterModal();
        // Aplicar tamaño de fuente inicial (por si cambió antes)
        updateFontSize(fontSizeSlider.value);
        // Aplicar estado inicial de etiquetas de arista
        updateEdgeLabels();

        // Ajustar vista inicial
        network.fit();

    } // Fin processBundle

    /** Añade listeners a eventos de la red Vis.js */
    function addNetworkEventListeners() {
        if (!network) return;

        // Clic en Nodo
        network.on('click', (properties) => {
            const { nodes: clickedNodes, edges: clickedEdges, event } = properties;
            // console.log('Click event:', properties);

            if (clickedNodes.length > 0) {
                const nodeId = clickedNodes[0];
                const nodeData = allNodes.get(nodeId);
                console.log(`Nodo clickeado: ${nodeId}`, nodeData);

                if (nodeData && nodeData.fhirResource) {
                    // Mostrar panel de detalles
                    detailsType.textContent = nodeData.resourceType || 'N/A';
                    detailsId.textContent = nodeData.fhirResource.id || 'N/A';
                    detailsName.textContent = getResourceName(nodeData.fhirResource);
                    detailsDate.textContent = getResourceDate(nodeData.fhirResource);
                    // detailsJson.textContent = JSON.stringify(nodeData.fhirResource, null, 2); //Cambio Panel Detalle Recursos
                    detailsJsonContent.textContent = JSON.stringify(nodeData.fhirResource, null, 2); //Cambio Panel Detalle Recursos
                    detailsPanel.classList.add('visible');

                     // Resaltar nodo clickeado y vecinos (sobrescribe enfoque si hay)
                    // clearFocus(); // Opcional: Limpiar enfoque al hacer clic
                    highlightNodeAndNeighbors(nodeId);

                } else {
                    resetDetailsPanel();
                    closeDetailsPanel();
                    clearHighlights();
                    if(detailsJsonContent) 
                        detailsJsonContent.textContent = 'Selecciona un nodo para ver detalles.';
                }
            } else {
                 // Clic fuera de un nodo -> cerrar panel detalles y limpiar resaltados/enfoque
                 resetDetailsPanel();
                 closeDetailsPanel();
                 clearHighlights();
                 // Opcional: Limpiar enfoque al hacer clic fuera
                 // clearFocus();
                 if(detailsJsonContent) 
                    detailsJsonContent.textContent = 'Selecciona un nodo para ver detalles.';
            }
        });

        // Hover sobre Nodo (para Tooltip)
        network.on('hoverNode', (params) => {
            const nodeId = params.node;
            // console.log(`Hover sobre nodo: ${nodeId}`);
            // Actualizar el título del nodo dinámicamente para el tooltip
            // Vis.js usa la propiedad 'title' del nodo para el tooltip
            try {
                // const tooltipContent = buildNodeTooltip(nodeId);
                // console.log("Generated Tooltip HTML for node", nodeId, ":", tooltipContent);
                // allNodes.update({ id: nodeId, title: tooltipContent });

                // LLAMAR a la función que devuelve un ELEMENTO
                const tooltipElement = buildNodeTitle(nodeId); // Ahora llamamos a esta función
                // ACTUALIZAR el title del nodo con el ELEMENTO DOM devuelto
                allNodes.update({ id: nodeId, title: tooltipElement });
                console.log(`[Tooltip] Updated title for node ${nodeId} with DOM element.`);
                
            } catch (e) {
                //  console.error("Error generando tooltip:", e);
                //  allNodes.update({ id: nodeId, title: "Error al generar tooltip" });

                 console.error("[Tooltip] Error building/setting tooltip element:", e);
                 // Fallback a texto simple si falla la creación del elemento
                 const errorText = `Error tooltip: ${e.message}`;
                 allNodes.update({ id: nodeId, title: errorText });
            }
        });

        // Quitar hover del nodo
        network.on('blurNode', (params) => {
            // console.log(`Blur nodo: ${params.node}`);
            // Podríamos limpiar el 'title' si fuera muy pesado, pero usualmente no es necesario
            // allNodes.update({ id: params.node, title: undefined });
        });

        // Otros eventos útiles (opcional)
        network.on("dragStart", (params) => {
            // Podría ser útil si queremos re-activar físicas temporalmente
            // console.log("Drag Start");
            if (params.nodes && params.nodes.length > 0) {
                if (toggleAdjustOnDrag && toggleAdjustOnDrag.checked) {
                    console.log("Drag Start - Toggle activo. Reactivando físicas temporalmente");
                    network.setOptions({ physics: { enabled: true } });
               } else {
                    console.log("Drag Start - Toggle inactivo. No se activan físicas.");
               }
            }
        });
         network.on("dragEnd", (params) => {
             // console.log("Drag End");
             // Opcional: Desactivar físicas de nuevo si se activaron
             // network.setOptions({ physics: false });
             if (params.nodes && params.nodes.length > 0) {
                if (network && network.physics.options.enabled) {
                    console.log("Drag End - Desactivando físicas (si estaban activas)");
                    network.setOptions({ physics: { enabled: false } });
               }
                // Opcional: Estabilizar un poco después de soltar si se movió mucho
                // network.stabilize(100); // Estabilizar por 100 iteraciones
            }
         });
          network.on("zoom", (params) => {
             // console.log(`Zoom: ${params.scale}`);
         });

    } // Fin addNetworkEventListeners

    /** Resalta un nodo y sus vecinos directos */
    function highlightNodeAndNeighbors(nodeId) {
        if (!network) return;
        clearHighlights(); // Limpiar resaltados anteriores

        const nodesToUpdate = [];
        const neighborIds = new Set();

        // Resaltar el nodo principal
        const mainNode = allNodes.get(nodeId);
        if (mainNode) {
             nodesToUpdate.push({
                 id: nodeId,
                 borderWidth: 2, //Grosor del borde del nodo principal
                 color: { border: '#ff0000', background: mainNode.originalColor.background, highlight: { border: '#ff0000', background: mainNode.originalColor.background } },
                 font: { size: (parseInt(fontSizeSlider.value, 10) + 1) } // Ligeramente más grande
             });
        }

        // Obtener y resaltar vecinos
        const connectedEdges = network.getConnectedEdges(nodeId);
        connectedEdges.forEach(edgeId => {
             const edge = allEdges.get(edgeId);
             if (!edge) return;
             const neighborId = (edge.from === nodeId) ? edge.to : edge.from;
             if (neighborId !== nodeId && !neighborIds.has(neighborId)) {
                 const neighborNode = allNodes.get(neighborId);
                 // Solo resaltar si el nodo vecino está visible (no oculto por filtro/enfoque)
                 if (neighborNode && !neighborNode.hidden) {
                     neighborIds.add(neighborId);
                     nodesToUpdate.push({
                         id: neighborId,
                         borderWidth: 2,
                         color: { border: '#f5a623', background: neighborNode.originalColor.background, highlight: { border: '#f5a623', background: neighborNode.originalColor.background } },
                         font: { size: parseInt(fontSizeSlider.value, 10) }
                     });
                 }
             }
        });

        if (nodesToUpdate.length > 0) {
            allNodes.update(nodesToUpdate);
        }
    }

    /** Limpia todos los resaltados de nodos */
    function clearHighlights() {
        if (!network || currentFocusNodeId) return; // No limpiar si hay un enfoque activo (el enfoque maneja sus propios resaltados)

        const nodesToUpdate = [];
        allNodes.forEach(node => {
            // Solo revertir si el borde o tamaño de fuente no son los por defecto
            if (node.borderWidth !== 1 || node.font?.size !== parseInt(fontSizeSlider.value, 10)) {
                nodesToUpdate.push({
                    id: node.id,
                    borderWidth: 1,
                    color: node.originalColor,
                    font: { size: parseInt(fontSizeSlider.value, 10) }
                });
            }
        });
        if (nodesToUpdate.length > 0) {
            allNodes.update(nodesToUpdate);
        }
    }


    /** Popula el modal de filtros con los tipos de recurso encontrados */
    function populateFilterModal() {
        filterCheckboxesContainer.innerHTML = ''; // Limpiar contenido anterior
        if (resourceTypesInBundle.size === 0) {
            filterCheckboxesContainer.innerHTML = '<p>No se encontraron tipos de recurso en el Bundle.</p>';
            return;
        }

        const sortedTypes = Array.from(resourceTypesInBundle).sort();

        sortedTypes.forEach(resourceType => {
            // Crear el contenedor para cada item (opcional, pero puede ayudar con grid)
            const itemContainer = document.createElement('div');
            itemContainer.classList.add('filter-item'); // Añadir clase por si se necesita estilo

            // Crear el checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `filter-${resourceType}`;
            checkbox.value = resourceType;
            checkbox.checked = true; // Por defecto, todos seleccionados
            checkbox.addEventListener('change', applyFilters); // Aplicar filtro en tiempo real

            // Crear la etiqueta (label)
            const label = document.createElement('label');
            label.htmlFor = `filter-${resourceType}`;
            // label.textContent = resourceType; // Ya no ponemos el texto directamente aquí

            // Crear el swatch de color
            const colorSwatch = document.createElement('span');
            colorSwatch.classList.add('filter-color-swatch'); // Añadir clase para estilo
            // colorSwatch.style.backgroundColor = colorMap[resourceType] || '#808080';
            colorSwatch.style.backgroundColor = predefinedColorMap[resourceType] || defaultNodeColor;

            // *** Añadir swatch y texto DENTRO de la etiqueta ***
            label.appendChild(colorSwatch);
            label.appendChild(document.createTextNode(` ${resourceType}`)); // Añadir texto después del swatch

            // Añadir checkbox y label al contenedor del item
            itemContainer.appendChild(checkbox);
            itemContainer.appendChild(label);

            // Añadir el contenedor del item al contenedor principal del grid
            filterCheckboxesContainer.appendChild(itemContainer);
        });
    }

    // --- Funciones para Manejar Paneles y Modales ---
    function openModal(modalElement) {
        if(modalElement) modalElement.style.display = 'flex'; // Usar flex para centrar
    }
    function closeModal(modalElement) {
        if(modalElement) modalElement.style.display = 'none';
    }
    function closeAllModals() {
        closeModal(helpModal);
        closeModal(pasteJsonModal);
        closeModal(filterModal);
    }

    function openControlPanel() {
        controlPanel.classList.add('visible');
        // Opcional: Mover el trigger para que no quede debajo
        // controlPanelTrigger.style.left = `var(--panel-width)`;
    }
    function closeControlPanel() {
        controlPanel.classList.remove('visible');
        // controlPanelTrigger.style.left = '0';
    }

    function openDetailsPanel() {
        detailsPanel.classList.add('visible');
    }
    function closeDetailsPanel() {
        detailsPanel.classList.remove('visible');
        resetDetailsPanel(); // Limpiar detalles al cerrar
        clearHighlights(); // Limpiar resaltados al cerrar
    }

    // --- Event Listeners para UI (Botones, Controles, etc.) ---

    // Cargar Archivo
    loadFileButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    processBundle(jsonData, file.name);
                    closeControlPanel(); // Cerrar panel después de cargar
                } catch (error) {
                    console.error("Error al parsear JSON del archivo:", error);
                    alert(`Error al leer el archivo JSON: ${error.message}`);
                    loadingMessage.textContent = `Error al parsear ${file.name}. Verifique que sea JSON válido.`;
                    loadingMessage.style.display = 'block';
                    fileNameDisplay.textContent = `Error en ${file.name}`;
                }
            };
            reader.onerror = () => {
                console.error("Error al leer el archivo:", reader.error);
                alert("Error al leer el archivo.");
                 loadingMessage.textContent = `Error al leer ${file.name}.`;
                 loadingMessage.style.display = 'block';
                 fileNameDisplay.textContent = `Error en ${file.name}`;
            };
            reader.readAsText(file);
        } else if(file) {
            alert("Por favor, selecciona un archivo JSON válido.");
            fileNameDisplay.textContent = 'Archivo no válido';
        }
         // Resetear el input para permitir cargar el mismo archivo de nuevo
        event.target.value = null;
    });

    // Modales
    helpButton.addEventListener('click', () => openModal(helpModal));
    openPasteModalButton.addEventListener('click', () => {
        pasteJsonError.textContent = ''; // Limpiar errores anteriores
        openModal(pasteJsonModal);
        pasteJsonTextarea.focus();
    });
    openFilterModalButton.addEventListener('click', () => openModal(filterModal));

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Error potencial aquí: Asume que el modal es el padre directo
            // closeModal(button.closest('.modal')); // Así debería ser
            // Corrección si estaba mal:
             const modalToClose = button.closest('.modal'); // Encuentra el ancestro modal más cercano
             if (modalToClose) {
                 closeModal(modalToClose);
             } else {
                 console.error("No se pudo encontrar el modal para cerrar desde el botón:", button);
             }
        });
    });
    // Cerrar modal haciendo clic fuera del contenido
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });

    // Panel de Controles (Trigger y cierre)
    let controlPanelTimeout;
    controlPanelTrigger.addEventListener('mouseenter', () => {
         clearTimeout(controlPanelTimeout);
         openControlPanel();
    });
     controlPanelTrigger.addEventListener('mouseleave', () => {
         // No hacer nada al salir del trigger, solo al salir del panel
     });
    controlPanel.addEventListener('mouseenter', () => {
         clearTimeout(controlPanelTimeout); // Cancelar cierre si vuelve a entrar
    });
     controlPanel.addEventListener('mouseleave', () => {
         // Cerrar después de un breve retraso para permitir mover el mouse al panel
         controlPanelTimeout = setTimeout(() => {
             closeControlPanel();
         }, 300); // 300ms de retraso
     });
    closeControlPanelButton.addEventListener('click', closeControlPanel);


    // Panel de Detalles (Cierre)
    closeDetailsPanelButton.addEventListener('click', closeDetailsPanel);


    // Modal Pegar JSON
    drawPastedJsonButton.addEventListener('click', () => {
        const jsonText = pasteJsonTextarea.value.trim();
        if (!jsonText) {
            pasteJsonError.textContent = 'El área de texto está vacía.';
            return;
        }
        try {
            const jsonData = JSON.parse(jsonText);
            processBundle(jsonData, "Texto Pegado");
            closeModal(pasteJsonModal);
             closeControlPanel(); // Cerrar panel izquierdo también
        } catch (error) {
            console.error("Error al parsear JSON pegado:", error);
            pasteJsonError.textContent = `Error de parseo JSON: ${error.message}`;
        }
    });
    clearPasteJsonButton.addEventListener('click', () => {
        pasteJsonTextarea.value = '';
        pasteJsonError.textContent = '';
    });

    // Modal Filtros (Botones Todos/Ninguno)
    filterSelectAllButton.addEventListener('click', () => {
        const checkboxes = filterCheckboxesContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        applyFilters(); // Aplicar cambios
    });
    filterSelectNoneButton.addEventListener('click', () => {
        const checkboxes = filterCheckboxesContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        applyFilters(); // Aplicar cambios
    });

    // Controles de Visualización (Panel Izquierdo)
    toggleNames.addEventListener('change', updateNodeLabels);
    toggleIds.addEventListener('change', updateNodeLabels);
    toggleDates.addEventListener('change', updateNodeLabels);
    toggleEdgeLabels.addEventListener('change', updateEdgeLabels);
    toggleTooltipConnections.addEventListener('change', () => {
        // No requiere redibujar inmediato, el tooltip se genera al hacer hover
        console.log("Actualización de tooltip en hover activada/desactivada.");
    });

    fontSizeSlider.addEventListener('input', (event) => {
        const newSize = event.target.value;
        fontSizeValue.textContent = `${newSize}px`;
        updateFontSize(newSize);
    });

    // Enfoque de Recurso
    focusResourceSelect.addEventListener('change', (event) => {
        const selectedNodeId = event.target.value;
        focusOnNode(selectedNodeId); // La función maneja el caso de valor vacío ('')
    });

    clearFocusButton.addEventListener('click', clearFocus);

    // Copiar JSON del Panel de Detalles
    copyJsonButton.addEventListener('click', () => {
        // const jsonContent = detailsJson.textContent;
        const jsonContent = detailsJsonContent.textContent;
        if (jsonContent && jsonContent !== 'Selecciona un nodo para ver detalles.') {
            copyToClipboard(jsonContent);
        } else {
            // Opcional: Informar al usuario si intenta copiar el placeholder
            console.log("Intento de copiar texto placeholder.");
        }
    });

     // Cerrar paneles/modales con tecla Escape
     document.addEventListener('keydown', (event) => {
         if (event.key === 'Escape') {
             console.log("Tecla Escape presionada");
             // Prioridad: Cerrar modal abierto > Cerrar panel detalles > Cerrar panel controles
             if (helpModal.style.display !== 'none') closeModal(helpModal);
             else if (pasteJsonModal.style.display !== 'none') closeModal(pasteJsonModal);
             else if (filterModal.style.display !== 'none') closeModal(filterModal);
             else if (detailsPanel.classList.contains('visible')) closeDetailsPanel();
             else if (controlPanel.classList.contains('visible')) closeControlPanel();
         }
     });

    // --- Inicialización al cargar ---
    clearGraph(); // Asegura estado limpio inicial
    console.log("Visualizador FHIR listo.");

}); // Fin DOMContentLoaded

// --- Funciones Helper Adicionales ---

/** Aclara u oscurece un color hexadecimal */
function lightenColor(color, percent) {
    let num = parseInt(color.replace("#", ""), 16),
        amt = Math.round(2.55 * percent * 100), // Corrección aquí
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    R = Math.max(0, Math.min(255, R));
    G = Math.max(0, Math.min(255, G));
    B = Math.max(0, Math.min(255, B));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}
