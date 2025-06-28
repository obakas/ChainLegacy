-include .env


deploy:
	@forge script script/DeployChainLegacy.s.sol:DeployChainLegacy $(NETWORK_ARGS)

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(PRIVATE_KEY) --via-ir --broadcast



deploy-sepolia:
	@forge script script/DeployChainLegacy.s.sol --rpc-url  $(SEPOLIA_RPC_URL)  --private-key $(SEPOLIA_PRIVATE_KEY) --broadcast



