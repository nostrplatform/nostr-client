import { useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink, User, CircleDollarSign, Key, Calendar, Clock, Timer, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useEffect, useState } from 'react';
import { motion } from "framer-motion";

// UI Components
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Spinner } from '@/shared/components/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Skeleton } from "@/shared/components/ui/skeleton";

// Feature Components & Hooks
import { useAngorProject } from '@/features/angor-hub/hooks';
import { AngorNostrService } from '@/features/angor-hub/services/nostr';
import { ProjectMediaGallery } from '@/features/angor-hub/components/project-media-gallery';
import { ProjectFAQ } from '@/features/angor-hub/components/project-faq';
import { ProjectMembers } from '@/features/angor-hub/components/project-members';
import { ProjectDetailCard } from '@/features/angor-hub/components/project-detail-card';
import { ProjectSocialLinks } from '@/features/angor-hub/components/project-social-links';
// Import SmartText
import { SmartText } from '@/features/angor-hub/components/smart-text';

// Utils
import { satoshiToBitcoin } from '@/shared/utils/bitcoin';
import { getProgressColor, getProjectStatus, getRemainingTime, getSpentPercentage, getPenaltiesPercentage } from '@/features/angor-hub/utils/project';

// Loading Skeleton Component
const ProjectSkeleton = () => (
  <div className="space-y-4 animate-pulse p-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-[200px] w-full rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-[120px] md:col-span-1" />
      <Skeleton className="h-[120px] md:col-span-2" />
    </div>
  </div>
);

// Animated Progress Bar Component
const AnimatedProgress = ({ value, colorClass }: { value: number; colorClass: string }) => (
  <div className="relative h-2 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
    <motion.div
      className={`absolute h-full ${colorClass}`}
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  </div>
);

// Expandable Description Text Component
const DescriptionText = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200; // Adjust length as needed
  const shouldShowButton = text.length > maxLength;

  return (
    <div className="space-y-1">
      <p className={`text-sm sm:text-base text-muted-foreground leading-relaxed ${!isExpanded && "line-clamp-3"}`}>
        {text}
      </p>
      {shouldShowButton && (
        <Button
          variant="link"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:text-primary/80 px-0 h-auto py-0"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
};

// Main Project Page Component
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

  // Fetch extra details (content, media, members, faq)
  useEffect(() => {
    const fetchExtraDetails = async () => {
      if (!project || !project.details?.nostrPubKey) return;

      setIsLoadingDetails(true);
      try {
        const data = await nostrService.fetchProjectContent(project.details.nostrPubKey);
        setExtraDetails({
          content: data.content,
          media: data.media,
          members: data.members,
          faq: data.faq
        });
      } catch (err) {
        console.error("Error fetching project extra details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchExtraDetails();
  }, [project, nostrService]); // Added nostrService dependency

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <Spinner />
        <p className="mt-4 text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  // Project Not Found State
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-xl font-semibold">Project not found</p>
        <Button onClick={() => navigate(-1)} variant="ghost" className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // --- Prepare Data for Display ---
  const name = project.metadata?.name || project.profile?.name || 'Unnamed Project';
  const banner = project.metadata?.banner || project.profile?.banner;
  const picture = project.metadata?.picture || project.profile?.picture;
  const about = project.metadata?.about || project.profile?.about || 'No description available.';
  const website = project.metadata?.website;
  const lud16 = project.metadata?.lud16;
  const nip05 = project.metadata?.nip05;
  const npub = project.details?.nostrPubKey ? nip19.npubEncode(project.details.nostrPubKey) : undefined;
  const projectStatus = getProjectStatus(project.details);

  // Process Financial Data
  const processFinancialData = () => {
    if (!stats || !project.details?.targetAmount) return null;
    const targetAmount = project.details.targetAmount;
    const currentAmount = stats.amountInvested;
    const progressPercentage = targetAmount > 0 ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100) : 0;
    return {
      targetAmount,
      currentAmount,
      spentAmount: stats.amountSpentSoFarByFounder,
      penaltiesAmount: stats.amountInPenalties,
      investorCount: stats.investorCount,
      penaltyCount: stats.countInPenalties,
      progressPercentage,
      spentPercentage: getSpentPercentage({ amountSpentSoFarByFounder: stats.amountSpentSoFarByFounder, amountInvested: currentAmount }),
      penaltiesPercentage: getPenaltiesPercentage({ amountInPenalties: stats.amountInPenalties, amountInvested: currentAmount }),
      progressColor: getProgressColor(progressPercentage),
      timeRemaining: getRemainingTime(project.details.expiryDate),
    };
  };
  const financialData = processFinancialData();

  // --- Render Component ---
  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 p-2 sm:p-4 pb-16 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft />
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold truncate">Project Details</h2>
      </div>

      {/* Hero Section */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="relative w-full h-[150px] sm:h-[200px] md:h-[250px] bg-muted">
          {banner ? (
            <img src={banner} alt={`${name} banner`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        {/* Profile Content */}
        <div className="relative -mt-16 sm:-mt-20 px-3 sm:px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end">
            {/* Avatar & Status */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background rounded-full shadow-lg">
                <AvatarImage src={picture} alt={name} className="object-cover" />
                <AvatarFallback className="text-2xl sm:text-3xl font-bold">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                <Badge
                  className={`text-xs sm:text-sm border-none px-3 py-1
                    ${projectStatus === 'active' ? 'bg-green-500 text-white' : ''}
                    ${projectStatus === 'upcoming' ? 'bg-blue-500 text-white' : ''}
                    ${projectStatus === 'completed' ? 'bg-gray-500 text-white' : ''}
                  `}
                >
                  {projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Project Info & Actions */}
            <div className=" gap-4 md:gap-6">
              <div className="text-center md:text-left space-y-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight line-clamp-2 break-words">
                  {name}
                </h1>
                {/* Use SmartText for about */}
                <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                   <SmartText text={about} />
                </div>
                {nip05 && (
                  <Badge variant="outline" className="text-xs truncate max-w-full">
                    {nip05}
                  </Badge>
                )}
              </div>
              {/* Action Buttons - Remove Invest and Profile, keep others */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-wrap items-center justify-center md:justify-end gap-2 flex-shrink-0 mt-6"
              >
                <Button variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://beta.angor.io/view/${projectId}`, '_blank')}
                  aria-label="Invest Now"
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Invest
                </Button>
                {website && (
                  <Button variant="outline" size="sm" onClick={() => window.open(website.startsWith('http') ? website : `https://${website}`, '_blank')} aria-label="Visit Website">
                    <ExternalLink className="h-4 w-4 mr-2" /> Website
                  </Button>
                )}
                {npub && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/profile/${npub}`)} aria-label="View Profile">
                    <User className="h-4 w-4 mr-2" /> Profile
                  </Button>
                )}
                {lud16 && (
                  <Button variant="outline" size="sm" aria-label="Lightning Payment">
                    <CircleDollarSign className="h-4 w-4 mr-2" /> ⚡️
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Funding Progress Bar */}
        {financialData && (
          <div className="px-3 sm:px-6 pb-4 sm:pb-6 border-t border-border">
             <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mt-4">
              <div className="flex justify-between text-xs sm:text-sm mb-2 flex-wrap gap-1">
                <span className="font-medium">{satoshiToBitcoin(financialData.currentAmount)} BTC raised</span>
                <span className="text-muted-foreground">Target: {satoshiToBitcoin(financialData.targetAmount)} BTC</span>
              </div>
              <AnimatedProgress value={financialData.progressPercentage} colorClass={financialData.progressColor} />
              <div className="flex justify-between text-xs sm:text-sm mt-2 flex-wrap gap-1">
                <span className="text-primary font-medium">{financialData.progressPercentage}% Complete</span>
                <span className="text-muted-foreground">{financialData.timeRemaining} left</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Main Content Area (Details + Tabs) */}
      <div className="grid grid-cols-1">
        {/* Left Column: Details & Socials */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <ProjectDetailCard
            project={project}
            stats={stats ?? undefined}
            onVisitWebsite={website ? () => window.open(website.startsWith('http') ? website : `https://${website}`, '_blank') : undefined}
          />
          <ProjectSocialLinks externalIdentities={project.externalIdentities} />
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2 mt-6">
          <Card className="overflow-hidden">
            <Tabs defaultValue="description" className="w-full">
              {/* Responsive Tabs List */}
              <div className="overflow-x-auto">
                <TabsList className="grid w-full grid-cols-5 min-w-[400px]">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="faq">FAQ</TabsTrigger>
                </TabsList>
              </div>

              {/* Description Tab Content */}
              <TabsContent value="description" className="mt-0 p-4">
                {isLoadingDetails ? <ProjectSkeleton /> : (
                  <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
                    {(() => {
                      const content = extraDetails.content;
                      const isLikelyJSON = (str?: string) => str?.trim().startsWith('{') && str?.trim().endsWith('}');

                      if (!isLikelyJSON(content)) {
                        // Display as plain text - Use SmartText here too if desired
                        return (
                              <CardContent><p className="whitespace-pre-wrap"><SmartText text={content || about} /></p></CardContent>
                         );
                      }

                      try {
                        const jsonContent = JSON.parse(content || '{}');
                        if (typeof jsonContent !== 'object' || jsonContent === null) throw new Error("Parsed content is not an object");

                        const formatTimestamp = (ts: number) => ts ? new Date(ts * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A";

                        // Render structured JSON data
                        return (
                          <div className="grid gap-4">
                            {/* Overview */}
                            <Card>
                              <CardHeader><CardTitle className="text-base sm:text-lg">Overview</CardTitle></CardHeader>
                              <CardContent className="grid gap-3 md:grid-cols-2 text-xs sm:text-sm">
                                {['nostrPubKey', 'projectIdentifier', 'founderKey', 'founderRecoveryKey'].map(key => jsonContent[key] && (
                                  <div key={key} className="flex items-start gap-2 overflow-hidden">
                                    <Key className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                      <p className="text-muted-foreground truncate font-mono">{String(jsonContent[key])}</p>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                            {/* Timeline */}
                            {(jsonContent.startDate || jsonContent.expiryDate || jsonContent.penaltyDays) && (
                              <Card>
                                <CardHeader><CardTitle className="text-base sm:text-lg">Timeline</CardTitle></CardHeader>
                                <CardContent className="flex flex-col sm:flex-row justify-around items-center gap-4 text-center text-xs sm:text-sm">
                                  <div className="flex-1">
                                    <Calendar className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                    <p className="font-medium">Start</p>
                                    <p className="text-muted-foreground">{formatTimestamp(jsonContent.startDate)}</p>
                                  </div>
                                  {jsonContent.penaltyDays && <>
                                    <div className="h-px sm:h-10 w-full sm:w-px bg-border" />
                                    <div className="flex-1">
                                      <Clock className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                      <p className="font-medium">Penalty</p>
                                      <p className="text-muted-foreground">{jsonContent.penaltyDays} Days</p>
                                    </div>
                                  </>}
                                  {jsonContent.expiryDate && <>
                                    <div className="h-px sm:h-10 w-full sm:w-px bg-border" />
                                    <div className="flex-1">
                                      <Timer className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                      <p className="font-medium">End</p>
                                      <p className="text-muted-foreground">{formatTimestamp(jsonContent.expiryDate)}</p>
                                    </div>
                                  </>}
                                </CardContent>
                              </Card>
                            )}
                            {/* Stages */}
                            {jsonContent.stages?.length > 0 && (
                              <Card>
                                <CardHeader><CardTitle className="text-base sm:text-lg">Funding Stages</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                  {jsonContent.stages.map((stage: any, idx: number) => (
                                    <div key={idx} className="bg-muted/50 p-3 rounded-lg flex justify-between items-center text-xs sm:text-sm">
                                      <div>
                                        <p className="font-medium">Stage {idx + 1}</p>
                                        <p className="text-muted-foreground">{satoshiToBitcoin(stage.amountToRelease)} BTC</p>
                                      </div>
                                      <Badge variant="outline">{formatTimestamp(stage.releaseDate)}</Badge>
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            )}
                            {/* Seeders */}
                            {jsonContent.projectSeeders && (
                              <Card>
                                <CardHeader><CardTitle className="text-base sm:text-lg">Seeders</CardTitle></CardHeader>
                                <CardContent className="space-y-3 text-xs sm:text-sm">
                                  <p><span className="font-medium">Threshold:</span> {jsonContent.projectSeeders.threshold || "N/A"}</p>
                                  {jsonContent.projectSeeders.secretHashes?.length > 0 && (
                                    <div>
                                      <p className="font-medium mb-1">Secret Hashes:</p>
                                      <div className="grid gap-2 md:grid-cols-2">
                                        {jsonContent.projectSeeders.secretHashes.map((hash: string, idx: number) => (
                                          <div key={idx} className="bg-muted p-2 rounded font-mono text-xs truncate">{hash}</div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        );
                      } catch (error) {
                        console.error("Failed to parse JSON content:", error);
                        // Fallback to plain text if parsing fails - Use SmartText
                        return (
                          <Card>
                            <CardHeader><CardTitle className="text-base sm:text-lg">Description</CardTitle></CardHeader>
                            <CardContent>
                              <p className="whitespace-pre-wrap"><SmartText text={content || about} /></p>
                              {process.env.NODE_ENV !== 'production' && (
                                <p className="mt-2 text-xs text-yellow-600">Note: Content looked like JSON but failed to parse.</p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      }
                    })()}
                  </div>
                )}
              </TabsContent>

              {/* Financial Tab Content */}
              <TabsContent value="financial" className="mt-6 p-4">
                {financialData && stats ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
                    <Card>
                      <CardHeader><CardTitle className="text-base sm:text-lg">Funding Progress</CardTitle></CardHeader>
                      <CardContent>
                        <AnimatedProgress value={financialData.progressPercentage} colorClass={financialData.progressColor} />
                        <div className="flex justify-between text-xs sm:text-sm mt-2">
                          <span>{satoshiToBitcoin(financialData.currentAmount)} BTC raised</span>
                          <span className="text-muted-foreground">Target: {satoshiToBitcoin(financialData.targetAmount)} BTC</span>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center sm:text-left">
                      {[
                        { label: 'Invested', value: satoshiToBitcoin(stats.amountInvested) + ' BTC', detail: `From ${stats.investorCount} investor${stats.investorCount !== 1 ? 's' : ''}` },
                        { label: 'Spent by Founder', value: satoshiToBitcoin(stats.amountSpentSoFarByFounder) + ' BTC', detail: `${financialData.spentPercentage}% of invested` },
                        { label: 'Penalties', value: satoshiToBitcoin(stats.amountInPenalties) + ' BTC', detail: `${stats.countInPenalties} total (${financialData.penaltiesPercentage}% of invested)` }
                      ].map(item => (
                        <Card key={item.label} className="p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
                          <p className="text-lg sm:text-xl font-semibold mt-1">{item.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No financial data available.</div>
                )}
              </TabsContent>

              {/* Media Tab Content */}
              <TabsContent value="media" className="mt-0 p-4">
                <ProjectMediaGallery media={extraDetails.media} />
              </TabsContent>

              {/* Team Tab Content */}
              <TabsContent value="team" className="mt-0 p-4">
                {isLoadingDetails ? <ProjectSkeleton /> : <ProjectMembers members={extraDetails.members} />}
              </TabsContent>

              {/* FAQ Tab Content */}
              <TabsContent value="faq" className="mt-0 p-4">
                <ProjectFAQ faq={extraDetails.faq} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};
