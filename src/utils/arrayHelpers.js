/**
 * Utilitários para manipulação segura de arrays
 */

/**
 * Garante que um valor seja um array válido
 * @param {any} value - Valor a ser verificado
 * @returns {Array} Array vazio se o valor for inválido, ou o próprio valor se for um array
 */
export const ensureArray = (value) => {
    return Array.isArray(value) ? value : [];
};

/**
 * Executa map de forma segura em um array
 * @param {any} array - Array para mapear
 * @param {Function} callback - Função de callback do map
 * @returns {Array} Resultado do map ou array vazio
 */
export const safeMap = (array, callback) => {
    return ensureArray(array).map(callback);
};

/**
 * Executa filter de forma segura em um array
 * @param {any} array - Array para filtrar
 * @param {Function} callback - Função de callback do filter
 * @returns {Array} Resultado do filter ou array vazio
 */
export const safeFilter = (array, callback) => {
    return ensureArray(array).filter(callback);
};

/**
 * Executa reduce de forma segura em um array
 * @param {any} array - Array para reduzir
 * @param {Function} callback - Função de callback do reduce
 * @param {any} initialValue - Valor inicial
 * @returns {any} Resultado do reduce ou valor inicial
 */
export const safeReduce = (array, callback, initialValue) => {
    return ensureArray(array).reduce(callback, initialValue);
};
