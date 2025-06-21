```md
# 🏛️ ChainLegacy

**A decentralized smart inheritance protocol.**  
Ensure your digital assets are securely passed on — even when you’re not around to do it yourself.

---

## ✨ What is ChainLegacy?

ChainLegacy lets you register inheritors for your crypto assets and define the conditions under which those assets will be transferred — like inactivity, custom age locks (e.g. turning 18), or timeouts. Think of it as a **will on the blockchain**.

No middlemen. No lawyers. Just code, Chainlink, and your legacy.

---

## 🛠️ Tech Stack & Architecture

| Layer            | Tech                        |
|------------------|-----------------------------|
| Smart Contracts  | Solidity                    |
| Framework        | Foundry                     |
| Chainlink Tools  | Automation (Keepers)        |
| Token Standard   | ERC20 (`LegacyToken`)       |
| Data Layer       | Ethereum Storage            |
| Frontend (Planned) | React + RainbowKit (TBD) |

### 🔗 Chainlink Integration

ChainLegacy uses **Chainlink Automation** to monitor user activity (via `keepAlive()`) and trigger asset transfers when conditions are met (`performUpkeep`). All asset distribution is **on-chain and permissionless**.

---

## 🧪 Features

- 🧾 Register inheritors with custom percentages
- ⏳ Automated inheritance via Chainlink Automation
- 🎂 Age-based unlocking (e.g. daughter inherits at 18)
- 💀 Dead man's switch (`keepAlive` timeout)
- 🪙 ERC20 token support (NFT support coming soon)
- 🔒 Fully non-custodial

---

## 🧠 How It Works

1. **Deploy ChainLegacy**
2. **Register your plan**:
   - Inheritors and their birth years
   - Percentage splits (must total 100)
   - Timeout (e.g. 30 days)
   - Assets (ERC20 tokens)
3. **Transfer assets to contract**
4. **Ping `keepAlive()` regularly**
5. **Chainlink Automation** checks inactivity
6. If user inactive and inheritor is age-eligible, assets are distributed

---

## 📁 Repo Structure

```

/src
├── ChainLegacy.sol       # Core protocol logic
└── LegacyToken.sol       # Mintable demo token (ERC20)

/test
└── ChainLegacy.t.sol     # Foundry unit tests

/script
└── DeployChainLegacy.s.sol  # Deployment script

````

---

## ⚙️ Local Setup & Testing

```bash
forge install
forge build
forge test 
````

---

## 🚀 Deploy to Testnet

Set your private key in `.env`:

```bash
PRIVATE_KEY=your_private_key_here
RPC_URL=http://localhost:8545
```

Then run:

```bash
forge script script/DeployChainLegacy.s.sol \
  --rpc-url $RPC_URL \
  --broadcast -vvvv
```
or

```
make deploy
```

---

## 🧪 Example Test Output

```bash
[PASS] test_InheritanceTransfersToInheritors() (gas: 102317)
Test result: All 1 tests passed!
```

---

## 📹 Demo Video

📺 [Watch the Demo](#)
*(3–5 minutes, public video showing contract functionality, test results, and Chainlink usage)*

---

## 🔐 Chainlink Hackathon Requirements

✅ Uses Chainlink Automation
✅ Smart contract changes state via Chainlink
✅ Public source code (GitHub)
✅ Video demo + README

---

## 📄 License

MIT — use it, remix it, pass the legacy on.

---

## 👨🏽‍💻 Author

**Obaka Idris**
Aspiring blockchain engineer building public-good protocols that *outlive their creators.*
[GitHub: @obakas](https://github.com/obakas/ChainLegacy)

---

```

