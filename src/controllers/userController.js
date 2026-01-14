import express from "express";

const userController = express.Router();

userController.get("/", (req, res) => {
  res.send("Hello World");
});

export default userController;
