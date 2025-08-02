
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { WhatsAppInstance } from '../../../server/src/schema';

interface WebhookConfigProps {
  instance: WhatsAppInstance;
  onUpdate: (instance: WhatsAppInstance) => void;
}

const AVAILABLE_EVENTS = [
  { id: 'message', label: 'New Messages', description: 'Receive notifications for incoming messages' },
  { id: 'message_status', label: 'Message Status', description: 'Delivery and read receipts' },
  { id: 'connection', label: 'Connection Changes',description: 'Connection status updates' },
  { id: 'qr_updated', label: 'QR Code Updates', description: 'When QR code is refreshed' }
];

export function WebhookConfig({ instance, onUpdate }: WebhookConfigProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [webhookUrl, setWebhookUrl] = useState(instance.webhook_url || '');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    instance.webhook_events || []
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await trpc.updateInstanceConfig.mutate({
        instance_id: instance.id,
        webhook_url: webhookUrl || null,
        webhook_events: selectedEvents.length > 0 ? selectedEvents : null
      });
      
      onUpdate(result);
      setSuccess('Webhook configuration updated successfully!');
    } catch {
      setError('Failed to update webhook configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventToggle = (eventId: string, checked: boolean) => {
    setSelectedEvents((prev: string[]) => 
      checked 
        ? [...prev, eventId]
        : prev.filter((id: string) => id !== eventId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🔔</span>
          <span>Webhook Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure webhooks to receive real-time updates from your WhatsApp instance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-server.com/webhook"
              value={webhookUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setWebhookUrl(e.target.value)
              }
            />
            <p className="text-sm text-gray-600">
              Enter your server's webhook endpoint URL to receive notifications
            </p>
          </div>

          <div className="space-y-4">
            <Label>Events to Subscribe</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_EVENTS.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={event.id}
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={(checked: boolean) => 
                      handleEventToggle(event.id, checked)
                    }
                  />
                  <div className="space-y-1">
                    <label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                      {event.label}
                    </label>
                    <p className="text-xs text-gray-600">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Configuration */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">Current Configuration</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">URL: </span>
                <span className="font-mono">
                  {instance.webhook_url || 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Events: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {instance.webhook_events && instance.webhook_events.length > 0 ? (
                    instance.webhook_events.map((event: string) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {event}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">None selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : '💾 Save Webhook Configuration'}
          </Button>
        </form>

        {/* Webhook Testing Section */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium mb-3">Webhook Payload Example</h4>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
            <pre>{`{
  "event": "message",
  "instance_id": ${instance.id},
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "from": "+1234567890",
    "message": "Hello, World!",
    "message_id": "msg_123"
  }
}`}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
