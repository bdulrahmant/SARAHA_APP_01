import joi from "joi";
import { generalValidationFields } from "../../common/utlis/validation.js";
import { fileFieldValidation } from "../../common/utlis/index.js";



export const shareProfile = {
    params:joi.object().keys({
        userId:generalValidationFields.id.required(),
    }).required(),
}


export const profileImage = {
    file: generalValidationFields.file(fileFieldValidation.image).required()

}


export const profileCoverImage = {
    files:joi.array().items(
        generalValidationFields.file(fileFieldValidation.image).required()
    ).min(1).max(5).required()

}



export const profileAttachment = {
    
    files:joi.object().keys({
        profileImage:
            joi.array().items(
                generalValidationFields.file(fileFieldValidation.image).required()
    ).length(1).required(),

        profileCoverImage:
            joi.array().items(
                generalValidationFields.file(fileFieldValidation.image).required()
    ).min(1).max(5).required()
}).required()
}


export const updatePassword = {
        body:joi.object().keys({
            oldPassword:generalValidationFields.password.required(),
            password:generalValidationFields.password.not(joi.ref('oldPassword')).required(),
            confirmPassword:generalValidationFields.confirmPassword('password').required(),
        }).required()
}