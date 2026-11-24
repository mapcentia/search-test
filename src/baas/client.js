import { createCentiaClient, SqlNoToken } from "@mapcentia/gc2-sdk";

const client = createCentiaClient({
    baseUrl: "https://ballerup.admin.gc2.io",
});

export const sql = new SqlNoToken(client);
