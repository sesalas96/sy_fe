import { CompanyService } from '../companyService';

// Mock fetch for testing
global.fetch = jest.fn();

describe('CompanyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage for auth token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue('mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('getCompanies', () => {
    it('should fetch companies successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Test Company',
            taxId: '123456789',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const companies = await CompanyService.getCompanies();
      
      expect(fetch).toHaveBeenCalledWith(
        'https://sybe-production.up.railway.app/api/companies',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
        })
      );
      
      expect(companies).toHaveLength(1);
      expect(companies[0].name).toBe('Test Company');
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(CompanyService.getCompanies()).rejects.toThrow('Server error');
    });
  });

  describe('createCompany', () => {
    it('should create a company successfully', async () => {
      const newCompany = {
        name: 'New Company',
        taxId: '987654321',
        address: 'Test Address',
        phone: '+1234567890',
        email: 'test@company.com',
        industry: 'Technology',
        employeeCount: 50,
        contactPerson: {
          name: 'John Doe',
          position: 'CEO',
          email: 'john@company.com',
          phone: '+1234567890'
        },
        legalRepresentative: {
          name: 'John Doe',
          cedula: '123456789',
          position: 'CEO'
        },
        status: 'active' as const
      };

      const mockResponse = {
        success: true,
        data: {
          ...newCompany,
          id: '2',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await CompanyService.createCompany(newCompany);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://sybe-production.up.railway.app/api/companies',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newCompany),
        })
      );
      
      expect(result.id).toBe('2');
      expect(result.name).toBe('New Company');
    });
  });
});