
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  loginInputSchema, 
  createInstanceInputSchema,
  updateInstanceInputSchema,
  sendMessageInputSchema,
  instanceControlInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createWhatsAppInstance } from './handlers/create_whatsapp_instance';
import { getUserInstance } from './handlers/get_user_instance';
import { updateInstanceConfig } from './handlers/update_instance_config';
import { controlInstance } from './handlers/control_instance';
import { getQRCode } from './handlers/get_qr_code';
import { sendMessage } from './handlers/send_message';
import { getInstanceLogs } from './handlers/get_instance_logs';
import { getWebhookDeliveries } from './handlers/get_webhook_deliveries';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Mock authentication middleware - should be replaced with real JWT verification
const authenticatedProcedure = publicProcedure.use(({ next }) => {
  // This is a placeholder! Real authentication should verify JWT token
  const userId = 1; // Mock user ID
  return next({
    ctx: { userId }
  });
});

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
    
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),
  
  // WhatsApp instance management
  createInstance: authenticatedProcedure
    .input(createInstanceInputSchema)
    .mutation(({ input, ctx }) => createWhatsAppInstance(input, ctx.userId)),
    
  getInstance: authenticatedProcedure
    .query(({ ctx }) => getUserInstance(ctx.userId)),
    
  updateInstanceConfig: authenticatedProcedure
    .input(updateInstanceInputSchema)
    .mutation(({ input, ctx }) => updateInstanceConfig(input, ctx.userId)),
    
  controlInstance: authenticatedProcedure
    .input(instanceControlInputSchema)
    .mutation(({ input, ctx }) => controlInstance(input, ctx.userId)),
    
  getQRCode: authenticatedProcedure
    .input(z.object({ instance_id: z.number() }))
    .query(({ input, ctx }) => getQRCode(input.instance_id, ctx.userId)),
  
  // Messaging
  sendMessage: authenticatedProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input, ctx }) => sendMessage(input, ctx.userId)),
  
  // Monitoring
  getInstanceLogs: authenticatedProcedure
    .input(z.object({ 
      instance_id: z.number(),
      limit: z.number().default(100)
    }))
    .query(({ input, ctx }) => getInstanceLogs(input.instance_id, ctx.userId, input.limit)),
    
  getWebhookDeliveries: authenticatedProcedure
    .input(z.object({ 
      instance_id: z.number(),
      limit: z.number().default(50)
    }))
    .query(({ input, ctx }) => getWebhookDeliveries(input.instance_id, ctx.userId, input.limit)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`WhatsApp Instance Manager TRPC server listening at port: ${port}`);
}

start();
