/**
 * Utility to test Administrador dashboard API endpoints
 * This can be used for development and debugging
 */

import dashboardService from '../services/dashboardService';

export const testSuperAdminEndpoints = async () => {
  console.log('🔧 Testing Administrador API endpoints...');
  
  try {
    // Test basic dashboard stats
    console.log('📊 Testing /api/dashboard/stats...');
    const stats = await dashboardService.getStats();
    console.log('Stats result:', stats);
    
    // Test activities
    console.log('📋 Testing /api/dashboard/activities...');
    const activities = await dashboardService.getActivities(5, 0);
    console.log('Activities result:', activities);
    
    // Test alerts
    console.log('🚨 Testing /api/dashboard/alerts...');
    const alerts = await dashboardService.getAlerts('all');
    console.log('Alerts result:', alerts);
    
    // Test Administrador specific endpoints
    console.log('🏥 Testing /api/dashboard/system-health...');
    const systemHealth = await dashboardService.getSystemHealth();
    console.log('System Health result:', systemHealth);
    
    console.log('💰 Testing /api/dashboard/revenue...');
    const revenue = await dashboardService.getRevenue();
    console.log('Revenue result:', revenue);
    
    console.log('📈 Testing /api/dashboard/api-usage...');
    const apiUsage = await dashboardService.getApiUsage();
    console.log('API Usage result:', apiUsage);
    
    console.log('✅ All Administrador endpoints tested successfully!');
    return {
      stats,
      activities,
      alerts,
      systemHealth,
      revenue,
      apiUsage
    };
    
  } catch (error) {
    console.error('❌ Error testing Administrador endpoints:', error);
    throw error;
  }
};

// Helper function to call from browser console
(window as any).testSuperAdminAPI = testSuperAdminEndpoints;