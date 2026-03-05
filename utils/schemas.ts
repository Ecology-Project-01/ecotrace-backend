import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        username: z.string().min(3).max(20),
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

export const observationSchema = z.object({
    body: z.object({
        taxon: z.object({
            category: z.string().min(1),
            common_name: z.string().min(1),
            scientific_name: z.string().optional(),
            kingdom: z.string().optional(),
        }),
        count: z.number().min(1).optional(),
        notes: z.string().optional(),
        location: z.array(z.string()).length(2), // [Lat, Lng]
        location_name: z.array(z.string()).optional(),
        observedAt: z.string().datetime().or(z.date()).optional(),
    }),
});
