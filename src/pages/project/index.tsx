import { useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Calendar, User, Users, Clock, CircleDollarSign, Shield, Key, Timer, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Spinner } from '@/shared/components/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
 import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import { motion } from "framer-motion";

import { useAngorProject } from '@/features/angor-hub/hooks';
import { satoshiToBitcoin } from '@/shared/utils/bitcoin';
import { useEffect, useState } from 'react';
import { AngorNostrService } from '@/features/angor-hub/services/nostr';

// Add FAQ data
const FAQ_DATA = [
  {
    question: "What is Angor Platform?",
    answer: "Angor is a decentralized crowdfunding platform built on Bitcoin and Nostr that enables transparent and trustless project funding."
  },
  {
    question: "How do project stages work?",
    answer: "Projects are funded in stages. Each stage has a specific amount and release date. Funds are only released when milestones are met."
  },
  {
    question: "What happens if a project fails?",
    answer: "If a project fails to meet its milestones, investors can get their funds back through the penalty system."
  },
  {
    question: "How are funds protected?",
    answer: "Funds are secured through multi-signature wallets and time-locked contracts on the Bitcoin network."
  }
];

// Add loading skeleton component
const ProjectSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-[200px] w-full rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-[120px]" />
      <Skeleton className="h-[120px]" />
    </div>
  </div>
);

// Add custom progress bar component
const AnimatedProgress = ({ value }: { value: number }) => (
  <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
    <motion.div
      className="absolute h-full bg-primary"
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  </div>
);

export const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, stats, isLoading } = useAngorProject(projectId || '');
  
  const [extraDetails, setExtraDetails] = useState<{
    content?: string;
    media?: string[];
    members?: string[];
  }>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const nostrService = AngorNostrService.getInstance();
  
  useEffect(() => {
    const fetchExtraDetails = async () => {
      if (!project || !project.nostrEventId) return;
      
      try {
        setIsLoadingDetails(true);
        const data = await nostrService.fetchProjectData(project.nostrEventId);
        setExtraDetails({
          content: data.content,
          media: data.media,
          members: data.members,
        });
      } catch (err) {
        console.error("Error fetching project details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchExtraDetails();
  }, [project, nostrService]);
  
  // Format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <Spinner />
        <p className="mt-4">Loading project details...</p>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-xl">Project not found</p>
        <Button onClick={() => navigate(-1)} variant="ghost" className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  // Extract project details
  const name = project.metadata?.name || project.profile?.name || 'Unnamed Project';
  const picture = project.metadata?.picture || project.profile?.picture;
  const about = project.metadata?.about || project.profile?.about || 'No description available';
  const website = project.metadata?.website;
  const lud16 = project.metadata?.lud16;
  const nip05 = project.metadata?.nip05;
  
  const startDate = project.details?.startDate ? formatDate(project.details.startDate) : 'N/A';
  const expiryDate = project.details?.expiryDate ? formatDate(project.details.expiryDate) : 'N/A';
  
  // Create a npub if we have the Nostr pubkey
  const npub = project.details?.nostrPubKey ? 
    nip19.npubEncode(project.details.nostrPubKey) : 
    undefined;
    
  // Calculate funding progress
  const targetAmount = project.details?.targetAmount || 0;
  const currentAmount = stats ? stats.amountInvested : 0;
  const progressPercentage = targetAmount > 0 ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100) : 0;
  
  // Calculate time remaining
  const calculateTimeRemaining = () => {
    if (!project.details?.expiryDate) return 'N/A';
    
    const now = Math.floor(Date.now() / 1000);
    const expiryTimestamp = project.details.expiryDate;
    
    if (now >= expiryTimestamp) return 'Expired';
    
    const secondsRemaining = expiryTimestamp - now;
    const daysRemaining = Math.floor(secondsRemaining / (60 * 60 * 24));
    
    if (daysRemaining > 0) {
      return `${daysRemaining} days`;
    }
    
    const hoursRemaining = Math.floor(secondsRemaining / (60 * 60));
    return `${hoursRemaining} hours`;
  };
  
  const timeRemaining = calculateTimeRemaining();
  
  return (
    <div className="flex flex-col space-y-6 p-4 pb-16">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-bold">Project</h2>
      </div>
      
      {/* Simplified Hero Section */}
      <Card className="border shadow-md">
      <div className="relative min-h-[300px] md:min-h-[400px] overflow-hidden rounded-xl bg-card">
        {/* Content Container */}
        <div className="relative z-10 h-full container mx-auto px-4 py-8 md:py-12 flex flex-col justify-between">
          {/* Header Content */}
          <div className="space-y-6 max-w-4xl">
            {/* Project Status Badge */}
            <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Active Project
            </div>

            {/* Title and Description */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                {name}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
                {about}
              </p>
            </div>

            {/* Project Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
             
              {stats && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Investors</div>
                  <div className="font-medium mt-1">
                    {stats.investorCount} {stats.investorCount === 1 ? 'Investor' : 'Investors'}
                  </div>
                </div>
              )}

              {project.details?.penaltyDays && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Penalty Period</div>
                  <div className="font-medium mt-1">{project.details.penaltyDays} days</div>
                </div>
              )}

              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Time Remaining</div>
                <div className="font-medium mt-1">{timeRemaining}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
            <Button 
              variant="default" 
              size="lg"
              className="flex items-center gap-2"
              onClick={() => window.open(`https://test.angor.io/view/${projectId}`, '_blank')}
            >
              <CircleDollarSign className="h-5 w-5" />
              <span className="font-medium">Invest in Project</span>
            </Button>
            
            {npub && (
              <Button 
                variant="outline" 
                size="lg"
                className="flex items-center gap-2"
                onClick={() => navigate(`/profile/${npub}`)}
              >
                <User className="h-5 w-5" />
                <span className="font-medium">View Nostr Profile</span>
              </Button>
            )}

            {website && (
              <Button
                variant="ghost"
                size="lg"
                className="flex items-center gap-2"
                onClick={() => window.open(website.startsWith('http') ? website : `https://${website}`, '_blank')}
              >
                <ExternalLink className="h-5 w-5" />
                <span className="font-medium">Website</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      </Card>
      {/* Project metadata card */}
      <Card className="border shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-xl">
              <AvatarImage src={picture} alt={name} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                {website && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Website:</span>
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {website} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                {nip05 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">NIP-05:</span>
                    <span>{nip05}</span>
                  </div>
                )}
                
                {lud16 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Lightning:</span>
                    <span>{lud16}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">Timeline:</span>
                  <span>{startDate} - {expiryDate}</span>
                </div>
                
                {project.founderKey && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Founder:</span>
                    <span className="truncate max-w-xs">{project.founderKey.substring(0, 16)}...</span>
                  </div>
                )}
              </div>
              
              {/* Funding progress */}
              {stats && targetAmount > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{satoshiToBitcoin(currentAmount)} BTC raised</span>
                    <span>Target: {satoshiToBitcoin(targetAmount)} BTC</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{progressPercentage}% funded</span>
                    <span className="text-muted-foreground">{timeRemaining} remaining</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Content area */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <Tabs defaultValue="description" className="w-full p-1">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>
            
            {/* Description Tab */}
            <TabsContent value="description" className="mt-4 p-4">
              {isLoadingDetails ? (
                <ProjectSkeleton />
              ) : (
                <div className="space-y-4">
                  {isLoadingDetails ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      <div className="prose dark:prose-invert max-w-none">
                        {(() => {
                          try {
                            const jsonContent = JSON.parse(extraDetails.content || '{}');
                            
                            // Group data into categories for better organization
                            const groups = {
                              overview: ['nostrPubKey', 'projectIdentifier', 'founderKey', 'founderRecoveryKey'],
                              dates: ['startDate', 'expiryDate'],
                              financial: ['targetAmount', 'penaltyDays'],
                              stages: ['stages'],
                              seeding: ['projectSeeders']
                            };
                            
                            return (
                              <div className="grid gap-6">
                                {/* Overview Section */}
                                <Card className="overflow-hidden">
                                  <CardHeader className="bg-muted/40">
                                    <CardTitle className="text-lg">Project Overview</CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                      {groups.overview.map(key => (
                                        jsonContent[key] && (
                                          <div key={key} className="flex items-start gap-2 overflow-hidden">
                                            <div className="rounded-md bg-primary/10 p-2">
                                              <Key className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="font-medium capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                              </p>
                                              <p className="text-sm text-muted-foreground truncate font-mono">
                                                {String(jsonContent[key])}
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Timeline Section */}
                                <Card>
                                  <CardHeader className="bg-muted/40">
                                    <CardTitle className="text-lg">Project Timeline</CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-6">
                                    <div className="flex justify-between items-center">
                                      <div className="text-center flex-1">
                                        <Calendar className="h-8 w-8 mx-auto text-primary/60" />
                                        <p className="mt-2 font-medium">Start Date</p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatDate(jsonContent.startDate)}
                                        </p>
                                      </div>
                                      <div className="h-px w-full max-w-[100px] bg-border" />
                                      <div className="text-center flex-1">
                                        <Clock className="h-8 w-8 mx-auto text-primary/60" />
                                        <p className="mt-2 font-medium">Penalty Period</p>
                                        <p className="text-sm text-muted-foreground">
                                          {jsonContent.penaltyDays} Days
                                        </p>
                                      </div>
                                      <div className="h-px w-full max-w-[100px] bg-border" />
                                      <div className="text-center flex-1">
                                        <Timer className="h-8 w-8 mx-auto text-primary/60" />
                                        <p className="mt-2 font-medium">End Date</p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatDate(jsonContent.expiryDate)}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Stages Section */}
                                {jsonContent.stages && jsonContent.stages.length > 0 && (
                                  <Card>
                                    <CardHeader className="bg-muted/40">
                                      <CardTitle className="text-lg">Funding Stages</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                      <div className="relative">
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                                        <div className="space-y-6">
                                          {jsonContent.stages.map((stage: any, idx: number) => (
                                            <div key={idx} className="relative pl-8">
                                              <div className="absolute left-0 w-8 flex items-center justify-center">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-background">
                                                  {idx + 1}
                                                </div>
                                              </div>
                                              <div className="bg-muted rounded-lg p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                  <h4 className="font-medium">Stage {idx + 1}</h4>
                                                  <Badge variant="outline">
                                                    {formatDate(stage.releaseDate)}
                                                  </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                  <CircleDollarSign className="h-4 w-4" />
                                                  <span>Release Amount: {satoshiToBitcoin(stage.amountToRelease)} BTC</span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Project Seeders */}
                                {jsonContent.projectSeeders && (
                                  <Card>
                                    <CardHeader className="bg-muted/40">
                                      <CardTitle className="text-lg">Project Seeders</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                          <Shield className="h-5 w-5 text-primary/60" />
                                          <span className="font-medium">Threshold:</span>
                                          <span>{jsonContent.projectSeeders.threshold}</span>
                                        </div>
                                        {jsonContent.projectSeeders.secretHashes?.length > 0 && (
                                          <div className="space-y-2">
                                            <p className="font-medium flex items-center gap-2">
                                              <Key className="h-4 w-4 text-primary/60" />
                                              Secret Hashes
                                            </p>
                                            <div className="grid gap-2 md:grid-cols-2">
                                              {jsonContent.projectSeeders.secretHashes.map((hash: string, idx: number) => (
                                                <div key={idx} className="bg-muted p-2 rounded font-mono text-xs truncate">
                                                  {hash}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            );
                          } catch (e) {
                            return <p className="whitespace-pre-wrap">{extraDetails.content || about}</p>;
                          }
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="mt-4 p-4">
              {stats && (stats.amountSpentSoFarByFounder > 0 || stats.amountInPenalties > 0) ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Funding Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Funding Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <AnimatedProgress value={progressPercentage} />
                        <div className="flex justify-between text-sm">
                          <span>{satoshiToBitcoin(currentAmount)} BTC raised</span>
                          <span className="text-muted-foreground">
                            Target: {satoshiToBitcoin(targetAmount)} BTC
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-4 flex flex-col">
                      <span className="text-sm text-muted-foreground">Invested</span>
                      <span className="text-xl font-bold mt-1">
                        {satoshiToBitcoin(stats.amountInvested)} BTC
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        From {stats.investorCount} {stats.investorCount === 1 ? 'investor' : 'investors'}
                      </span>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4 flex flex-col">
                      <span className="text-sm text-muted-foreground">Spent</span>
                      <span className="text-xl font-bold mt-1">
                        {satoshiToBitcoin(stats.amountSpentSoFarByFounder)} BTC
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Used by founder
                      </span>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4 flex flex-col">
                      <span className="text-sm text-muted-foreground">Penalties</span>
                      <span className="text-xl font-bold mt-1">
                        {satoshiToBitcoin(stats.amountInPenalties)} BTC
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Total: {stats.countInPenalties} {stats.countInPenalties === 1 ? 'penalty' : 'penalties'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No financial data available
                </div>
              )}
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="mt-4 p-4">
              {isLoadingDetails ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => (
                    <Skeleton key={i} className="aspect-video rounded-lg" />
                  ))}
                </div>
              ) : extraDetails.media && extraDetails.media.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {extraDetails.media.map((url, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative aspect-video overflow-hidden rounded-lg bg-muted"
                    >
                      <img 
                        src={url}
                        alt={`Project media ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                      <div 
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <Button variant="secondary" size="sm" className="w-full">
                          View Full Image
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
                  <p>No media content available</p>
                </div>
              )}
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="mt-4 p-4">
              {isLoadingDetails ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : extraDetails.members && extraDetails.members.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {extraDetails.members.map((member, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative overflow-hidden rounded-lg bg-muted p-4 hover:bg-muted/80 transition-colors cursor-pointer"
                      onClick={() => {
                        try {
                          const npub = nip19.npubEncode(member);
                          navigate(`/profile/${npub}`);
                        } catch (e) {
                          console.error("Invalid public key:", e);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-background">
                          <AvatarFallback>{idx + 1}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Member {idx + 1}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {member.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-20" />
                  <p>No team members listed</p>
                </div>
              )}
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="mt-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {FAQ_DATA.map((item, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
