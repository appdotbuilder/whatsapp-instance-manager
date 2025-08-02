
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { WhatsAppInstance } from '../../../server/src/schema';

interface ApiDocumentationProps {
  instance: WhatsAppInstance;
}

export function ApiDocumentation({ instance }: ApiDocumentationProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = async (text: string, endpointName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(endpointName);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const baseUrl = `${window.location.origin}/api/v1/instances/${instance.id}`;

  const endpoints = [
    {
      name: 'send-message',
      method: 'POST',
      path: '/send-message',
      description: 'Send a text, image, or document message',
      headers: {
        'Authorization': `Bearer ${instance.api_key}`,
        'Content-Type': 'application/json'
      },
      body: {
        to: '+1234567890',
        message: 'Hello from WhatsApp API!',
        type: 'text'
      },
      response: {
        success: true,
        message_id: 'msg_123456789',
        status: 'sent'
      }
    },
    {
      name: 'instance-status',
      method: 'GET',
      path: '/status',
      description: 'Get current instance status and connection info',
      headers: {
        'Authorization': `Bearer ${instance.api_key}`
      },
      response: {
        status: 'running',
        connected: true,
        phone_number: '+1234567890',
        last_seen: '2024-01-01T12:00:00Z'
      }
    },
    {
      name: 'qr-code',
      method: 'GET',
      path: '/qr-code',
      description: 'Get QR code for WhatsApp linking (when not connected)',
      headers: {
        'Authorization': `Bearer ${instance.api_key}`
      },
      response: {
        qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        expires_at: '2024-01-01T12:05:00Z'
      }
    },
    {
      name: 'webhook-config',
      method: 'PUT',
      path: '/webhook',
      description: 'Update webhook configuration',
      headers: {
        'Authorization': `Bearer ${instance.api_key}`,
        'Content-Type': 'application/json'
      },
      body: {
        url: 'https://your-server.com/webhook',
        events: ['message', 'message_status']
      },
      response: {
        success: true,
        webhook_url: 'https://your-server.com/webhook',
        events: ['message', 'message_status']
      }
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📚</span>
          <span>API Documentation</span>
        </CardTitle>
        <CardDescription>
          Complete API reference for programmatic access to your WhatsApp instance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">📋 Overview</TabsTrigger>
            <TabsTrigger value="endpoints">🔗 Endpoints</TabsTrigger>
            <TabsTrigger value="webhooks">🔔 Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🔑 Authentication</h3>
                <p className="text-blue-700 text-sm mb-3">
                  All API requests require your instance API key in the Authorization header:
                </p>
                <div className="bg-white p-3 rounded border font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span>Authorization: Bearer {instance.api_key}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`Bearer ${instance.api_key}`, 'auth-header')}
                    >
                      {copiedEndpoint === 'auth-header' ? '✅' : '📋'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">🌐 Base URL</h3>
                <div className="bg-white p-3 rounded border font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span>{baseUrl}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(baseUrl, 'base-url')}
                    >
                      {copiedEndpoint === 'base-url' ? '✅' : '📋'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">⚡ Rate Limits</h3>
                <div className="text-yellow-700 text-sm space-y-1">
                  <div>• Messages: 100 per minute</div>
                  <div>• Status checks: 1000 per hour</div>
                  <div>• QR code requests: 10 per minute</div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">📱 Phone Number Formats</h3>
                <div className="text-purple-700 text-sm space-y-1">
                  <div>• International format: +1234567890</div>
                  <div>• WhatsApp ID format: 1234567890@c.us</div>
                  <div>• Group ID format: 1234567890-group@g.us</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-4">
            {endpoints.map((endpoint) => (
              <Card key={endpoint.name} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Badge className={endpoint.method === 'GET' ? 'bg-green-500' : 'bg-blue-500'}>
                        {endpoint.method}
                      </Badge>
                      <span className="font-mono text-sm">{endpoint.path}</span>
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`, endpoint.name)}
                    >
                      {copiedEndpoint === endpoint.name ? '✅ Copied' : '📋 Copy URL'}
                    </Button>
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Headers */}
                  <div>
                    <h4 className="font-medium mb-2">Headers</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono space-y-1">
                      {Object.entries(endpoint.headers).map(([key, value]: [string, string]) => (
                        <div key={key}>
                          <span className="text-blue-600">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Request Body */}
                  {endpoint.body && (
                    <div>
                      <h4 className="font-medium mb-2">Request Body</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(endpoint.body, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <h4 className="font-medium mb-2">Response</h4>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </pre>
                  </div>

                  {/* cURL Example */}
                  <div>
                    <h4 className="font-medium mb-2">cURL Example</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                      <code>
                        curl -X {endpoint.method} "{baseUrl}{endpoint.path}" \<br/>
                        {Object.entries(endpoint.headers).map(([key, value]: [string, string]) => (
                          <span key={key}>
                            &nbsp;&nbsp;-H "{key}: {value}" \<br/>
                          </span>
                        ))}
                        {endpoint.body && (
                          <>
                            &nbsp;&nbsp;-d '{JSON.stringify(endpoint.body)}'
                          </>
                        )}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>🔔 Webhook Events</CardTitle>
                  <CardDescription>
                    Your webhook endpoint will receive POST requests for these events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">📨 message</h4>
                      <p className="text-sm text-gray-600 mb-3">Triggered when a new message is received</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`{
  "event": "message",
  "instance_id": ${instance.id},
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "message_id": "msg_123456789",
    "from": "+1234567890",
    "to": "+0987654321",
    "message": "Hello, World!",
    "type": "text",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">📋 message_status</h4>
                      <p className="text-sm text-gray-600 mb-3">Triggered when message status changes (delivered, read, etc.)</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`{
  "event": "message_status",
  "instance_id": ${instance.id},
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "message_id": "msg_123456789",
    "status": "delivered",
    "timestamp": "2024-01-01T12:00:30Z"
  }
}`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">🔌 connection</h4>
                      <p className="text-sm text-gray-600 mb-3">Triggered when connection status changes</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`{
  "event": "connection",
  "instance_id": ${instance.id},
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "status": "connected",
    "phone_number": "+1234567890"
  }
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>⚙️ Webhook Configuration</CardTitle>
                  <CardDescription>
                    Best practices for webhook implementation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-1">✅ Requirements</h4>
                      <ul className="text-blue-700 space-y-1">
                        <li>• HTTPS endpoint (SSL required)</li>
                        <li>• Respond with HTTP 200 for successful processing</li>
                        <li>• Response time under 10 seconds</li>
                        <li>• Handle duplicate events (idempotency)</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-1">🔄 Retry Policy</h4>
                      <ul className="text-yellow-700 space-y-1">
                        <li>• Failed deliveries are retried up to 5 times</li>
                        <li>• Exponential backoff: 1m, 5m, 25m, 2h, 10h</li>
                        <li>• Webhooks disabled after 5 consecutive failures</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-1">🔒 Security</h4>
                      <ul className="text-green-700 space-y-1">
                        <li>• Verify requests using instance API key</li>
                        <li>• Use HTTPS to protect data in transit</li>
                        <li>• Implement request signing (recommended)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
