import type { Request, Response, NextFunction } from 'express';

export function bullBoardAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const isAuthenticated =
    typeof req.isAuthenticated === 'function' && req.isAuthenticated();
  const user = (req as any).user;

  if (!isAuthenticated || !user) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Não autenticado',
    });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      statusCode: 403,
      message: 'Acesso restrito a administradores',
    });
  }

  return next();
}
