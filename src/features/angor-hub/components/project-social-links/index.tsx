import { ExternalIdentity } from '../../types';
import { getSocialIcon, getSocialLink } from '../../utils/project';
import { Card } from '@/shared/components/ui/card';
import { Share } from 'lucide-react';

interface SocialLinkProps {
  identity: ExternalIdentity;
}

const SocialLink = ({ identity }: SocialLinkProps) => {
  const icon = getSocialIcon(identity.platform);
  const link = getSocialLink(identity);
  
  return (
    <a 
      href={link}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 p-3 hover:bg-muted transition-colors rounded-lg"
    >
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-primary/80">
        <i className={`icon-${icon}`} data-lucide={icon} />
      </div>
      <div>
        <div className="font-medium capitalize">{identity.platform}</div>
        <div className="text-xs text-muted-foreground">{identity.username}</div>
      </div>
    </a>
  );
};

export const ProjectSocialLinks = ({ 
  externalIdentities 
}: { 
  externalIdentities?: ExternalIdentity[] 
}) => {
  if (!externalIdentities || externalIdentities.length === 0) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-muted-foreground">
        <Share className="h-8 w-8 mb-2 opacity-40" />
        <p>No social links available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-4">Social Links</h3>
      <div className="space-y-1">
        {externalIdentities.map((identity, idx) => (
          <SocialLink key={idx} identity={identity} />
        ))}
      </div>
    </Card>
  );
};
