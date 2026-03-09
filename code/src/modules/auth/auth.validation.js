import joi from "joi"
import { generalValidationFields } from "../../common/utlis/validation.js"



export const login ={
    body: joi
  .object()
  .keys({
    email: generalValidationFields.email.required(),
    password:generalValidationFields.password.required(),
  }).required(),
}


export const signup = {
    body: login.body.append()
  .keys({
    email: generalValidationFields.email.required(),
    username: generalValidationFields.username.required(),
    password:generalValidationFields.password.required(),
    phone: generalValidationFields.phone.required(),
    confirmPassword:generalValidationFields.confirmPassword("password").required(),

  }).required(),

 
}






