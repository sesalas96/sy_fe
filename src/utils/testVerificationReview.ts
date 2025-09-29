// Test function to verify the review API works correctly
import { userVerificationsApi } from '../services/userVerificationsApi';

export const testApproveVerification = async () => {
  try {
    // Test approving CCSS
    console.log('Testing CCSS approval...');
    const ccssResult = await userVerificationsApi.reviewVerification(
      '68d0ab248a46299f99495c70',
      'approve',
      undefined,
      '2026-01-21T00:00:00.000Z'
    );
    console.log('CCSS approval result:', ccssResult);
    
    // Test approving INS
    console.log('Testing INS approval...');
    const insResult = await userVerificationsApi.reviewVerification(
      '68d0c01b8a46299f99495e91',
      'approve',
      undefined,
      '2025-01-28T00:00:00.000Z'
    );
    console.log('INS approval result:', insResult);
    
    return { ccssResult, insResult };
  } catch (error) {
    console.error('Error testing verification approval:', error);
    throw error;
  }
};

// Add this function to window for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).testApproveVerification = testApproveVerification;
}