import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { 
   Clock, Target, User, Link as LinkIcon, 
  Twitter, Github, Mail, ExternalLink, Shield
} from 'lucide-react';

import { IndexedProject, ProjectStats, ExternalIdentity } from '../../types';
import { satoshiToBitcoin } from '@/shared/utils/bitcoin';
import { formatDate, getSocialIcon, getSocialLink } from '../../utils/project';
import { Button } from '@/shared/components/ui/button';

interface ProjectDetailCardProps {
  project: IndexedProject;
  stats?: ProjectStats;
  onVisitWebsite?: () => void;
}

export const ProjectDetailCard = ({ project, stats, onVisitWebsite }: ProjectDetailCardProps) => {
  // Extract project details
  const website = project.metadata?.website;
  const externalIdentities = project.externalIdentities || [];
  const lud16 = project.metadata?.lud16;
  const startDate = project.details?.startDate ? formatDate(project.details.startDate) : 'N/A';
  const expiryDate = project.details?.expiryDate ? formatDate(project.details.expiryDate) : 'N/A';
  
  // Format founder key
  const founderKey = project.details?.founderKey
    ? `${project.details.founderKey.substring(0, 8)}...${project.details.founderKey.substring(project.details.founderKey.length - 8)}`
    : 'N/A';

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-muted/40">
        <CardTitle className="text-lg">Project Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Timeline Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Timeline
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Start Date</span>
              <span className="font-medium">{startDate}</span>
            </div>
            <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">End Date</span>
              <span className="font-medium">{expiryDate}</span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Financial Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Funding
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Target Amount</span>
              <span className="font-medium">
                {project.details?.targetAmount ? satoshiToBitcoin(project.details.targetAmount) : 'N/A'} BTC
              </span>
            </div>
            {stats && (
              <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Current Amount</span>
                <span className="font-medium">
                  {satoshiToBitcoin(stats.amountInvested)} BTC
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {stats.investorCount} investor{stats.investorCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          {/* Only show if project has penalty days specified */}
          {project.details?.penaltyDays && (
            <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Penalty Period</span>
              <span className="font-medium">{project.details.penaltyDays} days</span>
            </div>
          )}
        </div>

        <Separator />
        
        {/* Founder Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Founder
          </h3>
          <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
            <span className="text-xs text-muted-foreground">Founder Key</span>
            <span className="font-medium font-mono text-sm truncate">{founderKey}</span>
          </div>
        </div>

        {/* External Links */}
        {(website || externalIdentities.length > 0 || lud16) && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                Links
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {website && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={onVisitWebsite}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </Button>
                )}
                
                {lud16 && (
                  <Badge variant="outline" className="py-1 px-3 gap-1">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {lud16.includes('@') ? lud16 : `⚡ Lightning`}
                  </Badge>
                )}
                
                {externalIdentities.map((identity, idx) => (
                  <a 
                    key={idx}
                    href={getSocialLink(identity)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 py-1 px-3 text-xs bg-muted rounded-full hover:bg-muted/80"
                  >
                    {(() => {
                      const icon = getSocialIcon(identity.platform);
                      if (icon === 'twitter') return <Twitter className="h-3 w-3" />;
                      if (icon === 'github') return <Github className="h-3 w-3" />;
                      if (icon === 'mail') return <Mail className="h-3 w-3" />;
                      return <ExternalLink className="h-3 w-3" />;
                    })()}
                    {identity.platform}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Project Stages */}
        {project.details?.stages && project.details.stages.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Funding Stages
              </h3>
              
              <div className="space-y-2">
                {project.details.stages.map((stage, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Stage {idx + 1}</span>
                      <div className="text-xs text-muted-foreground">
                        {satoshiToBitcoin(stage.amountToRelease)} BTC
                      </div>
                    </div>
                    <Badge variant="outline">
                      {formatDate(stage.releaseDate)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
