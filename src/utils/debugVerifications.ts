// Debug utility to understand verification data structure
export const debugVerifications = async (userId: string) => {
  try {
    const token = localStorage.getItem('token');
    
    // Call the API directly to see raw response
    const response = await fetch(
      `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/verifications/users/${userId}/all`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const rawData = await response.json();
    
    console.log('=== DEBUG VERIFICATIONS ===');
    console.log('Raw API Response:', rawData);
    
    // If it's wrapped in a success/data structure
    const data = rawData.data || rawData;
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n=== First Company ===');
      console.log('Full company object:', data[0]);
      
      if (data[0].verifications && data[0].verifications.details) {
        console.log('\n=== First Verification Detail ===');
        const firstVerification = data[0].verifications.details[0];
        console.log('Full verification object:', firstVerification);
        console.log('\nAvailable fields:', Object.keys(firstVerification));
        
        // Check for various ID field names
        console.log('\n=== Checking ID fields ===');
        console.log('id:', firstVerification.id);
        console.log('_id:', firstVerification._id);
        console.log('userVerificationId:', firstVerification.userVerificationId);
        console.log('userCompanyVerificationId:', firstVerification.userCompanyVerificationId);
        
        // Check if there's a submitted verification
        if (firstVerification.submittedVerification) {
          console.log('\n=== Submitted Verification ===');
          console.log('submittedVerification:', firstVerification.submittedVerification);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error debugging verifications:', error);
    throw error;
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugVerifications = debugVerifications;
}