"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, MoonIcon, SunIcon, ArrowRight, Sparkles, Home } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { useProjectStore } from "@/lib/store";
import { loadStripe } from "@stripe/stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId");
  const [projectName, setProjectName] = useState("");
  
  const { theme, setTheme } = useTheme();
  const [userRole, setUserRole] = useState("freelancer");
  const [mounted, setMounted] = useState(false);
  const { getProjectById, updatePaymentStatus } = useProjectStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setUserRole(savedRole);
    }

    if (projectId) {
      updatePaymentStatus(projectId, "paid");
      const project = getProjectById(projectId);
      if (project) {
        setProjectName(project.name);
      }
    }
    
    setMounted(true);
    
    // Set window size for confetti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Window resize handler
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    // Hide confetti after 6 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 6000);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [projectId, getProjectById, updatePaymentStatus]);
  
  const handleRoleChange = (role: string) => {
    setUserRole(role);
    localStorage.setItem("userRole", role);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced confetti effect */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={600}
          gravity={0.05}
          colors={['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa']}
          tweenDuration={8000}
        />
      )}
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div 
          className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.2, 0.3],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.1, 0.2],
            x: [0, 20, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-[60%] right-[10%] w-[25%] h-[25%] rounded-full bg-green-500/5"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Animated small particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-green-400/20 dark:bg-green-400/10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
      
      {/* Header with smooth entrance */}
      <motion.header 
        className="border-b relative z-10 bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Sparkles className="h-5 w-5" />
              <span>PeerHire</span>
            </Link>
          </motion.div>
          <div className="flex items-center gap-4">
            <Tabs value={userRole} onValueChange={handleRoleChange} className="hidden md:block">
              <TabsList className="bg-background/70 backdrop-blur-sm">
                <TabsTrigger value="freelancer">Freelancer</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
              </TabsList>
            </Tabs>
            <motion.div
              whileHover={{ rotate: 45 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>
      
      {/* Main content area */}
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh] relative z-10">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              damping: 20,
              delay: 0.2
            }}
            className="w-full max-w-md"
          >
            {/* Enhanced success card with better visual design */}
            <Card className="p-10 shadow-xl border-t-4 border-green-500 dark:border-green-400 relative overflow-hidden rounded-xl">
              {/* Card background elements */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/10 dark:to-transparent z-0 opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.5, duration: 1 }}
              />
              
              {/* Success sparkles */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute rounded-full bg-green-400 dark:bg-green-500"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                    width: `${Math.random() * 6 + 2}px`,
                    height: `${Math.random() * 6 + 2}px`,
                    zIndex: 1
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 3,
                    ease: "easeInOut",
                    delay: 1 + Math.random() * 2
                  }}
                />
              ))}
              
              {/* Card content with enhanced animations */}
              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: 0.5
                  }}
                  className="mb-8 mx-auto"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/30 flex items-center justify-center mx-auto shadow-md">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ 
                        scale: [0.5, 1.2, 1],
                        opacity: 1,
                        rotate: [0, 10, -5, 0] 
                      }}
                      transition={{
                        duration: 1,
                        delay: 0.8,
                        ease: "easeOut"
                      }}
                    >
                      <CheckCircle className="w-14 h-14 text-green-500 dark:text-green-400" strokeWidth={1.5} />
                    </motion.div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <motion.h1 
                    className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-400 dark:to-emerald-300"
                    animate={{ 
                      scale: [1, 1.03, 1],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: 2,
                      repeatType: "reverse",
                      ease: "easeInOut",
                      delay: 1.2
                    }}
                  >
                    Payment Successful!
                  </motion.h1>
                  <div className="w-24 h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 dark:from-green-400 dark:to-emerald-300 mx-auto mb-5 rounded-full" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="mb-8 text-center"
                >
                  <p className="text-muted-foreground text-lg">
                    Your payment for{" "}
                    {projectName ? (
                      <motion.span 
                        className="font-semibold text-foreground"
                        animate={{ 
                          color: ['#10b981', '#059669', '#10b981'],
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }}
                      >
                        &ldquo;{projectName}&rdquo;
                      </motion.span>
                    ) : (
                      "the project"
                    )}{" "}
                    has been processed successfully.
                  </p>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="text-muted-foreground mt-3"
                  >
                    You can now review the project and provide feedback.
                  </motion.p>
                </motion.div>
                
                <motion.div 
                  className="space-y-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={() => router.push("/")} 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 group"
                    >
                      <span>Return to Dashboard</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </motion.div>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="text-sm text-muted-foreground"
                  >
                    Don&apos;t forget to provide your feedback for the developer.
                  </motion.p>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}