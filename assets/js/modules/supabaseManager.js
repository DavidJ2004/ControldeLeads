// Módulo para gestión de Supabase - Guardar y consultar leads
import { SUPABASE_CONFIG, TABLE_NAME } from './supabaseConfig.js';
// Inicializar cliente de Supabase
let supabaseClient = null;

// Función para inicializar Supabase
function initSupabase() {
    if (supabaseClient) {
        console.log('✅ Cliente de Supabase ya inicializado');
        return supabaseClient;
    }
    
    console.log('🔵 Inicializando cliente de Supabase...');
    console.log('📋 URL:', SUPABASE_CONFIG.url);
    console.log('🔑 Anon Key (primeros 20 chars):', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
    
    // Verificar que las credenciales estén configuradas
    if (SUPABASE_CONFIG.url.includes('TU_SUPABASE_URL') || 
        SUPABASE_CONFIG.anonKey.includes('TU_SUPABASE_ANON_KEY')) {
        console.warn('⚠️ Supabase no está configurado. Por favor, actualiza supabaseConfig.js con tus credenciales.');
        return null;
    }
    
    // Cargar Supabase desde CDN (está disponible globalmente como window.supabase)
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase no está cargado. Asegúrate de incluir el script en index.html');
        console.error('💡 Verifica que el script <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> esté antes del módulo principal');
        console.error('💡 Espera unos segundos y recarga la página si el script se está cargando');
        return null;
    }
    
    console.log('✅ Supabase CDN cargado correctamente');
    console.log('📦 Versión de Supabase:', window.supabase ? 'disponible' : 'no disponible');
    
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Cliente de Supabase inicializado correctamente');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Error al inicializar Supabase:', error);
        console.error('Stack trace:', error.stack);
        return null;
    }
}

// Función para verificar si un teléfono ya existe en la base de datos
export async function checkDuplicatePhone(phone) {
    const client = initSupabase();
    if (!client) return false;
    
    try {
        const { data, error } = await client
            .from(TABLE_NAME)
            .select('telefono')
            .eq('telefono', phone)
            .limit(1);
        
        if (error) {
            console.error('Error al verificar duplicado:', error);
            return false;
        }
        
        return data && data.length > 0;
    } catch (error) {
        console.error('Error al verificar duplicado:', error);
        return false;
    }
}

// Función para guardar un lead en Supabase
export async function saveLeadToSupabase(lead) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase no está configurado' };
    }
    
    try {
        // Verificar duplicado antes de guardar
        const isDuplicate = await checkDuplicatePhone(lead.telefono);
        if (isDuplicate) {
            return { 
                success: false, 
                error: 'duplicate', 
                message: `El teléfono ${lead.telefono} ya existe en la base de datos` 
            };
        }
        
        // Preparar datos para insertar
        const leadData = {
            telefono: lead.telefono,
            nombre: lead.nombre || 'sin nombre',
            correo: lead.correo || 'sin correo',
            provincia: lead.provincia || 'provincia o estado no especificado'
        };
        
        // Insertar en Supabase
        const { data, error } = await client
            .from(TABLE_NAME)
            .insert([leadData])
            .select();
        
        if (error) {
            console.error('Error al guardar lead:', error);
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Error al guardar lead:', error);
        return { success: false, error: error.message };
    }
}

// Función para guardar múltiples leads
export async function saveLeadsToSupabase(leads) {
    console.log(`💾 saveLeadsToSupabase: Iniciando guardado de ${leads.length} leads...`);
    
    const client = initSupabase();
    if (!client) {
        console.error('❌ No se pudo inicializar el cliente de Supabase');
        return { success: false, error: 'Supabase no está configurado', total: leads.length, saved: 0, duplicates: 0, errors: leads.length };
    }
    
    const results = {
        total: leads.length,
        saved: 0,
        duplicates: 0,
        errors: 0,
        details: []
    };
    
    console.log(`📊 Procesando ${leads.length} leads...`);
    
    // Procesar leads uno por uno para detectar duplicados individualmente
    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        if (i % 10 === 0) {
            console.log(`📈 Progreso: ${i}/${leads.length} leads procesados...`);
        }
        
        const result = await saveLeadToSupabase(lead);
        
        if (result.success) {
            results.saved++;
            results.details.push({ 
                telefono: lead.telefono, 
                status: 'saved' 
            });
        } else if (result.error === 'duplicate') {
            results.duplicates++;
            results.details.push({ 
                telefono: lead.telefono, 
                status: 'duplicate' 
            });
        } else {
            results.errors++;
            results.details.push({ 
                telefono: lead.telefono, 
                status: 'error',
                error: result.error 
            });
            if (i < 5) { // Solo mostrar los primeros 5 errores para no saturar la consola
                console.warn(`⚠️ Error al guardar lead ${i + 1}:`, result.error);
            }
        }
    }
    
    console.log(`✅ Guardado completado: ${results.saved} guardados, ${results.duplicates} duplicados, ${results.errors} errores`);
    return results;
}

// Función para obtener todos los leads desde Supabase
export async function getAllLeadsFromSupabase() {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase no está configurado' };
    }
    
    try {
        const { data, error } = await client
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error al obtener leads:', error);
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener leads:', error);
        return { success: false, error: error.message };
    }
}

// Función para obtener leads con filtros
export async function getLeadsWithFilters(filters = {}) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase no está configurado' };
    }
    
    try {
        let query = client.from(TABLE_NAME).select('*');
        
        // Aplicar filtros
        if (filters.provincia) {
            query = query.eq('provincia', filters.provincia);
        }
        
        if (filters.fechaDesde) {
            query = query.gte('created_at', filters.fechaDesde);
        }
        
        if (filters.fechaHasta) {
            query = query.lte('created_at', filters.fechaHasta);
        }
        
        // Ordenar por fecha de creación (más recientes primero)
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error al obtener leads filtrados:', error);
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener leads filtrados:', error);
        return { success: false, error: error.message };
    }
}

// Función para verificar si Supabase está configurado
export function isSupabaseConfigured() {
    return !SUPABASE_CONFIG.url.includes('TU_SUPABASE_URL') && 
           !SUPABASE_CONFIG.anonKey.includes('TU_SUPABASE_ANON_KEY');
}

