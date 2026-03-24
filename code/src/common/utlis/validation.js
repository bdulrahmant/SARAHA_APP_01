import joi from "joi";
import { Types } from "mongoose";
import { validation } from "../../middleware/validation.middleware.js";

export const generalValidationFields = {
  email: joi
    .string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 3,
      tlds: { allow: ["com", "net"] },
    }),
  otp: joi.string().pattern(new RegExp(/^\d{6}/)),


  password: joi
    .string()
    .pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/)),


  username: joi
    .string()
    .pattern(
      new RegExp(
        /^(?=.{3,20}$)(?!.*[_.]{2})[a-zA-Z0-9 ]+([._ ]?[a-zA-Z0-9]+)*$/,
      ),
    )
    .case("lower")
    .messages({
      "any.required": "username is required",
      "string-empty": "username cannot be empty",
    }),

  phone: joi
    .string()
    .pattern(/^01[0125][0-9]{8}$/),

  confirmPassword: function (path="password") {
    return joi.string().valid(joi.ref(path))
  },
  flag:joi.boolean().truthy("true" , "1").falsy("false" , "0"),

  id:joi.string().custom((value, helper)=>{
            console.log({value,helper});
            return Types.ObjectId.isValid(value) ? true : helper.message("invalid objectId")
        }),


  file:function (validation =[]) {
    return  joi.object().keys({
            "fieldname": joi.string().required(),
            "originalname": joi.string().required(),
            "encoding": joi.string().required(),
            "mimetype": joi.string().valid(...Object.values(validation)).required(),
            "finalPath": joi.string().required(),
            "destination": joi.string().required(),
            "filename": joi.string().required(),
            "path": joi.string().required(),
            "size": joi.number().required()
        })
  }

};
