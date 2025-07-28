/**
 * Sistema de logging para debug em produção
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const debugLog = {
    info: (message, data = null) => {
        if (isDevelopment) {
            console.log(`[DEBUG] ${message}`, data);
        }
    },
    
    warn: (message, data = null) => {
        console.warn(`[WARNING] ${message}`, data);
    },
    
    error: (message, error = null) => {
        console.error(`[ERROR] ${message}`, error);
        
        // Em produção, podemos enviar erros para um serviço de monitoramento
        if (isProduction) {
            // Aqui poderia enviar para Sentry, LogRocket, etc.
        }
    },
    
    arrayOperation: (operation, arrayName, array) => {
        if (!Array.isArray(array)) {
            debugLog.error(`Array operation '${operation}' failed: ${arrayName} is not an array`, { arrayName, array, type: typeof array });
            return false;
        }
        
        if (isDevelopment) {
            debugLog.info(`Array operation '${operation}' on '${arrayName}' with ${array.length} items`);
        }
        return true;
    }
};

export default debugLog;
