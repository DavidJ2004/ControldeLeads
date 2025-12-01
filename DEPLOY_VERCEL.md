# 🚀 Despliegue en Vercel

## Pasos para desplegar en Vercel

### Opción 1: Desde la interfaz web de Vercel (Recomendado)

1. **Preparar el repositorio**
   - Asegúrate de que tu código esté en GitHub, GitLab o Bitbucket
   - Verifica que todos los archivos estén commiteados

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con tu cuenta de GitHub/GitLab/Bitbucket
   - Haz clic en "Add New Project"

3. **Importar el proyecto**
   - Selecciona tu repositorio
   - Vercel detectará automáticamente que es un sitio estático

4. **Configuración del proyecto**
   - **Framework Preset**: Otro (o deja en blanco)
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: Deja vacío (no es necesario para sitios estáticos)
   - **Output Directory**: Deja vacío
   - **Install Command**: `npm install` (opcional, solo si necesitas dependencias)

5. **Variables de entorno** (si las necesitas)
   - No se requieren variables de entorno para este proyecto
   - Las credenciales de Supabase están en `assets/js/modules/supabaseConfig.js`

6. **Desplegar**
   - Haz clic en "Deploy"
   - Espera a que termine el despliegue
   - Tu sitio estará disponible en una URL como: `https://tu-proyecto.vercel.app`

### Opción 2: Desde la línea de comandos (CLI)

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Iniciar sesión**
   ```bash
   vercel login
   ```

3. **Desplegar**
   ```bash
   vercel
   ```
   
   - Sigue las instrucciones en pantalla
   - Para producción: `vercel --prod`

## ✅ Verificaciones antes de desplegar

- [x] ✅ `vercel.json` configurado
- [x] ✅ `.gitignore` actualizado
- [x] ✅ Todas las rutas son relativas (no hay referencias a localhost en producción)
- [x] ✅ Scripts de Supabase cargados desde CDN
- [x] ✅ No hay archivos temporales o de desarrollo

## 📝 Notas importantes

### Supabase
- Las credenciales de Supabase están en `assets/js/modules/supabaseConfig.js`
- Asegúrate de que las credenciales sean correctas antes de desplegar
- En producción, las credenciales funcionarán igual que en desarrollo

### CORS
- Vercel permite CORS por defecto
- Los scripts de CDN (Supabase, SheetJS) funcionarán sin problemas

### HTTPS
- Vercel proporciona HTTPS automáticamente
- Esto resuelve las advertencias de "blob URL insecure connection" que aparecían en desarrollo

## 🔧 Solución de problemas

### Error: "Module not found"
- Verifica que todas las rutas de importación sean relativas
- Asegúrate de que todos los archivos estén en el repositorio

### Error: "Supabase no está cargado"
- Verifica que el script de Supabase esté en `index.html`
- Revisa la consola del navegador para más detalles

### El sitio no carga
- Verifica que `index.html` esté en la raíz del proyecto
- Revisa los logs de Vercel en el dashboard

## 🎉 Después del despliegue

1. **Probar la aplicación**
   - Carga un archivo CSV/Excel
   - Verifica que la distribución funcione
   - Comprueba que Supabase guarde los datos

2. **Dominio personalizado** (Opcional)
   - Ve a Settings → Domains en Vercel
   - Agrega tu dominio personalizado

3. **Monitoreo**
   - Revisa los logs en el dashboard de Vercel
   - Monitorea el uso de Supabase en su dashboard

## 📚 Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Guía de Supabase](GUIA_SUPABASE.md)

