export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    email_verified_at?: string;
    has_api_key?: boolean;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
