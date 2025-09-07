import { safeArray } from './dashboardUtils';

// Test cases for safeArray function
export const testSafeArray = () => {
  console.log('🧪 Testing safeArray function...');
  
  // Test with valid array
  const validArray = [1, 2, 3];
  const result1 = safeArray(validArray);
  console.log('Valid array:', validArray, '→', result1, 'isArray:', Array.isArray(result1));
  
  // Test with undefined
  const result2 = safeArray(undefined);
  console.log('Undefined:', undefined, '→', result2, 'isArray:', Array.isArray(result2));
  
  // Test with null
  const result3 = safeArray(null);
  console.log('Null:', null, '→', result3, 'isArray:', Array.isArray(result3));
  
  // Test with non-array object
  const nonArray = { length: 3, 0: 'a', 1: 'b', 2: 'c' };
  const result4 = safeArray(nonArray as any);
  console.log('Non-array object:', nonArray, '→', result4, 'isArray:', Array.isArray(result4));
  
  // Test with string
  const string = 'hello';
  const result5 = safeArray(string as any);
  console.log('String:', string, '→', result5, 'isArray:', Array.isArray(result5));
  
  // Test filter operation on results
  console.log('Testing filter operations:');
  try {
    const filtered1 = result1.filter(x => x > 1);
    console.log('Valid array filtered:', filtered1);
    
    const filtered2 = result2.filter(x => true);
    console.log('Undefined → array filtered:', filtered2);
    
    const filtered3 = result3.filter(x => true);
    console.log('Null → array filtered:', filtered3);
    
    console.log('✅ All filter operations successful!');
  } catch (error) {
    console.error('❌ Filter operation failed:', error);
  }
  
  console.log('🎉 safeArray test completed!');
};

// Make it available globally for browser console testing
(window as any).testSafeArray = testSafeArray;