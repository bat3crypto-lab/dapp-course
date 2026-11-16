
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";

contract ProjectRegistryTest is Test {
    ProjectRegistry registry;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

event ProjectRegistered(uint256 indexed id, address indexed owner);

event ProjectUpdated(uint256 indexed id, address indexed owner);

event OwnershipTransferred(
    uint256 indexed id,
    address indexed previousOwner,
    address indexed newOwner
);


    function setUp() public {
        registry = new ProjectRegistry();
    }

    function testRegisterProject() public {
        vm.prank(alice);

        registry.registerProject(
            "Alice's Project",
            "My first blockchain project"
        );

        assertEq(registry.projectCount(), 1);

        (
            uint256 id,
            string memory name,
            string memory description,
            address owner
        ) = registry.projects(1);

        assertEq(id, 1);
        assertEq(name, "Alice's Project");
        assertEq(description, "My first blockchain project");
        assertEq(owner, alice);
    }

    function testOwnerCanUpdateProject() public {
        vm.prank(alice);
        registry.registerProject("Original", "Description");

        vm.prank(alice);
        registry.updateProject(
            1,
            "Updated",
            "New description"
        );

        (, string memory name, string memory description, ) =
            registry.projects(1);

        assertEq(name, "Updated");
        assertEq(description, "New description");
    }

    function testNonOwnerCannotUpdateProject() public {
        vm.prank(alice);
        registry.registerProject("Original", "Description");

        vm.prank(bob);
        vm.expectRevert(
            bytes("Not the project owner")
        );

        registry.updateProject(
            1,
            "Bob's edit",
            "Unauthorized change"
        );
    }

    function testCannotRegisterEmptyName() public {
        vm.prank(alice);
        vm.expectRevert(
            bytes("Name cannot be empty")
        );

        registry.registerProject("", "Description");
    }


function testOwnerCanTransferProject() public {
    vm.prank(alice);
    registry.registerProject("Original", "Description");

    vm.prank(alice);
    registry.transferProjectOwnership(1, bob);

    (, , , address owner) = registry.projects(1);

    assertEq(owner, bob);
}

function testPreviousOwnerCannotUpdateAfterTransfer() public {
    vm.prank(alice);
    registry.registerProject("Original", "Description");

    vm.prank(alice);
    registry.transferProjectOwnership(1, bob);

    vm.prank(alice);
    vm.expectRevert(bytes("Not the project owner"));

    registry.updateProject(
        1,
        "Alice's edit",
        "Should be rejected"
    );

    vm.prank(bob);
    registry.updateProject(
        1,
        "Bob's project",
        "New owner updated it"
    );

    (, string memory name, , address owner) =
        registry.projects(1);

    assertEq(name, "Bob's project");
    assertEq(owner, bob);
}

function testCannotTransferToZeroAddress() public {
    vm.prank(alice);
    registry.registerProject("Original", "Description");

    vm.prank(alice);
    vm.expectRevert(bytes("Invalid new owner"));

    registry.transferProjectOwnership(1, address(0));
}

function testCannotUpdateNonexistentProject() public {
    vm.prank(alice);
    vm.expectRevert(bytes("Project does not exist"));

    registry.updateProject(
        999,
        "New name",
        "New description"
    );
}

function testCannotTransferNonexistentProject() public {
    vm.prank(alice);
    vm.expectRevert(bytes("Project does not exist"));

    registry.transferProjectOwnership(999, bob);
}

function testNonOwnerCannotTransferProject() public {
    vm.prank(alice);
    registry.registerProject("Alice's project", "Description");

    vm.prank(bob);
    vm.expectRevert(bytes("Not the project owner"));

    registry.transferProjectOwnership(1, bob);
}

function testCannotUpdateProjectWithEmptyName() public {
    vm.prank(alice);
    registry.registerProject("Original", "Description");

    vm.prank(alice);
    vm.expectRevert(bytes("Name cannot be empty"));

    registry.updateProject(1, "", "New description");
}

function testMultipleProjectsHaveUniqueIds() public {
    vm.startPrank(alice);

    registry.registerProject("Project One", "First");
    registry.registerProject("Project Two", "Second");

    vm.stopPrank();

    assertEq(registry.projectCount(), 2);

    (uint256 firstId, , , ) = registry.projects(1);
    (uint256 secondId, , , ) = registry.projects(2);

    assertEq(firstId, 1);
    assertEq(secondId, 2);
}

function testFuzzRegisterProject(
    string memory name,
    string memory description
) public {
    // Only test valid, non-empty project names.
    vm.assume(bytes(name).length > 0);

    vm.prank(alice);
    registry.registerProject(name, description);

    assertEq(registry.projectCount(), 1);

    (
        uint256 id,
        string memory storedName,
        string memory storedDescription,
        address owner
    ) = registry.projects(1);

    assertEq(id, 1);
    assertEq(storedName, name);
    assertEq(storedDescription, description);
    assertEq(owner, alice);
}

function testRegistrationEmitsEvent() public {
    vm.expectEmit(true, true, false, false);
    emit ProjectRegistered(1, alice);

    vm.prank(alice);
    registry.registerProject("Project", "Description");
}

function testUpdateEmitsEvent() public {
    vm.prank(alice);
    registry.registerProject("Original", "Description");

    vm.expectEmit(true, true, false, false);
    emit ProjectUpdated(1, alice);

    vm.prank(alice);
    registry.updateProject(1, "Updated", "New description");
}

function testTransferEmitsEvent() public {
    vm.prank(alice);
    registry.registerProject("Project", "Description");

    vm.expectEmit(true, true, true, false);
    emit OwnershipTransferred(1, alice, bob);

    vm.prank(alice);
    registry.transferProjectOwnership(1, bob);
}

function testRejectedUpdatePreservesProject() public {
    vm.prank(alice);
    registry.registerProject("Original", "Description");

    vm.prank(bob);
    vm.expectRevert(bytes("Not the project owner"));

    registry.updateProject(1, "Hacked", "Changed");

    (, string memory name, string memory description, address owner) =
        registry.projects(1);

    assertEq(name, "Original");
    assertEq(description, "Description");
    assertEq(owner, alice);
}

}
