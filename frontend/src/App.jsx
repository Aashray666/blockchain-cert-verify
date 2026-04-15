import { useState, useEffect } from "react";
import { JsonRpcProvider, Wallet, Contract } from "ethers";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const ABI = [
  "function issueCertificate(bytes32 _hash, string _recipientName, string _course, string _date) public",
  "function verifyCertificate(bytes32 _hash) public view returns (bool exists, string recipientName, string course, string date)",
];

async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getContract(needSigner = false) {
  const provider = new JsonRpcProvider(RPC_URL);
  if (needSigner) {
    const wallet = new Wallet(PRIVATE_KEY, provider);
    return new Contract(CONTRACT_ADDRESS, ABI, wallet);
  }
  return new Contract(CONTRACT_ADDRESS, ABI, provider);
}

export default function App() {
  const [tab, setTab] = useState("issue");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [txLogs, setTxLogs] = useState([]);

  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [issueFile, setIssueFile] = useState(null);
  const [verifyFile, setVerifyFile] = useState(null);
  const [result, setResult] = useState(null);

  // Blockchain explorer state
  const [blocks, setBlocks] = useState([]);
  const [chainInfo, setChainInfo] = useState({ blockNumber: 0, gasPrice: "0", accounts: [] });
  const [selectedBlock, setSelectedBlock] = useState(null);

  function addLog(msg) {
    setTxLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }

  // Fetch blockchain data
  async function fetchChainData() {
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const blockNumber = await provider.getBlockNumber();
      const gasPrice = (await provider.getFeeData()).gasPrice;
      const network = await provider.getNetwork();

      const blockList = [];
      const start = Math.max(0, blockNumber - 9);
      for (let i = blockNumber; i >= start; i--) {
        const block = await provider.getBlock(i, true);
        blockList.push(block);
      }

      setBlocks(blockList);
      setChainInfo({
        blockNumber,
        chainId: network.chainId.toString(),
        gasPrice: gasPrice ? (Number(gasPrice) / 1e9).toFixed(2) : "0",
      });
    } catch (err) {
      console.error("Failed to fetch chain data", err);
    }
  }

  useEffect(() => {
    fetchChainData();
    const interval = setInterval(fetchChainData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleIssue(e) {
    e.preventDefault();
    try {
      setStatusType("loading"); setStatus("Hashing file...");
      const hash = await hashFile(issueFile);
      addLog(`SHA-256: ${hash}`);
      setStatus("Sending transaction...");
      const contract = await getContract(true);
      const tx = await contract.issueCertificate(hash, name, course, date);
      addLog(`TX Hash: ${tx.hash}`);
      setStatus("Waiting for confirmation...");
      const receipt = await tx.wait();
      addLog(`Block #${receipt.blockNumber} | Gas: ${receipt.gasUsed.toString()}`);
      setStatusType("success"); setStatus("Certificate issued on blockchain!");
      fetchChainData();
    } catch (err) {
      setStatusType("error"); setStatus("Error: " + err.message);
      addLog(`Error: ${err.message}`);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    try {
      setStatusType("loading"); setStatus("Hashing file...");
      const hash = await hashFile(verifyFile);
      addLog(`SHA-256: ${hash}`);
      setStatus("Querying blockchain...");
      const contract = await getContract(false);
      const [exists, recipientName, courseName, issueDate] = await contract.verifyCertificate(hash);
      addLog(`Result: Certificate ${exists ? "FOUND" : "NOT FOUND"}`);
      if (exists) {
        setResult({ recipientName, courseName, issueDate });
        setStatusType("success"); setStatus("Certificate is VALID");
      } else {
        setResult(null); setStatusType("error"); setStatus("Certificate NOT FOUND");
      }
    } catch (err) {
      setStatusType("error"); setStatus("Error: " + err.message);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "#e2e8f0", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "rgba(15,23,42,0.9)", borderBottom: "1px solid #334155", padding: "16px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: "#fff" }}>🔗 Blockchain Certificate Verification</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Ethereum Smart Contract · Hardhat Local Network</p>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <span style={{ color: "#10b981" }}>● Connected</span>
          <span style={{ color: "#94a3b8" }}>Block #{chainInfo.blockNumber}</span>
          <span style={{ color: "#94a3b8" }}>Gas: {chainInfo.gasPrice} Gwei</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "flex", maxWidth: 1300, margin: "24px auto", padding: "0 20px", gap: 24 }}>
        {/* LEFT — Main Panel */}
        <div style={{ flex: "1 1 55%", minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: 20 }}>
            {["issue", "verify"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setStatus(""); setStatusType(""); setResult(null); }}
                style={{ flex: 1, padding: 13, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                  background: tab === t ? "#4f46e5" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8",
                  borderRadius: t === "issue" ? "10px 0 0 10px" : "0 10px 10px 0" }}>
                {t === "issue" ? "📜 Issue Certificate" : "🔍 Verify Certificate"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={cardStyle}>
            {tab === "issue" && (
              <form onSubmit={handleIssue}>
                <label style={labelStyle}>Recipient Name</label>
                <input style={inputStyle} placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                <label style={labelStyle}>Course</label>
                <input style={inputStyle} placeholder="e.g. Computer Science" value={course} onChange={(e) => setCourse(e.target.value)} required />
                <label style={labelStyle}>Date of Issue</label>
                <input style={{ ...inputStyle, colorScheme: "dark" }} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <label style={labelStyle}>Certificate PDF</label>
                <input style={inputStyle} type="file" accept=".pdf" onChange={(e) => setIssueFile(e.target.files[0])} required />
                <button style={btnStyle} type="submit">Issue to Blockchain</button>
              </form>
            )}
            {tab === "verify" && (
              <form onSubmit={handleVerify}>
                <label style={labelStyle}>Upload Certificate PDF</label>
                <input style={inputStyle} type="file" accept=".pdf" onChange={(e) => setVerifyFile(e.target.files[0])} required />
                <button style={btnStyle} type="submit">Verify on Blockchain</button>
              </form>
            )}

            {status && (
              <div style={{ marginTop: 18, padding: 12, borderRadius: 8, fontSize: 13,
                background: statusType === "success" ? "#064e3b" : statusType === "error" ? "#7f1d1d" : "#1e3a5f",
                border: `1px solid ${statusType === "success" ? "#10b981" : statusType === "error" ? "#ef4444" : "#3b82f6"}`,
                color: statusType === "success" ? "#6ee7b7" : statusType === "error" ? "#fca5a5" : "#93c5fd" }}>
                {statusType === "loading" && "⏳ "}{statusType === "success" && "✅ "}{statusType === "error" && "❌ "}{status}
              </div>
            )}

            {result && (
              <div style={{ marginTop: 14, padding: 14, background: "#064e3b", border: "1px solid #10b981", borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: "#6ee7b7", marginBottom: 8, fontWeight: 700 }}>CERTIFICATE DETAILS</div>
                {[["Recipient", result.recipientName], ["Course", result.courseName], ["Issued", result.issueDate]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #134e4a", fontSize: 13 }}>
                    <span style={{ color: "#94a3b8" }}>{l}</span><span style={{ color: "#fff" }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          {txLogs.length > 0 && (
            <div style={{ ...cardStyle, marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8" }}>📋 Transaction Log</span>
                <button onClick={() => setTxLogs([])} style={{ background: "none", border: "1px solid #475569", color: "#94a3b8", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>Clear</button>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 11, maxHeight: 160, overflowY: "auto" }}>
                {txLogs.map((log, i) => (
                  <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #1e293b", color: "#cbd5e1", wordBreak: "break-all" }}>
                    <span style={{ color: "#64748b" }}>[{log.time}]</span> {log.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Blockchain Explorer */}
        <div style={{ flex: "1 1 45%", minWidth: 0 }}>
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#38bdf8" }}>⛓️ Blockchain Explorer</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Network", value: "Hardhat Local" },
                { label: "Chain ID", value: chainInfo.chainId || "31337" },
                { label: "Latest Block", value: `#${chainInfo.blockNumber}` },
                { label: "Gas Price", value: `${chainInfo.gasPrice} Gwei` },
              ].map((item) => (
                <div key={item.label} style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: "#38bdf8", marginTop: 3, fontFamily: "monospace" }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Contract</div>
            <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 11, color: "#a78bfa", wordBreak: "break-all" }}>
              {CONTRACT_ADDRESS}
            </div>
          </div>

          {/* Blocks List */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#38bdf8" }}>🧱 Recent Blocks</h3>
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {blocks.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>No blocks yet...</div>}
              {blocks.map((block) => (
                <div key={block.number}
                  onClick={() => setSelectedBlock(selectedBlock === block.number ? null : block.number)}
                  style={{ padding: "10px 12px", marginBottom: 8, background: selectedBlock === block.number ? "#1e3a5f" : "#0f172a",
                    border: `1px solid ${selectedBlock === block.number ? "#3b82f6" : "#1e293b"}`,
                    borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Block #{block.number}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 10,
                      background: block.transactions.length > 0 ? "#4f46e5" : "#334155",
                      color: block.transactions.length > 0 ? "#fff" : "#94a3b8",
                    }}>
                      {block.transactions.length} tx{block.transactions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    {new Date(Number(block.timestamp) * 1000).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2, fontFamily: "monospace" }}>
                    Hash: {block.hash.slice(0, 20)}...{block.hash.slice(-8)}
                  </div>

                  {/* Expanded block details */}
                  {selectedBlock === block.number && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #334155", fontSize: 11 }}>
                      <div style={{ color: "#94a3b8", marginBottom: 4 }}>Gas Used: {block.gasUsed.toString()}</div>
                      <div style={{ color: "#94a3b8", marginBottom: 4 }}>Gas Limit: {block.gasLimit.toString()}</div>
                      {block.transactions.length > 0 && (
                        <div>
                          <div style={{ color: "#38bdf8", marginTop: 6, marginBottom: 4 }}>Transactions:</div>
                          {block.transactions.map((tx, i) => (
                            <div key={i} style={{ background: "#0f172a", borderRadius: 6, padding: 8, marginBottom: 4, fontFamily: "monospace", wordBreak: "break-all", color: "#a78bfa", fontSize: 10 }}>
                              {typeof tx === "string" ? tx : tx.hash}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 22 };
const labelStyle = { display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 };
const inputStyle = { width: "100%", padding: "11px 12px", marginBottom: 14, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box", outline: "none" };
const btnStyle = { width: "100%", padding: 13, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, marginTop: 4 };
