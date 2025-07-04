import React, { useEffect, useState } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";

const rpcEndpoint = "https://rpc-palvus.pion-1.ntrn.tech";
const chainId = "pion-1";

function ReturnForm() {
  const [walletInfo, setWalletInfo] = useState("");
  const [climbDate, setClimbDate] = useState("");
  const [climbLocation, setClimbLocation] = useState("");
  const [depositValue, setDepositValue] = useState("");
  const [depositDenom, setDepositDenom] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    const fetchWalletAndClimbInfo = async () => {
      if (!window.keplr) {
        alert("Keplrをインストールしてください。");
        return;
      }

      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length === 0) {
        alert("ウォレットアドレスが取得できませんでした。");
        return;
      }

      const address = accounts[0].address;
      setWalletInfo(address);

      const client = await SigningStargateClient.connect(rpcEndpoint);

      // 入山時トランザクション情報の取得（アドレスのTX履歴を元に検索）
      const txs = await client.searchTx({
        sentFromOrTo: address,
      });

      const climbTx = txs.find(tx => {
        // 入山TXを特定するロジック（メモや特定のタグで判断する必要あり）
        return tx.rawLog.includes("登山届");
      });

      if (!climbTx) {
        alert("入山情報が見つかりませんでした。");
        return;
      }

      const climbInfo = JSON.parse(climbTx.memo); // JSONとしてmemoを使う前提

      setClimbDate(climbInfo.climbDate);
      setClimbLocation(climbInfo.climbLocation);
      setDepositValue(climbInfo.depositValue);
      setDepositDenom(climbInfo.depositDenom);
      setTxHash(climbTx.hash);
    };

    fetchWalletAndClimbInfo();
  }, []);

  const handleReturnSubmit = async () => {
    if (!returnDate) {
      alert("下山日を入力してください。");
      return;
    }

    if (!window.keplr) {
      alert("Keplrをインストールしてください。");
      return;
    }

    await window.keplr.enable(chainId);
    const offlineSigner = window.keplr.getOfflineSigner(chainId);
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, offlineSigner);

    const txMsg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: walletInfo,
        toAddress: walletInfo,
        amount: [{ denom: depositDenom, amount: depositValue }],
      },
    };

    try {
      const fee = { amount: [{ denom: depositDenom, amount: "1000" }], gas: "200000" };

      const result = await client.signAndBroadcast(
        walletInfo,
        [txMsg],
        fee,
        JSON.stringify({
          type: "下山届",
          climbTxHash: txHash,
          returnDate,
        })
      );

      if (result.code === 0) {
        alert("下山届を送信しました。TXハッシュ：" + result.transactionHash);
      } else {
        alert("TX送信エラー：" + result.rawLog);
      }
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

      <label>
        入山日:
        <input type="date" value={climbDate} readOnly />
      </label>

      <label>
        登山場所:
        <input type="text" value={climbLocation} readOnly />
      </label>

      <label>
        Deposit返還額: {depositValue} {depositDenom}
      </label>

      <label>
        下山日:
        <input
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          min={climbDate}
        />
      </label>

      <button type="button" onClick={handleReturnSubmit} disabled={!returnDate}>
        下山届を提出（Deposit返還）
      </button>
    </div>
  );
}

export default ReturnForm;
