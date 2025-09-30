import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Company } from '../types';
import authService from '../services/authService';
import { trackingService } from '../services/trackingService';
import { fileService } from '../services/fileService';
import { userVerificationsApi, UserCompanyVerifications } from '../services/userVerificationsApi';
import { PendingVerificationsCount, calculatePendingVerifications } from '../utils/verificationUtils';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  userAvatarUrl: string | null; // URL del selfie para el avatar
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  // Impersonation
  isImpersonating: boolean;
  originalAdmin: { id: string; email: string } | null;
  impersonateUser: (userId: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  checkImpersonationStatus: () => Promise<void>;
  refreshUserAvatar: () => Promise<void>; // Para refrescar el avatar
  // Pending verifications
  pendingVerifications: PendingVerificationsCount | null;
  refreshPendingVerifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<{ id: string; email: string } | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerificationsCount | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth context...');
        const storedUser = localStorage.getItem('user');
        const storedCompany = localStorage.getItem('company');
        const token = authService.getStoredToken();
        
        if (storedUser && token) {
          try {
            // For real tokens, verify with backend
            await authService.getCurrentUser(token);
            
            // Token is valid, restore user session
            const restoredUser = JSON.parse(storedUser);
            setUser(restoredUser);
            if (storedCompany) {
              setCompany(JSON.parse(storedCompany));
            }
            
            // Load user avatar on session restore
            loadUserAvatar(restoredUser);
            // Load pending verifications
            loadPendingVerifications(restoredUser);
          } catch (error) {
            // Token is invalid or expired, clear everything
            console.warn('Token validation failed, clearing session');
            localStorage.removeItem('user');
            localStorage.removeItem('company');
            authService.removeToken();
            setUser(null);
            setCompany(null);
          }
        } else {
          // No stored session, clear everything
          localStorage.removeItem('user');
          localStorage.removeItem('company');
          authService.removeToken();
          setUser(null);
          setCompany(null);
        }
      } catch (error) {
        // If there's any error during initialization, treat as no session
        console.error('Auth initialization error:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('company');
        authService.removeToken();
        setUser(null);
        setCompany(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Function to load user avatar (selfie)
  const loadUserAvatar = async (userData: User) => {
    try {
      const userId = userData.id || userData._id;
      if (!userId) {
        console.log('No userId available for avatar loading');
        return;
      }

      console.log('Loading avatar for user:', userId);
      
      // Get only identity files to find the selfie
      const response = await fileService.getIdentityFiles(userId);
      
      if (response.success && response.files) {
        const selfieFile = response.files.find((f: any) => f.fieldName === 'selfie');
        
        if (selfieFile) {
          console.log('Selfie found, downloading for avatar:', selfieFile.id);
          const blob = await fileService.downloadContractorFile(selfieFile.id);
          const avatarUrl = URL.createObjectURL(blob);
          
          setUserAvatarUrl(avatarUrl);
          console.log('User avatar loaded successfully');
        } else {
          console.log('No selfie file found for user');
          setUserAvatarUrl(null);
        }
      } else {
        console.log('No identity files found for user');
        setUserAvatarUrl(null);
      }
    } catch (error) {
      console.error('Error loading user avatar:', error);
      setUserAvatarUrl(null);
    }
  };

  // Function to refresh user avatar
  const refreshUserAvatar = async () => {
    if (user) {
      await loadUserAvatar(user);
    }
  };

  // Function to load pending verifications
  const loadPendingVerifications = async (userData: User) => {
    try {
      console.log('Loading pending verifications for user:', userData.email);
      // Try to load verifications for all users
      const verifications = await userVerificationsApi.getMyVerifications();
      console.log('Verifications received:', verifications);
      const pendingCount = calculatePendingVerifications(verifications);
      console.log('Pending count:', pendingCount);
      setPendingVerifications(pendingCount);
    } catch (error) {
      console.error('Error loading pending verifications:', error);
      setPendingVerifications(null);
    }
  };

  // Function to refresh pending verifications
  const refreshPendingVerifications = async () => {
    if (user) {
      await loadPendingVerifications(user);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Call the backend API
      const response = await authService.login(email, password);
      console.log('Login response:', response);
      
      // Store the token
      authService.setToken(response.token);
      
      // Map the response user to our User type
      const user: User = {
        id: response.user.id,
        _id: (response.user as any)._id || response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        name: `${response.user.firstName} ${response.user.lastName}`.trim(),
        role: response.user.role as UserRole,
        company: response.user.company,
        companyId: response.user.company?._id,
        isActive: (response.user as any).isActive ?? (response.user as any).active ?? true,
        active: (response.user as any).active ?? (response.user as any).isActive ?? true,
        status: (response.user as any).status || ((response.user as any).isActive ? 'active' : 'inactive'),
        acceptedTerms: (response.user as any).acceptedTerms ?? true,
        acceptedPrivacyPolicy: (response.user as any).acceptedPrivacyPolicy ?? true,
        termsAcceptedAt: (response.user as any).termsAcceptedAt || new Date().toISOString(),
        privacyPolicyAcceptedAt: (response.user as any).privacyPolicyAcceptedAt || new Date().toISOString(),
        profile: (response.user as any).profile,
        verificationData: (response.user as any).verificationData,
        createdAt: (response.user as any).createdAt || new Date().toISOString(),
        updatedAt: (response.user as any).updatedAt || new Date().toISOString(),
        lastLogin: (response.user as any).lastLogin,
        __v: (response.user as any).__v
      };
      
      // Check if user is active before proceeding
      if (!user.isActive && user.status === 'inactive') {
        throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador para más información.');
      }
      
      // Map company information if it exists
      let companyData: Company | null = null;
      if (response.user.company) {
        companyData = {
          _id: response.user.company._id,
          id: response.user.company._id,
          name: response.user.company.name,
          taxId: response.user.company.ruc,
          address: response.user.company.address,
          phone: response.user.company.phone,
          email: response.user.company.email,
          industry: 'Construction', // Default value
          userCount: 0, // Default value
          isActive: response.user.company.isActive,
          contactPerson: {
            name: `${response.user.firstName} ${response.user.lastName}`.trim(),
            position: 'Administrator',
            email: response.user.email,
            phone: response.user.company.phone
          },
          legalRepresentative: {
            name: `${response.user.firstName} ${response.user.lastName}`.trim(),
            cedula: '',
            position: 'Legal Representative'
          },
          status: response.user.company.isActive ? 'active' : 'inactive',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      
      setUser(user);
      setCompany(companyData);
      localStorage.setItem('user', JSON.stringify(user));
      if (companyData) {
        localStorage.setItem('company', JSON.stringify(companyData));
      } else {
        localStorage.removeItem('company');
      }
      
      // Load user avatar after successful login
      loadUserAvatar(user);
      
      // Check if companiesVerifications came in the login response
      if ((response.user as any).companiesVerifications) {
        console.log('Found companiesVerifications in login response');
        const pendingCount = calculatePendingVerifications((response.user as any).companiesVerifications);
        setPendingVerifications(pendingCount);
      } else {
        // Load pending verifications after successful login
        loadPendingVerifications(user);
      }
      
      // Return the user for login redirect
      return user;
    } catch (error) {
      console.error('Authentication failed:', error);
      // Remove any stored session data on failure
      authService.removeToken();
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      setUser(null);
      setCompany(null);
      throw error; // Re-throw the error so the UI can handle it
    }
  };

  const logout = () => {
    // Track logout before clearing user data
    trackingService.trackAuthEvent('logout');
    
    // Clean up avatar URL
    if (userAvatarUrl) {
      URL.revokeObjectURL(userAvatarUrl);
      setUserAvatarUrl(null);
    }
    
    setUser(null);
    setCompany(null);
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    authService.removeToken();
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  // Impersonation functions
  const checkImpersonationStatus = async () => {
    try {
      const token = authService.getStoredToken();
      if (!token) return;

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api'}/api/auth/impersonation-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setIsImpersonating(result.isImpersonating || false);
        if (result.isImpersonating && result.originalAdmin) {
          setOriginalAdmin(result.originalAdmin);
        } else {
          setOriginalAdmin(null);
        }
      }
    } catch (error) {
      console.error('Error checking impersonation status:', error);
    }
  };

  const impersonateUser = async (userId: string) => {
    try {
      const token = authService.getStoredToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api'}/api/auth/impersonate/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al impersonar usuario');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update token and user state
        authService.setToken(result.token);
        
        // Map the impersonated user
        const impersonatedUser: User = {
          id: result.user.id,
          _id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          name: `${result.user.firstName} ${result.user.lastName}`.trim(),
          role: result.user.role as UserRole,
          company: result.user.company,
          companyId: result.user.company?._id,
          isActive: result.user.isActive ?? true,
          active: result.user.isActive ?? true,
          status: result.user.isActive ? 'active' : 'inactive',
          acceptedTerms: true,
          acceptedPrivacyPolicy: true,
          termsAcceptedAt: new Date().toISOString(),
          privacyPolicyAcceptedAt: new Date().toISOString(),
          profile: result.user.profile,
          verificationData: result.user.verificationData,
          createdAt: result.user.createdAt || new Date().toISOString(),
          updatedAt: result.user.updatedAt || new Date().toISOString(),
          lastLogin: result.user.lastLogin
        };

        setUser(impersonatedUser);
        setIsImpersonating(true);
        setOriginalAdmin(result.user.originalAdmin);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(impersonatedUser));
      }
    } catch (error) {
      console.error('Error impersonating user:', error);
      throw error;
    }
  };

  const endImpersonation = async () => {
    try {
      const token = authService.getStoredToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api'}/api/auth/end-impersonation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al terminar impersonación');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update token and return to admin user
        authService.setToken(result.token);
        
        // Map the admin user
        const adminUser: User = {
          id: result.user.id,
          _id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          name: `${result.user.firstName} ${result.user.lastName}`.trim(),
          role: result.user.role as UserRole,
          company: result.user.company,
          companyId: result.user.company?._id,
          isActive: result.user.isActive ?? true,
          active: result.user.isActive ?? true,
          status: result.user.isActive ? 'active' : 'inactive',
          acceptedTerms: true,
          acceptedPrivacyPolicy: true,
          termsAcceptedAt: new Date().toISOString(),
          privacyPolicyAcceptedAt: new Date().toISOString(),
          profile: result.user.profile,
          verificationData: result.user.verificationData,
          createdAt: result.user.createdAt || new Date().toISOString(),
          updatedAt: result.user.updatedAt || new Date().toISOString(),
          lastLogin: result.user.lastLogin
        };

        setUser(adminUser);
        setIsImpersonating(false);
        setOriginalAdmin(null);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(adminUser));
      }
    } catch (error) {
      console.error('Error ending impersonation:', error);
      throw error;
    }
  };

  // Check impersonation status on mount and token change
  useEffect(() => {
    if (user && !isLoading) {
      checkImpersonationStatus();
    }
  }, [user, isLoading]);

  // Clean up impersonation on component unmount
  useEffect(() => {
    return () => {
      if (isImpersonating) {
        // Silent cleanup on unmount
        navigator.sendBeacon(
          `${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api'}/api/auth/end-impersonation`,
          JSON.stringify({ silent: true })
        );
      }
    };
  }, [isImpersonating]);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        userAvatarUrl,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        hasRole,
        isImpersonating,
        originalAdmin,
        impersonateUser,
        endImpersonation,
        checkImpersonationStatus,
        refreshUserAvatar,
        pendingVerifications,
        refreshPendingVerifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};