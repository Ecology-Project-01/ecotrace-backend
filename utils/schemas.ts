import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(20),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["user", "admin", "superadmin"]).optional(),
        org: z.string().min(2).optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
    }),
});

const pathPointSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
});

export const tripCreateSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(200),
        path: z.array(pathPointSchema),
        distance: z.number().min(0),
        startTime: z.string().datetime().or(z.date()),
        endTime: z.string().datetime().or(z.date()),
        observations: z.array(z.unknown()).optional(),
        clientId: z.string().optional(),
    }),
});

export const observationSchema = z.object({
    body: z.object({
        taxon: z.object({
            category: z.string().min(1),
            common_name: z.string().min(1),
            scientific_name: z.string().optional(),
            kingdom: z.string().optional(),
            family: z.string().optional(),
            order: z.string().optional(),
            iucn_status: z.string().optional(),
        }),
        count: z.number().min(1).optional(),
        notes: z.string().optional(),
        breeding_status: z.string().max(200).optional(),
        location: z.array(z.string()).length(2), // [Lat, Lng]
        location_name: z.array(z.string()).optional(),
        observedAt: z.string().datetime().or(z.date()).optional(),
    }),
});

export const observationUpdateSchema = z.object({
    body: z.object({
        taxon: z.object({
            common_name: z.string().min(1).optional(),
            scientific_name: z.string().optional(),
            family: z.string().optional(),
            order: z.string().optional(),
            iucn_status: z.string().optional(),
            // category and kingdom not allowed to edit here, could be added if needed
        }).optional(),
        count: z.number().min(1).optional(),
        notes: z.string().optional(),
        breeding_status: z.string().max(200).optional()
    }),
});
