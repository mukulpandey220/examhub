import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import examsRouter from './routes/exams.js';
import proctoringRouter from './routes/proctoring.js';
import adminRouter from './routes/admin.js';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request logger in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'aiproctor-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // OpenAPI Specification endpoint
  app.get(['/api/docs', '/api/openapi.json'], (req: Request, res: Response) => {
    res.sendFile(new URL('./docs/openapi.json', import.meta.url).pathname);
  });

  // Mount API routers
  app.use('/api/exams', examsRouter);
  app.use('/api/proctoring', proctoringRouter);
  app.use('/api/admin', adminRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Path not found: ${req.method} ${req.path}` });
  });

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
};

