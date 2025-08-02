
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { WhatsAppInstance } from '../../../server/src/schema';

interface InstanceControlsProps {
  instance: WhatsAppInstance;
  onUpdate: (instance: WhatsAppInstance) => void;
}

export function InstanceControls({ instance, onUpdate }: InstanceControlsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleControl = async (action: 'start' | 'stop' | 'restart') => {
    setIsLoading(action);
    
    try {
      const result = await trpc.controlInstance.mutate({
        instance_id: instance.id,
        action
      });
      onUpdate(result);
    } catch (error) {
      console.error(`Failed to ${action} instance:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  const canStart = instance.status === 'stopped' || instance.status === 'error';
  const canStop = instance.status === 'running' || instance.status === 'starting';
  const canRestart = instance.status === 'running';

  return (
    <div className="flex space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleControl('start')}
        disabled={!canStart || isLoading === 'start'}
        className={canStart ? 'text-green-600 border-green-200 hover:bg-green-50' : ''}
      >
        {isLoading === 'start' ? '...' : '▶️ Start'}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleControl('stop')}
        disabled={!canStop || isLoading === 'stop'}
        className={canStop ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
      >
        {isLoading === 'stop' ? '...' : '⏹️ Stop'}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleControl('restart')}
        disabled={!canRestart || isLoading === 'restart'}
        className={canRestart ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : ''}
      >
        {isLoading === 'restart' ? '...' : '🔄 Restart'}
      </Button>
    </div>
  );
}
