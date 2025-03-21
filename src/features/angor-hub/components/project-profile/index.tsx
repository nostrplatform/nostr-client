import { useEffect, useState } from 'react';
import { ChevronLeft, Calendar, Target, User, Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Spinner } from '@/shared/components/spinner';
import { Separator } from '@/shared/components/ui/separator';
import { Muted } from '@/shared/components/ui/typography/muted';

import { satoshiToBitcoin } from '@/shared/utils/bitcoin';
import { IndexedProject, ProjectStats } from '../../types';
import { AngorNostrService } from '../../services/nostr';

export const ProjectProfile = ({
  projectId,
  onBack,
  projects,
  stats,
}: {
  projectId: string;
  onBack: () => void;
  projects?: IndexedProject[] | null;
  stats: Record<string, ProjectStats>;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const project = projects?.find(p => p.projectIdentifier === projectId);
  const projectStats = stats[projectId];
  const nostrService = AngorNostrService.getInstance();
  
  const [extraDetails, setExtraDetails] = useState<{
    content?: string;
    media?: string[];
    members?: string[];
  }>({});

  useEffect(() => {
    const fetchExtraDetails = async () => {
      if (!project || !project.nostrEventId) return;
      
      try {
        setIsLoading(true);
        const data = await nostrService.fetchProjectData(project.nostrEventId);
        setExtraDetails({
          content: data.content,
          media: data.media,
          members: data.members,
        });
      } catch (err) {
        console.error("Error fetching project details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtraDetails();
  }, [project, nostrService]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Spinner />
        <p className="mt-4">Loading project details...</p>
        <Button onClick={onBack} variant="ghost" className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const name = project.metadata?.name || project.profile?.name || 'Unnamed Project';
  const picture = project.metadata?.picture || project.profile?.picture;
  const about = project.metadata?.about || project.profile?.about || 'No description available';
  
  // Format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const startDate = project.details?.startDate ? formatDate(project.details.startDate) : 'N/A';
  const expiryDate = project.details?.expiryDate ? formatDate(project.details.expiryDate) : 'N/A';
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-semibold ml-2">{name}</h2>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={picture} alt={name} className="object-cover" />
                  <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <h3 className="text-lg font-semibold">{name}</h3>
                <div className="mb-4">
                  <Muted>Project ID: {project.projectIdentifier.substring(0, 8)}...</Muted>
                </div>
                
                {projectStats && (
                  <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">Investors</span>
                      <span className="font-bold">{projectStats.investorCount}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">Invested</span>
                      <span className="font-bold">{satoshiToBitcoin(projectStats.amountInvested)} BTC</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Start - End Dates</span>
                    <span className="text-sm">{startDate} - {expiryDate}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Target Amount</span>
                    <span className="text-sm">
                      {project.details?.targetAmount ? satoshiToBitcoin(project.details.targetAmount) : 'N/A'} BTC
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Founder</span>
                    <span className="text-sm truncate">
                      {project.details?.founderKey ? project.details.founderKey.substring(0, 10) + '...' : 'N/A'}
                    </span>
                  </div>
                </div>
                
                {extraDetails.members && extraDetails.members.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Team Members</span>
                      <span className="text-sm">{extraDetails.members.length} members</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-2/3">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm mb-4">{about}</p>
              
              {isLoading ? (
                <div className="flex justify-center my-4">
                  <Spinner />
                </div>
              ) : (
                <>
                  {extraDetails.content && (
                    <>
                      <Separator className="my-4" />
                      <h3 className="font-semibold mb-2">Project Details</h3>
                      <p className="text-sm whitespace-pre-wrap">{extraDetails.content}</p>
                    </>
                  )}
                  
                  {extraDetails.media && extraDetails.media.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h3 className="font-semibold mb-2">Media</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {extraDetails.media.slice(0, 6).map((url, idx) => (
                          <img 
                            key={idx}
                            src={url}
                            alt={`Project media ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              
              {project.details?.stages && project.details.stages.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <h3 className="font-semibold mb-2">Project Stages</h3>
                  <div className="space-y-2">
                    {project.details.stages.map((stage, idx) => (
                      <div key={idx} className="p-2 bg-muted rounded-md">
                        <div className="flex justify-between">
                          <span>Stage {idx + 1}</span>
                          <span>{formatDate(stage.releaseDate)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Amount: {satoshiToBitcoin(stage.amountToRelease)} BTC
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
