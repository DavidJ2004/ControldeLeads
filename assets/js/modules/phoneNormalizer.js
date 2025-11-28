// Módulo para normalización de números de teléfono

// Función para detectar si un número es ecuatoriano
export function isEcuadorianNumber(phone) {
    if (!phone || phone === '') {
        return false;
    }
    
    const phoneStr = String(phone);
    let cleaned = phoneStr.replace(/[\s\-\(\)\.]/g, '');
    
    // Verificar si tiene código de país 593 (Ecuador)
    if (cleaned.startsWith('+593') || cleaned.startsWith('593') || cleaned.startsWith('00593')) {
        return true;
    }
    
    // Obtener solo dígitos
    const digitsOnly = cleaned.replace(/\D/g, '');
    
    // Si empieza con 0 y tiene 9 o 10 dígitos, es ecuatoriano
    if (digitsOnly.startsWith('0') && (digitsOnly.length === 9 || digitsOnly.length === 10)) {
        return true;
    }
    
    // Si tiene exactamente 9 dígitos y NO empieza con código de país extranjero, es ecuatoriano
    if (digitsOnly.length === 9) {
        const firstDigit = digitsOnly[0];
        if (firstDigit === '9' || firstDigit === '8' || firstDigit === '7' || firstDigit === '6' || firstDigit === '5') {
            return true;
        }
        if (!cleaned.startsWith('+') && !cleaned.startsWith('00')) {
            return true;
        }
    }
    
    // Si tiene 10 dígitos y empieza con 0, es ecuatoriano
    if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
        return true;
    }
    
    // Si tiene entre 9 y 10 dígitos y no tiene código de país, probablemente es ecuatoriano
    if ((digitsOnly.length === 9 || digitsOnly.length === 10) && !cleaned.startsWith('+') && !cleaned.startsWith('00')) {
        const commonForeignCodes = ['1', '44', '34', '52', '54', '55', '56', '57', '58', '51'];
        let hasForeignCode = false;
        for (const code of commonForeignCodes) {
            if (digitsOnly.startsWith(code) && digitsOnly.length > 10) {
                hasForeignCode = true;
                break;
            }
        }
        if (!hasForeignCode) {
            return true;
        }
    }
    
    return false;
}

// Función para extraer código de país de un número extranjero
function extractCountryCode(phone) {
    if (!phone || phone === '') {
        return null;
    }
    
    const phoneStr = String(phone);
    let cleaned = phoneStr.replace(/[\s\-\(\)\.]/g, '');
    
    // Si empieza con +, extraer código de país
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
        const countryCodeMatch = cleaned.match(/^(\d{1,3})/);
        if (countryCodeMatch) {
            return '+' + countryCodeMatch[1];
        }
    }
    
    // Si empieza con 00 (formato internacional sin +)
    if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
        const countryCodeMatch = cleaned.match(/^(\d{1,3})/);
        if (countryCodeMatch) {
            return '+' + countryCodeMatch[1];
        }
    }
    
    // Si no tiene + pero tiene muchos dígitos, podría tener código de país
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length > 10) {
        const commonCodes = ['1', '44', '34', '52', '54', '55', '56', '57', '58', '51', '506', '507', '502', '503', '504', '505', '506'];
        for (const code of commonCodes) {
            if (digitsOnly.startsWith(code) && code !== '593') {
                return '+' + code;
            }
        }
    }
    
    return null;
}

// Función para normalizar números de teléfono
export function normalizePhoneNumber(phone) {
    if (!phone || phone === '') {
        return '';
    }
    
    const phoneStr = String(phone).trim();
    
    // Si es un valor por defecto, no normalizar
    if (phoneStr.toLowerCase() === 'sin telefono' || phoneStr.toLowerCase() === 'sin teléfono') {
        return phoneStr;
    }
    
    // Verificar si es un número ecuatoriano
    if (isEcuadorianNumber(phoneStr)) {
        // Normalizar número ecuatoriano a formato 0XXXXXXXXX
        let cleaned = phoneStr.replace(/[\s\-\(\)\.]/g, '');
        
        // Remover código de país si existe (+593, 593, 00593)
        if (cleaned.startsWith('+593')) {
            cleaned = cleaned.substring(4);
        } else if (cleaned.startsWith('593')) {
            cleaned = cleaned.substring(3);
        } else if (cleaned.startsWith('00593')) {
            cleaned = cleaned.substring(5);
        }
        
        // Remover cualquier carácter que no sea dígito
        cleaned = cleaned.replace(/\D/g, '');
        
        // Si está vacío después de limpiar, retornar vacío
        if (cleaned === '') {
            return '';
        }
        
        // Si tiene menos de 9 dígitos, no es un número válido, retornar original
        if (cleaned.length < 9) {
            return phoneStr;
        }
        
        // Si ya está en formato correcto (0 + 9 dígitos = 10 total), retornar
        if (cleaned.startsWith('0') && cleaned.length === 10) {
            return cleaned;
        }
        
        // Si tiene 9 dígitos, agregar 0 al inicio
        if (cleaned.length === 9) {
            return '0' + cleaned;
        }
        
        // Si tiene 10 dígitos pero no empieza con 0, remover el primer dígito y agregar 0
        if (cleaned.length === 10 && !cleaned.startsWith('0')) {
            return '0' + cleaned.substring(1);
        }
        
        // Si tiene más de 10 dígitos, tomar los últimos 9 y agregar 0
        if (cleaned.length > 10) {
            const last9 = cleaned.substring(cleaned.length - 9);
            return '0' + last9;
        }
        
        // Por defecto, asegurar formato correcto
        if (!cleaned.startsWith('0')) {
            cleaned = '0' + cleaned;
        }
        
        // Asegurar exactamente 10 dígitos
        if (cleaned.length !== 10) {
            if (cleaned.length < 10) {
                return cleaned;
            } else {
                return cleaned.substring(0, 10);
            }
        }
        
        return cleaned;
    } else {
        // Es un número extranjero, mantener formato con código de país
        const countryCode = extractCountryCode(phoneStr);
        
        if (countryCode) {
            let cleaned = phoneStr.replace(/[\s\-\(\)\.]/g, '');
            
            if (cleaned.startsWith('+')) {
                return cleaned.replace(/\s/g, '');
            }
            
            if (cleaned.startsWith('00')) {
                cleaned = '+' + cleaned.substring(2);
                return cleaned.replace(/\s/g, '');
            }
            
            if (!cleaned.startsWith('+') && countryCode) {
                const digitsOnly = cleaned.replace(/\D/g, '');
                const codeDigits = countryCode.replace('+', '');
                if (digitsOnly.startsWith(codeDigits)) {
                    return countryCode + digitsOnly.substring(codeDigits.length);
                }
            }
        }
        
        // Si no se puede detectar código de país pero parece extranjero, mantener original
        const digitsOnly = phoneStr.replace(/\D/g, '');
        if (digitsOnly.length > 10 || phoneStr.includes('+') || phoneStr.startsWith('00')) {
            return phoneStr.replace(/[\s\-\(\)\.]/g, '').replace(/^00/, '+');
        }
        
        return phoneStr;
    }
}

// Función para detectar columnas que contienen números de teléfono
export function detectPhoneColumns(headers, sampleData) {
    const phoneKeywords = ['telefono', 'teléfono', 'phone', 'celular', 'movil', 'móvil', 'contacto', 'whatsapp'];
    const phoneColumns = [];
    
    headers.forEach(header => {
        const headerLower = header.toLowerCase();
        
        const isPhoneColumn = phoneKeywords.some(keyword => headerLower.includes(keyword));
        
        if (isPhoneColumn) {
            phoneColumns.push(header);
        } else {
            let phonePatternCount = 0;
            const sampleSize = Math.min(10, sampleData.length);
            
            for (let i = 0; i < sampleSize; i++) {
                const value = String(sampleData[i][header] || '');
                if (/\d/.test(value) && (value.includes('593') || value.includes('+') || value.startsWith('00') || /\d{9,}/.test(value.replace(/\D/g, '')))) {
                    phonePatternCount++;
                }
            }
            
            if (phonePatternCount > sampleSize * 0.5) {
                phoneColumns.push(header);
            }
        }
    });
    
    return phoneColumns;
}

// Función para normalizar todos los números de teléfono en los datos
export function normalizePhoneNumbers(data) {
    if (!data || data.length === 0) {
        return data;
    }
    
    const headers = Object.keys(data[0]);
    const phoneColumns = detectPhoneColumns(headers, data);
    
    if (phoneColumns.length === 0) {
        return data;
    }
    
    const normalizedData = data.map(row => {
        const normalizedRow = { ...row };
        
        phoneColumns.forEach(column => {
            if (normalizedRow[column]) {
                normalizedRow[column] = normalizePhoneNumber(normalizedRow[column]);
            }
        });
        
        return normalizedRow;
    });
    
    return normalizedData;
}

// Función para verificar si un lead tiene número extranjero
export function hasForeignPhone(lead, phoneColumns) {
    if (!phoneColumns || phoneColumns.length === 0) {
        return false;
    }
    
    for (const column of phoneColumns) {
        const phone = lead[column];
        if (phone && phone !== '' && phone !== '-') {
            if (!isEcuadorianNumber(phone)) {
                return true;
            }
        }
    }
    
    return false;
}

// Función para filtrar leads extranjeros
export function filterForeignLeads(data) {
    if (!data || data.length === 0) {
        return [];
    }
    
    const headers = Object.keys(data[0]);
    const phoneColumns = detectPhoneColumns(headers, data);
    
    if (phoneColumns.length === 0) {
        return [];
    }
    
    return data.filter(lead => hasForeignPhone(lead, phoneColumns));
}

