
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { InstanceLog } from '../../../server/src/schema';

interface LogsViewerProps {
  instanceId: number;
}

export function LogsViewer({ instanceId }: LogsViewerProps) {
  const [logs, setLogs] = useState<InstanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const limit = 100;

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.getInstanceLogs.query({ 
        instance_id: instanceId,
        limit 
      });
      setLogs(result);
    } catch {
      setError('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  }, [instanceId, limit]);

  useEffect(() => {
    loadLogs();
    
    // Auto-refresh logs every 30 seconds
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  const filteredLogs = logs.filter((log: InstanceLog) => 
    levelFilter === 'all' || log.level === levelFilter
  );

  const getLevelColor = (level: InstanceLog['level']) => {
    switch (level) {
      case 'error': return 'bg-red-500';
      case 'warn': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      case 'debug': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelIcon = (level: InstanceLog['level']) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      default: return '📝';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>📋</span>
              <span>Instance Logs</span>
            </CardTitle>
            <CardDescription>
              Monitor your WhatsApp instance activity and troubleshoot issues
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warn">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={loadLogs} disabled={isLoading} size="sm" variant="outline">
              {isLoading ? '...' : '🔄'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{logs.length}</div>
              <div className="text-blue-800">Total Logs</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">
                {logs.filter((log: InstanceLog) => log.level === 'error').length}
              </div>
              <div className="text-red-800">Errors</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">
                {logs.filter((log: InstanceLog) => log.level === 'warn').length}
              </div>
              <div className="text-yellow-800">Warnings</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {logs.filter((log: InstanceLog) => log.level === 'info').length}
              </div>
              <div className="text-green-800">Info</div>
            </div>
          </div>

          {error && (
            <div className="text-center text-red-600 py-4">{error}</div>
          )}

          {/* Logs List */}
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📝</div>
              <div>No logs available</div>
              <div className="text-sm">Logs will appear here as your instance runs</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.map((log: InstanceLog) => (
                <div key={log.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getLevelIcon(log.level)}</span>
                        <Badge className={`${getLevelColor(log.level)} text-white text-xs`}>
                          {log.level.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{log.message}</div>
                        {log.metadata && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                              View metadata
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {log.created_at.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
