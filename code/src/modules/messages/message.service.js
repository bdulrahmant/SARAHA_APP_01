import { notFoundException } from "../../common/utlis/index.js"
import { createOne, find, findOne, findOneAndDelete } from "../../DB/database.repository.js"
import { messageModel, UserModel } from "../../DB/index.js"


export const sendMessage = async (recieverId , {content=undefined}={} , files ,user) => {
    const account = await findOne({
        model:UserModel,
        filter:{_id:recieverId , confirmEmail:{$exists:true}}
    })
    if (!account) {
        throw notFoundException("Fail to find matching reciever account")
    }
    const message = await createOne({
        model:messageModel,
        data:{
            content,
            attachments: files ? (Array.isArray(files) ? files : [files]).map((file)=>file.finalPath) : [],
            recieverId,
            senderId: user ? user._id : undefined
        }
    })
    return message
}


export const getMessage = async (messagId , user) => {
    const message = await findOne({
        model:messageModel,
        filter:{
            _id : messagId,
            $or:[
                {senderId: user._id},
                {recieverIdId: user._id},
            ]

        },
        select:"-senderId"
    })

    if (!message) {
        throw notFoundException({message:`invalid message or not authorized action`})
    }
    return message
}



export const getMessages = async ( user ) => {
    const messages = await find({
        model:messageModel,
        filter:{
            $or:[
                {senderId: user._id},
                {recieverIdId: user._id},
            ]

        },
        select:"-senderId"
    })


    return messages
}

export const deleteMessage = async (messagId , user) => {
    const message = await findOneAndDelete({
        model:messageModel,
        filter:{
            _id:messagId,
            recieverIdId: user._id,
        

        },
        select:"-senderId"
    })

    if (!message) {
        throw notFoundException({message:`invalid message or not authorized action`})
    }
    return message
}
