import React, { useState } from "react";

function IPFSUploadForm() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("ファイルを選択してください。");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("https://ipfs-cluster.yamada.jo.sus.ac.jp/add", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa("ipfs:ipfs-yamada-lab")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult(`IPFS CID: ${result.Hash}`);
      } else {
        setUploadResult(`アップロード失敗: ${response.statusText}`);
      }
    } catch (error) {
      setUploadResult(`エラーが発生しました: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>IPFS画像アップロードフォーム</h2>

      <input type="file" onChange={handleFileChange} />

      <button type="button" onClick={handleUpload}>
        IPFSにアップロード
      </button>

      {uploadResult && <p>{uploadResult}</p>}
    </div>
  );
}

export default IPFSUploadForm;
