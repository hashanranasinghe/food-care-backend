const express = require("express");
const Chat = require("../models/chatModel");
const asyncHandler = require("express-async-handler");

const chatModel = require('../models/chatModel');

//add==========================================================================
const createMessage = asyncHandler(async (req,res)=>{
  const newMessage =new Chat(req.body);

  newMessage
  .save()
  .then((response) => {
    res.json({
      message: "msg create.",

    });
  })
  .catch((error) => {
    res.json({
      message: error,
      
    });
  });
});


//get==========================================================================
const getMessages = asyncHandler(async (req,res)=>{
  const getMessageList = await Chat.find({
    conversationId: req.params.conversationId,
  });
  if (!getMessageList) {
    res.status(404);
    throw new Error("Messages not found");
  }
  res.status(200).json(getMessageList);


});

module.exports = {createMessage,getMessages}
