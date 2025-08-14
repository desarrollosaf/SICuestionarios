import { Router } from "express";
import { getCurrentUser, LoginUser, cerrarsesion, ReadUser } from "../controllers/users";

const router = Router();

router.post("/api/user/login", LoginUser);

export default router;
