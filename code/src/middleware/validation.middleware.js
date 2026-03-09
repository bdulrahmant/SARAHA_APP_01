import { BadRequestException } from "../common/utlis/index.js";

export const validation = (schema) => {
  return async (req, res, next) => {

    const errors = [];

    for (const key of Object.keys(schema) || []) {

      try {

        await schema[key].validateAsync(req[key], {
          abortEarly: false,
        });

      } catch (error) {

        errors.push({
          key,
          details: error.details.map((ele) => {
            return {
              path: ele.path,
              message: ele.message
            };
          }),
        });

      }

    }

    if (errors.length) {
      throw BadRequestException({
        message: "validation error",
        extra: errors
      });
    }

    next();
  };
};