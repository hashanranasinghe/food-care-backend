const asyncHandler = require("express-async-handler");
const Conversation = require("../models/conversation");


//create conversation=============================================================================
const createConversation = asyncHandler(async (req,res)=>{
    const newConversation = new Conversation({
        members:[req.body.senderId,req.body.receiverId]
    });
    console.log(newConversation);

    newConversation
    .save()
    .then((response) => {
      res.json({
        message: "conversation create.",
      });
    })
    .catch((error) => {
      res.json({
        message: error,
        
      });
    });
   

});


//get conversation===================================================================================
const getConversation = asyncHandler(async (req,res)=>{
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
        res.status(404);
        throw new Error("Conversation not found");
      }
      res.status(200).json(conversation);
});


//get conversations of user =============================================================================
const getConversationsofUsers = asyncHandler(async (req,res)=>{
    const conversations = await Conversation.find({
        members:{$in: [req.params.userId]},
    });
    if (!conversations) {
        res.status(404);
        throw new Error("Conversation not found");
      }
      res.status(200).json(conversations);
});

module.exports = {
    createConversation,
    getConversation,
    getConversationsofUsers
};