
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProjectRegistry {
    struct Project {
        uint256 id;
        string name;
        string description;
        address owner;
    }

    uint256 public projectCount;

    mapping(uint256 => Project) public projects;

    event ProjectRegistered(
        uint256 indexed id,
        address indexed owner
    );

    function registerProject(
        string memory name,
        string memory description
    ) public {
        require(bytes(name).length > 0, "Name cannot be empty");

        projectCount++;

        projects[projectCount] = Project({
            id: projectCount,
            name: name,
            description: description,
            owner: msg.sender
        });

        emit ProjectRegistered(projectCount, msg.sender);
    }

    event ProjectUpdated(
        uint256 indexed id,
        address indexed owner
    );

    function updateProject(
        uint256 id,
        string memory newName,
        string memory newDescription
    ) public {
        require(
            id > 0 && id <= projectCount,
            "Project does not exist"
        );

        Project storage project = projects[id];

        require(
            msg.sender == project.owner,
            "Not the project owner"
        );

        require(
            bytes(newName).length > 0,
            "Name cannot be empty"
        );

        project.name = newName;
        project.description = newDescription;

        emit ProjectUpdated(id, msg.sender);
    }


    event OwnershipTransferred(
        uint256 indexed id,
        address indexed previousOwner,
        address indexed newOwner
    );

    function transferProjectOwnership(
        uint256 id,
        address newOwner
    ) public {
        require(
            id > 0 && id <= projectCount,
            "Project does not exist"
        );

        Project storage project = projects[id];

        require(
            msg.sender == project.owner,
            "Not the project owner"
        );

        require(
            newOwner != address(0),
            "Invalid new owner"
        );

        address previousOwner = project.owner;

        project.owner = newOwner;

        emit OwnershipTransferred(
            id,
            previousOwner,
            newOwner
        );
    }


}
