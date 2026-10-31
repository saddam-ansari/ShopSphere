import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { findUserByEmail, createUser, findUserById } from "../repositories/user.repository.js";

export const registerUser = async ({ name, email, password }) => {

    //1. Check whether user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error("User already exists");
    }

    //2. hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //3. Create user
    const user = await createUser(name, email, hashedPassword);

    return user;
}

export const loginUser = async ({ email, password }) => {

    // 1. Find user
    const user = await findUserByEmail(email);
    if (!user) {
        throw new Error("Invalid email or password");
    }

    //2. Compare password
    const isPasswordvalid = await bcrypt.compare(password, user.password);
    if (!isPasswordvalid) {
        throw new Error("Invalid email or password")
    }

    //3. Generate JWT
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "5h" }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        token
    };
};

export const getUserProfile = async (userId) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new Error("User not found")
    }

    return user;
}