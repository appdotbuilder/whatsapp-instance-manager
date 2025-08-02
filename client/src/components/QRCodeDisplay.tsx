
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';

interface QRCodeDisplayProps {
  instanceId: number;
}

export function QRCodeDisplay({ instanceId }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.getQRCode.query({ instance_id: instanceId });
      setQrCode(result.qr_code);
      
      if (!result.qr_code) {
        setError('QR code not available. Make sure your instance is running.');
      }
    } catch {
      setError('Failed to fetch QR code');
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchQRCode();
    
    // Auto-refresh QR code every 30 seconds
    const interval = setInterval(fetchQRCode, 30000);
    return () => clearInterval(interval);
  }, [fetchQRCode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🔗</span>
          <span>Connect WhatsApp</span>
        </CardTitle>
        <CardDescription>
          Scan the QR code with your WhatsApp mobile app to link your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading QR code...</div>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="WhatsApp QR Code"
                  className="border rounded-lg shadow-lg max-w-xs"
                />
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Instructions:</strong></p>
                <ol className="text-left max-w-md mx-auto space-y-1">
                  <li>1. Open WhatsApp on your phone</li>
                  <li>2. Go to Settings {'>'} Linked Devices</li>
                  <li>3. Tap "Link a Device"</li>
                  <li>4. Scan this QR code</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center space-y-2">
                <div className="text-4xl">📱</div>
                <div>QR code not available</div>
                <div className="text-sm">Start your instance to generate a QR code</div>
              </div>
            </div>
          )}

          <Button onClick={fetchQRCode} disabled={isLoading} variant="outline">
            {isLoading ? 'Refreshing...' : '🔄 Refresh QR Code'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
