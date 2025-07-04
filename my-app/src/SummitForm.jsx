import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { SigningStargateClient } from "@cosmjs/stargate";

function SummitForm() {
  const [summitData, setSummitData] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-scanner", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(
      (decodedText) => {
        const data = JSON.parse(decodedText);
        setSummitData(data);
        scanner.clear();
      },
      (error) => console.warn("QR scan error:", error)
    );

    scannerRef.current = scanner;

    return () => scanner.clear();
  }, []);

  const sendSummitTx = async () => {
    if (!summitData) return;

    const { walletAddress, mountain, summitTime } = summitData;

    if (!window.keplr) {
      alert("Keplrをインストールしてください。");
      return;
    }

    const chainId = "pion-1";
    const rpcEndpoint = "https://rpc-palvus.pion-1.ntrn.tech";

    await window.keplr.enable(chainId);
    const signer = window.keplr.getOfflineSigner(chainId);
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer);

    const txMsg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: walletAddress,
        toAddress: walletAddress, // 自己アドレスを指定
        amount: [{ denom: "utrn", amount: "1" }], // 送信内容は調整が必要
      },
    };

    try {
      const fee = { amount: [{ denom: "utrn", amount: "500" }], gas: "200000" };
      const result = await client.signAndBroadcast(walletAddress, [txMsg], fee);

      if (result.code === 0) {
        alert(`登頂証明TX送信成功: ${result.transactionHash}`);
      } else {
        alert(`TXエラー: ${result.rawLog}`);
      }
    } catch (error) {
      alert(`送信エラー: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>登頂証明フォーム</h2>
      <div id="qr-scanner" style={{ width: 500, height: 500 }}></div>

      {summitData && (
        <div>
          <label>
            ウォレットアドレス:
            <input type="text" value={summitData.walletAddress} readOnly />
          </label>
          <label>
            山名:
            <input type="text" value={summitData.mountain} readOnly />
          </label>
          <label>
            登頂日時:
            <input type="datetime-local" value={summitData.summitTime.slice(0, 16)} readOnly />
          </label>
          <button onClick={sendSummitTx}>登頂証明を送信</button>
        </div>
      )}
    </div>
  );
}

export default SummitForm;
