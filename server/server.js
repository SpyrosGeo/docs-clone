const mongoose = require('mongoose')
const Document = require('./schemas/Document')
require('dotenv').config()

const user = process.env.DB_USER
const password = process.env.DB_PASSWORD

const mongoURI = `mongodb+srv://${user}:${password}@googledocsdemo.djyxp.mongodb.net/docs?retryWrites=true&w=majority`

const options = {
    useNewUrlParser:true,
    useUnifiedTopology:true
}
try {
    mongoose.connect(mongoURI,options,()=>{
        console.log('connected to db')
    })
}catch(error){
    console.log(error)

}


const io = require('socket.io')(3001,{
    cors:{
        origin:'http://localhost:3000',
        methods:['GET','POST']
    }
})
const defaultValue = ""

io.on('connection',socket =>{
    socket.on('get-document',async documentId=>{
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId)
        socket.emit('load-document',document.data)

        socket.on('send-changes',delta =>{
            socket.broadcast.to(documentId).emit('receive-changes',delta)
        })

        socket.on("save-document",async data =>{
            await Document.findByIdAndUpdate(documentId,{data})
        })
    })
})


async function findOrCreateDocument(id){
    if(id ==null)return 
    const document = await Document.findById(id);
    if(document) return document;
    return await Document.create({_id:id,data:defaultValue})
}