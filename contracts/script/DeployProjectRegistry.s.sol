
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";

contract DeployProjectRegistry is Script {
    function run() external returns (ProjectRegistry) {
        vm.startBroadcast();

        ProjectRegistry registry = new ProjectRegistry();

        vm.stopBroadcast();

        return registry;
    }
}
