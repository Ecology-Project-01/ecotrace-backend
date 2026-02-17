import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    tokenValidityDuration?: string;
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
        default: "15m", // Default to 15 minutes as per current logic
    }
}, { timestamps: true });

export default model<IUser>("user", userSchema);