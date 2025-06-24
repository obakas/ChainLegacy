// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "lib/chainlink-brownie-contracts/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

contract ChainLegacy is AutomationCompatibleInterface {
    event InheritanceExecuted(address indexed planOwner, uint256 timestamp);
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
        uint256 totalAssignedPercent;
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
        address[] calldata tokens // address[] calldata nfts
    ) external {
        require(
            inheritors.length == percentages.length &&
                inheritors.length == birthYears.length,
            "Mismatched arrays"
        );
        require(inheritors.length > 0, "No inheritors");

        uint256 total;
        // delete plans[msg.sender].inheritors;
        for (uint256 i = 0; i < inheritors.length; i++) {
            total += percentages[i];
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
        require(total <= 100, "Percentages cannot exceed 100");

        plans[msg.sender].tokens = tokens;
        plans[msg.sender].timeout = timeout;
        plans[msg.sender].lastPing = block.timestamp;
        plans[msg.sender].active = true;
        plans[msg.sender].totalAssignedPercent = total;
    }


    function keepAlive() external onlyActive(msg.sender) {
        plans[msg.sender].lastPing = block.timestamp;
    }


    function registerInheritor(address inheritor, uint256 percent) external {
        LegacyPlan storage plan = plans[msg.sender];

        require(inheritor != address(0), "Invalid address");
        require(percent > 0 && percent <= 100, "Invalid percent");

        // Check if already registered
        for (uint256 i = 0; i < plan.inheritors.length; i++) {
            require(plan.inheritors[i].inheritor != inheritor, "Already registered");
        }

        require(
            plan.totalAssignedPercent + percent <= 100,
            "Exceeds 100% allocation"
        );

        plan.inheritors.push(
            InheritorInfo({
                inheritor: inheritor,
                percent: percent,
                unlockTimestamp: block.timestamp // or set as needed
            })
        );
        plan.totalAssignedPercent += percent;
    }

    function removeInheritor(address inheritor) external {
        LegacyPlan storage plan = plans[msg.sender];
        bool found = false;
        uint256 percent = 0;
        uint256 index = 0;

        for (uint256 i = 0; i < plan.inheritors.length; i++) {
            if (plan.inheritors[i].inheritor == inheritor) {
                found = true;
                percent = plan.inheritors[i].percent;
                index = i;
                break;
            }
        }

        require(found, "Inheritor not found");

        // Subtract percent
        plan.totalAssignedPercent -= percent;

        // Remove from array
        plan.inheritors[index] = plan.inheritors[plan.inheritors.length - 1];
        plan.inheritors.pop();
    }

    function getUnallocatedPercent(address user) public view returns (uint256) {
        return 100 - plans[user].totalAssignedPercent;
    }

    function getAssignedPercent(
        address user
    ) public view returns (uint256) {
        return plans[user].totalAssignedPercent;
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

    function getPlan(
        address user
    )
        external
        view
        returns (
            InheritorInfo[] memory,
            address[] memory,
            uint256,
            uint256,
            bool
        )
    {
        LegacyPlan storage plan = plans[user];
        return (
            plan.inheritors,
            plan.tokens,
            plan.timeout,
            plan.lastPing,
            plan.active
        );
    }

    function getPlanSummary(
        address user
    )
        external
        view
        returns (
            uint256 inheritorCount,
            uint256 timeout,
            uint256 lastPing,
            bool active
        )
    {
        LegacyPlan storage plan = plans[user];
        return (
            plan.inheritors.length,
            plan.timeout,
            plan.lastPing,
            plan.active
        );
    }
}
