import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage } from '@/shared/components/ui/avatar';
import { ellipsis } from '@/shared/utils';
import { satoshiToBitcoin } from '@/shared/utils/bitcoin';
import { IndexedProject, ProjectStats } from '../../types';

export const ProjectItem = memo(
  ({ 
    project, 
    stats
  }: { 
    project: IndexedProject; 
    stats?: ProjectStats;
  }) => {
    const name = project.metadata?.name || project.profile?.name || 'Unnamed Project';
    const picture = project.metadata?.picture || project.profile?.picture;
    const about = project.metadata?.about || project.profile?.about || 'No description available';
    

    return (
      <Link 
        to={`/project/${project.projectIdentifier}`}
        className="flex gap-2 group cursor-pointer hover:bg-secondary/40 p-2 rounded-md"
      >
        <Avatar className="w-8 h-8 bg-secondary">
          <AvatarImage src={picture} alt="project-image" className="object-cover" />
        </Avatar>

        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-primary/60 group-hover:text-primary/100">
              {name}
            </p>
            {stats && (
              <p className="text-xs text-primary/40">
                {stats.investorCount} investors
              </p>
            )}
          </div>

          <p className="text-sm text-primary/60 group-hover:text-primary/100 [overflow-wrap:anywhere] pr-2">
            {ellipsis(about, 50)}
          </p>

          {stats && (
            <p className="text-xs text-primary/40 mt-1">
              {satoshiToBitcoin(stats.amountInvested)} BTC invested
            </p>
          )}
        </div>
      </Link>
    );
  },
  (prev, next) => 
    prev.project.projectIdentifier === next.project.projectIdentifier &&
    prev.stats === next.stats
);
