import { NODE_ENV } from "../../../../config/config.service.js";

// general customize error method
export const errorException = ({
  message = "fail",
  status = 400,
  extra = undefined,
} = {}) => {
  throw new Error(message, { cause: { status, extra } });
};

// error-templetes
export const conflictException = ({
  message = "conflict",
  extra = undefined,
} = {}) => {
  return errorException({ message, status: 400, extra });
};

export const notFoundException = ({
  message = "not Found",
  extra = undefined,
} = {}) => {
  return errorException({ message, status: 404, extra });
};

export const forbiddenException = ({
  message = "forbiddenException",
  extra = undefined,
} = {}) => {
  return errorException({ message, status: 403, extra });
};


export const BadRequestException = ({
  message = "bad request",
  extra = undefined,
} = {}) => {
  return errorException({ message, status: 400, extra });
};

// fixed error structer
export const globalErrorHandling = (error, req, res, next) => {
  const status = error.cause?.status ?? 500;
  const mood = NODE_ENV == "production";
  const defaultErrorMessage = "something went wrong server error";
  const displayErrorMessage = error.message || defaultErrorMessage;
  return res.status(status).json({
    status,
    stack: mood ? undefined : error.stack,
    errorMessage: mood
      ? status == 500
        ? defaultErrorMessage
        : displayErrorMessage
      : displayErrorMessage,
      extra:error?.cause?.extra||undefined,
  });
};
