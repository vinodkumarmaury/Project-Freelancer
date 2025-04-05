import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectFile {
  name: string;
  size: number;
  type: string;
  url: string;
  uploadDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  timeline: number;
  skills: string[];
  status: "open" | "in_progress" | "completed";
  clientId?: string;
  createdAt: string;
  submissionStatus?: "pending" | "submitted" | "approved";
  submissionUrl?: string;
  paymentStatus?: "pending" | "paid";
  projectFiles?: ProjectFile[];
}

export interface Bid {
  id: string;
  projectId: string;
  freelancerId: string;
  amount: number;
  timeline: number;
  proposal: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface ProjectFeedback {
  id: string;
  projectId: string;
  freelancerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface FreelancerRating {
  freelancerId: string;
  ratings: Array<{
    rating: number;
    feedback?: string;
    date: string;
  }>;
  averageRating: number;
}

export interface Freelancer {
  id: string;
  name: string;
  totalEarnings: number;
}

interface ProjectStore {
  projects: Project[];
  bids: Bid[];
  projectFeedbacks: ProjectFeedback[];
  freelancerRatings: FreelancerRating[];
  freelancers: Freelancer[];
  
  addProject: (project: Project) => void;
  addBid: (bid: Bid) => void;
  updateBidStatus: (bidId: string, status: Bid['status']) => void;
  updateProjectStatus: (projectId: string, status: Project['status']) => void;
  getProjectById: (id: string) => Project | undefined;
  getBidsForProject: (projectId: string) => Bid[];
  submitProject: (projectId: string, submissionUrl: string) => void;
  approveSubmission: (projectId: string) => void;
  
  addProjectFeedback: (feedback: ProjectFeedback) => void;
  getProjectFeedbackForFreelancer: (freelancerId: string) => ProjectFeedback[];
  updateFreelancerRating: (freelancerId: string, rating: number, feedback?: string) => void;
  getFreelancerRating: (freelancerId: string) => number;
  updatePaymentStatus: (projectId: string, status: "pending" | "paid") => void;
  updateFreelancerEarnings: (freelancerId: string, amount: number) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      bids: [],
      projectFeedbacks: [],
      freelancerRatings: [],
      freelancers: [
        {
          id: "current-freelancer-id",
          name: "John Doe",
          totalEarnings: 0
        }
      ],
      
      addProject: (project) => set((state) => ({ 
        projects: [...state.projects, project] 
      })),
      addBid: (bid) => set((state) => ({ 
        bids: [...state.bids, bid] 
      })),
      updateBidStatus: (bidId, status) => set((state) => ({
        bids: state.bids.map(bid => 
          bid.id === bidId ? { ...bid, status } : bid
        )
      })),
      updateProjectStatus: (projectId, status) => set((state) => ({
        projects: state.projects.map(project =>
          project.id === projectId ? { ...project, status } : project
        )
      })),
      getProjectById: (id) => get().projects.find(p => p.id === id),
      getBidsForProject: (projectId) => get().bids.filter(b => b.projectId === projectId),
      submitProject: (projectId, submissionUrl) => set((state) => ({
        projects: state.projects.map(project =>
          project.id === projectId ? { 
            ...project, 
            submissionStatus: "submitted",
            submissionUrl 
          } : project
        )
      })),
      approveSubmission: (projectId) => set((state) => ({
        projects: state.projects.map(project =>
          project.id === projectId ? { 
            ...project, 
            submissionStatus: "approved"
          } : project
        )
      })),
      
      addProjectFeedback: (feedback) => set((state) => ({
        projectFeedbacks: [...state.projectFeedbacks, feedback]
      })),
      
      getProjectFeedbackForFreelancer: (freelancerId) => {
        return get().projectFeedbacks.filter(f => f.freelancerId === freelancerId);
      },
      
      updateFreelancerRating: (freelancerId, rating, feedback) => set((state) => {
        const existingRatingIndex = state.freelancerRatings.findIndex(
          r => r.freelancerId === freelancerId
        );
        
        if (existingRatingIndex >= 0) {
          const updatedRatings = [...state.freelancerRatings];
          const freelancer = {...updatedRatings[existingRatingIndex]};
          
          freelancer.ratings.push({
            rating,
            feedback,
            date: new Date().toISOString()
          });
          
          const sum = freelancer.ratings.reduce((acc, curr) => acc + curr.rating, 0);
          freelancer.averageRating = sum / freelancer.ratings.length;
          
          updatedRatings[existingRatingIndex] = freelancer;
          return { freelancerRatings: updatedRatings };
        } else {
          return {
            freelancerRatings: [
              ...state.freelancerRatings,
              {
                freelancerId,
                ratings: [{
                  rating,
                  feedback,
                  date: new Date().toISOString()
                }],
                averageRating: rating
              }
            ]
          };
        }
      }),
      
      getFreelancerRating: (freelancerId) => {
        const ratingEntry = get().freelancerRatings.find(
          r => r.freelancerId === freelancerId
        );
        return ratingEntry ? ratingEntry.averageRating : 0;
      },
      
      updatePaymentStatus: (projectId, paymentStatus) => set((state) => ({
        projects: state.projects.map(project =>
          project.id === projectId ? { 
            ...project, 
            paymentStatus
          } : project
        )
      })),
      
      updateFreelancerEarnings: (freelancerId, amount) => 
        set((state) => ({
          freelancers: state.freelancers.map((freelancer) => 
            freelancer.id === freelancerId 
              ? { ...freelancer, totalEarnings: (freelancer.totalEarnings || 0) + amount } 
              : freelancer
          )
        })),
    }),
    {
      name: 'project-store',
    }
  )
);