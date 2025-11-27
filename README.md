# Control de Leads

Sistema de gestión y análisis de leads con soporte para archivos CSV y Excel (XLSX).

## Estructura del Proyecto

```
ControldeLeads/
├── index.html                 # Archivo principal HTML
├── README.md                  # Documentación del proyecto
│
├── assets/
│   ├── css/
│   │   └── style.css         # Estilos principales
│   │
│   └── js/
│       ├── main.js           # Archivo principal - Inicialización
│       │
│       └── modules/
│           ├── config.js              # Configuración y estado global
│           ├── utils.js               # Utilidades generales
│           ├── fileProcessor.js       # Procesamiento de archivos CSV/Excel
│           ├── phoneNormalizer.js     # Normalización de números telefónicos
│           ├── previewManager.js      # Gestión de vista previa y paginación
│           ├── distributionManager.js # Distribución de leads entre vendedores
│           └── csvExporter.js         # Exportación de archivos CSV
```

## Módulos

### `config.js`
- Variables globales del estado de la aplicación
- Referencias a elementos del DOM
- Función de inicialización

### `utils.js`
- Funciones de utilidad general
- Formateo de tamaño de archivos
- Manejo de errores
- Validación de tipos de archivo

### `fileProcessor.js`
- Procesamiento de archivos CSV
- Procesamiento de archivos Excel (XLSX)
- Parsing de datos
- Normalización inicial de datos

### `phoneNormalizer.js`
- Detección de números ecuatorianos vs extranjeros
- Normalización de números telefónicos
- Detección de columnas de teléfono
- Filtrado de leads extranjeros

### `previewManager.js`
- Visualización de datos en tabla
- Sistema de paginación
- Filtros de vista (todos/extranjeros)
- Gestión de filas por página

### `distributionManager.js`
- Distribución equitativa de leads entre vendedores
- Visualización de distribución
- Gestión de vendedores

### `csvExporter.js`
- Exportación de archivos CSV
- Compatibilidad con Bitrix24
- Descarga individual y masiva

### `main.js`
- Inicialización de la aplicación
- Event listeners
- Funciones globales para HTML

## Características

- ✅ Soporte para archivos CSV y Excel (XLSX)
- ✅ Normalización automática de números telefónicos
- ✅ Detección de números extranjeros
- ✅ Vista previa con paginación
- ✅ Distribución equitativa de leads entre vendedores
- ✅ Exportación CSV compatible con Bitrix24
- ✅ Interfaz responsive y moderna

## 🚀 Instalación y Uso

### Requisitos Previos

- Node.js (versión 14 o superior)
- npm (viene incluido con Node.js)

### Instalación

1. Clona o descarga este repositorio
2. Abre una terminal en la carpeta del proyecto
3. Instala las dependencias:

```bash
npm install
```

### Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Esto iniciará un servidor HTTP en `http://localhost:8000` y abrirá automáticamente tu navegador.

### Otros Comandos Disponibles

```bash
npm start      # Inicia el servidor y abre el navegador (igual que dev)
npm run serve  # Inicia el servidor sin abrir el navegador automáticamente
```

### ⚠️ Nota Importante

Este proyecto usa módulos ES6 de JavaScript, que requieren un servidor HTTP para funcionar correctamente. **No puedes abrir el archivo `index.html` directamente desde el explorador de archivos** (protocolo `file://`).

Si intentas abrirlo directamente, verás un mensaje de error con instrucciones para iniciar el servidor correctamente.

### Uso de la Aplicación

1. Una vez que el servidor esté corriendo, carga uno o varios archivos CSV o Excel (XLSX/XLS)
2. Visualiza y analiza los datos en la tabla de vista previa
3. Filtra entre todos los leads o solo los extranjeros
4. Distribuye los leads equitativamente entre vendedores
5. Descarga los archivos CSV para cada vendedor (compatibles con Bitrix24)

## ⚠️ Notas sobre Advertencias del Navegador

### Advertencia de Blob URL en HTTP

Si ves una advertencia en la consola del navegador sobre Blob URLs cargados sobre conexión insegura:

```
The file at 'blob:http://...' was loaded over an insecure connection. 
This file should be served over HTTPS.
```

**Esto es normal y no afecta la funcionalidad.** Esta advertencia aparece porque:
- Estás usando un servidor HTTP local para desarrollo
- Los archivos CSV se descargan usando Blob URLs (método estándar y seguro)
- El navegador advierte sobre HTTP vs HTTPS por seguridad

**Soluciones:**
- **En desarrollo local:** Puedes ignorar esta advertencia, no afecta la funcionalidad
- **En producción:** Si despliegas con HTTPS, esta advertencia desaparecerá automáticamente

## Tecnologías

- HTML5
- CSS3
- JavaScript (ES6 Modules)
- SheetJS (xlsx) - Para lectura de archivos Excel

