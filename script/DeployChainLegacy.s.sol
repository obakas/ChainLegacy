// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from  "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ChainLegacy} from  "src/ChainLegacy.sol";
import {LegacyToken} from "src/LegacyToken.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployChainLegacy is Script {
    function run() external {
        // Set deployer private key in env (or paste into script)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        HelperConfig helperConfig = new HelperConfig();
        address ethUsdPriceFeed = helperConfig.activeNetworkConfig();



        // Broadcast transaction from deployer
        vm.startBroadcast(deployerPrivateKey);

        // Optional: deploy a demo ERC20 token with 1 million supply
        LegacyToken token = new LegacyToken(1_000_000 ether);

        // Deploy ChainLegacy contract
        ChainLegacy legacy = new ChainLegacy(address(token), ethUsdPriceFeed);

        vm.stopBroadcast();
        

        console2.log("LegacyToken deployed at:", address(token));
        console2.log("ChainLegacy deployed at:", address(legacy));
    }
}
