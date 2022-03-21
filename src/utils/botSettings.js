import sdk from 'matrix-js-sdk';
import { isValidPolkadotAddress } from './isValidAdress';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import axios from "axios"


export let messages = [{ 'body': 'Input your wallet address', 'msgtype': 'm.notice' }];

export let validationState = {
    isValidAdress: false,
    messageForSign: '',
    address: ''
}
export function setupClient() {
    const client = sdk.createClient({
        baseUrl: "https://matrix.org",
        accessToken: "",
        userId: ""
    });

    const roomId = '';

    const sendMessage = (msg, msgtype, flag) => {
        newSession = true;

        if (msgtype === 'm.notice') {
            client.sendEvent(
                roomId,
                'm.room.message',
                { 'body': msg, 'msgtype': 'm.notice' },
                '',
                console.error,
            );
        }
        else {
            client.sendEvent(
                roomId,
                'm.room.message',
                { 'body': msg, 'msgtype': 'm.text' },
                '',
                console.error,
            );
            if (isValidPolkadotAddress(msg)) {
                const stringForSign = mnemonicGenerate().split(' ').slice(0, 3).join(' ');
                client.sendEvent(
                    roomId,
                    'm.room.message',
                    { 'body': `Sign this text at react app "${stringForSign}"`, 'msgtype': 'm.notice' },
                    '',
                    console.error,
                );
                validationState.address = msg
                validationState.isValidAdress = true;
                validationState.messageForSign = stringForSign;

            }
            else if (validationState.isValidAdress && flag) {
                client.sendEvent(
                    roomId,
                    'm.room.message',
                    { 'body': 'Signature verified successfully. Please refresh page at YibanChen App for finish verification of your account.', 'msgtype': 'm.notice' },
                    '',
                    console.error,
                );

                const body = {
                    isVerified: `${flag}`,
                    walletAddress: validationState.address
                }
                axios.post('http://localhost:5000/api/user', body)

                validationState = {
                    isValidAdress: false,
                    messageForSign: '',
                    address: ''
                }
                return;
            }
            else {
                client.sendEvent(
                    roomId,
                    'm.room.message',
                    { 'body': validationState.isValidAdress ? 'Invalid signature' : 'Invalid Polkadot wallet address', 'msgtype': 'm.notice' },
                    '',
                    console.error,
                );
            }
        }
    }

    client.once('sync', function (state) {
        if (state !== 'PREPARED') {
            return
        }
    });

    let newSession = false;

    client.on('Room.timeline', async (event) => {
        if (event.getType() !== 'm.room.message') {
            return;
        }
        else {
            if (newSession) {
                messages = [...messages, event.getContent()]
            }
        }
    });

    client.startClient();
    return { sendMessage, client };
}
