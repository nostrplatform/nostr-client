import { Muted } from '@/shared/components/ui/typography/muted';
import { Spinner } from '@/shared/components/spinner';
import { Button } from '@/shared/components/ui/button';
import { ProjectItem } from './components';
import { useAngorHub } from './hooks';

export const AngorHub = () => {
  const { 
    projects, 
    stats, 
    loadMore, 
    hasMore, 
    isLoading
  } = useAngorHub();

  return (
    <div className="flex flex-col gap-2 w-full h-full overflow-y-auto overflow-x-hidden">
      {projects === undefined && <Spinner />}
      {projects === null && <Muted>Failed to fetch Angor projects</Muted>}
      {projects && projects.map((project) => (
        <ProjectItem 
          key={project.projectIdentifier} 
          project={project}
          stats={stats[project.projectIdentifier]} 
        />
      ))}
      
      {hasMore && projects && projects.length > 0 && (
        <div className="py-2 flex justify-center">
          <Button 
            variant="secondary" 
            onClick={loadMore} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? <Spinner/> : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
};
