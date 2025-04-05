"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Pencil, PlusCircle,Trash2, ArrowRight,ExternalLink, MessageCircle, Upload, File, Download, X } from "lucide-react";
import { useProjectStore, type Project, type Bid, type ProjectFeedback, type ProjectFile } from "@/lib/store";
import { loadStripe } from '@stripe/stripe-js';
import Chat from "@/components/Chat";
import FileUpload from "@/components/FileUpload";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

// This would be your actual publishable key in production
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function ClientDashboard() {
  const router = useRouter();

  const { 
    projects, 
    bids, 
    addProject, 
    updateBidStatus, 
    updateProjectStatus, 
    getBidsForProject,
    approveSubmission,
    addProjectFeedback,
    updateFreelancerRating,
    updatePaymentStatus,
    addProjectFile,
    deleteProjectFile,
    updateProject
  } = useProjectStore();
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectRating, setProjectRating] = useState<number>(0);
  const [projectFeedback, setProjectFeedback] = useState<string>("");
  const [profileRating, setProfileRating] = useState<number>(0);
  const [profileFeedback, setProfileFeedback] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Array<{label: string, value: string}>>([]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000]);
  const [timelineRange, setTimelineRange] = useState<[number, number]>([1, 90]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState<string | null>(null);

  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const skillOptions = [
    { label: "React", value: "React" },
    { label: "Node.js", value: "Node.js" },
    { label: "TypeScript", value: "TypeScript" },
    { label: "Next.js", value: "Next.js" },
    { label: "Python", value: "Python" },
    { label: "Java", value: "Java" },
    { label: "AWS", value: "AWS" },
    { label: "UI/UX Design", value: "UI/UX Design" },
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSkills([]);
    setBudgetRange([0, 10000]);
    setTimelineRange([1, 90]);
    setStatusFilter("all");
  };

  const filteredProjects = projects.filter(project => {
    if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !project.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (statusFilter !== "all" && project.status !== statusFilter) {
      return false;
    }
    
    if (selectedSkills.length > 0) {
      const projectHasSelectedSkill = selectedSkills.some(selectedSkill => 
        project.skills.includes(selectedSkill.value)
      );
      if (!projectHasSelectedSkill) return false;
    }
    
    if (project.budget < budgetRange[0] || project.budget > budgetRange[1]) {
      return false;
    }
    
    if (project.timeline < timelineRange[0] || project.timeline > timelineRange[1]) {
      return false;
    }
    
    return true;
  });

  const handleProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      budget: Number(formData.get("budget")),
      timeline: Number(formData.get("timeline")),
      skills: (formData.get("skills") as string).split(",").map(s => s.trim()),
      status: "open",
      clientId: "current-user-id",
      createdAt: new Date().toISOString(),
      projectFiles: [],
      fileUpdates: []
    };

    addProject(newProject);
    
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        const fileToAdd: Omit<ProjectFile, "id"> = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadDate: new Date().toISOString(),
          uploadedBy: "client"
        };
        
        addProjectFile(newProject.id, fileToAdd);
      });
    }
    
    setIsDialogOpen(false);
    setUploadedFiles([]);
  };

  const handleEditProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectToEdit) return;
    
    const formData = new FormData(e.currentTarget);
    
    const updatedProject: Partial<Project> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      budget: Number(formData.get("budget")),
      timeline: Number(formData.get("timeline")),
      skills: (formData.get("skills") as string).split(",").map(s => s.trim())
    };
    
    updateProject(projectToEdit.id, updatedProject);
    setProjectToEdit(null);
    setIsEditDialogOpen(false);
  };

  const handleAcceptBid = (bid: Bid) => {
    updateBidStatus(bid.id, "accepted");
    updateProjectStatus(bid.projectId, "in_progress");
    alert("Bid accepted! Developer can now work on your project.");
  };

  const handlePayment = async (project: Project) => {
    try {
      setIsPaymentProcessing(true);
      
      const acceptedBid = bids.find(bid => 
        bid.projectId === project.id && bid.status === "accepted"
      );
      
      if (!acceptedBid) {
        alert('Error: No accepted bid found for this project');
        setIsPaymentProcessing(false);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: acceptedBid.amount * 100,
          projectId: project.id,
          bidId: acceptedBid.id
        }),
      });
      
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid server response');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session');
      }
      
      const { sessionId } = data;
      
      if (!sessionId) {
        throw new Error('No session ID received from server');
      }
      
      const result = await stripe.redirectToCheckout({ sessionId });
      
      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }
      
    } catch (error: any) {
      alert(`Payment failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleReview = (project: Project) => {
    setSelectedProject(project);
    setIsReviewDialogOpen(true);
  };

  const submitFeedback = () => {
    if (!selectedProject || projectRating === 0) return;
    
    const acceptedBid = bids.find(bid => 
      bid.projectId === selectedProject.id && bid.status === "accepted"
    );
    
    if (!acceptedBid) return;
    
    const feedback: ProjectFeedback = {
      id: Date.now().toString(),
      projectId: selectedProject.id,
      freelancerId: acceptedBid.freelancerId,
      rating: projectRating,
      comment: projectFeedback,
      createdAt: new Date().toISOString()
    };
    
    addProjectFeedback(feedback);
    
    if (profileRating > 0) {
      updateFreelancerRating(acceptedBid.freelancerId, profileRating, profileFeedback);
    }
    
    updateProjectStatus(selectedProject.id, "completed");
    approveSubmission(selectedProject.id);
    
    setProjectRating(0);
    setProjectFeedback("");
    setProfileRating(0);
    setProfileFeedback("");
    setIsReviewDialogOpen(false);
    setSelectedProject(null);
  };

  const clientProjects = projects.filter(project => project.clientId === "current-user-id");

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-end items-center"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto flex flex-col">
            <DialogHeader>
              <DialogTitle>Create a New Project</DialogTitle>
            </DialogHeader>
            <form id="project-form" onSubmit={handleProjectSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input name="name" required />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea name="description" required />
              </div>
              <div>
                <label className="text-sm font-medium">Budget (₹)</label>
                <Input type="number" name="budget" required min={1} />
              </div>
              <div>
                <label className="text-sm font-medium">Timeline (days)</label>
                <Input type="number" name="timeline" required min={1} />
              </div>
              <div>
                <label className="text-sm font-medium">Required Skills (comma-separated)</label>
                <Input name="skills" required placeholder="React, Node.js, TypeScript" />
              </div>
              <div>
                <label className="text-sm font-medium">Project Files (Optional)</label>
                <div className="mt-2">
                  <FileUpload onUpload={setUploadedFiles} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload any relevant files for the project requirements
                </p>
              </div>
            </form>
            <div className="pt-4 border-t mt-4 sticky bottom-0 bg-background">
              <Button type="submit" form="project-form" className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
      
    <div className="flex flex-wrap gap-3">
      <Button 
        onClick={() => setIsDialogOpen(true)} 
        variant="default"
        className="hover-scale hover-shadow flex items-center gap-2 bg-primary text-primary-foreground font-medium px-4 py-2"
      >
        <PlusCircle className="w-4 h-4 mr-1" />
        Create New Project
      </Button>
    </div>

    {filteredProjects.length === 0 && clientProjects.length > 0 ? (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No projects match your filters</p>
        <Button onClick={resetFilters} variant="outline">Clear Filters</Button>
      </Card>
    ) : (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2"
      >
        {filteredProjects.map((project) => {
          const projectBids = getBidsForProject(project.id);
          
          return (
            <motion.div key={project.id} variants={itemVariants}>
              <Card className="hover-scale hover-shadow p-6 overflow-hidden border-t-4 border-t-primary/80 h-full flex flex-col hover-lift transition-all">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="hover-pop">
                      {project.status === "open" 
                        ? "Open" 
                        : project.status === "in_progress" 
                          ? "In Progress" 
                          : "Completed"}
                    </Badge>
                    
                    {project.status === "open" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => {
                          setProjectToEdit(project);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        ✏️
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground mt-2 line-clamp-3">{project.description}</p>
                <div className="mt-4 space-y-2 mb-auto">
                  <div className="flex justify-between hover-border-animation">
                    <span className="text-sm font-medium">Budget:</span>
                    <span className="font-medium">₹{project.budget}</span>
                  </div>
                  <div className="flex justify-between hover-border-animation">
                    <span className="text-sm font-medium">Timeline:</span>
                    <span>{project.timeline} days</span>
                  </div>
                </div>
                <div className="mt-4 border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="hover-pop">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {project.status === "in_progress" && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2 flex justify-between items-center">
                      <span>Project Files</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowFileUpload(project.id)} 
                        className="text-xs"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Upload File
                      </Button>
                    </h4>
                    
                    {showFileUpload === project.id && (
                      <div className="mb-4 p-3 border rounded-md bg-muted/30">
                        <FileUpload 
                          onUpload={(files) => {
                            files.forEach(file => {
                              const fileToAdd: Omit<ProjectFile, "id"> = {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                url: URL.createObjectURL(file), 
                                uploadDate: new Date().toISOString(),
                                uploadedBy: "client"
                              };
                              
                              addProjectFile(project.id, fileToAdd);
                            });
                            setShowFileUpload(null);
                          }} 
                        />
                      </div>
                    )}
                    
                    {project.projectFiles && project.projectFiles.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {project.projectFiles.map((file) => (
                          <div 
                            key={file.id}
                            className="flex items-center p-2 bg-muted/40 rounded-md hover:bg-muted transition-colors"
                          >
                            <div className="p-2 bg-primary/10 rounded-md mr-3">
                              <File className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB · {new Date(file.uploadDate).toLocaleDateString()}
                                {file.uploadedBy === "developer" && " · Added by developer"}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-2"
                                asChild
                              >
                                <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              
                              {/* Only allow deletion of files uploaded by the client */}
                              {file.uploadedBy === "client" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this file?")) {
                                      deleteProjectFile(project.id, file.id, "client");
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
                    )}
                  </div>
                )}

                {project.status === "in_progress" && project.submissionStatus === "submitted" && (
                  <div className="mt-4 p-4 border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 rounded-lg hover-glow">
                    <h4 className="font-medium text-blue-700 dark:text-blue-300">Project Submitted</h4>
                    <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">
                      The developer has completed and submitted this project for your review.
                    </p>
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex gap-2">
                        {project.paymentStatus !== "paid" && (
                          <Button
                            size="sm"
                            onClick={() => handlePayment(project)}
                            disabled={isPaymentProcessing}
                            className="relative overflow-hidden hover-ripple"
                          >
                            {isPaymentProcessing ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                                Processing...
                              </span>
                            ) : (
                              "Pay Now"
                            )}
                          </Button>
                        )}
                        
                        {project.paymentStatus === "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(project)}
                            className="hover-slide-cta group"
                          >
                            Review Project
                            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                          </Button>
                        )}
                        
                        {project.submissionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="hover-slide-cta group"
                          >
                            <a href={project.submissionUrl} target="_blank" rel="noopener noreferrer">
                              View Submission
                              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                      
                      {project.paymentStatus !== "paid" ? (
                        <p className="text-xs text-muted-foreground">
                          Please complete payment to review the project
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Payment complete. You can now review the project.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {projectBids.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Bids Received</h4>
                    <div className="space-y-4">
                      {projectBids.map((bid) => (
                        <div key={bid.id} className="border rounded-lg p-4 hover-card-3d">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Bid Amount: ₹{bid.amount}</p>
                              <p className="text-sm text-muted-foreground">
                                Timeline: {bid.timeline} days
                              </p>
                            </div>
                            <Badge variant={
                              bid.status === "accepted"
                                ? "secondary"
                                : bid.status === "rejected"
                                ? "destructive"
                                : "outline"
                            } className="hover-pop">
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm">{bid.proposal}</p>
                          
                          {project.status === "open" && bid.status === "pending" && (
                            <div className="mt-4 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptBid(bid)}
                              >
                                Accept Bid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBidStatus(bid.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {project.status === "open" && projectBids.length === 0 && (
                  <div className="mt-6 text-center p-4 border rounded-lg border-dashed">
                    <p className="text-muted-foreground">No bids received yet.</p>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    )}

    {selectedProject && (
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review & Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium">Project Feedback</h3>
              <div>
                <label className="text-sm font-medium">Project Rating</label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer transition-all hover:scale-110 ${
                        star <= projectRating ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                      onClick={() => setProjectRating(star)}
                    />
                  ))}
                </div>
                {projectRating > 0 && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    {projectRating === 5 ? "Excellent" : 
                     projectRating === 4 ? "Very Good" : 
                     projectRating === 3 ? "Good" : 
                     projectRating === 2 ? "Fair" : "Poor"}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Project Feedback</label>
                <Textarea
                  value={projectFeedback}
                  onChange={(e) => setProjectFeedback(e.target.value)}
                  placeholder="How was the quality of the delivered project?"
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Developer Profile Review (Optional)</h3>
              <div>
                <label className="text-sm font-medium">Developer Rating</label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer transition-all hover:scale-110 ${
                        star <= profileRating ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                      onClick={() => setProfileRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Profile Feedback</label>
                <Textarea
                  value={profileFeedback}
                  onChange={(e) => setProfileFeedback(e.target.value)}
                  placeholder="How was your overall experience with this developer?"
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>

            <Button
              className="w-full"
              disabled={projectRating === 0}
              onClick={submitFeedback}
            >
              Submit Review & Complete Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}

    {projectToEdit && (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form id="edit-project-form" onSubmit={handleEditProject} className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div>
              <label className="text-sm font-medium">Project Name</label>
              <Input name="name" defaultValue={projectToEdit.name} required />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea name="description" defaultValue={projectToEdit.description} required />
            </div>
            <div>
              <label className="text-sm font-medium">Budget (₹)</label>
              <Input type="number" name="budget" defaultValue={projectToEdit.budget} required min={1} />
            </div>
            <div>
              <label className="text-sm font-medium">Timeline (days)</label>
              <Input type="number" name="timeline" defaultValue={projectToEdit.timeline} required min={1} />
            </div>
            <div>
              <label className="text-sm font-medium">Required Skills (comma-separated)</label>
              <Input name="skills" defaultValue={projectToEdit.skills.join(", ")} required />
            </div>
          </form>
          <div className="pt-4 border-t mt-4 sticky bottom-0 bg-background">
            <Button type="submit" form="edit-project-form" className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}

    {/* Chat button */}
    <motion.div
      className="fixed bottom-4 right-4 z-40"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        className="rounded-full w-12 h-12 shadow-lg hover-glow"
        onClick={() => setIsChatOpen(true)}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </motion.div>
    
    {/* Chat component */}
    <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userRole="client" />
  </div>
  );
}