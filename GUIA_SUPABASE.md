# 📋 Guía Paso a Paso: Configuración de Supabase

## 🎯 Objetivo
Configurar Supabase para almacenar leads y evitar duplicados en tu sistema de control de leads.

---

## 📝 PASO 1: Crear Cuenta y Proyecto en Supabase

### 1.1 Acceder a Supabase
- Abre tu navegador y ve a: **https://supabase.com**
- Haz clic en el botón **"Start your project"** o **"Sign up"**

### 1.2 Registrarse
- Elige un método de registro:
  - ✅ **GitHub** (recomendado)
  - ✅ **Google**
  - ✅ **Email**
- Completa el proceso de registro

### 1.3 Crear Nuevo Proyecto
1. Una vez dentro del dashboard, haz clic en **"New Project"**
2. Completa el formulario:
   ```
   Name: control-de-leads
   Database Password: [Crea una contraseña segura - GUÁRDALA]
   Region: South America (São Paulo) [o la más cercana]
   Pricing Plan: Free
   ```
3. Haz clic en **"Create new project"**
4. ⏳ Espera 2-3 minutos mientras se crea el proyecto

---

## 📝 PASO 2: Crear la Tabla de Leads

### 2.1 Acceder al Table Editor
1. En el menú lateral izquierdo, busca y haz clic en **"Table Editor"**
2. Verás una lista de tablas (probablemente vacía)

### 2.2 Crear Nueva Tabla
1. Haz clic en el botón **"New table"** (arriba a la derecha)
2. Completa:
   ```
   Name: leads
   Description: Tabla para almacenar leads del sistema
   Enable Row Level Security: ❌ (desactivado por ahora)
   ```
3. Haz clic en **"Save"**

---

## 📝 PASO 3: Agregar Columnas a la Tabla

Una vez creada la tabla `leads`, necesitas agregar las siguientes columnas:

### Columna 1: `id` (ID único)
1. Haz clic en **"Add column"**
2. Configura:
   ```
   Name: id
   Type: int8 (bigint)
   Default value: [deja vacío - se generará automáticamente]
   Is Primary Key: ✅ SÍ
   Is Nullable: ❌ NO
   Is Unique: ✅ SÍ
   ```
3. Haz clic en **"Save"**

### Columna 2: `telefono` (Teléfono - ÚNICO para evitar duplicados)
1. Haz clic en **"Add column"**
2. Configura:
   ```
   Name: telefono
   Type: text
   Is Nullable: ❌ NO
   Is Unique: ✅ SÍ (MUY IMPORTANTE)
   ```
3. Haz clic en **"Save"**

### Columna 3: `nombre`
1. Haz clic en **"Add column"**
2. Configura:
   ```
   Name: nombre
   Type: text
   Is Nullable: ✅ SÍ
   Default: 'sin nombre'
   ```
3. Haz clic en **"Save"**

### Columna 4: `correo`
1. Haz clic en **"Add column"**
2. Configura:
   ```
   Name: correo
   Type: text
   Is Nullable: ✅ SÍ
   Default: 'sin correo'
   ```
3. Haz clic en **"Save"**

### Columna 5: `provincia`
1. Haz clic en **"Add column"**
2. Configura:
   ```
   Name: provincia
   Type: text
   Is Nullable: ✅ SÍ
   Default: 'provincia o estado no especificado'
   ```
3. Haz clic en **"Save"**

### Columna 6: `created_at` (Fecha de creación)
1. Haz clic en **"Add column"**
2. Configura:
   ```
   Name: created_at
   Type: timestamptz
   Default value: now()
   Is Nullable: ❌ NO
   ```
3. Haz clic en **"Save"**

### Columna 7: `updated_at` (Opcional - Fecha de actualización)
1. Haz clic en **"Add column"**
2. Configura:
   ```
   Name: updated_at
   Type: timestamptz
   Default value: now()
   Is Nullable: ✅ SÍ
   ```
3. Haz clic en **"Save"**

---

## 📝 PASO 4: Crear Índices para Optimización

### 4.1 Acceder al SQL Editor
1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"**

### 4.2 Ejecutar SQL para Índices
Copia y pega este código SQL:

```sql
-- Crear índice único en teléfono para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_telefono_unique 
ON leads(telefono);

-- Crear índice en created_at para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_leads_created_at 
ON leads(created_at DESC);
```

3. Haz clic en **"Run"** (o presiona `Ctrl + Enter`)
4. Deberías ver: ✅ "Success. No rows returned"

---

## 📝 PASO 5: Obtener Credenciales de API

### 5.1 Acceder a Settings
1. En el menú lateral, haz clic en el ícono **⚙️ Settings**
2. Selecciona **"API"** en el submenú

### 5.2 Copiar Credenciales
Encontrarás dos secciones importantes:

#### Project URL
```
https://xxxxx.supabase.co
```
📋 **Copia esta URL** - La necesitarás para conectar tu aplicación

#### API Keys
- **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - 📋 **Copia esta clave** - Es segura para usar en el frontend
  
- **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - ⚠️ **NO la copies aquí** - Solo úsala en backend (no la necesitas ahora)

### 5.3 Guardar Credenciales
Guarda estas credenciales en un lugar seguro:
```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 PASO 6: Configurar Políticas de Seguridad (Row Level Security)

### 6.1 Activar Row Level Security
1. Ve a **"Table Editor"**
2. Selecciona la tabla **"leads"**
3. Haz clic en la pestaña **"Policies"**
4. Activa el toggle **"Enable Row Level Security"**

### 6.2 Crear Políticas
1. Ve a **"SQL Editor"** → **"New query"**
2. Copia y pega este código:

```sql
-- Política para permitir INSERT (agregar nuevos leads)
CREATE POLICY "Allow insert for all" 
ON leads FOR INSERT 
TO anon 
WITH CHECK (true);

-- Política para permitir SELECT (leer leads)
CREATE POLICY "Allow select for all" 
ON leads FOR SELECT 
TO anon 
USING (true);

-- Política para permitir UPDATE (actualizar leads)
CREATE POLICY "Allow update for all" 
ON leads FOR UPDATE 
TO anon 
USING (true);
```

3. Haz clic en **"Run"**
4. Deberías ver: ✅ "Success. No rows returned"

---

## 📝 PASO 7: Probar la Configuración

### 7.1 Insertar un Lead de Prueba
1. Ve a **"Table Editor"** → tabla **"leads"**
2. Haz clic en **"Insert row"** (botón verde)
3. Completa los campos:
   ```
   telefono: 0991234567
   nombre: Lead de Prueba
   correo: prueba@test.com
   provincia: Pichincha
   ```
4. Haz clic en **"Save"**
5. ✅ Deberías ver el registro creado en la tabla

### 7.2 Verificar que No Permite Duplicados
1. Intenta insertar otro lead con el mismo teléfono:
   ```
   telefono: 0991234567 (el mismo)
   nombre: Otro Lead
   correo: otro@test.com
   provincia: Guayas
   ```
2. Haz clic en **"Save"**
3. ❌ Deberías ver un error: "duplicate key value violates unique constraint"
4. ✅ Esto confirma que el control de duplicados funciona

---

## 📝 PASO 8: Verificar Estructura Final

Tu tabla `leads` debería tener esta estructura:

| Columna | Tipo | Nullable | Unique | Default |
|---------|------|----------|--------|---------|
| id | int8 | ❌ NO | ✅ SÍ | auto |
| telefono | text | ❌ NO | ✅ SÍ | - |
| nombre | text | ✅ SÍ | ❌ NO | 'sin nombre' |
| correo | text | ✅ SÍ | ❌ NO | 'sin correo' |
| provincia | text | ✅ SÍ | ❌ NO | 'provincia o estado no especificado' |
| created_at | timestamptz | ❌ NO | ❌ NO | now() |
| updated_at | timestamptz | ✅ SÍ | ❌ NO | now() |

---

## ✅ Checklist Final

Antes de continuar, verifica que tengas:

- [ ] ✅ Proyecto creado en Supabase
- [ ] ✅ Tabla `leads` creada
- [ ] ✅ Todas las columnas agregadas correctamente
- [ ] ✅ Índice único en `telefono` creado
- [ ] ✅ Credenciales de API copiadas (URL y anon key)
- [ ] ✅ Políticas de seguridad configuradas
- [ ] ✅ Prueba de inserción exitosa
- [ ] ✅ Verificación de duplicados funcionando

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu base de datos Supabase estará configurada y lista para integrarse con tu aplicación.

**Próximos pasos:** Cuando estés listo, podremos integrar Supabase en tu aplicación JavaScript para:
- Guardar leads automáticamente
- Detectar duplicados antes de guardar
- Consultar y generar reportes
- Exportar datos a CSV

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún problema en algún paso, revisa:
1. Que la contraseña de la base de datos sea segura
2. Que todas las columnas estén configuradas correctamente
3. Que el índice único esté creado
4. Que las políticas de seguridad estén activas

