
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';

interface MessageSenderProps {
  instanceId: number;
}

export function MessageSender({ instanceId }: MessageSenderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [messageForm, setMessageForm] = useState({
    to: '',
    message: '',
    type: 'text' as 'text' | 'image' | 'document'
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.to.trim() || !messageForm.message.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.sendMessage.mutate({
        instance_id: instanceId,
        to: messageForm.to.trim(),
        message: messageForm.message.trim(),
        type: messageForm.type
      });
      
      setSuccess(`Message sent successfully to ${messageForm.to}!`);
      setMessageForm(prev => ({ ...prev, message: '' }));
    } catch {
      setError('Failed to send message. Make sure your WhatsApp is connected.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>💬</span>
          <span>Send Message</span>
        </CardTitle>
        <CardDescription>
          Send messages through your WhatsApp instance programmatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Phone Number</Label>
              <Input
                id="recipient"
                placeholder="+1234567890"
                value={messageForm.to}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMessageForm(prev => ({ ...prev, to: e.target.value }))
                }
                required
              />
              <p className="text-xs text-gray-600">
                Include country code (e.g., +1 for US, +44 for UK)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-type">Message Type</Label>
              <Select 
                value={messageForm.type || 'text'} 
                onValueChange={(value: 'text' | 'image' | 'document') =>
                  setMessageForm(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">📝 Text Message</SelectItem>
                  <SelectItem value="image">🖼️ Image</SelectItem>
                  <SelectItem value="document">📄 Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message-content">
              {messageForm.type === 'text' ? 'Message' : 
               messageForm.type === 'image' ? 'Image URL or Base64' : 
               'Document URL or Base64'}
            </Label>
            <Textarea
              id="message-content"
              placeholder={
                messageForm.type === 'text' ? 'Type your message here...' :
                messageForm.type === 'image' ? 'https://example.com/image.jpg or data:image/jpeg;base64,...' :
                'https://example.com/document.pdf or data:application/pdf;base64,...'
              }
              value={messageForm.message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMessageForm(prev => ({ ...prev, message: e.target.value }))
              }
              rows={4}
              required
            />
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
            {isLoading ? 'Sending...' : '🚀 Send Message'}
          </Button>
        </form>

        {/* Quick Examples */}
        <div className="mt-6 pt-6  border-t">
          <h4 className="font-medium mb-3">📱 Quick Examples</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800">US Number</div>
              <div className="font-mono text-blue-600">+1234567890</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800">UK Number</div>
              <div className="font-mono text-green-600">+447123456789</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-800">WhatsApp ID</div>
              <div className="font-mono text-purple-600">1234567890@c.us</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
