import joi from "joi";
import { Types } from "mongoose";

export const generalValidationFields = {
  email: joi
    .string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 3,
      tlds: { allow: ["com", "net"] },
    }),


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

  id:joi.string().custom((value, helper)=>{
            console.log({value,helper});
            return Types.ObjectId.isValid(value) ? true : helper.message("invalid objectId")
        })

};
