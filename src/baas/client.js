import { createCentiaClient, SqlNoToken } from "@centia-io/sdk";

const client = createCentiaClient({
    baseUrl: "https://ballerup.admin.gc2.io",
});

export const sql = new SqlNoToken(client);
