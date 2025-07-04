// src/WalletPage.jsx
import React, { useState } from 'react';
import { SigningStargateClient } from '@cosmjs/stargate';

const rpcEndpoint = "https://rpc.cosmos.network:443";
const chainId = "cosmoshub-4";

const WalletPage = () => {
  const [address, setAddress] = useState('');

  const connectWallet = async () => {
    if (!window.keplr) {
      alert("Keplr Walletをインストールしてください");
      return;
    }

    await window.keplr.enable(chainId);
    const offlineSigner = window.keplr.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();

    setAddress(accounts[0].address);

    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, offlineSigner);
    const balance = await client.getBalance(accounts[0].address, 'uatom');
    console.log(`残高: ${balance.amount} ${balance.denom}`);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🔌 ウォレット接続ページ</h1>
      <button onClick={connectWallet}>
        🔑 Keplrウォレットに接続
      </button>
      {address && (
        <div style={{ marginTop: "20px" }}>
          <strong>👤 接続済みアドレス：</strong> {address}
        </div>
      )}
    </div>
  );
};

export default WalletPage;
