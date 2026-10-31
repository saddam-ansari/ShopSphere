import { registerUser, loginUser, getUserProfile } from "../services/user.service.js";

export const register = async (req, res) => {
    try {
       
        const { name, email, password } = req.body ?? {};

        //Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const user = await registerUser({ name, email, password });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        })
    }
    catch (error) {
        console.error(error);

        if (error.message == "User already exists") {
            return res.status(409).json({
                success: false,
                message: error.message
            })
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const result = await loginUser({ email, password });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    }
    catch (error) {
        console.error(error);

        if (error.message === "Invalid email or password") {
            return res.status(401).json({
                success: false,
                message: error.message
            })
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })

    }
}

export const profile = async (req, res) => {
    try {
        const user = await getUserProfile(req.user.userId);
        return res.status(200).json({
            success: true,
            data: user
        })
    }
    catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};