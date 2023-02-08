import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const { utils } = ethers;

const rawMessage = "ERC1271SignatureChecker";
const TEST_MESSAGE = utils.keccak256(utils.toUtf8Bytes(rawMessage));
const WRONG_MESSAGE = utils.keccak256(utils.toUtf8Bytes("Nope"));

// 参考 https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/helpers/sign.js
function toEthSignedMessageHash(messageHex: string) {
  const messageBuffer = Buffer.from(messageHex.substring(2), "hex");
  const prefix = Buffer.from(
    `\u0019Ethereum Signed Message:\n${messageBuffer.length}`
  );
  return ethers.utils.keccak256(Buffer.concat([prefix, messageBuffer]));
}

describe("ERC1271SignatureChecker", function () {
  async function deployERC1271SignatureCheckerFixture() {
    // Contracts are deployed using the first signer/account by default

    const [signer, otherAccount] = await ethers.getSigners();

    const ERC1271SignatureChecker = await ethers.getContractFactory(
      "ERC1271SignatureChecker"
    );
    const signatureChecker = await ERC1271SignatureChecker.deploy();

    const ERC1271WalletMock = await ethers.getContractFactory(
      "ERC1271WalletMock"
    );

    const wallet = await ERC1271WalletMock.deploy(signer.address);

    // console.log("signer.address", signer.address);
    // console.log("wallet", wallet);

    const ERC1271MaliciousMock = await ethers.getContractFactory(
      "ERC1271MaliciousMock"
    );

    const maliciousWallet = await ERC1271MaliciousMock.deploy();

    const messageHash = toEthSignedMessageHash(TEST_MESSAGE);
    const messageWrongHash = toEthSignedMessageHash(WRONG_MESSAGE);

    // etherjs 签名方式和web3js 不同
    // https://github.com/ethers-io/ethers.js/issues/285#issuecomment-423901328
    const signature = await signer.signMessage(
      ethers.utils.arrayify(TEST_MESSAGE)
    );

    return {
      signatureChecker,
      signer,
      wallet,
      signature,
      messageHash,
      messageWrongHash,
      otherAccount,
      maliciousWallet,
    };
  }

  describe("SignatureChecker (ERC1271)", function () {
    describe("EOA account", function () {
      it("with matching signer and signature", async function () {
        const { signatureChecker, signer, signature, messageHash } =
          await loadFixture(deployERC1271SignatureCheckerFixture);
        expect(
          await signatureChecker.isValidSignature(
            signer.address,
            messageHash,
            signature
          )
        ).to.equal(true);
      });

      it("with invalid signer", async function () {
        const { signatureChecker, signature, messageHash, otherAccount } =
          await loadFixture(deployERC1271SignatureCheckerFixture);
        expect(
          await signatureChecker.isValidSignature(
            otherAccount.address,
            messageHash,
            signature
          )
        ).to.equal(false);
      });

      it("with invalid signature", async function () {
        const { signatureChecker, signature, messageWrongHash, signer } =
          await loadFixture(deployERC1271SignatureCheckerFixture);
        expect(
          await signatureChecker.isValidSignature(
            signer.address,
            messageWrongHash,
            signature
          )
        ).to.equal(false);
      });
    });

    describe("ERC1271 wallet", function () {
      it("with matching signer and signature", async function () {
        const { signatureChecker, wallet, messageHash, signature } =
          await loadFixture(deployERC1271SignatureCheckerFixture);
        expect(
          await signatureChecker.isValidSignature(
            wallet.address,
            messageHash,
            signature
          )
        ).to.equal(true);
      });

      it("with invalid signer", async function () {
        const { signatureChecker, wallet, messageHash, signature } =
          await loadFixture(deployERC1271SignatureCheckerFixture);

        expect(
          await signatureChecker.isValidSignature(
            signatureChecker.address,
            messageHash,
            signature
          )
        ).to.equal(false);
      });

      it("with invalid signature", async function () {
        const { signatureChecker, wallet, messageWrongHash, signature } =
          await loadFixture(deployERC1271SignatureCheckerFixture);

        expect(
          await signatureChecker.isValidSignature(
            wallet.address,
            messageWrongHash,
            signature
          )
        ).to.equal(false);
      });

      it("with malicious wallet", async function () {
        const { signatureChecker, messageHash, signature, maliciousWallet } =
          await loadFixture(deployERC1271SignatureCheckerFixture);

        expect(
          await signatureChecker.isValidSignature(
            maliciousWallet.address,
            messageHash,
            signature
          )
        ).to.equal(false);
      });
    });
  });
});
