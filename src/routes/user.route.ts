import Router from "express";
import {
  addUserController,
  removeUserController,
  updateUserController,
  getUsersController,
} from "../controllers/user.controller";

const router = Router();

router.post("/", addUserController);
router.delete("/:id", removeUserController);
router.put("/:id", updateUserController);
router.get("/", getUsersController);

export default router;
