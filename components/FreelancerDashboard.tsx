"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { GithubIcon, LinkedinIcon, Globe, Star, Search, CreditCard, File, Download, Upload, X } from "lucide-react";
import { useProjectStore, type Project, type Bid, type ProjectFile } from "@/lib/store";
import { toast } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import FileUpload from "@/components/FileUpload";

// Define the missing skillLevels object
const skillLevels: Record<string, number> = {
  "React.js": 95,
  "Node.js": 88,
  "TypeScript": 92,
  "Next.js": 85,
  "UI/UX Design": 75,
};

// Define mock completed projects type
interface CompletedProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  demoUrl: string;
  githubUrl: string;
  testimonial?: string;
  clientRating?: number;
}

// Define mock completed projects
const completedProjects: CompletedProject[] = [
  {
    id: "1",
    name: "E-commerce Dashboard",
    description: "A responsive admin dashboard for a fashion e-commerce website",
    technologies: ["React", "TypeScript", "Tailwind CSS"],
    demoUrl: "https://example.com/demo1",
    githubUrl: "https://github.com/johndoe/ecommerce-dashboard",
    testimonial: "John delivered the project on time with exceptional quality",
    clientRating: 5,
  },
  {
    id: "2",
    name: "Task Management App",
    description: "A drag-and-drop task management application with real-time updates",
    technologies: ["Vue.js", "Firebase", "SCSS"],
    demoUrl: "https://example.com/demo2",
    githubUrl: "https://github.com/johndoe/task-manager",
    testimonial: "Great communication and problem-solving skills",
    clientRating: 4.5,
  },
];

export default function FreelancerDashboard() {
  const {
    projects,
    bids,
    addBid,
    getBidsForProject,
    submitProject,
    getProjectFeedbackForFreelancer,
    addProjectFile,
    deleteProjectFile,
    freelancers, // Add this
  } = useProjectStore();
  const [rating, setRating] = useState(4.5);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkill, setFilterSkill] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"budget" | "timeline">("budget");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [projectToSubmit, setProjectToSubmit] = useState<Project | null>(null);
  const [showFileUpload, setShowFileUpload] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<{
    name: string;
    earnings: number;
  }[]>([
    { name: "Jan", earnings: 0 },
    { name: "Feb", earnings: 0 },
    { name: "Mar", earnings: 0 },
    { name: "Apr", earnings: 0 },
    { name: "May", earnings: 0 },
    { name: "Jun", earnings: 0 },
  ]);

  const currentFreelancer = freelancers.find(f => f.id === "current-freelancer-id");
  const totalEarnings = currentFreelancer?.totalEarnings || 0;

  const myBids = bids.filter((bid) => bid.freelancerId === "current-freelancer-id");

  const myCompletedProjects = projects.filter((project) => {
    const acceptedBid = bids.find(
      (bid) =>
        bid.projectId === project.id &&
        bid.freelancerId === "current-freelancer-id" &&
        bid.status === "accepted"
    );
    return project.status === "completed" && acceptedBid;
  });

  const myFeedback = getProjectFeedbackForFreelancer("current-freelancer-id");

  useEffect(() => {
    if (totalEarnings > 0) {
      const currentMonth = new Date().getMonth();
      const updatedEarningsData = [...earningsData];

      updatedEarningsData[currentMonth].earnings = totalEarnings * 0.6;

      if (currentMonth > 0) {
        updatedEarningsData[currentMonth - 1].earnings = totalEarnings * 0.3;
      }

      if (currentMonth > 1) {
        updatedEarningsData[currentMonth - 2].earnings = totalEarnings * 0.1;
      }

      setEarningsData(updatedEarningsData);
    }
  }, [totalEarnings]);

  const handleBidSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const newBid: Bid = {
      id: Date.now().toString(),
      projectId: selectedProject.id,
      freelancerId: "current-freelancer-id",
      amount: Number(formData.get("amount")),
      timeline: Number(formData.get("timeline")),
      proposal: formData.get("proposal") as string,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    addBid(newBid);
    toast.success("New bid received for your project!");
    setSelectedProject(null);
    setIsSubmitting(false);
  };

  const handleSubmitProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectToSubmit) return;
    submitProject(projectToSubmit.id, submissionUrl);
    setProjectToSubmit(null);
    setSubmissionUrl("");
  };

  const handleSaveProject = (projectId: string) => {
    const savedProjects = JSON.parse(localStorage.getItem("savedProjects") || "[]");
    localStorage.setItem("savedProjects", JSON.stringify([...savedProjects, projectId]));
  };

  useEffect(() => {
    if (selectedProject) {
      const viewedProjects = JSON.parse(localStorage.getItem("viewedProjects") || "[]");
      if (!viewedProjects.includes(selectedProject.id)) {
        localStorage.setItem("viewedProjects", JSON.stringify([...viewedProjects, selectedProject.id]));
      }
    }
  }, [selectedProject]);

  const filteredProjects = projects
    .filter(
      (project) =>
        (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        project.status === "open"
    )
    .filter((project) => filterSkill === "all" || project.skills.includes(filterSkill))
    .sort((a, b) => (sortBy === "budget" ? b.budget - a.budget : b.timeline - a.timeline));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 hover-lift hover-shadow transition-all duration-300">
          <div className="flex items-start gap-6">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative group"
            >
              <Avatar className="h-24 w-24 rounded-full shadow-lg">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&q=80"
                  alt="Profile"
                />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-primary hover:text-primary/80 transition-colors">
                    John Doe
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Full Stack Developer with 5 years of experience in building scalable web applications
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">({rating})</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover-scale hover-bg-primary"
                  >
                    <GithubIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover-scale hover-bg-primary"
                  >
                    <LinkedinIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover-scale hover-bg-primary"
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-4 text-lg text-primary">Skills & Proficiency</h3>
                <motion.ul
                  className="space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                >
                  {Object.keys(skillLevels).map((skill) => (
                    <motion.li
                      key={skill}
                      className="text-sm font-medium bg-primary/10 text-primary px-4 py-2 rounded-lg shadow-sm"
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      {skill}
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">Earnings Overview</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</p>
              {totalEarnings === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Complete projects to start earning!
                </p>
              )}
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="h-[200px]">
            {totalEarnings > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/30" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${value}`, 'Earnings']}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      borderColor: 'var(--border)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--primary)', r: 4 }}
                    activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--background)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">No earnings data yet</p>
                  <p className="text-xs mt-1">Your earnings chart will appear here</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold mb-4">Completed Projects</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {myCompletedProjects.length > 0 ? (
            myCompletedProjects.map((project) => {
              const feedback = myFeedback.find((f) => f.projectId === project.id);

              return (
                <Card key={project.id} className="hover-scale hover-shadow p-6">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <p className="text-muted-foreground mt-2">{project.description}</p>
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {project.submissionUrl && (
                      <div>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={project.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Submission
                          </a>
                        </Button>
                      </div>
                    )}

                    {feedback && (
                      <>
                        {feedback.comment && (
                          <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
                            &ldquo;{feedback.comment}&rdquo;
                          </blockquote>
                        )}
                        {feedback.rating > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(feedback.rating)
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">Client Rating</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <p className="col-span-2 text-center text-muted-foreground py-8">
              You haven&apos;t completed any projects yet
            </p>
          )}

          {myCompletedProjects.length === 0 &&
            completedProjects.map((project: CompletedProject) => (
              <Card key={project.id} className="hover-scale hover-shadow p-6">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <p className="text-muted-foreground mt-2">{project.description}</p>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech: string) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                        Live Demo
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        GitHub
                      </a>
                    </Button>
                  </div>
                  {project.testimonial && (
                    <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
                      &ldquo;{project.testimonial}&rdquo;
                    </blockquote>
                  )}
                  {project.clientRating && (
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(project.clientRating!)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">Client Rating</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available Projects</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterSkill} onValueChange={setFilterSkill}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                <SelectItem value="React">React</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Node.js">Node.js</SelectItem>
                <SelectItem value="TypeScript">TypeScript</SelectItem>
                <SelectItem value="Next.js">Next.js</SelectItem>
                <SelectItem value="Angular">Angular</SelectItem>
                <SelectItem value="Vue.js">Vue.js</SelectItem>
                <SelectItem value="Java">Java</SelectItem>
                <SelectItem value="C#">C#</SelectItem>
                <SelectItem value="Go">Go</SelectItem>
                <SelectItem value="Ruby">Ruby</SelectItem>
                <SelectItem value="PHP">PHP</SelectItem>
                <SelectItem value="AWS">AWS</SelectItem>
                <SelectItem value="Docker">Docker</SelectItem>
                <SelectItem value="Kubernetes">Kubernetes</SelectItem>
                <SelectItem value="MongoDB">MongoDB</SelectItem>
                <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                <SelectItem value="GraphQL">GraphQL</SelectItem>
                <SelectItem value="Flutter">Flutter</SelectItem>
                <SelectItem value="React Native">React Native</SelectItem>
                <SelectItem value="Swift">Swift</SelectItem>
                <SelectItem value="Kotlin">Kotlin</SelectItem>
                <SelectItem value="TensorFlow">TensorFlow</SelectItem>
                <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: "budget" | "timeline") => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Highest Budget</SelectItem>
                <SelectItem value="timeline">Longest Timeline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Card key={project.id} className="hover-scale hover-shadow p-6">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <p className="text-muted-foreground mt-2">{project.description}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Budget:</span>
                    <span>₹{project.budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeline:</span>
                    <span>{project.timeline} days</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {project.projectFiles && project.projectFiles.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-sm">Project Files</h4>
                      
                      {myBids.some(bid => bid.projectId === project.id && bid.status === "accepted") &&
                      project.status === "in_progress" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowFileUpload(project.id)} 
                          className="text-xs"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Add File
                        </Button>
                      )}
                    </div>
                    
                    {showFileUpload === project.id && (
                      <div className="mb-4 p-3 border rounded-md bg-muted/30">
                        <FileUpload 
                          onUpload={(files: File[]) => {
                            files.forEach((file: File) => {
                              const fileToAdd: Omit<ProjectFile, "id"> = {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                url: URL.createObjectURL(file),
                                uploadDate: new Date().toISOString(),
                                uploadedBy: "developer"
                              };
                              
                              addProjectFile(project.id, fileToAdd);
                            });
                            setShowFileUpload(null);
                          }} 
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {project.projectFiles.map((file, index) => (
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
                              {file.uploadedBy === "client" && " · Added by client"}
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
                            
                            {file.uploadedBy === "developer" && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteProjectFile(project.id, file.id, "developer")}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!myBids.some(bid => bid.projectId === project.id) ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="hover-scale hover-shadow w-full mt-4"
                        onClick={() => setSelectedProject(project)}
                      >
                        Place Bid
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Place a Bid for {project.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleBidSubmit} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Bid Amount (₹)</label>
                          <Input
                            type="number"
                            name="amount"
                            required
                            min={1}
                            max={project.budget}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Project budget: ₹{project.budget}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Timeline (days)
                          </label>
                          <Input
                            type="number"
                            name="timeline"
                            required
                            min={1}
                            max={project.timeline}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Project timeline: {project.timeline} days
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Proposal</label>
                          <Textarea
                            name="proposal"
                            required
                            placeholder="Write your proposal..."
                            rows={4}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? "Submitting..." : "Submit Bid"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button className="w-full mt-4" disabled>
                    Bid Placed
                  </Button>
                )}
              </Card>
            ))
          ) : (
            <p className="col-span-2 text-center text-muted-foreground py-8">
              No open projects found matching your criteria
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <h2 className="text-xl font-semibold mb-4">My Bids</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {myBids.map((bid) => {
            const project = projects.find((p) => p.id === bid.projectId);
            if (!project) return null;

            return (
              <Card key={`${project.id}-${bid.amount}`} className="p-6">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Bid Amount:</span>
                    <span>₹{bid.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeline:</span>
                    <span>{bid.timeline} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge
                      variant={
                        bid.status === "accepted"
                          ? "secondary"
                          : bid.status === "rejected"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </Badge>
                  </div>
                  {bid.status === "accepted" && project.status === "in_progress" && (
                    <Button
                      className="w-full mt-4"
                      variant="outline"
                      onClick={() => setProjectToSubmit(project)}
                    >
                      Submit Project
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {projectToSubmit && (
        <Dialog open={!!projectToSubmit} onOpenChange={() => setProjectToSubmit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitProject} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project URL or Documentation Link</label>
                <Input
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit for Review
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}