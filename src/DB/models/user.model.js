import mongoose from "mongoose";
import { genderEnum, providerEnum } from "../../common/utlis/enums/index.js";
import { profile } from "../../modules/user/user.service.js";

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        minLength:[2, `FirstName connot be less than 2 char but you have entered a {VALUE}`],
        maxLength:[25, `FirstName connot be more than 25 char but you have entered a {VALUE}`],
        trim:true
    },
    lastName:{
        type:String,
        required:true,
        minLength:[2, `lastName connot be less than 2 char but you have entered a {VALUE}`],
        maxLength:[25, `lastName connot be more than 25 char but you have entered a {VALUE}`],
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:String
    },
    confirmEmail:{
        type:Date
    },
    changeCredentialTime:{
        type:Date
    },
    gender:{
        type:Number,
        enum:Object.values(genderEnum),
        default:genderEnum.Male
    },
    provider:{
        type:Number,
        enum:Object.values(providerEnum),
        default:providerEnum.System
    },
    otp: {
    type: String,
    default: null
},

otpExpires: {
    type: Date,
    default: null
},

isVerified: {
    type: Boolean,
    default: false
},

    profilePicture:String,
    coverPictures:[String],


},{
    collection:"Route_Users",
    timestamps:true,
    strictQuery:true,
    optimisticConcurrency:true,
    autoIndex:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})

userSchema.virtual("username").set(function (value) {
    const [firstName , lastName] = value.split(' ') || [];
    this.set({firstName,lastName})
}).get(function(){
    return this.firstName + " " + this.lastName;
})

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema)