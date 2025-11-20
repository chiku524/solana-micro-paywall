#!/usr/bin/env node

/**
 * Script to request devnet SOL from Solana faucet
 * Usage: node scripts/get-devnet-sol.js [wallet-address]
 */

const https = require('https');

const WALLET_ADDRESS = process.argv[2] || 'GEkkJj1yigKjtDn8c2bob9WmWfLNDSQAc2Wiu5NQyC2N';
const AMOUNT = 2; // 2 SOL

console.log(`Requesting ${AMOUNT} devnet SOL for address: ${WALLET_ADDRESS}\n`);

const requestData = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'requestAirdrop',
  params: [WALLET_ADDRESS, AMOUNT * 1e9], // Convert SOL to lamports
});

const options = {
  hostname: 'api.devnet.solana.com',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': requestData.length,
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.error) {
        console.error('Error:', response.error.message);
        console.log('\nAlternative methods:');
        console.log('1. Visit https://faucet.solana.com and paste your address');
        console.log(`2. Use Solana CLI: solana airdrop ${AMOUNT} ${WALLET_ADDRESS} --url https://api.devnet.solana.com`);
      } else {
        console.log('✅ Airdrop requested successfully!');
        console.log('Transaction signature:', response.result);
        console.log('\nWaiting for confirmation...');
        console.log('Check your balance in a few seconds.');
      }
    } catch (error) {
      console.error('Failed to parse response:', error);
      console.log('\nRaw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
  console.log('\nAlternative methods:');
  console.log('1. Visit https://faucet.solana.com and paste your address');
  console.log(`2. Use Solana CLI: solana airdrop ${AMOUNT} ${WALLET_ADDRESS} --url https://api.devnet.solana.com`);
});

req.write(requestData);
req.end();

