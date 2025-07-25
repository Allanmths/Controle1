/**
 * UtilitÃ¡rios para manipulaÃ§Ã£o segura de arrays
 */
import debugLog from './debugLog';

/**
 * Garante que um valor seja um array vÃ¡lido
 * @param {any} value - Valor a ser verificado
 * @param {string} name - Nome do array para debug
 * @returns {Array} Array vazio se o valor for invÃ¡lido, ou o prÃ³prio valor se for um array
 */
export const ensureArray = (value, name = 'unknown') => {
    if (!Array.isArray(value)) {
        debugLog.warn(`ensureArray: ${name} is not an array`, { value, type: typeof value });
        return [];
    }
    return value;
};

/**
 * Executa map de forma segura em um array
 * @param {any} array - Array para mapear
 * @param {Function} callback - FunÃ§Ã£o de callback do map
 * @param {string} name - Nome do array para debug
 * @returns {Array} Resultado do map ou array vazio
 */
export const safeMap = (array, callback, name = 'unknown') => {
    const safeArray = ensureArray(array, name);
    debugLog.arrayOperation('map', name, safeArray);
    return safeArray.map(callback);
};

/**
 * Executa filter de forma segura em um array
 * @param {any} array - Array para filtrar
 * @param {Function} callback - FunÃ§Ã£o de callback do filter
 * @param {string} name - Nome do array para debug
 * @returns {Array} Resultado do filter ou array vazio
 */
export const safeFilter = (array, callback, name = 'unknown') => {
    const safeArray = ensureArray(array, name);
    debugLog.arrayOperation('filter', name, safeArray);
    return safeArray.filter(callback);
};

/**
 * Executa reduce de forma segura em um array
 * @param {any} array - Array para reduzir
 * @param {Function} callback - FunÃ§Ã£o de callback do reduce
 * @param {any} initialValue - Valor inicial
 * @param {string} name - Nome do array para debug
 * @returns {any} Resultado do reduce ou valor inicial
 */
export const safeReduce = (array, callback, initialValue, name = 'unknown') => {
    const safeArray = ensureArray(array, name);
    debugLog.arrayOperation('reduce', name, safeArray);
    return safeArray.reduce(callback, initialValue);
};
