/**
 * User Model
 * Defines the Mongoose schema for users.
 * Includes: IUser interface and userSchema with fields for username, email, password, role, and organization.
 */
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    tokenValidityDuration?: string;
    role: "user" | "admin" | "superadmin",
    org: string;
    resetPasswordToken?: string | undefined;
    resetPasswordExpires?: Date | undefined;
    deviceInfo?: {
        brand: string;
        model: string;
        osVersion: string;
    };
    orgSetupKey?: string; // Hashed key for the organization
}



const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    tokenValidityDuration: {
        type: String,
        default: "PT15", // Represents 15 Minutes
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "admin", "superadmin"],
        default: "user"
    },
    org: {
        type: String,
        default: 'solo',
        required: true,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    deviceInfo: {
        brand: String,
        model: String,
        osVersion: String,
    },
    orgSetupKey: {
        type: String,
        select: false, // Ensure key isn't exposed in responses
    }

}, { timestamps: true, versionKey: false });



export default model<IUser>("user", userSchema);