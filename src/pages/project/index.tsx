import { useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Calendar, Target, User, Users, Clock, CircleDollarSign, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Spinner } from '@/shared/components/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import { useAngorProject } from '@/features/angor-hub/hooks';
import { satoshiToBitcoin } from '@/shared/utils/bitcoin';
import { useEffect, useState } from 'react';
import { AngorNostrService } from '@/features/angor-hub/services/nostr';

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
      
      {/* Hero section with project banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 md:p-8">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold">{name}</h1>
          <p className="mt-2 text-muted-foreground max-w-3xl">{about}</p>
          
          {/* Metadata badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-background/60 backdrop-blur-sm">
              Project ID: {project.projectIdentifier.substring(0, 8)}...
            </Badge>
            {stats && (
              <Badge variant="secondary" className="bg-background/60 backdrop-blur-sm">
                {stats.investorCount} {stats.investorCount === 1 ? 'Investor' : 'Investors'}
              </Badge>
            )}
            {project.details?.penaltyDays && (
              <Badge variant="outline" className="bg-background/60 backdrop-blur-sm">
                Penalty: {project.details.penaltyDays} days
              </Badge>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="default" 
              size="lg"
              className="flex items-center gap-2"
              onClick={() => window.open(`https://test.angor.io/view/${projectId}`, '_blank')}
            >
              <CircleDollarSign className="h-4 w-4" />
              <span>Invest in Project</span>
            </Button>
            
            {npub && (
              <Button 
                variant="outline" 
                size="lg"
                className="flex items-center gap-2"
                onClick={() => navigate(`/profile/${npub}`)}
              >
                <User className="h-4 w-4" />
                <span>View Nostr Profile</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
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
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full grid grid-cols-4 p-0">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            {/* Description Tab */}
            <TabsContent value="description" className="mt-4">
              {isLoadingDetails ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="whitespace-pre-wrap">
                    {extraDetails.content || about}
                  </div>
                  
                  {/* Project Information */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Project Information</CardTitle>
                      <CardDescription>Details and timeline for the project</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Timeline</p>
                              <p className="text-sm text-muted-foreground">{startDate} - {expiryDate}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Target Amount</p>
                              <p className="text-sm text-muted-foreground">
                                {project.details?.targetAmount ? satoshiToBitcoin(project.details.targetAmount) : 'N/A'} BTC
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Investors</p>
                              <p className="text-sm text-muted-foreground">
                                {stats?.investorCount || 0} {stats && stats.investorCount === 1 ? 'investor has' : 'investors have'} contributed
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Penalty Period</p>
                              <p className="text-sm text-muted-foreground">
                                {project.details?.penaltyDays || 'N/A'} days
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Project stages */}
                      {project.details?.stages && project.details.stages.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-lg font-medium mb-3">Project Stages</h3>
                            <div className="space-y-3">
                              {project.details.stages.map((stage, idx) => (
                                <div key={idx} className="rounded-md bg-muted p-3">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                                        {idx + 1}
                                      </div>
                                      <span className="font-medium">Stage {idx + 1}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{formatDate(stage.releaseDate)}</span>
                                  </div>
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    Release Amount: {satoshiToBitcoin(stage.amountToRelease)} BTC
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="mt-4">
              {stats && (stats.amountSpentSoFarByFounder > 0 || stats.amountInPenalties > 0) ? (
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No financial data available
                </div>
              )}
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="mt-4">
              {extraDetails.media && extraDetails.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {extraDetails.media.map((url, idx) => (
                    <div key={idx} className="relative aspect-video group overflow-hidden rounded-md">
                      <img 
                        src={url}
                        alt={`Project media ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div 
                        className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <span className="text-white text-xs truncate">View Full Image</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No media content available
                </div>
              )}
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="mt-4">
              {extraDetails.members && extraDetails.members.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {extraDetails.members.map((member, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 bg-muted p-4 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                      onClick={() => {
                        try {
                          const npub = nip19.npubEncode(member);
                          navigate(`/profile/${npub}`);
                        } catch (e) {
                          console.error("Invalid public key:", e);
                        }
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{idx + 1}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Member {idx + 1}</span>
                        <span className="text-xs text-muted-foreground">{member.substring(0, 8)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No team members listed
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      
      {/* Remove the right column layout */}
    </div>
  );
};
