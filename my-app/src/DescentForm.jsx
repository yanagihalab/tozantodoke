import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const CONTRACT_ADDRESS = "neutron1mkyz6g9dvgxs4m6wp65v030nmxduzmlf4a85v45jmg9jcz5h6klskzrtqw";
const RPC_ENDPOINT = "https://rpc-palvus.pion-1.ntrn.tech";
const CHAIN_ID = "pion-1";

function SubmitForm() {
  const location = useLocation();
  const qrInfo = location.state?.qrInfo;

  const [walletInfo, setWalletInfo] = useState("");

  useEffect(() => {
    const getWalletInfo = async () => {
      if (!window.keplr) {
        alert("Keplrウォレットが見つかりません。Keplrをインストールしてください。");
        return;
      }

      await window.keplr.enable(CHAIN_ID);
      const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();

      if (accounts && accounts.length > 0) {
        setWalletInfo(accounts[0].address);
      } else {
        alert("ウォレットアドレスを取得できませんでした。");
      }
    };

    getWalletInfo();
  }, []);

  const handleDescentSubmit = async () => {
    const address = walletInfo;

    if (!address) {
      alert("ウォレット情報が取得できていません。");
      return;
    }

    if (!window.keplr) {
      alert("Keplrウォレットが見つかりません。");
      return;
    }

    await window.keplr.enable(CHAIN_ID);
    const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
    const client = await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, offlineSigner);

    const msg = {
      submit_descent_info: {},
    };

    try {
      const fee = { amount: [{ denom: "untrn", amount: "10000" }], gas: "200000" };
      const result = await client.execute(address, CONTRACT_ADDRESS, msg, fee);
      alert("下山届を送信しました。TXハッシュ：" + result.transactionHash);
    } catch (error) {
      alert("エラーが発生しました：" + error.message);
    }
  };

  return (
    <div>
      <h2>下山届フォーム</h2>

      <label>
        ウォレット情報:
        <input type="text" value={walletInfo} readOnly />
      </label>

      <button type="button" onClick={handleDescentSubmit}>
        下山届を提出
      </button>
    </div>
  );
}

export default SubmitForm;
