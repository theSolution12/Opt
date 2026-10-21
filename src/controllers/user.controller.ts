import type { Request, Response } from "express";
import {
  addUser,
  removeUser,
  updateUser,
  users,
} from "../services/user.service";

export const addUserController = (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name is required",
    });
  }

  const result = addUser({ name, email });

  return res.status(201).json(result);
};

export const removeUserController = (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Id is required",
    });
  }

  const result = removeUser(Number(id));

  return res.status(200).json(result);
};

export const updateUserController = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Id is required",
    });
  }

  const result = updateUser({ id: Number(id), name, email });

  if (!result.success) {
    return res.status(404).json(result);
  }

  return res.status(200).json(result);
};

export const getUsersController = (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    users: users,
  });
};
