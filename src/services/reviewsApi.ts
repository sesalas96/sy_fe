import { apiCall } from '../utils/apiUtils';
import { 
  Review, 
  ReviewSummary, 
  CreateReviewInput, 
  UpdateReviewInput, 
  ReviewFilters as BaseReviewFilters,
  FlagReviewInput 
} from '../types';

// Re-export types that components need
export type { Review, ReviewSummary };

export interface ReviewFilters extends BaseReviewFilters {
  page?: number;
  limit?: number;
}

class ReviewsApi {
  // Get reviews for current user's company
  async getCompanyReviews(filters?: ReviewFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    return await apiCall('GET', `/api/reviews/company?${params.toString()}`);
  }

  // Get reviews for a specific contractor (public endpoint)
  async getContractorReviews(contractorId: string) {
    try {
      const response = await apiCall('GET', `/api/reviews/contractor/${contractorId}`);
      return response;
    } catch (error: any) {
      // Return mock data for development if API is not available
      if (error.status === 404) {
        console.warn('Reviews API not available, returning empty data');
        return { reviews: [] };
      }
      throw error;
    }
  }

  // Get review summary for a contractor
  async getContractorSummary(contractorId: string): Promise<ReviewSummary> {
    try {
      const response = await apiCall('GET', `/api/reviews/summary/${contractorId}`);
      return response;
    } catch (error: any) {
      // Return mock data for development if API is not available
      if (error.status === 404) {
        console.warn('Review summary API not available, returning default data');
        return {
          totalReviews: 0,
          averageRating: 0,
          wouldHireAgainPercentage: 0,
          metrics: {
            punctuality: 0,
            quality: 0,
            safety: 0,
            communication: 0,
            professionalBehavior: 0
          },
          ratingDistribution: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
          }
        };
      }
      throw error;
    }
  }

  // Create a new review
  async createReview(data: CreateReviewInput) {
    return await apiCall('POST', '/api/reviews', data);
  }

  // Get a specific review
  async getReview(reviewId: string) {
    return await apiCall('GET', `/api/reviews/${reviewId}`);
  }

  // Update a review
  async updateReview(reviewId: string, data: UpdateReviewInput) {
    return await apiCall('PUT', `/api/reviews/${reviewId}`, data);
  }

  // Delete a review (soft delete)
  async deleteReview(reviewId: string) {
    return await apiCall('DELETE', `/api/reviews/${reviewId}`);
  }

  // Flag a review
  async flagReview(reviewId: string, data: FlagReviewInput) {
    return await apiCall('POST', `/api/reviews/${reviewId}/flag`, data);
  }

  // Add response to a review (for contractors)
  async respondToReview(reviewId: string, response: string) {
    return await apiCall('POST', `/api/reviews/${reviewId}/response`, {
      response
    });
  }

  // Get pending reviews (works without reviews)
  async getPendingReviews() {
    return await apiCall('GET', '/api/reviews/pending');
  }

  // Get current user's reviews (as contractor)
  async getMyReviews() {
    return await apiCall('GET', '/api/reviews/user/me');
  }

  // Get top contractors
  async getTopContractors(limit: number = 10, minReviews: number = 5) {
    return await apiCall('GET', `/api/reviews/top-contractors?limit=${limit}&minReviews=${minReviews}`);
  }

  // Export reviews
  async exportReviews(format: 'csv' | 'excel', year?: number) {
    const params = new URLSearchParams({ format });
    if (year) params.append('year', year.toString());
    
    return await apiCall('GET', `/api/reviews/export?${params.toString()}`);
  }
}

export const reviewsApi = new ReviewsApi();