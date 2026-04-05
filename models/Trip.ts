import { Schema, model, Document } from "mongoose";

export interface IPathPoint {
    latitude: number;
    longitude: number;
}

export interface ITrip extends Document {
    contributor: string;
    org: string;
    name: string;
    clientId?: string;
    path: IPathPoint[];
    distance: number;
    startTime: Date;
    endTime: Date;
    observations: unknown[];
    createdAt: Date;
}

const PathPointSchema = new Schema(
    {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
    },
    { _id: false }
);

const TripSchema = new Schema<ITrip>(
    {
        contributor: { type: String, required: true, trim: true },
        org: { type: String, required: true, default: "solo" },
        name: { type: String, required: true, trim: true, maxlength: 200 },
        clientId: { type: String, trim: true },
        path: { type: [PathPointSchema], default: [] },
        distance: { type: Number, required: true, min: 0 },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        observations: { type: [Schema.Types.Mixed], default: [] },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

TripSchema.index({ org: 1, createdAt: -1 });
TripSchema.index({ contributor: 1, createdAt: -1 });

export default model<ITrip>("trips", TripSchema);
