import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SigningStargateClient } from "@cosmjs/stargate";

function SubmitForm() {
  const location = useLocation();
  const qrInfo = location.state?.qrInfo;

  const [walletInfo, setWalletInfo] = useState("");
  const [climbDate, setClimbDate] = useState("");
  const [climbLocation, setClimbLocation] = useState("");
  const [depositValue, setDepositValue] = useState("");
  const [depositDenom, setDepositDenom] = useState("");
  const [returnDate, setReturnDate] = useState("");

  useEffect(() => {
    const getWalletInfo = async () => {
      if (!window.keplr) {
        alert("Keplrウォレットが見つかりません。Keplrをインストールしてください。");
        return;
      }

      const chainId = "pion-1";
      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts && accounts.length > 0) {
        setWalletInfo(accounts[0].address);
      } else {
        alert("ウォレットアドレスを取得できませんでした。");
      }
    };

    getWalletInfo();
  }, []);

  useEffect(() => {
    if (qrInfo) {
      setClimbDate(qrInfo.startDate.slice(0, 10));
      setClimbLocation(qrInfo.mountainLocation);
      setDepositValue(qrInfo.depositAmount);
      setDepositDenom(qrInfo.depositDenom);
    }
  }, [qrInfo]);

  const handleReturnDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate < climbDate) {
      alert("帰着日は入山日以降の日付を選択してください。");
      setReturnDate("");
    } else {
      setReturnDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!returnDate) {
      alert("帰着日を入力してください。");
      return;
    }

    if (!window.keplr) {
      alert("Keplrウォレットが見つかりません。");
      return;
    }

    const chainId = "pion-1";
    const rpcEndpoint = "https://rpc-palvus.pion-1.ntrn.tech";

    await window.keplr.enable(chainId);
    const offlineSigner = window.keplr.getOfflineSigner(chainId);

    const client = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      offlineSigner
    );

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
      const result = await client.signAndBroadcast(walletInfo, [txMsg], fee);

      if (result.code === 0) {
        alert("登山届を送信しました。TXハッシュ：" + result.transactionHash);
      } else {
        alert("TX送信エラー：" + result.rawLog);
      }
    } catch (error) {
      alert("エラーが発生しました：" + error.message);
    }
  };

  return (
    <div>
      <h2>登山届フォーム</h2>

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
        目安Depositトークン量 単位: ({depositDenom})
        <input
          type="text"
          value={depositValue}
          onChange={(e) => setDepositValue(e.target.value)}
        />
      </label>

      <label>
        帰着日（入力してください）:
        <input
          type="date"
          value={returnDate}
          onChange={handleReturnDateChange}
        />
      </label>

      <button type="button" onClick={handleSubmit} disabled={!returnDate}>
        登山届を提出
      </button>
    </div>
  );
}

export default SubmitForm;
