
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { WebhookDelivery } from '../../../server/src/schema';

interface WebhookDeliveriesProps {
  instanceId: number;
}

export function WebhookDeliveries({ instanceId }: WebhookDeliveriesProps) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadDeliveries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.getWebhookDeliveries.query({ 
        instance_id: instanceId,
        limit: 50 
      });
      setDeliveries(result);
    } catch {
      setError('Failed to load webhook deliveries');
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    loadDeliveries();
    
    // Auto-refresh deliveries every 30 seconds
    const interval = setInterval(loadDeliveries, 30000);
    return () => clearInterval(interval);
  }, [loadDeliveries]);

  const filteredDeliveries = deliveries.filter((delivery: WebhookDelivery) => 
    statusFilter === 'all' || delivery.status === statusFilter
  );

  const getStatusColor = (status: WebhookDelivery['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: WebhookDelivery['status']) => {
    switch (status) {
      case 'delivered': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>📤</span>
              <span>Webhook Deliveries</span>
            </CardTitle>
            <CardDescription>
              Track webhook delivery status and troubleshoot failed attempts
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={loadDeliveries} disabled={isLoading} size="sm" variant="outline">
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
              <div className="text-xl font-bold text-blue-600">{deliveries.length}</div>
              <div className="text-blue-800">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {deliveries.filter((d: WebhookDelivery) => d.status === 'delivered').length}
              </div>
              <div className="text-green-800">Delivered</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">
                {deliveries.filter((d: WebhookDelivery) => d.status === 'failed').length}
              </div>
              <div className="text-red-800">Failed</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">
                {deliveries.filter((d: WebhookDelivery) => d.status === 'pending').length}
              </div>
              <div className="text-yellow-800">Pending</div>
            </div>
          </div>

          {error && (
            <div className="text-center text-red-600 py-4">{error}</div>
          )}

          {/* Deliveries List */}
          {filteredDeliveries.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📤</div>
              <div>No webhook deliveries yet</div>
              <div className="text-sm">Deliveries will appear here when webhooks are triggered</div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDeliveries.map((delivery: WebhookDelivery) => (
                <div key={delivery.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-lg">{getStatusIcon(delivery.status)}</span>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(delivery.status)} text-white`}>
                            {delivery.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{delivery.event_type}</Badge>
                          {delivery.retry_count > 0 && (
                            <Badge variant="secondary">Retries: {delivery.retry_count}</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div><strong>URL:</strong> {delivery.webhook_url}</div>
                          {delivery.response_status && (
                            <div><strong>Response:</strong> HTTP {delivery.response_status}</div>
                          )}
                          {delivery.next_retry_at && (
                            <div><strong>Next Retry:</strong> {delivery.next_retry_at.toLocaleString()}</div>
                          )}
                        </div>

                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            View payload
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-32">
                            {JSON.stringify(delivery.payload, null, 2)}
                          </pre>
                        </details>

                        {delivery.response_body && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              View response
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-32">
                              {delivery.response_body}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {delivery.created_at.toLocaleString()}
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
