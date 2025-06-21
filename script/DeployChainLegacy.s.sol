// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "src/ChainLegacy.sol";
import "src/LegacyToken.sol";

contract DeployChainLegacy is Script {
    function run() external {
        // Set deployer private key in env (or paste into script)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Broadcast transaction from deployer
        vm.startBroadcast(deployerPrivateKey);

        // Optional: deploy a demo ERC20 token with 1 million supply
        LegacyToken token = new LegacyToken(1_000_000 ether);

        // Deploy ChainLegacy contract
        ChainLegacy legacy = new ChainLegacy();

        vm.stopBroadcast();

        console2.log("LegacyToken deployed at:", address(token));
        console2.log("ChainLegacy deployed at:", address(legacy));
    }
}
