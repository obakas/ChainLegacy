// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "src/ChainLegacy.sol";
import "src/LegacyToken.sol";

contract ChainLegacyTest is Test {
    ChainLegacy public legacy;
    LegacyToken public token;
    address public owner = address(1);
    address public inheritor1 = address(2);
    address public inheritor2 = address(3);
    address public inheritor3 = address(4);

    function setUp() public {
        legacy = new ChainLegacy();
        token = new LegacyToken(1_000_000 ether);
        token.transfer(owner, 1000 ether);
        vm.startPrank(owner);
        token.approve(address(legacy), 1000 ether);
    }

    // function testRegisterPlanAndDistribute() public {
    //     address[] memory inheritors = new address[](2);
    //     inheritors[0] = inheritor1;
    //     inheritors[1] = inheritor2;
    //     uint256[] memory percentages = new uint256[](2);
    //     percentages[0] = 60;
    //     percentages[1] = 40;
    //     uint256[] memory birthYears = new uint256[](2);
    //     birthYears[0] = 1952;
    //     birthYears[1] = 1952;
    //     address[] memory tokens = new address[](1);
    //     tokens[0] = address(token);
    //     address[] memory nfts = new address[](0);

    //     legacy.registerPlan(inheritors, percentages, birthYears, 1 days, tokens, nfts);
    //     (bool upkeepNeeded1, ) = legacy.checkUpkeep(abi.encode(owner));
    //     assertFalse(upkeepNeeded1, "Upkeep should not be needed yet");

    //     // Simulate time passing
    //     vm.warp(block.timestamp + 2 days);
    //     (bool upkeepNeeded2, ) = legacy.checkUpkeep(abi.encode(owner));
    //     assertTrue(upkeepNeeded2, "Upkeep should be needed after timeout");

    //     // Run upkeep
    //     uint256 bal1Before = token.balanceOf(inheritor1);
    //     uint256 bal2Before = token.balanceOf(inheritor2);
    //     legacy.performUpkeep(abi.encode(owner));
    //     uint256 bal1After = token.balanceOf(inheritor1);
    //     uint256 bal2After = token.balanceOf(inheritor2);
    //     assertEq(bal1After - bal1Before, 600 ether, "Inheritor1 should get 60%");
    //     assertEq(bal2After - bal2Before, 400 ether, "Inheritor2 should get 40%");
    // }

    function testRegisterPlanMismatchedArrays() public {
        address[] memory inheritors = new address[](2);
        inheritors[0] = inheritor1;
        inheritors[1] = inheritor2;
        uint256[] memory percentages = new uint256[](1);
        percentages[0] = 100;
        uint256[] memory birthYears = new uint256[](2);
        birthYears[0] = 2000;
        birthYears[1] = 2005;
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        // address[] memory nfts = new address[](0);

        vm.expectRevert("Mismatched arrays");
        legacy.registerPlan(inheritors, percentages, birthYears, 1 days, tokens);
    }

    function testRegisterPlanPercentagesNot100() public {
        address[] memory inheritors = new address[](2);
        inheritors[0] = inheritor1;
        inheritors[1] = inheritor2;
        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 70;
        percentages[1] = 20;
        uint256[] memory birthYears = new uint256[](2);
        birthYears[0] = 2000;
        birthYears[1] = 2005;
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        // address[] memory nfts = new address[](0);

        vm.expectRevert("Percentages must sum to 100");
        legacy.registerPlan(inheritors, percentages, birthYears, 1 days, tokens);
    }

    function testKeepAlivePreventsUpkeep() public {
        address[] memory inheritors = new address[](1);
        inheritors[0] = inheritor1;
        uint256[] memory percentages = new uint256[](1);
        percentages[0] = 100;
        uint256[] memory birthYears = new uint256[](1);
        birthYears[0] = 2000;
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        // address[] memory nfts = new address[](0);

        legacy.registerPlan(inheritors, percentages, birthYears, 1 days, tokens);
        vm.warp(block.timestamp + 12 hours);
        legacy.keepAlive();
        vm.warp(block.timestamp + 12 hours + 1);
        (bool upkeepNeeded3, ) = legacy.checkUpkeep(abi.encode(owner));
        assertFalse(upkeepNeeded3, "Upkeep should not be needed after keepAlive");
    }
}
