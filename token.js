export default async function handler(request, response) {
    // Hanya izinkan metode POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { code } = request.body;

    if (!code) {
        return response.status(400).json({ error: 'Missing authorization code' });
    }

    // Ambil Client Secret dari Environment Variable Vercel demi keamanan
    const CLIENT_ID = "1514501983728304228";
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET; 
    const REDIRECT_URI = "https://throvities.vercel.app/";

    try {
        // Kirim permintaan token ke server resmi Discord
        const discordResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        const data = await discordResponse.json();

        if (data.error) {
            return response.status(400).json({ error: data.error_description || data.error });
        }

        // Kembalikan access_token ke app.js kamu
        return response.status(200).json({ access_token: data.access_token });

    } catch (error) {
        return response.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
