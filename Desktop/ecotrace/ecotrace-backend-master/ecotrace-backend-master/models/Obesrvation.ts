import { Schema, model, Document } from 'mongoose';

export interface IObservation extends Document {
    contributor: string;
    taxon: {
        kingdom?: string,
        category: string,
        common_name: string,
        category_name?: string
    },
    count: number,
    notes?: string;

    photos: {
        url: string;
        thumbnailUrl?: string;
        width?: number;
        height?: number;
    }[];

    location: {
        type: 'Point';
        coordinates: [number, number]; // [lng, lat]
    };

    route?: {
        latitude: number;
        longitude: number;
        timestamp: number;
    }[];

    observedAt?: Date;
    updatedDate?: Date;
}

const ObservationSchema = new Schema<IObservation>(
    {
        contributor: {
            type: String,
            required: true,
            trim: true
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

        photos: [
            {
                url: { type: String, required: true },
                thumbnailUrl: String,
                width: Number,
                height: Number
            }
        ],

        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
        },

        route: [
            {
                latitude: { type: Number, required: true },
                longitude: { type: Number, required: true },
                timestamp: { type: Number, required: true }
            }
        ],

        observedAt: {
            type: Date
        },

        updatedDate: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

ObservationSchema.index({ location: '2dsphere' }); // for geo location
export default model<IObservation>("observations", ObservationSchema);
