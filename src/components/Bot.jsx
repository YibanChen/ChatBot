import React, { useState, useEffect, useRef } from 'react';
import './Bot.css'
import { validationState } from '../utils/botSettings';
import { setupClient } from '../utils/botSettings';
import { messages } from '../utils/botSettings';
import { u8aToHex } from "@polkadot/util"
import { cryptoWaitReady, decodeAddress, signatureVerify } from '@polkadot/util-crypto';

function Bot() {

    const [userMessage, setUserMessage] = useState('')
    const [botMessages, setBotMessages] = useState(messages)
    const [botValidationState, setBotValidationState] = useState(validationState)
    const botInstance = useRef({})

    const setUpBot = async () => {
        const client = await setupClient();
        botInstance.current = client;
    }

    useEffect(() => {
        if (!(Object.keys(botInstance.current).length)) {
            setUpBot()
        }
    }, [])

    useEffect(() => {
        setBotMessages(messages);
    }, [messages])

    function onVerify(messToSign, signSignature, acc) {
        const isValidSignature = (signedMessage, signature, address) => {
            const publicKey = decodeAddress(address);
            const hexPublicKey = u8aToHex(publicKey);

            return signatureVerify(signedMessage, signature, hexPublicKey).isValid;
        };

        const main = async () => {
            await cryptoWaitReady();
            const isValid = isValidSignature(
                messToSign,
                signSignature,
                acc
            );
            return isValid
        }
        const verifiedSignature = main();
        return verifiedSignature;
    }

    const onMessageSend = (e) => {
        e.preventDefault();
        if (botValidationState.isValidAdress) {
            onVerify(botValidationState.messageForSign, userMessage, botValidationState.address).then(res => {
                botInstance.current.sendMessage(userMessage, 'm.text', res);
                setUserMessage('');
            }).catch(e => {
                botInstance.current.sendMessage(userMessage, 'm.text');
                setUserMessage('');
            })
            return
        }
        botInstance.current.sendMessage(userMessage, 'm.text');
        setUserMessage('');
    }


    return (
        <>
            <form className='matrix-bot'>
                <div className='matrix-bot__messages'>
                    {
                        botMessages.length && botMessages.map(mess => {
                            return (
                                <div key={Math.random * Math.random} className={`matrix-bot__message matrix-bot__messages--${mess.msgtype === 'm.notice' ? 'Bot' : 'User'}`}>
                                    <p>{mess.msgtype === 'm.notice' ? 'Bot' : 'You'}</p>
                                    <p>{mess.body}</p>
                                </div>
                            )
                        })
                    }
                </div>
                <div className='matrix-bot__events'>
                    <input type="text" placeholder='Input your message' value={userMessage} onChange={(e) => setUserMessage(e.target.value)} />
                    <button onClick={onMessageSend}>Send</button>
                </div>
            </form>
        </>
    )
}
export default Bot;