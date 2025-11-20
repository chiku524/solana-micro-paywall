#!/bin/bash

# Script to request devnet SOL from Solana faucet
# Usage: ./scripts/get-devnet-sol.sh <wallet-address>

WALLET_ADDRESS=${1:-"GEkkJj1yigKjtDn8c2bob9WmWfLNDSQAc2Wiu5NQyC2N"}

echo "Requesting devnet SOL for address: $WALLET_ADDRESS"
echo ""

# Method 1: Using Solana CLI (if installed)
if command -v solana &> /dev/null; then
    echo "Using Solana CLI..."
    solana airdrop 2 $WALLET_ADDRESS --url https://api.devnet.solana.com
    echo ""
    echo "Checking balance..."
    solana balance $WALLET_ADDRESS --url https://api.devnet.solana.com
else
    echo "Solana CLI not found. Using curl to request from faucet..."
    echo ""
    
    # Method 2: Using curl to request from faucet
    echo "Requesting from Solana faucet..."
    curl -X POST https://api.devnet.solana.com \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"requestAirdrop\",\"params\":[\"$WALLET_ADDRESS\", 2000000000]}"
    
    echo ""
    echo ""
    echo "Alternative: Visit https://faucet.solana.com and paste your address:"
    echo "$WALLET_ADDRESS"
    echo ""
    echo "Or use the Solana CLI:"
    echo "  solana airdrop 2 $WALLET_ADDRESS --url https://api.devnet.solana.com"
fi

