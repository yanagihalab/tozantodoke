import React, { useState, useEffect } from "react";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const CONTRACT_ADDRESS = "neutron1pl9ex24yh67l7atm4sz7j2rzs29my0p6qnxsc9nlmyaaqy2s9azqngl6hp";
const RPC_ENDPOINT = "https://rpc-palvus.pion-1.ntrn.tech";
const CHAIN_ID = "pion-1";

const executeMessages = [
  { type: "submit_climbing_info", fields: ["mountain", "start_date", "deposit_amount", "deposit_denom"], description: "登山情報を登録します。" },
  { type: "submit_descent_info", fields: ["return_date"], description: "下山情報を登録します。" },
  { type: "submit_warning_info", fields: ["nft_owner", "warning_message"], description: "注意情報を登録します。" },
];

const queryMessages = [
  { type: "get_climbing_info", fields: ["climber"], description: "特定ユーザーの登山情報を取得します。" },
  { type: "list_active_climbs", fields: [], description: "現在登山中の全ユーザーを取得します。" },
  { type: "list_all_climbs", fields: ["start_after", "limit"], description: "全ての登山情報を取得します。" },
  { type: "get_deposit_status", fields: ["climber"], description: "特定ユーザーのデポジット状態を取得します。" },
  { type: "get_warning_info", fields: ["nft_owner"], description: "特定のNFT所有者に関連する注意情報を取得します。" },
];

function ContractTestPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [client, setClient] = useState(null);
  const [executeResult, setExecuteResult] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [selectedExecuteMsg, setSelectedExecuteMsg] = useState(executeMessages[0].type);
  const [selectedQueryMsg, setSelectedQueryMsg] = useState(queryMessages[0].type);
  const [executeFormData, setExecuteFormData] = useState({});
  const [queryFormData, setQueryFormData] = useState({});

  useEffect(() => {
    const initClient = async () => {
      if (!window.keplr) {
        alert("Keplrウォレットをインストールしてください。");
        return;
      }

      await window.keplr.enable(CHAIN_ID);
      const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      setWalletAddress(accounts[0].address);

      const cosmwasmClient = await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, offlineSigner);
      setClient(cosmwasmClient);
    };

    initClient();
  }, []);

  const handleExecuteInputChange = (field, value) => {
    setExecuteFormData((prevData) => ({ ...prevData, [field]: value }));
  };

  const handleQueryInputChange = (field, value) => {
    setQueryFormData((prevData) => ({ ...prevData, [field]: value }));
  };

  const executeContract = async () => {
    if (!client) {
      alert("Clientが初期化されていません。");
      return;
    }

    const msgPayload = { [selectedExecuteMsg]: executeFormData };

    try {
      const fee = { amount: [{ denom: "untrn", amount: "10000" }], gas: "200000" };
      const result = await client.execute(walletAddress, CONTRACT_ADDRESS, msgPayload, fee);
      setExecuteResult(JSON.stringify(result, null, 2));
    } catch (error) {
      alert(`エラー発生: ${error.message}`);
    }
  };

  const queryContract = async () => {
    if (!client) {
      alert("Clientが初期化されていません。");
      return;
    }

    const msgPayload = { [selectedQueryMsg]: queryFormData };

    try {
      const result = await client.queryContractSmart(CONTRACT_ADDRESS, msgPayload);
      setQueryResult(JSON.stringify(result, null, 2));
    } catch (error) {
      alert(`エラー発生: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>コントラクト実行テスト</h2>

      <label>
        Executeメッセージ:
        <select value={selectedExecuteMsg} onChange={(e) => setSelectedExecuteMsg(e.target.value)}>
          {executeMessages.map((msg) => (
            <option key={msg.type} value={msg.type}>{msg.type}</option>
          ))}
        </select>
      </label>
      <p>{executeMessages.find(msg => msg.type === selectedExecuteMsg)?.description}</p>

      {executeMessages.find((msg) => msg.type === selectedExecuteMsg).fields.map((field) => (
        <div key={field}>
          <label>{field}:
            <input value={executeFormData[field] || ""} onChange={(e) => handleExecuteInputChange(field, e.target.value)} />
          </label>
        </div>
      ))}

      <button onClick={executeContract}>Execute実行</button>
      {executeResult && <pre>{executeResult}</pre>}

      <h2>コントラクトクエリテスト</h2>
      <label>
        Queryメッセージ:
        <select value={selectedQueryMsg} onChange={(e) => setSelectedQueryMsg(e.target.value)}>
          {queryMessages.map((msg) => (
            <option key={msg.type} value={msg.type}>{msg.type}</option>
          ))}
        </select>
      </label>
      <p>{queryMessages.find(msg => msg.type === selectedQueryMsg)?.description}</p>

      {queryMessages.find((msg) => msg.type === selectedQueryMsg).fields.map((field) => (
        <div key={field}>
          <label>{field}:
            <input value={queryFormData[field] || ""} onChange={(e) => handleQueryInputChange(field, e.target.value)} />
          </label>
        </div>
      ))}

      <button onClick={queryContract}>Query実行</button>
      {queryResult && <pre>{queryResult}</pre>}
    </div>
  );
}

export default ContractTestPage;
