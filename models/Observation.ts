/**
 * Observation Model
 * Defines the Mongoose schema for ecological observations.
 * Includes: IObservation interface and ObservationSchema with fields for contributor, taxon, photos, location, and route.
 */
import { Schema, model, Document } from 'mongoose';

export interface IObservation extends Document {
    contributor: string;
    taxon: {
        kingdom?: string,
        category: string,
        common_name: string,
        scientific_name?: string,
        category_name?: string
    },
    count: number,
    notes?: string;

    location: string[];
    location_name?: string[];

    observedDate: Date;
    createdDate: Date;
    org: string;
}

const ObservationSchema = new Schema<IObservation>(
    {
        contributor: {
            type: String,
            required: true,
            trim: true
        },

        org: {
            type: String,
            required: true,
            default: 'solo'
        },

        taxon: {
            kingdom: { type: String, required: false },
            category: { type: String, required: true },
            common_name: { type: String, required: true },
            scientific_name: { type: String, required: false }
        },

        count: {
            type: Number,
            default: 1,
            min: 1
        },

        notes: {
            type: String,
            trim: true
        },

        location: {
            type: [String],
            required: true
        },
        location_name: { type: [String] },

        observedDate: {
            type: Date,
            required: true,
            default: Date.now
        },

        createdDate: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: false }
);

export default model<IObservation>("observations", ObservationSchema);
