import fetch from 'node-fetch';

const CHANNEL = process.env['SLACK_CHANNEL']

export const sendMessage = async (message) => {
    const response = await fetch(CHANNEL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: message
        })
    });
    return response.ok;
}