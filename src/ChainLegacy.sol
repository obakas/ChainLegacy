// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AutomationCompatibleInterface} from "lib/chainlink-brownie-contracts/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {AggregatorV3Interface} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {PriceConverter} from "./PriceConverter.sol";

error ChainLegacy__NotEnoughUSD();
error ChainLegacy__WithdrawFailed();
error ChainLegacy__OnlyToken();

contract ChainLegacy is AutomationCompatibleInterface {
    using PriceConverter for uint256;

    address public immutable legacyToken;
    AggregatorV3Interface private s_priceFeed;
    uint256 public constant MINIMUM_USD = 5e18;

    struct InheritorInfo {
        string name;
        address inheritor;
        uint256 percent;
        uint256 unlockTimestamp;
    }

    struct LegacyPlan {
        string[] names;
        InheritorInfo[] inheritors;
        address[] tokens;
        uint256 timeout;
        uint256 lastPing;
        bool active;
        uint256 totalAssignedPercent;
        uint256 nativeBalance;
        mapping(address => uint256) erc20Balances;
    }

    mapping(address => LegacyPlan) private plans;

    event NativeDeposit(address indexed from, uint256 amount);
    event ERC20Deposit(address indexed from, uint256 amount);
    event InheritanceExecuted(address indexed planOwner, uint256 timestamp);

    constructor(address _legacyToken, address _priceFeed) {
        legacyToken = _legacyToken;
        s_priceFeed = AggregatorV3Interface(_priceFeed);
    }

    modifier onlyActive(address user) {
        require(plans[user].active, "Plan not active");
        _;
    }

    function registerPlan(
        string[] calldata names,
        address[] calldata inheritors,
        uint256[] calldata percentages,
        uint256[] calldata birthYears, // not used in demo
        uint256 timeout,
        address[] calldata tokens
    ) external {
        require(
            inheritors.length == percentages.length &&
                inheritors.length == birthYears.length &&
                inheritors.length == names.length,
            "Mismatched arrays"
        );
        require(inheritors.length > 0, "No inheritors");

        uint256 total;
        LegacyPlan storage plan = plans[msg.sender];
        delete plan.inheritors;

        for (uint256 i = 0; i < inheritors.length; i++) {
            total += percentages[i];

            uint256 unlockTime = block.timestamp + 3 minutes + (i * 1 minutes); // 🚀 demo mode unlock

            plan.inheritors.push(
                InheritorInfo({
                    name: names[i],
                    inheritor: inheritors[i],
                    percent: percentages[i],
                    unlockTimestamp: unlockTime
                })
            );
        }

        require(total <= 100, "Percentages cannot exceed 100");

        plan.names = names;
        plan.tokens = tokens;
        plan.timeout = timeout;
        plan.lastPing = block.timestamp;
        plan.active = true;
        plan.totalAssignedPercent = total;
    }


    function keepAlive() external onlyActive(msg.sender) {
        plans[msg.sender].lastPing = block.timestamp;
    }

    function registerInheritor(
        address inheritor,
        uint256 percent,
        string calldata name
    ) external {
        LegacyPlan storage plan = plans[msg.sender];

        require(inheritor != address(0), "Invalid address");
        require(percent > 0 && percent <= 100, "Invalid percent");

        for (uint256 i = 0; i < plan.inheritors.length; i++) {
            require(
                plan.inheritors[i].inheritor != inheritor,
                "Already registered"
            );
        }

        require(
            plan.totalAssignedPercent + percent <= 100,
            "Exceeds 100% allocation"
        );

        uint256 unlockTime = block.timestamp + 3 minutes; // 🔓 demo-ready unlock time

        plan.inheritors.push(
            InheritorInfo({
                name: name,
                inheritor: inheritor,
                percent: percent,
                unlockTimestamp: unlockTime
            })
        );
        plan.totalAssignedPercent += percent;
    }


    function fundWithNative() public payable {
        if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) {
            revert ChainLegacy__NotEnoughUSD();
        }
        plans[msg.sender].nativeBalance += msg.value;
        emit NativeDeposit(msg.sender, msg.value);
    }

    receive() external payable {
        fundWithNative();
    }

    fallback() external payable {
        fundWithNative();
    }

    function deposit(address from, uint256 amount) external {
        if (msg.sender != legacyToken) revert ChainLegacy__OnlyToken();
        plans[from].erc20Balances[legacyToken] += amount;
        emit ERC20Deposit(from, amount);
    }

    function withdrawNative(uint256 amount) external {
        LegacyPlan storage plan = plans[msg.sender];
        require(plan.nativeBalance >= amount, "Insufficient balance");
        plan.nativeBalance -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert ChainLegacy__WithdrawFailed();
    }

    function withdrawERC20(uint256 amount) external {
        LegacyPlan storage plan = plans[msg.sender];
        require(
            plan.erc20Balances[legacyToken] >= amount,
            "Insufficient token balance"
        );
        plan.erc20Balances[legacyToken] -= amount;
        require(
            IERC20(legacyToken).transfer(msg.sender, amount),
            "Token withdraw failed"
        );
    }

    function getERC20Balance(
        address user,
        address token
    ) external view returns (uint256) {
        return plans[user].erc20Balances[token];
    }

    function getTotalDepositedInUSD(
        address user
    ) external view returns (uint256) {
        return plans[user].nativeBalance.getConversionRate(s_priceFeed);
    }

    // function getAssignedPercent(address user) public view returns (uint256) {
    //     return plans[user].totalAssignedPercent;
    // }

    function getPlan(
        address user
    )
        external
        view
        returns (
            string[] memory names,
            InheritorInfo[] memory inheritors,
            address[] memory tokens,
            uint256 timeout,
            uint256 lastPing,
            bool active,
            uint256 nativeBalance
        )
    {
        LegacyPlan storage plan = plans[user];
        return (
            plan.names,
            plan.inheritors,
            plan.tokens,
            plan.timeout,
            plan.lastPing,
            plan.active,
            plan.nativeBalance
        );
    }

    function getPlanSummary(
        address user
    )
        external
        view
        returns (
            uint256 nameCount,
            uint256 inheritorCount,
            uint256 timeout,
            uint256 lastPing,
            bool active
        )
    {
        LegacyPlan storage plan = plans[user];
        return (
            plan.names.length,
            plan.inheritors.length,
            plan.timeout,
            plan.lastPing,
            plan.active
        );
    }

    function getUnallocatedPercent(address user) public view returns (uint256) {
        LegacyPlan storage plan = plans[user];
        if (!plan.active) return 0; // or maybe return 100, if you want to show all unallocated
        return 100 - plan.totalAssignedPercent;
    }

    function removeInheritor(address inheritor, string memory name) external {
        LegacyPlan storage plan = plans[msg.sender];
        bool found = false;
        uint256 percent = 0;
        uint256 index = 0;

        for (uint256 i = 0; i < plan.inheritors.length; i++) {
            if (
                plan.inheritors[i].inheritor == inheritor &&
                keccak256(abi.encodePacked(plan.inheritors[i].name)) ==
                keccak256(abi.encodePacked(name))
            ) {
                found = true;
                percent = plan.inheritors[i].percent;
                index = i;
                break;
            }
        }

        require(found, "Inheritor not found");

        // Remove inheritor
        for (uint256 i = index; i < plan.inheritors.length - 1; i++) {
            plan.inheritors[i] = plan.inheritors[i + 1];
        }
        plan.inheritors.pop();

        // plan.allocatedPercent -= percent;
    }

    function performUpkeep(bytes calldata performData) external override {
        address user = abi.decode(performData, (address));
        LegacyPlan storage plan = plans[user];

        require(
            plan.active && (block.timestamp - plan.lastPing > plan.timeout),
            "Not ready"
        );
        plan.active = false;

        for (uint256 i = 0; i < plan.tokens.length; i++) {
            IERC20 token = IERC20(plan.tokens[i]);
            uint256 totalBalance = plan.erc20Balances[address(token)];
            uint256 allocatedTotal = 0;

            for (uint256 j = 0; j < plan.inheritors.length; j++) {
                InheritorInfo memory info = plan.inheritors[j];
                if (block.timestamp >= info.unlockTimestamp) {
                    uint256 share = (totalBalance * info.percent) / 100;
                    token.transfer(info.inheritor, share);
                    allocatedTotal += share;
                }
            }

            plan.erc20Balances[address(token)] = 0;
            uint256 refund = totalBalance - allocatedTotal;
            if (refund > 0) token.transfer(user, refund);
        }

        uint256 nativeBal = plan.nativeBalance;
        uint256 nativeAllocated = 0;

        for (uint256 i = 0; i < plan.inheritors.length; i++) {
            InheritorInfo memory info = plan.inheritors[i];
            if (block.timestamp >= info.unlockTimestamp) {
                uint256 share = (nativeBal * info.percent) / 100;
                payable(info.inheritor).transfer(share);
                nativeAllocated += share;
            }
        }

        plan.nativeBalance = 0;
        uint256 nativeRefund = nativeBal - nativeAllocated;
        if (nativeRefund > 0) payable(user).transfer(nativeRefund);

        emit InheritanceExecuted(user, block.timestamp);
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
        upkeepNeeded =
            plan.active &&
            (block.timestamp - plan.lastPing > plan.timeout);
        performData = checkData;
    }
}
