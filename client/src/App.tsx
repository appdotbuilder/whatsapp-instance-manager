
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { WhatsAppInstance } from '../../server/src/schema';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { InstanceControls } from '@/components/InstanceControls';
import { WebhookConfig } from '@/components/WebhookConfig';
import { MessageSender } from '@/components/MessageSender';
import { LogsViewer } from '@/components/LogsViewer';
import { WebhookDeliveries } from '@/components/WebhookDeliveries';
import { ApiDocumentation } from '@/components/ApiDocumentation';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: ''
  });

  // Instance creation form
  const [instanceName, setInstanceName] = useState('');

  const loadInstance = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const result = await trpc.getInstance.query();
      setInstance(result);
    } catch {
      console.error('Failed to load instance');
      setError('Failed to load instance data');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadInstance();
  }, [loadInstance]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (authMode === 'register') {
        await trpc.createUser.mutate(authForm);
        setAuthMode('login');
        setError('Account created! Please log in.');
      } else {
        await trpc.login.mutate(authForm);
        setIsAuthenticated(true);
        setAuthForm({ email: '', password: '' });
      }
    } catch {
      setError(authMode === 'login' ? 'Invalid credentials' : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const newInstance = await trpc.createInstance.mutate({ 
        instance_name: instanceName.trim() 
      });
      setInstance(newInstance);
      setInstanceName('');
    } catch {
      setError('Failed to create instance');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: WhatsAppInstance['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500';
      case 'creating': return 'bg-blue-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">📱</div>
            <CardTitle className="text-2xl">WhatsApp Manager</CardTitle>
            <CardDescription>
              Manage your dedicated WhatsApp instances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAuthForm(prev => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAuthForm(prev => ({ ...prev, password: e.target.value }))
                }
                required
              />
              
              {error && (
                <Alert className={error.includes('created') ? 'border-green-200 bg-green-50' : undefined}>
                  <AlertDescription className={error.includes('created') ? 'text-green-800' : undefined}>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setError(null);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📱</div>
            <h1 className="text-xl font-bold text-gray-900">WhatsApp Manager</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsAuthenticated(false);
              setInstance(null);
            }}
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!instance ? (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Create Your WhatsApp Instance</CardTitle>
              <CardDescription>
                Get started by creating your dedicated WhatsApp instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateInstance} className="space-y-4">
                <Input
                  placeholder="Instance name (e.g., My Business WhatsApp)"
                  value={instanceName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setInstanceName(e.target.value)
                  }
                  maxLength={50}
                  required
                />
                
                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Instance...' : 'Create Instance 🚀'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Instance Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{instance.instance_name}</span>
                      <Badge className={`${getStatusColor(instance.status)} text-white`}>
                        {instance.status.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {instance.phone_number ? (
                        <>Connected: {instance.phone_number}</>
                      ) : (
                        'Not connected to WhatsApp'
                      )}
                    </CardDescription>
                  </div>
                  <InstanceControls 
                    instance={instance} 
                    onUpdate={(updatedInstance: WhatsAppInstance) => setInstance(updatedInstance)} 
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Instance ID</div>
                    <div className="font-mono">{instance.id}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">API Key</div>
                    <div className="font-mono text-xs">{instance.api_key.substring(0, 12)}...</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Created</div>
                    <div>{instance.created_at.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Last Seen</div>
                    <div>{instance.last_seen ? instance.last_seen.toLocaleString() : 'Never'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Tabs */}
            <Tabs defaultValue="connect" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="connect">🔗 Connect</TabsTrigger>
                <TabsTrigger value="message">💬 Message</TabsTrigger>
                <TabsTrigger value="webhooks">🔔 Webhooks</TabsTrigger>
                <TabsTrigger value="logs">📋 Logs</TabsTrigger>
                <TabsTrigger value="deliveries">📤 Deliveries</TabsTrigger>
                <TabsTrigger value="api">📚 API Docs</TabsTrigger>
              </TabsList>

              <TabsContent value="connect">
                <QRCodeDisplay instanceId={instance.id} />
              </TabsContent>

              <TabsContent value="message">
                <MessageSender instanceId={instance.id} />
              </TabsContent>

              <TabsContent value="webhooks">
                <WebhookConfig 
                  instance={instance} 
                  onUpdate={(updatedInstance: WhatsAppInstance) => setInstance(updatedInstance)} 
                />
              </TabsContent>

              <TabsContent value="logs">
                <LogsViewer instanceId={instance.id} />
              </TabsContent>

              <TabsContent value="deliveries">
                <WebhookDeliveries instanceId={instance.id} />
              </TabsContent>

              <TabsContent value="api">
                <ApiDocumentation instance={instance} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
