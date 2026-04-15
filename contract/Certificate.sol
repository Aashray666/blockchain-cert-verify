// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Certificate {
    address public owner;

    struct Cert {
        string recipientName;
        string course;
        string date;
        bool exists;
    }

    mapping(bytes32 => Cert) public certificates;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can issue certificates");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCertificate(
        bytes32 _hash,
        string memory _recipientName,
        string memory _course,
        string memory _date
    ) public onlyOwner {
        require(!certificates[_hash].exists, "Certificate already exists");
        certificates[_hash] = Cert(_recipientName, _course, _date, true);
    }

    function verifyCertificate(bytes32 _hash)
        public
        view
        returns (bool exists, string memory recipientName, string memory course, string memory date)
    {
        Cert memory c = certificates[_hash];
        return (c.exists, c.recipientName, c.course, c.date);
    }
}
