export class AppError extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public isOperational = true
    ) {
      super(message);
    }
  }
  
  export const errorHandler = (error: any) => {
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(500, 'Internal server error');
  };