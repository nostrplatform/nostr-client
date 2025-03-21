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
import { ProjectMediaGallery } from '@/features/angor-hub/components/project-media-gallery';
import { ProjectFAQ } from '@/features/angor-hub/components/project-faq';
import { ProjectMembers } from '@/features/angor-hub/components/project-members';

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

// Add this new component near the top of the file after imports
const DescriptionText = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 280; // Approximately 3 lines of text
  const shouldShowButton = text.length > maxLength;

  return (
    <div className="space-y-2">
      <p className={`text-base md:text-lg text-muted-foreground leading-relaxed ${!isExpanded && "line-clamp-3"}`}>
        {text}
      </p>
      {shouldShowButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:text-primary/80"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
};

export const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, stats, isLoading } = useAngorProject(projectId || '');

  const [extraDetails, setExtraDetails] = useState<{
    content?: string;
    media?: string[];
    members?: string[];
    faq?: Array<{ question: string; answer: string }>;
  }>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const nostrService = AngorNostrService.getInstance();

  useEffect(() => {
    const fetchExtraDetails = async () => {
      if (!project || !project.details?.nostrPubKey) return;

      try {
        setIsLoadingDetails(true);
        console.log("Fetching project content for:", project.details.nostrPubKey);
        const data = await nostrService.fetchProjectContent(project.details.nostrPubKey);
        console.log("Fetched project extra details:", data);
        setExtraDetails({
          content: data.content,
          media: data.media,
          members: data.members,
          faq: data.faq
        });
      } catch (err) {
        console.error("Error fetching project details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchExtraDetails();
  }, [project]);

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
  const banner = project.metadata?.banner || project.profile?.banner;
  const picture = project.metadata?.picture || project.profile?.picture;
  const about = project.metadata?.about || project.profile?.about || 'No description available';
  const website = project.metadata?.website;
  const lud16 = project.metadata?.lud16;
  const nip05 = project.metadata?.nip05;


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
      <Card className="border shadow-md overflow-hidden">
        <div className="relative">
          {/* Banner Image */}
          <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden rounded-t-xl">
            {picture ? (
              <img
                src={banner}
                alt={`${name} banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
            )}
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          {/* Profile Content */}
          <div className="relative -mt-24 px-4 md:px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Large Profile Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background rounded-full shadow-xl">
                  <AvatarImage src={picture} alt={name} className="object-cover" />
                  <AvatarFallback className="text-4xl font-bold">
                    {name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Project Info */}
              <div className="flex-1 space-y-6 md:space-y-8">
                {/* Project Title and Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                      {name}
                    </h1>
                    <DescriptionText text={about} />
                  </div>

                  {/* Project Status Badge */}
                  <div className="flex items-center gap-2">
                    {nip05 && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {nip05}
                      </Badge>
                    )}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  
                    <Button
                      variant="ghost"
                      size="lg"
                      className="relative group hover:bg-muted/50"
                      onClick={() => window.open(`https://test.angor.io/view/${projectId}`, '_blank')}
                    >
                      <ExternalLink className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                      <span>Invest Now</span>
                    </Button>
                  
                  {website && (
                    <Button
                      variant="ghost"
                      size="lg"
                      className="relative group hover:bg-muted/50"
                      onClick={() => window.open(website?.startsWith('http') ? website : `https://${website}`, '_blank')}
                    >
                      <ExternalLink className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                      <span>Visit Website</span>
                    </Button>
                  )}

                  {npub && (
                    <Button
                      variant="ghost"
                      size="lg"
                      className="relative group hover:bg-muted/50"
                      onClick={() => navigate(`/profile/${npub}`)}
                    >
                      <User className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                      <span>View Profile</span>
                    </Button>
                  )}

                  {lud16 && (
                    <Button
                      variant="ghost"
                      size="lg"
                      className="relative group hover:bg-muted/50"
                    >
                      <CircleDollarSign className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                      <span>Lightning ⚡️</span>
                    </Button>
                  )}
                </motion.div>


              </div>
            </div>
          </div>
        </div>

        {/* Funding Progress Bar */}
        {stats && targetAmount > 0 && (
          <div className="px-4 md:px-8 pb-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{satoshiToBitcoin(currentAmount)} BTC raised</span>
                <span className="text-muted-foreground">Target: {satoshiToBitcoin(targetAmount)} BTC</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-sm mt-2">
                <span className="text-primary font-medium">{progressPercentage}% Complete</span>
                <span className="text-muted-foreground">{timeRemaining} left</span>
              </div>
            </div>
          </div>
        )}

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
              {/* Debug output */}
              {/* {process.env.NODE_ENV !== 'production' && (
                <div className="mb-4 p-2 bg-yellow-100/10 text-yellow-500 rounded text-xs">
                  <p>Media debug info:</p>
                  <pre className="overflow-auto">{JSON.stringify(extraDetails.media, null, 2)}</pre>
                </div>
              )} */}
              <ProjectMediaGallery media={extraDetails.media} />
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="mt-4 p-4">
              {isLoadingDetails ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-36" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                </div>
              ) : (
                <ProjectMembers members={extraDetails.members} />
              )}
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="mt-4 p-4">
              <ProjectFAQ faq={extraDetails.faq} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
