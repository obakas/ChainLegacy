-include .env

deploy:
	@forge script script/DeployChainLegacy.s.sol:DeployChainLegacy $(NETWORK_ARGS)

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(PRIVATE_KEY) --via-ir --broadcast