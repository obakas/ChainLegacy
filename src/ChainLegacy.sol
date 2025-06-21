// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "lib/chainlink-brownie-contracts/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

contract ChainLegacy is AutomationCompatibleInterface {
    struct InheritorInfo {
        address inheritor;
        uint256 percent; // out of 100
        uint256 unlockTimestamp; // when this inheritor is eligible (e.g. turns 18)
    }

    struct LegacyPlan {
        InheritorInfo[] inheritors;
        address[] tokens;
        uint256 timeout;
        uint256 lastPing;
        bool active;
    }

    mapping(address => LegacyPlan) public plans;

    modifier onlyActive(address user) {
        require(plans[user].active, "Plan not active");
        _;
    }

    function registerPlan(
        address[] calldata inheritors,
        uint256[] calldata percentages,
        uint256[] calldata birthYears,
        uint256 timeout,
        address[] calldata tokens,
        address[] calldata /* nfts */
    ) external {
        require(
            inheritors.length == percentages.length &&
                inheritors.length == birthYears.length,
            "Mismatched arrays"
        );
        require(inheritors.length > 0, "No inheritors");

        uint256 total;
        for (uint256 i = 0; i < percentages.length; i++) {
            total += percentages[i];
        }
        require(total == 100, "Percentages must sum to 100");

        delete plans[msg.sender].inheritors;
        for (uint256 i = 0; i < inheritors.length; i++) {
            uint256 unlockTime = block.timestamp +
                ((birthYears[i] + 18 - 1970) * 365 days);
            plans[msg.sender].inheritors.push(
                InheritorInfo({
                    inheritor: inheritors[i],
                    percent: percentages[i],
                    unlockTimestamp: unlockTime
                })
            );
        }

        plans[msg.sender].tokens = tokens;
        plans[msg.sender].timeout = timeout;
        plans[msg.sender].lastPing = block.timestamp;
        plans[msg.sender].active = true;
    }

    function keepAlive() external onlyActive(msg.sender) {
        plans[msg.sender].lastPing = block.timestamp;
    }

    function checkUpkeep(
        bytes calldata checkData
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        address user = abi.decode(checkData, (address));
        LegacyPlan storage plan = plans[user];
        if (plan.active && block.timestamp - plan.lastPing > plan.timeout) {
            upkeepNeeded = true;
            performData = checkData;
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        address user = abi.decode(performData, (address));
        LegacyPlan storage plan = plans[user];
        require(plan.active, "Inactive plan");
        require(
            block.timestamp - plan.lastPing > plan.timeout,
            "Timeout not reached"
        );

        for (uint256 i = 0; i < plan.tokens.length; i++) {
            IERC20 token = IERC20(plan.tokens[i]);
            uint256 totalBalance = token.balanceOf(address(this));

            for (uint256 j = 0; j < plan.inheritors.length; j++) {
                InheritorInfo memory info = plan.inheritors[j];
                if (block.timestamp >= info.unlockTimestamp) {
                    uint256 share = (totalBalance * info.percent) / 100;
                    token.transfer(info.inheritor, share);
                }
            }
        }

        plan.active = false;
    }
}
