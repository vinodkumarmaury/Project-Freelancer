"use client";

import { useEffect, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoonIcon, SunIcon, GithubIcon, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import FreelancerDashboard from "@/components/FreelancerDashboard";
import ClientDashboard from "@/components/ClientDashboard";

const MotionButton = motion(Button);

export default function Home() {
  const { theme, setTheme } = useTheme(); 
  const [userRole, setUserRole] = useState("freelancer");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setUserRole(savedRole);
    }
    setMounted(true);
  }, []);

  const handleRoleChange = (role: string) => {
    setUserRole(role);
    localStorage.setItem("userRole", role);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.header 
        className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <motion.h1 
            className="text-2xl font-bold gradient-heading hover-pop cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
          >
            PeerHire
          </motion.h1>
          <div className="flex items-center gap-4">
            <Tabs 
              value={userRole} 
              onValueChange={handleRoleChange}
              className="animate-fade-in"
            >
              <TabsList className="hover-glow">
                <TabsTrigger value="freelancer" className="relative px-6">
                  Freelancer
                  {userRole === "freelancer" && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      layoutId="tab-indicator"
                    />
                  )}
                </TabsTrigger>
                <TabsTrigger value="client" className="relative px-6">
                  Client
                  {userRole === "client" && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      layoutId="tab-indicator"
                    />
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <MotionButton
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full hover:bg-muted hover-pop"
              whileHover={{ rotate: 15, transition: { duration: 0.2 } }}
            >
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.div
                    key="sun"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SunIcon className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MoonIcon className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </MotionButton>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        <motion.main 
          key={userRole}
          className="container mx-auto px-4 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {userRole === "freelancer" ? (
            <FreelancerDashboard />
          ) : (
            <ClientDashboard />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}