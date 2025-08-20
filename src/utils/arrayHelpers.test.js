import { describe, it, expect, vi } from 'vitest';
import { ensureArray, safeMap, safeFilter, safeReduce } from './arrayHelpers';
import debugLog from './debugLog';

// Mock do debugLog para evitar logs nos testes
vi.mock('./debugLog', () => ({
  default: {
    warn: vi.fn(),
    arrayOperation: vi.fn(),
  },
}));

describe('arrayHelpers', () => {
  // Limpa os mocks antes de cada teste
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureArray', () => {
    it('should return the same array if the input is an array', () => {
      const inputArray = [1, 2, 3];
      expect(ensureArray(inputArray)).toBe(inputArray);
      expect(debugLog.warn).not.toHaveBeenCalled();
    });

    it('should return an empty array and log a warning if the input is not an array', () => {
      expect(ensureArray(null, 'nullTest')).toEqual([]);
      expect(debugLog.warn).toHaveBeenCalledWith('ensureArray: nullTest is not an array', { value: null, type: 'object' });
      
      expect(ensureArray(undefined, 'undefinedTest')).toEqual([]);
      expect(debugLog.warn).toHaveBeenCalledWith('ensureArray: undefinedTest is not an array', { value: undefined, type: 'undefined' });

      expect(ensureArray({}, 'objectTest')).toEqual([]);
      expect(ensureArray('string', 'stringTest')).toEqual([]);
      expect(ensureArray(123, 'numberTest')).toEqual([]);
      expect(debugLog.warn).toHaveBeenCalledTimes(5);
    });

    it('should return an empty array for an empty input array without logging a warning', () => {
      expect(ensureArray([], 'emptyTest')).toEqual([]);
      expect(debugLog.warn).not.toHaveBeenCalled();
    });
  });

  describe('safeMap', () => {
    it('should map over a valid array', () => {
      const inputArray = [1, 2, 3];
      const result = safeMap(inputArray, (x) => x * 2, 'mapTest');
      expect(result).toEqual([2, 4, 6]);
      expect(debugLog.arrayOperation).toHaveBeenCalledWith('map', 'mapTest', inputArray);
    });

    it('should return an empty array when mapping over a non-array', () => {
      const result = safeMap(null, (x) => x * 2, 'mapNullTest');
      expect(result).toEqual([]);
      expect(debugLog.warn).toHaveBeenCalledWith('ensureArray: mapNullTest is not an array', { value: null, type: 'object' });
    });
  });

  describe('safeFilter', () => {
    it('should filter a valid array', () => {
      const inputArray = [1, 2, 3, 4];
      const result = safeFilter(inputArray, (x) => x % 2 === 0, 'filterTest');
      expect(result).toEqual([2, 4]);
      expect(debugLog.arrayOperation).toHaveBeenCalledWith('filter', 'filterTest', inputArray);
    });

    it('should return an empty array when filtering a non-array', () => {
      const result = safeFilter(undefined, (x) => x % 2 === 0, 'filterUndefinedTest');
      expect(result).toEqual([]);
      expect(debugLog.warn).toHaveBeenCalledWith('ensureArray: filterUndefinedTest is not an array', { value: undefined, type: 'undefined' });
    });
  });

  describe('safeReduce', () => {
    it('should reduce a valid array', () => {
      const inputArray = [1, 2, 3, 4];
      const result = safeReduce(inputArray, (sum, x) => sum + x, 0, 'reduceTest');
      expect(result).toBe(10);
      expect(debugLog.arrayOperation).toHaveBeenCalledWith('reduce', 'reduceTest', inputArray);
    });

    it('should return the initial value when reducing a non-array', () => {
      const result = safeReduce({}, (sum, x) => sum + x, 100, 'reduceObjectTest');
      expect(result).toBe(100);
      expect(debugLog.warn).toHaveBeenCalledWith('ensureArray: reduceObjectTest is not an array', { value: {}, type: 'object' });
    });

     it('should return the initial value for an empty array', () => {
      const result = safeReduce([], (sum, x) => sum + x, 100, 'reduceEmptyTest');
      expect(result).toBe(100);
      expect(debugLog.arrayOperation).toHaveBeenCalledWith('reduce', 'reduceEmptyTest', []);
    });
  });
});
