// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract ERC1271SignatureChecker {
    function isValidSignature(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) external view returns (bool) {
        return SignatureChecker.isValidSignatureNow(signer, hash, signature);
    }
}
